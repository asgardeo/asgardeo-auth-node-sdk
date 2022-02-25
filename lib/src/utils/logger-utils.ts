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

/* eslint-disable no-console */

import { LOGGER_CONFIG } from "../constants";
export class Logger {

    // eslint-disable-next-line @typescript-eslint/no-empty-function
    private constructor() { }

    public static debug(message: string): void {
        if (process.env.DEBUG)
            console.log(
                LOGGER_CONFIG.bgGreen,
                LOGGER_CONFIG.fgBlack,
                "DEBUG",
                LOGGER_CONFIG.reset,
                LOGGER_CONFIG.fgGreen,
                message,
                LOGGER_CONFIG.reset
            );
    }

    public static warn(message: string): void {
        if (process.env.DEBUG)
            console.log(
                LOGGER_CONFIG.bgYellow,
                LOGGER_CONFIG.fgBlack,
                "WARNING",
                LOGGER_CONFIG.reset,
                LOGGER_CONFIG.fgYellow,
                message,
                LOGGER_CONFIG.reset
            );
    }

    public static error(message: string): void {
        if (process.env.DEBUG)
            console.log(
                LOGGER_CONFIG.bgRed,
                LOGGER_CONFIG.fgBlack,
                "ERROR",
                LOGGER_CONFIG.reset,
                LOGGER_CONFIG.fgRed,
                message,
                LOGGER_CONFIG.reset
            );
    }
}
