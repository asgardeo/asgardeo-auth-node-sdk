import { validate as uuidValidate, version as uuidVersion, v5 as uuidv5 } from "uuid";
import { UUID_VERSION } from "../constants";

export class SessionUtils {

    // eslint-disable-next-line @typescript-eslint/no-empty-function
    private constructor() { }

    public static createUUID(sub: string): string {
        const generated_uuid = uuidv5(sub, uuidv5.URL);
        return generated_uuid;
    }

    public static validateUUID(uuid: string): Promise<boolean> {
        if (uuidValidate(uuid) && uuidVersion(uuid) === UUID_VERSION) {
            return Promise.resolve(true)
        } else {
            return Promise.resolve(false);
        }
    }

}
