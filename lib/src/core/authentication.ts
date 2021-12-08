/**
 * Copyright (c) 2021, WSO2 Inc. (http://www.wso2.org) All Rights Reserved.
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
import {AsgardeoAuthClient } from '@asgardeo/auth-js';
import { AsgardeoAuthException } from "../exception";
import { NodeStore } from '../models';
import { MemoryCacheStore } from "../stores";
import cache from 'memory-cache'; // Only for debugging
import { UserSession } from '../session';

export class AsgardeoAuth<T>{

    private _auth :AsgardeoAuthClient<T>;
    private _store: NodeStore;
    private _sessionStore: UserSession;

    //TODO: Add the type here
    constructor(config: any){
        this._store = new MemoryCacheStore();
        this._auth = new AsgardeoAuthClient(this._store);
        this._sessionStore = new UserSession(this._store);
        this._auth.initialize(config);
    }

    public async getAuthURL() : Promise<object> {
        return new Promise((resolve, reject) => {
            this._auth.getAuthorizationURL().then((url: any) => {
                resolve(url);
            }).catch((reject));
        });
    }

    public async requestAccessToken(authorizationCode: string, sessionState: string): Promise<object> {

        const access_token = await this._auth.requestAccessToken(authorizationCode, sessionState);
        const sub_from_token = await this._auth.getDecodedIDToken();

        if (!(access_token && sub_from_token)) {
            return Promise.reject(
                new AsgardeoAuthException(
                    "AUTH_CORE-RAT1-NF01", //TODO: Not sure
                    "node-authentication",
                    "requestAccessToken",
                    "Access token or decoded token failed.",
                    "No token endpoint was found in the OIDC provider meta data returned by the well-known endpoint " +
                    "or the token endpoint passed to the SDK is empty."
                )
            )
        }

        const user_session = await this._sessionStore.getUserSession(sub_from_token.sub);
        console.log(user_session)

        //Create a new session if one does not exists
        if(user_session){
            const new_user_session = await this._sessionStore.createUserSession(sub_from_token.sub, access_token);
        }
        //DEBUG
        console.log(cache.keys());
        return Promise.resolve(access_token);
        
    }
    
    public async getIDToken(): Promise<string> {
        return new Promise((resolve, reject) => {
            this._auth.getIDToken().then((response: any) => {
                resolve(response);
            }).catch((reject));
        });
    }

}