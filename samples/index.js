const express = require('express');
const cookieParser = require('cookie-parser');
const AsgardeoAuth = require('@asgardeo/auth-nodejs-sdk');
const config = require('./config');

//Constants
const PORT = 5000;

//Initialize Express App 
const app = express();
app.use(cookieParser());

//Initialize Asgardeo Auth
const authClient = new AsgardeoAuth.AsgardeoNodeClient(config);


//Routes
app.get("/", (req, res) => {
    res.send("Hello World")
})

app.get("/login", (req, res) => {
    authClient.signIn(req.query.code, req.query.session_state).then(response => {
        if (response.hasOwnProperty('url')) {
            res.redirect(response.url)
        } else {
            res.cookie('ASGARDEO_SESSION_ID', response.session, { maxAge: 900000, httpOnly: true, SameSite: true });
            res.status(200).send(response)
        }
    })
});

app.get("/authorize", (req, res) => {
    if (req.query.code) {
        authClient.requestAccessToken(req.query.code, req.query.session_state).then(response => {
            // console.log("token", response)
            res.cookie('ASGARDEO_SESSION_ID', response.session, { maxAge: 900000, httpOnly: true, SameSite: true });
            res.send(response)
        }).catch(err => {
            console.log(err)
            res.send(err)
        })
    }
});

app.get("/id", (req, res) => {
    if (req.cookies.ASGARDEO_SESSION_ID === undefined) {
        res.send("Unauthenticated")
    } else {
        authClient.getIDToken(req.cookies.ASGARDEO_SESSION_ID).then(response => {
            res.send(response)
        }).catch(err => {
            console.log(err)
            res.send(err)
        })
    }
});

app.get("/isauth", (req, res) => {
    if (req.cookies.ASGARDEO_SESSION_ID === undefined) {
        res.send("Unauthenticated")
    } else {
        authClient.isAuthenticated(req.cookies.ASGARDEO_SESSION_ID).then(response => {
            res.send(response)
        }).catch(err => {
            console.log(err)
            res.send(err)
        })
    }
});

app.get("/protected", (req,res) => {
    if (req.cookies.ASGARDEO_SESSION_ID === undefined) {
        res.send("Unauthenticated")
    } else {
        res.status(200).send("Protected Route")
    }
})

app.get("/logout", (req, res) => {
    if (req.cookies.ASGARDEO_SESSION_ID === undefined) {
        res.send("Unauthenticated")
    } else {
        authClient.getSignoutURL(req.cookies.ASGARDEO_SESSION_ID).then(response => {
            res.cookie('ASGARDEO_SESSION_ID', null, { maxAge: 0 });
            res.redirect(response)
        }).catch(err => {
            console.log(err)
            res.send(err)
        })
    }

});


//Start the app and listen on PORT 5000
app.listen(PORT, () => { console.log(`Server Started at PORT ${PORT}`) });



