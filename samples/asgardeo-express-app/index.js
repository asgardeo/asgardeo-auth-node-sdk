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

const { AsgardeoNodeClient } = require("@asgardeo/auth-node");
const cookieParser = require("cookie-parser");
const express = require("express");
const rateLimit = require("express-rate-limit");
const { v4: uuidv4 } = require("uuid");
const config = require("./config.json");

const limiter = rateLimit({
    max: 100,
    windowMs: 1 * 60 * 1000 // 1 minute
});

//Constants
const PORT = 3000;

//Initialize Express App
const app = express();

app.use(cookieParser());
app.use(limiter);

app.set("view engine", "ejs");

app.use("/", express.static("static"));

//Initialize Asgardeo Auth Client
const authClient = new AsgardeoNodeClient(config);

const dataTemplate = {
    authenticateResponse: null,
    error: false,
    idToken: null,
    isAuthenticated: false,
    isConfigPresent: Boolean(config && config.clientID && config.clientSecret)
};

//Routes
app.get("/", async (req, res) => {
    const data = { ...dataTemplate };

    try {
        data.isAuthenticated = req.cookies.ASGARDEO_SESSION_ID
            ? await authClient.isAuthenticated(req.cookies.ASGARDEO_SESSION_ID)
            : false;

        data.idToken = data.isAuthenticated ? await authClient.getIDToken(req.cookies.ASGARDEO_SESSION_ID) : null;

        data.authenticateResponse = data.isAuthenticated
            ? await authClient.getBasicUserInfo(req.cookies.ASGARDEO_SESSION_ID)
            : {};

        data.error = req.query.error === "true";

        res.render("index", data);
    } catch (error) {
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
            res.cookie("ASGARDEO_SESSION_ID", userID, {
                httpOnly: true,
                maxAge: 900000,
                sameSite: "lax"
            });
            res.redirect(url);

            return;
        }
    };

    authClient
        .signIn(redirectCallback, userID, req.query.code, req.query.session_state, req.query.state)
        .then((response) => {
            if (response.accessToken || response.idToken) {
                res.redirect("/");
            }
        })
        .catch(() => {
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
    // eslint-disable-next-line no-console
    console.log(`Server Started at PORT ${ PORT }`);
});
