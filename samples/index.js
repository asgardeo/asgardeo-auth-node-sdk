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
const auth = AsgardeoAuth.initializeApp(config);

//Routes
app.get("/login", (req, res) => {
    testSDK.getAuthURL(auth).then(url => {
        console.log(url)
        if (url){
            res.redirect(url)
        }
    }).catch(err => {
        console.log(err)
    })
});

//Start the app and listen on PORT 5000
app.listen(PORT, ()=> {console.log(`Server Started at PORT ${PORT}`)});



