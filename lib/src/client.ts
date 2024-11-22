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
    AuthClientConfig,
    BasicUserInfo,
    CustomGrantConfig,
    DataLayer,
    DecodedIDTokenPayload,
    FetchResponse,
    OIDCEndpoints,
    Store,
    TokenResponse
} from "@asgardeo/auth-js";
import { AsgardeoNodeCore } from "./core"
import { AuthURLCallback } from "./models";

/**
 * This class provides the necessary methods needed to implement authentication.
 *
 * @export
 * @class AsgardeoNodeClient
*/
export class AsgardeoNodeClient<T> {
    private _authCore: AsgardeoNodeCore<T>;

    /**
    * This is the constructor method that returns an instance of the `AsgardeoNodeClient` class.
    *
    * @param {AuthClientConfig<T>} config - The configuration object.
    * @param {Store} store - The store object.
    *
    * @example
    * ```
    * const _store: Store = new DataStore();
    * const _config = {
           signInRedirectURL: "http://localhost:3000/sign-in",
           signOutRedirectURL: "http://localhost:3000/dashboard",
           clientID: "client ID",
           serverOrigin: "https://api.asgardeo.io/t/<org_name>"
       };
    * const auth = new AsgardeoNodeClient(_config,_store);
    * ```
    *
    * @link https://github.com/asgardeo/asgardeo-auth-js-sdk/tree/master#constructor
    * @preserve
    */
    constructor(config: AuthClientConfig<T>, store?: Store) {
        this._authCore = new AsgardeoNodeCore(config, store);
    }

    /**
     * This method logs in a user. If the authorization code is not available it will resolve with the
     * authorization URL to authorize the user.
     * @param {string} authorizationCode - The authorization code obtained from Asgardeo after a user signs in.
     * @param {String} sessionState - The session state obtained from Asgardeo after a user signs in.
     * @param {string} userID - (Optional) A unique ID of the user to be authenticated. This is useful in multi-user
     * scenarios where each user should be uniquely identified.
     * @param {string} state - The state parameter in the redirect URL.
     *
     * @return {Promise<URLResponse | NodeTokenResponse>} - A Promise that resolves with the
     * [`URLResponse`](#URLResponse) object or a Promise that resolves with
     * the [`NodeTokenResponse`](#NodeTokenResponse) object.
     *
     * @example
     * ```
     * authClient.signIn(req.query.code, req.query.session_state).then(response => {
     *   //URL property will available if the user has not been authenticated already
     *   if (response.hasOwnProperty('url')) {
     *       res.redirect(response.url)
     *   } else {
     *       //Set the cookie
     *       res.cookie('ASGARDEO_SESSION_ID', response.session, { maxAge: 900000, httpOnly: true, SameSite: true });
     *       res.status(200).send(response)
     *   }
     *});
     * ```
     *
     * @link https://github.com/asgardeo/asgardeo-auth-js-sdk/tree/master#signIn
     *
     * @memberof AsgardeoNodeClient
     *
     */
    public async signIn(
        authURLCallback: AuthURLCallback,
        userId: string,
        authorizationCode?: string,
        sessionState?: string,
        state?: string,
        signInConfig?: Record<string, string | boolean>
    ): Promise<TokenResponse> {
        return this._authCore.signIn(authURLCallback, userId, authorizationCode, sessionState, state, signInConfig);
    }

    /**
     * This method clears all session data and returns the sign-out URL.
     * @param {string} userId - The userId of the user. (If you are using ExpressJS,
     * you may get this from the request cookies)
     *
     * @return {Promise<string>} - A Promise that resolves with the sign-out URL.
     *
     * @example
     * ```
     * const signOutUrl = await auth.signOut(userId);
     * ```
     *
     * @link https://github.com/asgardeo/asgardeo-auth-js-sdk/tree/master#signOut
     *
     * @memberof AsgardeoNodeClient
     *
     */
    public async signOut(userId: string): Promise<string> {
        return this._authCore.signOut(userId);
    }

    /**
     * This method returns a boolean value indicating if the user is authenticated or not.
     * @param {string} userId - The userId of the user.
     * (If you are using ExpressJS, you may get this from the request cookies)
     *
     * @return { Promise<boolean>} -A boolean value that indicates of the user is authenticated or not.
     *
     * @example
     * ```
     * const isAuth = await authClient.isAuthenticated("a2a2972c-51cd-5e9d-a9ae-058fae9f7927");
     * ```
     *
     * @link https://github.com/asgardeo/asgardeo-auth-js-sdk/tree/master#isAuthenticated
     *
     * @memberof AsgardeoNodeClient
     *
     */
    public async isAuthenticated(userId: string): Promise<boolean> {
        return this._authCore.isAuthenticated(userId);
    }

