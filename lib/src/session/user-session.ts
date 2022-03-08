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

import { Store, TokenResponse } from "@asgardeo/auth-js";
import { AsgardeoAuthException } from "../exception";
import { NodeSessionData } from "../models";
import { Logger, SessionUtils } from "../utils";

export class UserSession {

    private _sessionStore: Store;

    constructor(store: Store) {
        this._sessionStore = store;
    }

    public async createUserSession(userId: string, sessionData: TokenResponse): Promise<string> {

        //Append the expiary date
        const nodeSessionData : NodeSessionData = {
            ...sessionData,
            createdAt: Date.now()
        }

        const new_session = this._sessionStore.setData(userId, JSON.stringify(nodeSessionData));
        Logger.debug("New Session Created for " + userId);

        return Promise.resolve(userId);

    }

    public async getUserSession(uuid: string): Promise<NodeSessionData> {
        const rawSessionData = await this._sessionStore.getData(uuid);
        const sessionData = JSON.parse(rawSessionData);

        //Check if a session is already stored in the Node Store
        if (Object.keys(sessionData).length !== 0) {
            //Validate the existing session
            const isValidSession = await SessionUtils.validateSession(sessionData);

            //Destroy the session if it is invalid
            if (!isValidSession) {
                Logger.debug("Destroying invalid session");
                this.destroyUserSession(uuid);

                return Promise.resolve({
                    ...sessionData,
                    expired: true
                });
            }
        }

        return Promise.resolve(sessionData);
    }

    public async getUUID(): Promise<string> {
        const uuid = SessionUtils.createUUID();

        return uuid;
    }

    public async destroyUserSession(uuid: string): Promise<boolean> {

        if (!uuid) {
            Promise.reject(
                new AsgardeoAuthException(
                    "NODE_CORE-DUS1-NF01",
                    "destroyUserSession()",
                    "User UUID is not found",
                    "No user UUID has passed as a parameter"
                )
            );
        }

        const isValidUUID = await SessionUtils.validateUUID(uuid);

        if (isValidUUID) {
            const removeData = await this._sessionStore.removeData(uuid);
            Logger.debug("Session destroyed for user " + uuid);
            uuid = "";

            return Promise.resolve(true);
        } else {
            return Promise.reject(
                new AsgardeoAuthException(
                    "NODE_CORE-RAT1-NV01",
                    "removeData()",
                    "Destroying session failed",
                    "The provided UUID is not valid."
                )
            );
        }
    }

}
