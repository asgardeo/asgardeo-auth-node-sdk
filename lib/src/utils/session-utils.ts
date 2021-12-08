import { v5 as uuidv5, validate as uuidValidate, version as uuidVersion } from 'uuid';
import { UUID_VERSION } from '../constants';

export class SessionUtils{

    private constructor(){} 

    public static createUUID(sub: string): string {
        const generated_uuid = uuidv5(sub, uuidv5.URL);
        return generated_uuid;
    }

    public static validateUUID(uuid: string): Promise<Boolean> {
        return new Promise((resolve, reject) => {
            if (uuidValidate(uuid) && uuidVersion(uuid) === UUID_VERSION) {
                resolve(true)
            } else {
                resolve(false);
            }
        });
    }

}