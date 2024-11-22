/**
 * Copyright (c) 2022, WSO2 Inc. (http://www.wso2.com) All Rights Reserved.
 *
 * WSO2 Inc. licenses this file to you under the Apache License,
 * Version 2.0 (the "License"); you may not use this file except
 * in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied. See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

import {
    AsgardeoAuthClient,
    AsgardeoAuthException,
    AuthClientConfig,
    BasicUserInfo,
    CryptoUtils,
    CustomGrantConfig,
    DataLayer,
    DecodedIDTokenPayload,
    FetchResponse,
    OIDCEndpoints,
    SessionData,
    Store,
    TokenResponse
} from "@asgardeo/auth-js";
import { AuthURLCallback } from "../models";
import { MemoryCacheStore } from "../stores";
import { Logger, SessionUtils } from "../utils";
import { NodeCryptoUtils } from "../utils/crypto-utils";

export class AsgardeoNodeCore<T> {
    private _auth: AsgardeoAuthClient<T>;
    private _cryptoUtils: CryptoUtils;
    private _store: Store;
    private _dataLayer: DataLayer<T>;

    constructor(config: AuthClientConfig<T>, store?: Store) {
        //Initialize the default memory cache store if an external store is not passed.
        if (!store) {
            this._store = new MemoryCacheStore();
        } else {
            this._store = store;
        }
        this._cryptoUtils = new NodeCryptoUtils();
        this._auth = new AsgardeoAuthClient(this._store, this._cryptoUtils);
        this._auth.initialize(config);
        this._dataLayer = this._auth.getDataLayer();
        Logger.debug("Initialized AsgardeoAuthClient successfully");
    }

    public async signIn(
        authURLCallback: AuthURLCallback,
        userID: string,
        authorizationCode?: string,
        sessionState?: string,
        state?: string,
        signInConfig?: Record<string, string | boolean>
    ): Promise<TokenResponse> {
        if (!userID) {
            return Promise.reject(
                new AsgardeoAuthException(
                    "NODE-AUTH_CORE-SI-NF01",
                    "No user ID was provided.",
                    "Unable to sign in the user as no user ID was provided."
                )
            );
        }

        if (await this.isAuthenticated(userID)) {
            const sessionData: SessionData = await this._dataLayer.getSessionData(userID);

            return Promise.resolve({
                accessToken: sessionData.access_token,
                createdAt: sessionData.created_at,
                expiresIn: sessionData.expires_in,
                idToken: sessionData.id_token,
                refreshToken: sessionData.refresh_token ?? "",
                scope: sessionData.scope,
                tokenType: sessionData.token_type
            });
        }

        //Check if the authorization code or session state is there.
        //If so, generate the access token, otherwise generate the auth URL and return with callback function.
        if (!authorizationCode || !state) {
            if (!authURLCallback || typeof authURLCallback !== "function") {
                return Promise.reject(
                    new AsgardeoAuthException(
                        "NODE-AUTH_CORE-SI-NF02",
                        "Invalid AuthURLCallback function.",
                        "The AuthURLCallback is not defined or is not a function."
                    )
                );
            }
            const authURL = await this.getAuthURL(userID, signInConfig);
            authURLCallback(authURL);

            return Promise.resolve({
                accessToken: "",
                createdAt: 0,
                expiresIn: "",
                idToken: "",
                refreshToken: "",
                scope: "",
                session: "",
                tokenType: ""
            });
        }

        return this.requestAccessToken(authorizationCode, sessionState ?? "", userID, state);
    }

    public async getAuthURL(userId: string, signInConfig?: Record<string, string | boolean>): Promise<string> {
        const authURL = await this._auth.getAuthorizationURL(signInConfig, userId);

        if (authURL) {
            return Promise.resolve(authURL.toString());
        } else {
            return Promise.reject(
                new AsgardeoAuthException(
                    "NODE-AUTH_CORE-GAU-NF01",
                    "Getting Authorization URL failed.",
                    "No authorization URL was returned by the Asgardeo Auth JS SDK."
                )
            );
        }
    }

    public async requestAccessToken(
        authorizationCode: string,
        sessionState: string,
        userId: string,
        state: string
    ): Promise<TokenResponse> {
        return this._auth.requestAccessToken(authorizationCode, sessionState, state, userId);
    }

    public async getIDToken(userId: string): Promise<string> {
        const is_logged_in = await this.isAuthenticated(userId);
        if (!is_logged_in) {
            return Promise.reject(
                new AsgardeoAuthException(
                    "NODE-AUTH_CORE-GIT-NF01",
                    "The user is not logged in.",
                    "No session ID was found for the requested user. User is not logged in."
                )
            );
        }
        const idToken = await this._auth.getIDToken(userId);
        if (idToken) {
            return Promise.resolve(idToken);
        } else {
            return Promise.reject(
                new AsgardeoAuthException(
                    "NODE-AUTH_CORE-GIT-NF02",
                    "Requesting ID Token Failed",
                    "No ID Token was returned by the Asgardeo Auth JS SDK."
                )
            );
        }
    }

    public async refreshAccessToken(userId?: string): Promise<TokenResponse> {
        return this._auth.refreshAccessToken(userId);
    }

    public async isAuthenticated(userId: string): Promise<boolean> {
        try {
            if (!(await this._auth.isAuthenticated(userId))) {
                return Promise.resolve(false);
            }

            if (await SessionUtils.validateSession(await this._dataLayer.getSessionData(userId))) {
                return Promise.resolve(true);
            }

            const refreshed_token = await this.refreshAccessToken(userId);

            if (refreshed_token) {
                return Promise.resolve(true);
            }

            this._dataLayer.removeSessionData(userId);
            this._dataLayer.getTemporaryData(userId);
            return Promise.resolve(false);
        } catch (error) {
            return Promise.reject(error);
        }
    }

    public async signOut(userId: string): Promise<string> {
        const signOutURL = await this._auth.getSignOutURL(userId);

        if (!signOutURL) {
            return Promise.reject(
                new AsgardeoAuthException(
                    "NODE-AUTH_CORE-SO-NF01",
                    "Signing out the user failed.",
                    "Could not obtain the sign-out URL from the server."
                )
            );
        }

        return Promise.resolve(signOutURL);
    }

    public async getBasicUserInfo(userId: string): Promise<BasicUserInfo> {
        return this._auth.getBasicUserInfo(userId);
    }

    public async getOIDCServiceEndpoints(): Promise<OIDCEndpoints>{
        return this._auth.getOIDCServiceEndpoints();
    }

    public async getDecodedIDToken(userId?: string): Promise<DecodedIDTokenPayload>{
        return this._auth.getDecodedIDToken(userId);
    }

    public async getAccessToken(userId?: string): Promise<string>{
        return this._auth.getAccessToken(userId);
    }

    public async requestCustomGrant(config: CustomGrantConfig, userId?: string): Promise<TokenResponse | FetchResponse>{
        return this._auth.requestCustomGrant(config, userId);
    }

    public async updateConfig(config: Partial<AuthClientConfig<T>>): Promise<void>{
        return this._auth.updateConfig(config);
    }

    public async revokeAccessToken(userId?: string): Promise<FetchResponse>{
        return this._auth.revokeAccessToken(userId);
    }

    public static didSignOutFail(signOutRedirectURL: string): boolean{
        return AsgardeoNodeCore.didSignOutFail(signOutRedirectURL);
    }

    public static isSignOutSuccessful(signOutRedirectURL: string): boolean{
        return AsgardeoNodeCore.isSignOutSuccessful(signOutRedirectURL);
    }

    public getDataLayer(): DataLayer<T> {
        return this._dataLayer;
    }
    
}