    /**
     * This method returns the id token.
     * @param {string} userId - The userId of the user.
     * (If you are using ExpressJS, you may get this from the request cookies)
     *
     * @return {Promise<string>} -A Promise that resolves with the ID Token.
     *
     * @example
     * ```
     * const isAuth = await authClient.getIDToken("a2a2972c-51cd-5e9d-a9ae-058fae9f7927");
     * ```
     *
     * @link https://github.com/asgardeo/asgardeo-auth-js-sdk/tree/master#getIDToken
     *
     * @memberof AsgardeoNodeClient
     *
     */
    public async getIDToken(userId: string): Promise<string> {
        return this._authCore.getIDToken(userId);
    }

    /**
     * This method returns an object containing basic user information obtained from the id token.
     * @param {string} userId - The userId of the user.
     * (If you are using ExpressJS, you may get this from the request cookies)
     *
     * @return {Promise<string>} -A Promise that resolves with the 
     * An object containing basic user information obtained from the id token.
     *
     * @example
     * ```
     * const basicInfo = await authClient.getBasicUserInfo("a2a2972c-51cd-5e9d-a9ae-058fae9f7927");
     * ```
     *
     * @link https://github.com/asgardeo/asgardeo-auth-js-sdk/tree/master#getBasicUserInfo
     *
     * @memberof AsgardeoNodeClient
     *
     */
    public async getBasicUserInfo(userId: string): Promise<BasicUserInfo> {
        return this._authCore.getBasicUserInfo(userId);
    }

    /**
     * This method returns an object containing the OIDC service endpoints returned by the `.well-known` endpoint.
     * @return {Promise<OIDCEndpoints>} -A Promise that resolves with 
     * an object containing the OIDC service endpoints returned by the `.well-known` endpoint.
     *
     * @example
     * ```
     * const oidcEndpoints = await auth.getOIDCServiceEndpoints();
     * ```
     *
     * @link https://github.com/asgardeo/asgardeo-auth-js-sdk/tree/master#getOIDCServiceEndpoints
     *
     * @memberof AsgardeoNodeClient
     *
     */
    public async getOIDCServiceEndpoints(): Promise<OIDCEndpoints> {
        return this._authCore.getOIDCServiceEndpoints();
    }

    /**
     * This method returns the decoded ID token payload.
     * @param {string} userId - The userId of the user.
     * (If you are using ExpressJS, you may get this from the request cookies)
     *
     * @return {Promise<DecodedIDTokenPayload>} -A Promise that resolves with
     * an object containing the decoded ID token payload.
     *
     * @example
     * ```
     * const decodedIDTokenPayload = await auth.getDecodedIDToken("a2a2972c-51cd-5e9d-a9ae-058fae9f7927");
     * ```
     *
     * @link https://github.com/asgardeo/asgardeo-auth-js-sdk/tree/master#getDecodedIDToken
     *
     * @memberof AsgardeoNodeClient
     *
     */
    public async getDecodedIDToken(userId?: string): Promise<DecodedIDTokenPayload> {
        return this._authCore.getDecodedIDToken(userId);
    }

    /**
     * This method returns the access token.
     * @param {string} userId - The userId of the user.
     * (If you are using ExpressJS, you may get this from the request cookies)
     *
     * @return {Promise<string>} -A Promise that resolves with 
     * the access token stored in the store
     *
     * @example
     * ```
     *const accessToken = await auth.getAccessToken("a2a2972c-51cd-5e9d-a9ae-058fae9f7927");
     * ```
     *
     * @link https://github.com/asgardeo/asgardeo-auth-js-sdk/tree/master#getAccessToken
     *
     * @memberof AsgardeoNodeClient
     *
     */
    public async getAccessToken(userId?: string): Promise<string> {
        return this._authCore.getAccessToken(userId);
    }

    /**
     * This method returns Promise that resolves with the token information 
     * or the response returned by the server depending on the configuration passed.
     * @param {CustomGrantConfig} config - The config object contains attributes that would be used 
     * to configure the custom grant request.
     *
     * @param {string} userId - The userId of the user.
     * (If you are using ExpressJS, you may get this from the request cookies)
     * 
     * @return {Promise<TokenResponse | FetchResponse>} -A Promise that resolves with the token information 
     * or the response returned by the server depending on the configuration passed.
     *
     * @example
     * ```
     * const config = {
     *      attachToken: false,
     *      data: {
     *          client_id: "{{clientID}}",
     *          grant_type: "account_switch",
     *          scope: "{{scope}}",
     *          token: "{{token}}",
     *      },
     *      id: "account-switch",
     *      returnResponse: true,
     *      returnsSession: true,
     *      signInRequired: true
     * }

     * auth.requestCustomGrant(config).then((response)=>{
     *     console.log(response);
     * }).catch((error)=>{
     *     console.error(error);
     * });
     * ```
     *
     * @link https://github.com/asgardeo/asgardeo-auth-js-sdk/tree/master#requestCustomGrant
     *
     * @memberof AsgardeoNodeClient
     *
     */
    public async requestCustomGrant(config: CustomGrantConfig, userId?: string)
        : Promise<TokenResponse | FetchResponse> {
        return this._authCore.requestCustomGrant(config, userId);
    }

