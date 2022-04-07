# Asgardeo Auth NodeJS SDK

![Builder](https://github.com/asgardeo/asgardeo-auth-node-sdk/workflows/Builder/badge.svg)
[![Stackoverflow](https://img.shields.io/badge/Ask%20for%20help%20on-Stackoverflow-orange)](https://stackoverflow.com/questions/tagged/wso2is)
[![Join the chat at https://join.slack.com/t/wso2is/shared_invite/enQtNzk0MTI1OTg5NjM1LTllODZiMTYzMmY0YzljYjdhZGExZWVkZDUxOWVjZDJkZGIzNTE1NDllYWFhM2MyOGFjMDlkYzJjODJhOWQ4YjE](https://img.shields.io/badge/Join%20us%20on-Slack-%23e01563.svg)](https://join.slack.com/t/wso2is/shared_invite/enQtNzk0MTI1OTg5NjM1LTllODZiMTYzMmY0YzljYjdhZGExZWVkZDUxOWVjZDJkZGIzNTE1NDllYWFhM2MyOGFjMDlkYzJjODJhOWQ4YjE)
[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://github.com/wso2/product-is/blob/master/LICENSE)
[![Twitter](https://img.shields.io/twitter/follow/wso2.svg?style=social&label=Follow)](https://twitter.com/intent/follow?screen_name=wso2)

🚧 &ensp;&ensp;This project is a work in progress. Please do not use this yet!

## Table of Content

- [Introduction](#introduction)
- [Install](#install)
- [Getting Started](#getting-started)
- [APIs](#apis)

  - [constructor](#constructor)
  - [signIn](#signIn)
  - [signOut](#signOut)
  - [getIDToken](#getIDToken)
  - [isAuthenticated](#isAuthenticated)
  - [getBasicUserInfo](#getBasicUserInfo)
  - [getOIDCServiceEndpoints](#getOIDCServiceEndpoints)
  - [getAccessToken](#getAccessToken)
  - [revokeAccessToken](#revokeAccessToken)
  - [requestCustomGrant](#requestCustomGrant)
  - [getPKCECode](#getPKCECode)
  - [setPKCECode](#setPKCECode)
  - [updateConfig](#updateConfig)
  - [isSignOutSuccessful](#isSignOutSuccessful)
  - [isSignOutSuccessful](#isSignOutSuccessful)

- [Data Storage](#data-storage)
  - [Data Layer](#data-layer)
    [Models](#models)
  - [AuthClientConfig\<T>](#AuthClientConfigT)
  - [Store](#Store)
  - [NodeTokenResponse](#NodeTokenResponse)
  - [URLResponse](#URLResponse)
- [Develop](#develop)
- [Contribute](#contribute)
- [License](#license)

## Introduction

Asgardeo Auth NodeJS SDK provides the core methods that are needed to implement OIDC authentication in JavaScript/TypeScript based server side apps. This SDK can be used to build RESTful APIs with Javascript/Typescript based frameworks such as ExpressJS.

## Prerequisites

Create an organization in Asgardeo if you don't already have one. The organization name you choose will be referred to as `<org_name>` throughout this documentation.
If you are using [Asgardeo Cloud](https://wso2.com/asgardeo/) as the identity server, create a **Single-Page Application** in the console.

## Install

Install the library from the npm registry.

```
npm install @asgardeo/auth-nodejs-sdk
```

## Getting Started

###### **This getting started guide is an example of [Express JS](https://expressjs.com/) implementation. Other Node Platforms may differ from this implementation**

```javascript
// Import the packages needed to create an Express app
const express = require("express");
const cookieParser = require("cookie-parser");
const { v4: uuidv4 } = require("uuid");

// Import the Asgardeo Node SDK
// The SDK provides a client that can be used to carry out the authentication.
const { AsgardeoAuth } = require('@asgardeo/auth-nodejs-sdk');

// Create a config object containing the necessary configurations.
const config = {
    clientID: "<your_client_id>",
    clientSecret: "<your_client_secret>",
    serverOrigin: "https://api.asgardeo.io/t/<org_name>",
    signInRedirectURL: "http://localhost:3000/auth/login",
    signOutRedirectURL: "http://localhost:3000",
    scope: ["openid", "profile"]
};

// Create an express app  and setup
const PORT = 3000;
const app = express();
app.use(cookieParser());
app.set("view engine", "ejs");
app.use("/", express.static("static"));

// Instantiate the AsgardeoAuthClient and pass the config object as an argument into the constructor.
const authClient = new AsgardeoAuth(config);

// Define the data template needed for the view engine
const dataTemplate = {
    isConfigPresent: Boolean(config && config.clientID && config.clientSecret),
    isAuthenticated: false,
    idToken: null,
    error: false,
    authenticateResponse: null
}


// Implement a login route.
// For this example, we will define the login route as '/auth/login'. 
// You can change this to match your use case.
app.get("/auth/login", (req, res) => {

    // Check if the incoming request has a session ID which contains the user ID.
    let userID = req.cookies.ASGARDEO_SESSION_ID;

    // If the user ID is not present, create a new user ID.
    if (!userID) {
        userID = uuidv4(); 
    }

    // Define the callback function of the 'signIn' method
    const redirectCallback = (url) => {
        if (url) {
            // Make sure you use the httpOnly and sameSite to prevent from cross-site request forgery (CSRF) attacks.
            // You can change the cookie parameters as per your use case.
            res.cookie("ASGARDEO_SESSION_ID", userID, { maxAge: 900000, httpOnly: true, sameSite: "lax" });
            res.redirect(url);

            return;
        }
    };
    // Use the 'signIn' method from the SDK to initiate the authorization flow.
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
        }).catch((err) => {
            console.log(err);
            res.redirect("/?error=true");
        });

    // Now you have successfully implemented a login endpoint with Asgardeo Node SDK.
    // Please refer to the sample app to see the how to implement the other functionalities.
});

```

## APIs

The SDK provides a client class called `AsgardeoAuth` that provides you with the necessary methods to implement authentication.
You can instantiate the class and use the object to access the provided methods.

### constructor

```TypeScript
new AsgardeoAuth(config:AuthClientConfig<T>, store?: Store);
```

#### Arguments

1. config: [`AuthClientConfig<T>`](#AuthClientConfigT)

   This contains the configuration information needed to implement authentication such as the client ID, server origin etc. Additional configuration information that is needed to be stored can be passed by extending the type of this argument using the generic type parameter. For example, if you want the config to have an attribute called `foo`, you can create an interface called `Bar` in TypeScript and then pass that interface as the generic type to `AuthClientConfig` interface. To learn more about what attributes can be passed into this object, refer to the [`AuthClientConfig<T>`](#AuthClientConfigT) section.

   ```TypeScript
   interface Bar {
       foo: string
   }

   const auth = new AsgardeoAuthClient(config: AuthClientConfig<Bar>);
   }
   ```

   #### Example

   ```TypeScript
   const config = {
       signInRedirectURL: "http://localhost:3000/sign-in",
       signOutRedirectURL: "http://localhost:3000/login",
       clientID: "client ID",
       serverOrigin: "https://api.asgardeo.io/t/<org_name>"
   };
   ```

2. store: [`Store`](#Store)

   This is the object of interface [`Store`](#Store) that is used by the SDK to store all the necessary data used ranging from the configuration data to the access token. By default, the SDK is packed with a built-in Memory Cache Store. If needed, you can implement the Store to create a class with your own implementation logic and pass an instance of the class as the second argument. This way, you will be able to get the data stored in your preferred place. To know more about implementing the [`Store`](#Store) interface, refer to the [Data Storage](#data-storage) section.

   #### Description

   This creates an instance of the `AsgardeoAuthClient` class and returns it.

   #### Example

   ```TypeScript
   class NodeStore implements Store {
       public async setData(key: string, value: string): void {
           yourCustomStorage.setItem(key, value);
       }

       public async getData(key: string): string {
           return yourCustomStorage.getItem(key);
       }

       public async removeData(key: string): void {
           yourCustomStorage.removeItem(key);
       }
   }

   const store = new NodeStore();

   const auth = new AsgardeoAuthClient(config: AuthClientConfig<Bar>, store: store);
   ```

---

### signIn

```Typescript
signIn(authURLCallback: AuthURLCallback, authorizationCode?: string, sessionState?: string, userId?: string): Promise<URLResponse | NodeTokenResponse>
```

#### Arguments

1. authURLCallback: `AuthURLCallback`

   This is the callback function which is used to redirect the user to the authorization URL.

2. authorizationCode: `string` (optional)

   This is the authorization code obtained from Asgardeo after a user signs in.

3. sessionState: `string` (optional)

   This is the session state obtained from Asgardeo after a user signs in.

4. userId: `string` (optional)

   If you want to use the SDK to manage multiple user sessions, you can pass a unique ID here to generate an authorization URL specific to that user. This can be useful when this SDK is used in backend applications.

#### Returns

A Promise that resolves with a Promise that resolves with the [`NodeTokenResponse`](#NodeTokenResponse) object.

#### Description

This method first checks if the `authorizationCode` or `sessionState` is available in the arguments. If they exists, It will request the access token for the respective authorization code and returns a promise that will be resolved with the [`NodeTokenResponse`](#NodeTokenResponse) object.
If not, it will obtain the authorization URL and callback the `authURLCallback` function with the authorization URL. The user can be redirected to this URL to authenticate themselves and authorize the client.

_Note: Make sure you call the same `signIn()` method in the `signInRedirectURL` path to request the access token successfully._

#### Example (Express JS)

```Typescript
authClient.signIn(req.query.code, req.query.session_state, req.query.user_id).then(response => {
        //URL property will available if the user has not been authenticated already
        if (response.hasOwnProperty('url')) {
            res.redirect(response.url)
        } else {
            //Set the cookie
            res.cookie('ASGARDEO_SESSION_ID', response.session, { maxAge: 900000, httpOnly: true, SameSite: true });
            res.status(200).send(response)
        }
    });
```

---

### signOut

```TypeScript
signOut(userId: string): Promise<string>
```

#### Returns

signOutURL: `Promise<string>`

The user should be redirected to this URL in order to sign out of the server.

#### Description

This clears the authentication data from the store, generates the sign-out URL and returns it. This should be used only if you want to sign out the user from the Asgardeo as well.

#### Example

_Note: Make sure to invalidate the cookie ID when sending the response to the client_

```TypeScript
// This should be within an async function.
const signOutURL = await authClient.signOut("a2a2972c-51cd-5e9d-a9ae-058fae9f7927");
//If you are using Express JS you may try this to invalidate the cookie
 res.cookie('ASGARDEO_SESSION_ID',null, { maxAge: 0 });
 res.redirect(signOutURL);
```

---

### getIDToken

```TypeScript
getIDToken(userId: string): Promise<string>
```

#### Returns

idToken: `Promise<string>`
A Promise that resolves with the ID Token.

#### Description

This method returns the id token.

#### Example

```TypeScript
const idToken = await authClient.getIDToken("a2a2972c-51cd-5e9d-a9ae-058fae9f7927");
```

---

### isAuthenticated

```TypeScript
isAuthenticated(userId: string): Promise<boolean>
```

#### Returns

isAuth: `boolean`
A boolean value that indicates of the user is authenticated or not.

#### Description

This method returns a boolean value indicating if the user is authenticated or not.

#### Example

```TypeScript
// This should be within an async function.
const isAuth = await authClient.isAuthenticated("a2a2972c-51cd-5e9d-a9ae-058fae9f7927");
```

---

### getBasicUserInfo

```TypeScript
getBasicUserInfo(userId: string): Promise<BasicUserInfo>
```

#### Arguments

1. userId: `string` (optional)

   If you want to use the SDK to manage multiple user sessions, you can pass a unique ID here to generate an authorization URL specific to that user. This can be useful when this SDK is used in backend applications.

#### Returns

basicUserInfo: Promise<[BasicUserInfo](#BasicUserInfo)>
An object containing basic user information obtained from the id token.

#### Description

This method returns the basic user information obtained from the payload. To learn more about what information is returned, checkout the DecodedIDTokenPayload model.

#### Example

```TypeScript
// This should be within an async function.
const basicUserInfo = await authClient.getBasicUserInfo("a2a2972c-51cd-5e9d-a9ae-058fae9f7927");
```

---

### getOIDCServiceEndpoints

```TypeScript
getOIDCServiceEndpoints(): Promise<OIDCEndpoints>
```

#### Returns

oidcEndpoints: Promise<[OIDCEndpoints](#OIDCEndpoints)>
An object containing the OIDC service endpoints returned by the `.well-known` endpoint.

#### Description

This method returns the OIDC service endpoints obtained from the `.well-known` endpoint. To learn more about what endpoints are returned, checkout the OIDCEndpoints section.

#### Example

```TypeScript
// This should be within an async function.
const oidcEndpoints = await authClient.getOIDCServiceEndpoints();
```

---

### getDecodedIDToken

```TypeScript
getDecodedIDToken(userId?: string): Promise<DecodedIDTokenPayload>
```

#### Arguments

1. userId: `string` (optional)

   If you want to use the SDK to manage multiple user sessions, you can pass a unique ID here to generate an authorization URL specific to that user. This can be useful when this SDK is used in backend applications.

#### Returns

decodedIDTokenPayload: Promise<[DecodedIDTokenPayload](#DecodedIDTokenPayload)>
The decoded ID token payload.

#### Description

This method decodes the payload of the id token and returns the decoded values.

#### Example

```TypeScript
// This should be within an async function.
const decodedIDTokenPayload = await authClient.getDecodedIDToken("a2a2972c-51cd-5e9d-a9ae-058fae9f7927");
```

---

### getAccessToken

```TypeScript
getAccessToken(userId?: string): Promise<string>
```

#### Arguments

1. userId: `string` (optional)

   If you want to use the SDK to manage multiple user sessions, you can pass a unique ID here to generate an authorization URL specific to that user. This can be useful when this SDK is used in backend applications.

#### Returns

idToken: `Promise<string>` The id token.

#### Description

This method returns the id token.

#### Example

```TypeScript
// This should be within an async function.
const idToken = await authClient.getIDToken("a2a2972c-51cd-5e9d-a9ae-058fae9f7927");
```

---

### revokeAccessToken

```TypeScript
revokeAccessToken(userId?: string): Promise<FetchResponse>
```

#### Arguments

1. userId: `string` (optional)

   If you want to use the SDK to manage multiple user sessions, you can pass a unique ID here to generate an authorization URL specific to that user. This can be useful when this SDK is used in backend applications.

#### Returns

A Promise that resolves with the response returned by the server.

#### Description

This method clears the authentication data and sends a request to revoke the access token. You can use this method if you want to sign the user out of your application but not from the server.

#### Example

```TypeScript
// This should be within an async function.
const revokeToken = await auth.revokeAccessToken("a2a2972c-51cd-5e9d-a9ae-058fae9f7927");
```

---

### requestCustomGrant

```TypeScript
requestCustomGrant(config: CustomGrantConfig, userId?: string): Promise<TokenResponse | FetchResponse>
```

#### Arguments

1. config: [CustomGrantConfig](#CustomGrantConfig)

   The config object contains attributes that would be used to configure the custom grant request. To learn more about the different configurations available, checkout the CustomGrantConfig model.

1. userId: `string` (optional)

   If you want to use the SDK to manage multiple user sessions, you can pass a unique ID here to generate an authorization URL specific to that user. This can be useful when this SDK is used in backend applications.

#### Returns

A Promise that resolves with the token information or the response returned by the server depending on the configuration passed.

#### Description

This method can be used to send custom-grant requests to Asgardeo.

#### Example

```TypeScript
const config = {
    attachToken: false,
    data: {
        client_id: "{{clientID}}",
        grant_type: "account_switch",
        scope: "{{scope}}",
        token: "{{token}}",
    },
    id: "account-switch",
    returnResponse: true,
    returnsSession: true,
    signInRequired: true
}

auth.requestCustomGrant(config).then((response) => {
    console.log(response);
}).catch((error) => {
    console.error(error);
});
```

---

### getPKCECode

```TypeScript
getPKCECode(state: string, userId?: string): Promise<string>
```

#### Arguments

1. state: `string`

   The state parameter that was passed in the authorization request.

2. userId: `string` (optional)

   If you want to use the SDK to manage multiple user sessions, you can pass a unique ID here to generate an authorization URL specific to that user. This can be useful when this SDK is used in backend applications.

#### Returns

pkce: `string`
The PKCE code

#### Description

This code returns the PKCE code generated when the authorization URL is generated by the [getAuthorizationURL](#getAuthorizationURL) method.

#### Example

```TypeScript
// This should be within an async function.
const pkce = auth.getPKCECode(state, "a2a2972c-51cd-5e9d-a9ae-058fae9f7927");
```

---

### setPKCECode

```TypeScript
setPKCECode(pkce: string, state: string, userId?: string): Promise<void>
```

#### Arguments

1. pkce: `string`

   The PKCE code generated by the getAuthorizationURL method

2. state: `string`

   The state parameter that was passed in the authorization request.

3. userId: `string` (optional)

   If you want to use the SDK to manage multiple user sessions, you can pass a unique ID here to generate an authorization URL specific to that user. This can be useful when this SDK is used in backend applications.

#### Description

This method sets the PKCE code to the store. The PKCE code is usually stored in the store by the SDK. But there could be instances when the store could be cleared such as when the data is stored in the memory and the user is redirected to the authorization endpoint in a Single Page Application. When the user is redirected back to the app, the authorization code, session state, and the PKCE code will have to be sent to the server to obtain the access token. However, since, during redirection, everything in the memory is cleared, the PKCE code cannot be obtained. In such instances, the [getPKCECode](#getPKCECode) method can be used to get the PKCE code before redirection and store it in a place from where it can be retrieved after redirection, and then this method can be used to save the PKCE code to the store so that the [requestAccessToken](#requestAccessToken) method can run successfully.

#### Example

```TypeScript
// This should be within an async function.
const pkce = auth.setPKCECode("pkce", "state", "a2a2972c-51cd-5e9d-a9ae-058fae9f7927");
```

---

### updateConfig

```TypeScript
updateConfig(config: Partial<AuthClientConfig<T>>): Promise<void>
```

#### Arguments

1. config: `AuthClientConfig<T>`

   The config object containing the attributes that can be used to configure the SDK. To learn more about the available attributes, refer to the[ AuthClientConfig<T>](# AuthClientConfig<T>) model.

#### Description

This method can be used to update the configurations passed into the constructor of the [AsgardeoAuthClient](#AsgardeoAuthClient). Please note that every attribute in the config object passed as the argument here is optional. Use this method if you want to update certain attributes after instantiating the class.

#### Example

```TypeScript
const pkce = auth.updateConfig({
    signOutRedirectURL: "http://localhost:3000/sign-out"
});
```

---

### isSignOutSuccessful

```TypeScript
static isSignOutSuccessful(signOutRedirectURL: string): boolean
```
**This is a static method.**

#### Arguments

1. signOutRedirectURL: `string`

   The URL to which the user is redirected to after signing out from the server.

#### Returns

isSignedOut: `boolean`
A boolean value indicating if the user has been signed out or not.

#### Description

This method returns if the user has been successfully signed out or not. When a user signs out from the server, the user is redirected to the URL specified by the [signOutRedirectURL](#signOutRedirectURL) in the config object passed into the constructor of the [AsgardeoAuthClient](#AsgardeoAuthClient). The server appends path parameters indicating if the sign-out is successful. This method reads the URL and returns if the sign-out is successful or not. So, make sure you pass as the argument the URL to which the user has been redirected to after signing out from the server.

#### Example

```TypeScript
const isSignedOut = auth.isSignOutSuccessful(<signout_redirect_url>);
```

---

### didSignOutFail

```TypeScript
static didSignOutFail(signOutRedirectURL: string): boolean
```
**This is a static method.**

#### Arguments

1. signOutRedirectURL: `string`

   The URL to which the user is redirected to after signing out from the server.

#### Returns

didSignOutFail: `boolean`
A boolean value indicating if sign-out failed or not.

#### Description

This method returns if sign-out failed or not. When a user signs out from the server, the user is redirected to the URL specified by the [signOutRedirectURL](#signOutRedirectURL) in the config object passed into the constructor of the [AsgardeoAuthClient](#AsgardeoAuthClient). The server appends path parameters indicating if the sign-out is successful. This method reads the URL and returns if the sign-out failed or not. So, make sure you pass as the argument the URL to which the user has been redirected to after signing out from the server.

#### Example

```TypeScript
const isSignedOutFailed = auth.isSignOutSuccessful(<signout_redirect_url>);
```

---

## Data Storage

Since the SDK was developed with the view of being able to support various frameworks such as ExpressJS, Fastify and Next JS, the SDK allows developers to use their preferred mode of storage. To that end, the SDK allows you to pass a store object when instantiating the `AsgardeoAuthClient`. This store object contains methods that can be used to store, retrieve and delete data. The SDK provides a Store interface that you can implement to create your own Store class. You can refer to the [`Store`](#store) section to learn mire about the `Store` interface.

There are three methods that are to be implemented by the developer. They are

1. `setData`
2. `getData`
3. `removeData`

The `setData` method is used to store data. The `getData` method is used to retrieve data. The `removeData` method is used to delete data. The SDK converts the data to be stored into a JSON string internally and then calls the `setData` method to store the data. The data is represented as a key-value pairs in the SDK. The SDK uses four keys internally and you can learn about them by referring to the [Data Layer](#data-layer) section. So, every JSON stringified data value is supposed to be stored against the passed key in the data store. A sample implementation of the `Store` class using the browser session storage is given here.

```TypeScript
class NodeStore implements Store {
    public setData(key: string, value: string): void {
        sessionStorage.setItem(key, value);
    }

    public getData(key: string): string {
        return sessionStorage.getItem(key);
    }

    public removeData(key: string): void {
        sessionStorage.removeItem(key);
    }
}
```

---

## Models

### AuthClientConfig\<T>

This model has the following attributes.
|Attribute| Required/Optional| Type | Default Value| Description|
|--|--|--|--|--|
|`signInRedirectURL` |Required|`string`|""|The URL to redirect to after the user authorizes the client app. eg: `https//localhost:3000/sign-in`|
|`signOutRedirectURL` |Optional|`string`| The `signInRedirectURL` URL will be used if this value is not provided. |The URL to redirect to after the user |signs out. eg: `http://localhost:3000/dashboard`|
|`clientHost`|Optional| `string`|The origin of the client app obtained using `window.origin`|The hostname of the client app. eg: `https://localhost:3000`|
|`clientID`|Required| `string`|""|The client ID of the OIDC application hosted in the Asgardeo.|
|`clientSecret`|Optional| `string`|""|The client secret of the OIDC application|
|`enablePKCE`|Optional| `boolean`|`true`| Specifies if a PKCE should be sent with the request for the authorization code.|
|`prompt`|Optional| `string`|""|Specifies the prompt type of an OIDC request|
|`responseMode`|Optional| `ResponseMode`|`"query"`|Specifies the response mode. The value can either be `query` or `form_post`|
|`scope`|Optional| `string[]`|`["openid"]`|Specifies the requested scopes.|
|`serverOrigin`|Required| `string`|""|The origin of the Identity Provider. eg: `https://api.asgardeo.io/t/<org_name>`|
|`endpoints`|Optional| `OIDCEndpoints`|[OIDC Endpoints Default Values](#oidc-endpoints)|The OIDC endpoint URLs. The SDK will try to obtain the endpoint URLS |using the `.well-known` endpoint. If this fails, the SDK will use these endpoint URLs. If this attribute is not set, then the default endpoint URLs will be |used. However, if the `overrideWellEndpointConfig` is set to `true`, then this will override the endpoints obtained from the `.well-known` endpoint. |
|`overrideWellEndpointConfig`|Optional| `boolean` | `false` | If this option is set to `true`, then the `endpoints` object will override endpoints obtained |from the `.well-known` endpoint. If this is set to `false`, then this will be used as a fallback if the request to the `.well-known` endpoint fails.|
|`wellKnownEndpoint`|Optional| `string`|`"/oauth2/token/.well-known/openid-configuration"`| The URL of the `.well-known` endpoint.|
|`validateIDToken`|Optional| `boolean`|`true`|Allows you to enable/disable JWT ID token validation after obtaining the ID token.|
|`clockTolerance`|Optional| `number`|`60`|Allows you to configure the leeway when validating the id_token.|
|`sendCookiesInRequests`|Optional| `boolean`|`true`|Specifies if cookies should be sent in the requests.|

The `AuthClientConfig<T>` can be extended by passing an interface as the generic type. For example, if you want to add an attribute called `foo` to the config object, you can create an interface called `Bar` and pass that as the generic type into the `AuthClientConfig<T>` interface.

```TypeScript
interface Bar {
    foo: string
}

const config: AuthClientConfig<Bar> ={
    ...
}
```

### Store

| Method       | Required/Optional | Arguments                      | Returns                                                                                                                                                                         | Description                                                                                                                         |
| ------------ | ----------------- | ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `setData`    | Required          | key: `string`, value: `string` | `Promise<void>`                                                                                                                                                                 | This method saves the passed value to the store. The data to be saved is JSON stringified so will be passed by the SDK as a string. |
| `getData`    | Required          | key: `string`\|`string`        | This method retrieves the data from the store and returns a Promise that resolves with it. Since the SDK stores the data as a JSON string, the returned value will be a string. |
| `removeData` | Required          | key: `string`                  | `Promise<void>`                                                                                                                                                                 | Removes the data with the specified key from the store.                                                                             |

### NodeTokenResponse

| Method         | Type     | Description                 |
| -------------- | -------- | --------------------------- |
| `accessToken`  | `string` | The access token.           |
| `idToken`      | `string` | The id token.               |
| `expiresIn`    | `string` | The expiry time in seconds. |
| `scope`        | `string` | The scope of the token.     |
| `refreshToken` | `string` | The refresh token.          |
| `tokenType`    | `string` | The token type.             |
| `session`      | `string` | The session ID.             |

### AuthURLCallback

```TypeScript
(url: string): void;
```

#### Description

This method is used to handle the callback from the [`signIn`](#signIn) method. You may use this function to get the authorization URL and redirect the user to authorize the application.

#### Example

```TypeScript
//You may use this in Express JS
const urlCallbackHandler = (url: string): void => {
    res.redirect(url);
}
```

---

## Develop

### Prerequisites

- `Node.js` (version 10 or above).
- `npm` package manager.

### Installing Dependencies

The repository is a mono repository. The SDK repository is found in the [lib](https://github.com/asgardeo/asgardeo-auth-node-sdk/tree/master/lib) directory. You can install the dependencies by running the following command at the root.

```
npm run build
```

## Contribute

Please read [Contributing to the Code Base](http://wso2.github.io/) for details on our code of conduct, and the process for submitting pull requests to us.

### Reporting issues

We encourage you to report issues, improvements, and feature requests creating [Github Issues](https://github.com/asgardeo/asgardeo-auth-node-sdk/issues).

Important: And please be advised that security issues must be reported to security@wso2com, not as GitHub issues, in order to reach the proper audience. We strongly advise following the WSO2 Security Vulnerability Reporting Guidelines when reporting the security issues.

## License

This project is licensed under the Apache License 2.0. See the [LICENSE](LICENSE) file for details.
