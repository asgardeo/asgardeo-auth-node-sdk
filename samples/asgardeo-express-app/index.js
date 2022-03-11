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

const express = require("express");
const cookieParser = require("cookie-parser");
const { AsgardeoNodeClient } = require("@asgardeo/auth-node-sdk");
const config = require("./config");
const { v4: uuidv4 } = require("uuid");

//Constants
const PORT = 3000;

//Initialize Express App
const app = express();
app.use(cookieParser());

app.set("view engine", "ejs");

app.use("/", express.static("static"));

//Initialize Asgardeo Auth Client
const authClient = new AsgardeoNodeClient(config);

const dataTemplate = {
    isConfigPresent: Boolean(config && config.clientID && config.clientSecret),
    isAuthenticated: false,
    idToken: null,
    error: false,
    authenticateResponse: null
}

//Routes
app.get("/", async (req, res) => {
    const data = { ...dataTemplate };
    console.log(req.cookies.ASGARDEO_SESSION_ID);
    try {
        data.isAuthenticated = req.cookies.ASGARDEO_SESSION_ID
            ? await authClient.isAuthenticated(req.cookies.ASGARDEO_SESSION_ID)
            : false;

        data.idToken = data.isAuthenticated
            ? await authClient.getIDToken(req.cookies.ASGARDEO_SESSION_ID)
            : null;

        data.authenticateResponse = data.isAuthenticated
            ? await authClient.getBasicUserInfo(req.cookies.ASGARDEO_SESSION_ID)
            : {};

        data.error = req.query.error === "true";

        res.render("index", data);
    } catch (error) {
        console.log(error);
        res.render("index", { ...data, error: true });
    }
});

app.get("/auth/login", (req, res) => {

    let userID = req.cookies.ASGARDEO_SESSION_ID;

    if (!userID) {
        userID = uuidv4();
    }

    const redirectCallback = (url) => {
        if (url) {
            // Make sure you use the httpOnly and sameSite to prevent from cross-site request forgery (CSRF) attacks.
            res.cookie("ASGARDEO_SESSION_ID", userID, { maxAge: 900000, httpOnly: true, sameSite: "lax" });
            res.redirect(url);

            return;
        }
    };

    authClient
        .signIn(
            redirectCallback,
            userID,
            req.query.code,
            req.query.session_state,
            req.query.state
        )
        .then((response) => {
            if (response.accessToken || response.idToken) {
                res.redirect("/");
            }
        }).catch(() => {
            res.redirect("/?error=true");
        });
});

app.get("/auth/logout", (req, res) => {
    if (req.cookies.ASGARDEO_SESSION_ID === undefined) {
        res.redirect("/?error=true");
    } else {
        authClient
            .signOut(req.cookies.ASGARDEO_SESSION_ID)
            .then((url) => {
                //Invalidate the session cookie
                res.cookie("ASGARDEO_SESSION_ID", null, { maxAge: 0 });
                res.redirect(url);
            })
            .catch(() => {
                res.redirect("/?error=true");
            });
    }
});

//Start the app and listen on PORT 5000
app.listen(PORT, () => {
    console.log(`Server Started at PORT ${ PORT }`);
});
