const config = {
    "clientID": "Mm2adXV2jnL9pfo2kCHIEi_ej3Aa",
    "serverOrigin": "https://api.asgardeo.io/t/iconicto",
    "signInRedirectURL": "http://localhost:5000/authorize",
    "signOutRedirectURL": "http://localhost:5000",
    "enableOIDCSessionManagement": true,
    "scope": ["openid", "profile"],
    "validateIDToken": true,
    "runtimeEnvironment": "NODE",
}
module.exports = config;