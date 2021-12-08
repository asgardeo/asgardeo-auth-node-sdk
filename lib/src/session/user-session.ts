import { AsgardeoAuthException } from '../exception';
import { NodeStore } from '../models';
import { TokenResponse } from '@asgardeo/auth-js'
import { SessionUtils } from '../utils';

export class UserSession {

    private _sessionStore: NodeStore;

    constructor(store: NodeStore) {
        this._sessionStore = store;
    }

    public async createUserSession(sub: string, sessionData: TokenResponse): Promise<Boolean> {

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

        const new_session = this._sessionStore.setData(user_uuid, sessionData.toString());

        return Promise.resolve(true);

    }

    public async getUserSession(idToken: string): Promise<object> {
        return new Promise((resolve, reject) => {
            this._sessionStore.getData(idToken).then(data => {
                if (data) {
                    resolve(JSON.parse(data))
                } else {
                    resolve(JSON.parse('{}'));
                }
            }).catch((reject));

        });
    }

}