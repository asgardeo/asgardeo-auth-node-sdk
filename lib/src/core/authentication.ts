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

import { AsgardeoAuthClient, AuthClientConfig, CryptoUtils, Store } from "@asgardeo/auth-js";
import { AsgardeoAuthException } from "../exception";
import { AuthURLCallback, NodeTokenResponse } from "../models";
import { UserSession } from "../session";
import { MemoryCacheStore } from "../stores";
import { Logger } from "../utils";
import { NodeCryptoUtils } from "../utils/crypto-utils";

export class AsgardeoNodeCore<T>{

    private _auth: AsgardeoAuthClient<T>;
    private _cryptoUtils: CryptoUtils;
    private _store: Store;
    private _sessionStore: UserSession;

    constructor(config: AuthClientConfig<T>, store?: Store) {

        //Initialize the default memory cache store if an external store is not passed.
        if (!store) {
            this._store = new MemoryCacheStore();
        } else {
            this._store = store;
        }
        this._cryptoUtils = new NodeCryptoUtils();
        this._auth = new AsgardeoAuthClient(this._store, this._cryptoUtils);
        this._sessionStore = new UserSession(this._store);
        this._auth.initialize(config);
        Logger.debug("Initialized AsgardeoAuthClient successfully");
    }

    public async signIn(
        authURLCallback: AuthURLCallback,
        authorizationCode?: string,
        sessionState?: string,
        state?: string
    ): Promise<NodeTokenResponse> {

        //Check if the authorization code or session state is there.
        //If so, generate the access token, otherwise generate the auth URL and return with callback function.

        if (!authorizationCode || !sessionState || !state) {
            const userId = await this._sessionStore.getUUID();
            const authURL = await this.getAuthURL(userId);
            authURLCallback(authURL);

            return Promise.resolve({
                accessToken: "",
                expiresIn: "",
                idToken: "",
                refreshToken: "",
                scope: "",
                session: "",
                tokenType: ""
            });
        } else {
            const tokenResponse = await this.requestAccessToken(authorizationCode, sessionState, state);
            if (tokenResponse) {
                return Promise.resolve(tokenResponse);
            }
        }

        return Promise.reject(
            new AsgardeoAuthException(
                "NODE_CORE-SI1-NF01",
                "signIn()",
                "Access token or decoded token failed.",
                "No token endpoint was found in the OIDC provider meta data returned by the well-known endpoint " +
                "or the token endpoint passed to the SDK is empty."
            )
        );
    }

    public async getAuthURL(userId: string): Promise<string> {

        const authURL = await this._auth.getAuthorizationURL({}, userId);

        if (authURL) {
            return Promise.resolve(authURL.toString());
        } else {
            return Promise.reject(
                new AsgardeoAuthException(
                    "NODE_CORE-GAU1-NF01",
                    "getAuthURL()",
                    "Getting Authorization URL failed.",
                    "No authorization URL was returned by the well-known endpoint "
                )
            );
        }
    }

    public async requestAccessToken(
        authorizationCode: string,
        sessionState: string,
        userId: string
    ): Promise<NodeTokenResponse> {

        const access_token = await this._auth.requestAccessToken(authorizationCode, sessionState, userId);

        if (!access_token) {
            return Promise.reject(
                new AsgardeoAuthException(
                    "NODE_CORE-RAT1-NF01",
                    "requestAccessToken()",
                    "Access token failed.",
                    "No token endpoint was found in the OIDC provider meta data returned by the well-known endpoint " +
                    "or the token endpoint passed to the SDK is empty."
                )
            );
        }

        //Check if the user has a session already
        const existing_user = await this._sessionStore.getUserSession(userId);

        //Declare the response type
        let response: NodeTokenResponse = { ...access_token, session: "" };

        //TODO: double check the logic
        if (Object.keys(existing_user).length === 0 || Object.prototype.hasOwnProperty.call(existing_user, "invalid")) {
            //Create a new session if the user does not have one already
            const new_user_session = await this._sessionStore.createUserSession(userId, access_token);
            response = { ...access_token, session: new_user_session };
        } else {
            response = { ...access_token, session: userId };
        }

        return Promise.resolve(response);

    }

    public async getIDToken(userId: string): Promise<string> {

        const is_logged_in = await this.isAuthenticated(userId);
        if (!is_logged_in) {
            return Promise.reject(
                new AsgardeoAuthException(
                    "NODE_CORE-GIT1-NF01",
                    "getIDToken()",
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
                    "NODE_CORE-GIT1-NF02",
                    "getIDToken()",
                    "Requesting ID Token Failed",
                    "No ID Token was returned by the well-known endpoint."
                )
            );
        }
    }

    public async refreshAccessToken(userId: string): Promise<NodeTokenResponse> {
        const refreshed_token = await this._auth.refreshAccessToken(userId);
        let response: NodeTokenResponse = { ...refreshed_token, session: "" };

        if (refreshed_token) {
            const refreshed_session = await this._sessionStore.createUserSession(userId, refreshed_token);
            response = { ...refreshed_token, session: refreshed_session };

            return Promise.resolve(response);
        }

        return Promise.reject(
            new AsgardeoAuthException(
                "NODE_CORE-RAT2-NF02",
                "refreshAccessToken()",
                "Refreshing ID Token Failed",
                "No ID Token was returned by the well-known endpoint."
            )
        );

    }

    public async isAuthenticated(userId: string): Promise<boolean> {
        try {
            const existing_user_session = await this._sessionStore.getUserSession(userId);
            const isServerAuthenticated = Object.keys(existing_user_session).length === 0 ? false : true;

            const isAsgardeoAuthenticated = await this._auth.isAuthenticated(userId);

            //If the session exists but invalid, refresh the token
            if (Object.prototype.hasOwnProperty.call(existing_user_session, "invalid")) {
                Logger.debug("Refreshing Access Token");
                const refreshed_token = await this.refreshAccessToken(userId);
                if (refreshed_token) isServerAuthenticated === true;
            }

            if (isAsgardeoAuthenticated && isServerAuthenticated) {
                return Promise.resolve(true);
            } else {
                return Promise.resolve(false);
            }
        } catch (error) {
            return Promise.reject(
                new AsgardeoAuthException(
                    "NODE_CORE-IA1-F01",
                    "isAuthenticated()",
                    "Authenticating the user failed",
                    "Could not obtain the session data from the well-known endpoint" +
                    "or could not obtain the user session from the Node Store."
                )
            );
        }
    }

    public async signOut(userId: string): Promise<string> {

        const signOutURL = await this._auth.getSignOutURL(userId);
        const destroySession = await this._sessionStore.destroyUserSession(userId);

        if (!signOutURL || !destroySession) {
            return Promise.reject(
                new AsgardeoAuthException(
                    "NODE_CORE-SO1-NF01",
                    "signOut()",
                    "Signing out the user failed.",
                    "Could not obtain the signout URL from the server."
                )
            );
        }

        return Promise.resolve(signOutURL);
    }

}
