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

const express = require('express');
const cookieParser = require('cookie-parser');
const { AsgardeoNodeClient } = require('@asgardeo/auth-node-sdk');
const config = require('./config');

//Constants
const PORT = 5000;

//Initialize Express App
const app = express();
app.use(cookieParser());

//Initialize Asgardeo Auth Client
const authClient = new AsgardeoNodeClient(config);


//Routes
app.get("/", (req, res) => {
    res.send("Hello World");
});

app.get("/login", (req, res) => {
    const redirectCallback = (url) => {
        if (url) {
            res.redirect(url);
            return;
        }
    };
    authClient.signIn(redirectCallback, req.query.code, req.query.session_state).then(response => {
        console.log(response);
        //Make sure you use the httpOnly and sameSite to prevent from cross-site request forgery (CSRF) attacks.
        if (response.session) {
            res.cookie('ASGARDEO_SESSION_ID', response.session, { maxAge: 900000, httpOnly: true, sameSite: true });
            res.status(200).send(response);
        }
    });
});


app.get("/id", (req, res) => {
    //If the session cookie is not there in the request, it is not possible to get the session from the store.
    //Hence, unauthenticated.
    if (req.cookies.ASGARDEO_SESSION_ID === undefined) {
        res.send("Unauthenticated");
        //You may redirect the user to login endpoint here.
        // res.status(301).redirect("/login");
    } else {
        authClient.getIDToken(req.cookies.ASGARDEO_SESSION_ID).then(response => {
            res.send(response);
        }).catch(err => {
            console.log(err);
            res.send(err);
        });
    }
});

app.get("/isauth", (req, res) => {
    if (req.cookies.ASGARDEO_SESSION_ID === undefined) {
        res.send("Unauthenticated");
    } else {
        authClient.isAuthenticated(req.cookies.ASGARDEO_SESSION_ID).then(response => {
            res.send(response);
        }).catch(err => {
            console.log(err);
            res.send(err);
        });
    }
});

//A sample protected route
app.get("/protected", (req, res) => {
    if (req.cookies.ASGARDEO_SESSION_ID === undefined) {
        res.send("Unauthenticated");
    } else {
        res.status(200).send("Protected Route");
    }
});

app.get("/logout", (req, res) => {
    if (req.cookies.ASGARDEO_SESSION_ID === undefined) {
        res.send("Unauthenticated");
    } else {
        authClient.signOut(req.cookies.ASGARDEO_SESSION_ID).then(response => {
            //Invalidate the session cookie
            res.cookie('ASGARDEO_SESSION_ID', null, { maxAge: 0 });
            res.redirect(response);
        }).catch(err => {
            console.log(err);
            res.send(err);
        });
    }

});


//Start the app and listen on PORT 5000
app.listen(PORT, () => { console.log(`Server Started at PORT ${ PORT }`); });
