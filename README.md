# Welcome to Yap

Yap is a room-based chatting app

## Objective

The main objective of this project is to test my understanding of WebSockets, Engine.IO, and Socket.IO. As a result, my plan is to rewrite the backend multiple times:

1. Raw WebSockets + simple React frontend
2. Swap WebSockets to Engine.IO
3. Swap Engine.IO to Socket.IO
4. Add persistence to backend
5. Add authentication to frontend and backend
6. Add DM'ing to frontend and backend, overhaul UI

## Version History

| Version | Description                                                                       | Git Tag                                                   |
| ------- | --------------------------------------------------------------------------------- | --------------------------------------------------------- |
| v1.0    | Basic real-time room-based chat without persistence using native WebSockets only. | [View v1.0](https://github.com/noah-geerts/yap/tree/v1.0) |

## Frontend

[See docs here](./frontend/README.md)

## Backend

[See docs here](./backend/README.md)

## Description

- You can join any of the rooms in a dropdown
- When you join that room, a duplex connection with the server is initiated
- You can push messages to the server, and the server can push new messages to you for that room
- Rooms are handled manually by the server since the basic WebSocket protocol only allows you to open a bi-directional communication channel with the server as a whole, and does not specify subchannels or namespaces

## Authentication (Auth0)

![Authentication Diagram](auth-diagram.png)

**Auth0 Authentication API**
Basically it is used to sign up for or log into the tenant as a whole, and it can be used to request tokens for APIs within the tenant, which are accessed individually.

- Sign up requests
- Log in requests (returns a JWT for the tenant)
- Refresh requests (returns a JWT for the tenant)
- Requests for JWT's for the tenant's APIs (Management API, custom API's)

Note that one JWT private + public keyset is used for the entire Auth0 tenant, and that API access to different APIs (Management vs custom) is based on the audience (`aud`) claim inside the JWT signed by the **Auth0 Authentication API**.

### Frontend Authentication

The frontend is authenticated using the **Auth0 React SDK**. This provides a global context that automatically performs login actions by sending requests to the publicly accessible **Auth0 Authentication API**, and then holds states like `isAuthenticated` or `user`, and exposes functions like `logInWithRedirect()`.

### Backend Authentication

The backend is authenticated using JWT. The JWT keyset (public + private RSA keys) is managed by Auth0. To retrieve a JWT for the backend, the **Auth0 React SDK** requests it from the **Auth0 Authentication API**. The backend fetches the public key (ocassionally rotated) from a fixed endpoint and uses that public key to verify the JWT attached from frontend API requests. The private key is securely store on Auth0 servers and is used to sign the JWT before giving it to the frontend.

### Auth0 Management API Authentication

The **Auth0 Management API** is used to manage users, settings, and essentially anything else you can do in the Auth0 dashboard. Of course, this means we don't want users to have full access to this API, so if you want to do anything dangerous, you can make a request from the backend including the client secret to get a JWT for the **Auth0 Management API** from the **Auth0 Authentication API** with whatever scope (permissions) you require, and then that JWT can be used to make **Auth0 Management API** requests.

Alternatively, if you only need to make safe, per-user requests in your app, like in our use case, you can use the **Auth0 React SDK** to get a JWT for the **Auth0 Management API** that only includes scopes for the logged in user. This allows you to safely call the **Auth0 Management API** directly from the frontend for simple use cases like fetching or modifying user info, which we do in Yap.

### Scope

Something very annoying about Auth0 is how it manages scope. When you Initialize the `Auth0Provider` in the React SDK, you can specify an audience (Auth0-registered API), and the scope (permissions) permitted for that API. When the user logs in, they will consent to this (audience, scope) pair, and then any `getAccessTokenSilently()` requests will work as intended. If you instead wanted to `getAccessTokenSilently()` for another (audience, scope) pair, it will fail, because it needs explicit consent for that pair as well. For example a custom API "custom" with scope "custom:all":

```typescript
getAccessTokenSilently({
      // Explicitly specify the scope and API this
      authorizationParams: {
        scope:
          "custom:all",
        audience: "custom",
      },
```

would fail, and you would need to use getAccessTokenWithPopup instead so the user can consent. This even inclues, your additional APIs that do not have any custom scope, for example with the Yap Backend:

```typescript
getAccessTokenSilently({
      // Explicitly specify the scope and API this
      authorizationParams: {
        audience: "yap-backend-url",
      },
```

This will fail if the user didn't consent to this exact audience upon logging in. The recommended workaround is to use a single API gateway and have the user consent to it upon logging in (specify that gateway as the audience in `Auth0Provider` with the necessary scope), and then make all requests to your microservices as well as the **Auth0 Management API** using your gateway as a proxy. This is of course annoying as well because you need to create endpoints that are literally just passthroughs to **Auth0 Management API** endpoints. Alternatively you can use `getAccessTokenWithPopup()` to get consent from the user to access other API's from their account, but then for every additional custom API you use beyond the **Auth0 Management API**, the user will need to consent again, which interrupts their user flow. Currently, I am using this latter approach, but later I will swap to the prior approach to improve the user experience.