    /**
     * This method can be used to update the configurations passed into the constructor of the AsgardeoAuthClient.
     * @param {AuthClientConfig<T>} config - The config object containing the attributes 
     * that can be used to configure the SDK
     *
     * @return {Promise<void>} -A Promise that resolves with a void.
     *
     * @example
     * ```
     * const updateConfig = await auth.updateConfig({
     *       signOutRedirectURL: "http://localhost:3000/sign-out"
     *   });
     * ```
     *
     * @link https://github.com/asgardeo/asgardeo-auth-js-sdk/tree/master#updateConfig
     *
     * @memberof AsgardeoNodeClient
     *
     */
    public async updateConfig(config: Partial<AuthClientConfig<T>>): Promise<void> {
        return this._authCore.updateConfig(config);
    }

    /**
     * This method returns a Promise that resolves with the response returned by the server.
     * @param {string} userId - The userId of the user.
     * (If you are using ExpressJS, you may get this from the request cookies)
     *
     * @return {Promise<FetchResponse>} -A Promise that resolves with the response returned by the server.
     *
     * @example
     * ```
     * const revokeToken = await auth.revokeAccessToken("a2a2972c-51cd-5e9d-a9ae-058fae9f7927");
     * ```
     *
     * @link https://github.com/asgardeo/asgardeo-auth-js-sdk/tree/master#revokeAccessToken
     *
     * @memberof AsgardeoNodeClient
     *
     */
    public async revokeAccessToken(userId?: string): Promise<FetchResponse> {
        return this._authCore.revokeAccessToken(userId);
    }

    /**
     * This method refreshes the access token and returns a Promise that resolves with the new access
     * token and other relevant data.
     *
     * @param {string} userId - A unique ID of the user to be authenticated. This is useful in multi-user
     * scenarios where each user should be uniquely identified.
     *
     * @returns {Promise<TokenResponse>} - A Promise that resolves with the token response.
     *
     * @example
     * ```
     * const tokenResponse = await auth.refreshAccessToken("a2a2972c-51cd-5e9d-a9ae-058fae9f7927")
     * ```
     *
     * @link https://github.com/asgardeo/asgardeo-auth-js-sdk/tree/master#refreshAccessToken
     *
     * @memberof AsgardeoNodeClient
     */
    public refreshAccessToken(userId?: string): Promise<TokenResponse> {
        return this._authCore.refreshAccessToken(userId);
    }

    /**
     * This method returns if the user has been successfully signed out or not.
     * @param {string} signOutRedirectURL - The URL to which the user is redirected to 
     * after signing out from the server.
     *
     * @return {boolean} - A boolean value indicating if the user has been signed out or not.
     *
     * @example
     * ```
     * const isSignedOut = auth.isSignOutSuccessful(<signout_url>);;
     * ```
     *
     * @link https://github.com/asgardeo/asgardeo-auth-js-sdk/tree/master#isSignOutSuccessful
     *
     * @memberof AsgardeoNodeClient
     *
     */
    public static isSignOutSuccessful(signOutRedirectURL: string): boolean {
        return AsgardeoNodeClient.isSignOutSuccessful(signOutRedirectURL);
    }

    /**
     * This method returns if sign-out failed or not
     * @param {string} signOutRedirectURL - The URL to which the user is redirected to 
     * after signing out from the server.
     *
     * @return {boolean} - A boolean value indicating if sign-out failed or not.
     *
     * @example
     * ```
     * const isSignedOut = auth.isSignOutSuccessful(<signout_url>);
     * ```
     *
     * @link https://github.com/asgardeo/asgardeo-auth-js-sdk/tree/master#didSignOutFail
     *
     * @memberof AsgardeoNodeClient
     *
     */
    public static didSignOutFail(signOutRedirectURL: string): boolean {
        return AsgardeoNodeClient.didSignOutFail(signOutRedirectURL);
    }

    public async getDataLayer(): Promise<DataLayer<T>> {
        return this._authCore.getDataLayer();
    }
}

