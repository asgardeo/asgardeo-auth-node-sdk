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
const authClient = new AsgardeoAuth.AsgardeoAuth(config);


//Routes
app.get("/", (req, res) => {
    res.send("Hello World")
})



app.get("/login", (req, res) => {
    authClient.getAuthURL().then(url => {
        console.log(url)
        if (url) {
            res.redirect(url)
        }
    }).catch(err => {
        console.log(err)
        res.status(400).send({
            "message": "Failed"
        })
    })
});

app.get("/authorize", (req, res) => {
    if (req.query.code) {
        authClient.requestAccessToken(req.query.code, req.query.session_state).then(response => {
            // console.log("token", response)
            res.cookie('ASGARDEO_SESSION_ID', response.session, { maxAge: 900000, httpOnly: true });
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



