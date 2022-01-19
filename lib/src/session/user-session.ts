/**
* Copyright (c) 2020, WSO2 Inc. (http://www.wso2.com) All Rights Reserved.
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
import { Store, TokenResponse } from "@asgardeo/auth-js";
import { AsgardeoAuthException } from "../exception";
import { SessionUtils } from "../utils";

export class UserSession {

    private _sessionStore: Store;

    constructor(store: Store) {
        this._sessionStore = store;
    }

    public async createUserSession(sub: string, sessionData: TokenResponse): Promise<string> {

        const user_uuid = SessionUtils.createUUID(sub);

        if (!user_uuid) {
            return Promise.reject(
                new AsgardeoAuthException(
                    "AUTH_CORE-RAT1-NF01", //TODO: Not sure
                    "user-session",
                    "createUID",
                    "Creating UID failed",
                    "No token endpoint was found in the OIDC provider meta data returned by the well-known endpoint " +
                    "or the token endpoint passed to the SDK is empty."
                )
            );
        }

        const new_session = this._sessionStore.setData(user_uuid, JSON.stringify(sessionData));

        return Promise.resolve(user_uuid);

    }

    public async getUserSession(uuid: string): Promise<object> {
        const sessionData = await this._sessionStore.getData(uuid);

        return Promise.resolve(JSON.parse(sessionData));
    }

    public async getUUID(sub: string): Promise<string> {
        const uuid = SessionUtils.createUUID(sub);

        return uuid;
    }

    public async destroyUserSession(uuid: string): Promise<boolean> {

        if (!uuid) {
            Promise.reject(
                new AsgardeoAuthException(
                    "AUTH_CORE-RAT1-NF01", //TODO: Not sure
                    "user-session",
                    "getUserSession",
                    "User UUID is not found",
                    "No token endpoint was found in the OIDC provider meta data returned by the well-known endpoint " +
                    "or the token endpoint passed to the SDK is empty."
                )
            );
        }

        const isValidUUID = await SessionUtils.validateUUID(uuid);

        if (isValidUUID) {
            const removeData = await this._sessionStore.removeData(uuid);
            uuid = "";

            return Promise.resolve(true);
        } else {
            return Promise.reject(
                new AsgardeoAuthException(
                    "AUTH_CORE-RAT1-NF01", //TODO: Not sure
                    "user-session",
                    "destroyUserSession",
                    "Destroying session failed",
                    "The provided UUID is not valid."
                )
            );
        }
    }

}
