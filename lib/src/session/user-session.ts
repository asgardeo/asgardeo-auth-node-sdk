import { AsgardeoAuthException } from '../exception';
import { NodeStore } from '../models';
import { TokenResponse } from '@asgardeo/auth-js'
import { SessionUtils } from '../utils';

export class UserSession {

    private _sessionStore: NodeStore;
    private _userUUID: string;

    public get getUserUUID(): string {
        return this._userUUID;
    }

    constructor(store: NodeStore) {
        this._sessionStore = store;
        this._userUUID = "";
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

        this._userUUID = user_uuid;
        const new_session = this._sessionStore.setData(user_uuid, sessionData.toString());
        return Promise.resolve(user_uuid);

    }

    public async getUserSession(): Promise<object> {
        const sessionData = await this._sessionStore.getData(this._userUUID);
        if (Object.keys(sessionData).length !== 0) {
            return Promise.resolve(JSON.parse(sessionData))
        } else {
            return Promise.resolve(JSON.parse('{}'));
        }
    }

    public async destroyUserSession(): Promise<Boolean> {

        if (!this._userUUID) {
            Promise.reject(
                new AsgardeoAuthException(
                    "AUTH_CORE-RAT1-NF01", //TODO: Not sure
                    "user-session",
                    "getUserSession",
                    "User UUID is not found",
                    "No token endpoint was found in the OIDC provider meta data returned by the well-known endpoint " +
                    "or the token endpoint passed to the SDK is empty."
                )
            )
        }

        const isValidUUID = await SessionUtils.validateUUID(this._userUUID);

        if (isValidUUID) {
            const removeData = await this._sessionStore.removeData(this._userUUID);
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