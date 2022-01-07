import { TokenResponse } from "@asgardeo/auth-js";

export interface NodeTokenResponse extends TokenResponse {
    session: string
}
