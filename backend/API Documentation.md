# API Documentation

This document describes the Message REST API and the WebSocket Gateway used by the backend service.

Contents

- REST API (MessageController)
- WebSocket Gateway (MessageGateway)
- DTO / Schema reference
- Examples (HTTP + socket.io client)

---

## REST API

Base path: `/messages`

Authentication: JWT (Bearer token) using the project's Auth module.
All REST endpoints under `/messages` use the `AuthGuard('jwt')` guard. Provide the access token in the `Authorization` header:

```
Authorization: Bearer <JWT>
```

### GET /messages/:withId

Fetches messages between the authenticated user and the user with id `:withId`.

Request

- Method: GET
- URL: `/messages/:withId`
- Headers:
  - `Authorization: Bearer <JWT>` (required)
- Query parameters:
  - `lastReceivedTimestamp` (optional) — an integer cursor (timestamp in UTC epoch millis or seconds depending on your client conventions). When provided, the server will return messages with `timestamp_utc < lastReceivedTimestamp` (i.e., older messages). If omitted, the server returns the latest messages.

Behavior / validation

- If `lastReceivedTimestamp` is provided it must parse as an integer >= 0. If it cannot be parsed, the server responds with 400 Bad Request.
- The controller passes the authenticated user's `sub` (user id) and `withId` to the `MessageService.getMessages` method.

Responses

- 200 OK
  - Body: JSON array of message objects (see Message schema below). The messages are returned in descending order by `timestamp_utc` (most recent first). The result page size is limited (server uses Limit: 20).

- 400 Bad Request
  - When `lastReceivedTimestamp` is invalid (non-integer, negative) the server returns 400 with a standard NestJS BadRequestException response body.

- 401 Unauthorized
  - When the JWT is missing or invalid.

Example

Request
GET /messages/other-user-123?lastReceivedTimestamp=1630000000000
Headers: Authorization: Bearer eyJ...

Response (200)

```json
[
  {
    "chatid": "alice:other-user-123",
    "timestamp_utc": 1629999999000,
    "text": "hey",
    "from": "alice"
  },
  {
    "chatid": "alice:other-user-123",
    "timestamp_utc": 1629999998000,
    "text": "hello back",
    "from": "other-user-123"
  }
]
```

Notes

- The controller enforces authentication via `@UseGuards(AuthGuard('jwt'))` and extracts the user using `@User()` decorator.
- Pagination is cursor-based using `lastReceivedTimestamp`.

---

## WebSocket Gateway

Gateway: `MessageGateway` (Socket.IO-based)

- WebSocket server uses Socket.IO and is configured with CORS allowed (`@WebSocketGateway({ cors: true })`).

Authentication (handshake)

- The gateway expects clients to provide an `Authorization` header on the Socket.IO handshake. The header must be in the same `Bearer <JWT>` format used for REST.
- During connection (`handleConnection`), the server extracts the JWT and calls `AuthService.verifyToken(jwt)`. If verification fails or `Authorization` header is missing, the server disconnects the client.

Connection example (socket.io client):

```js
import { io } from 'socket.io-client';

const socket = io('https://your-server.example', {
  auth: {
    // If your client uses cookie-based or custom handshake, ensure the server reads headers accordingly.
  },
  extraHeaders: {
    Authorization: 'Bearer ' + token,
  },
});
```

Events

1. sendMessage (client -> server)

- Purpose: client sends a new message to persist and deliver.
- Validation: The gateway applies a Nest `ValidationPipe` on the handler with the following options:
  - `transform: true` — payloads will be transformed into DTO instances (so e.g. numeric conversions may occur if DTO uses class-transformer types).
  - `whitelist: true` — properties not defined on the DTO will be stripped.
  - `forbidNonWhitelisted: true` — if the payload contains extra properties not on the DTO, validation will fail.
  - `exceptionFactory: (errors) => new WsException(errors)` — validation failures throw a `WsException`.
- DTO: `SendMessageDto` (see DTO section below).

Acknowledgement and error handling

- The gateway uses a `SendMessageExceptionFilter` (applied with `@UseFilters`) to handle thrown exceptions.
- When message validation or processing fails, the `SendMessageExceptionFilter` will catch thrown exceptions and emit the following event:
  1. `messageStatus` (emitted only to the sender client) — indicates failure to deliver the message and echoes message text/timestamp.
     - Payload: `MessageStatusDto` (see DTOs below). Includes `success: false` and `errorMessage: "some description of what occured"`.
     - Emitted via: `client.emit('messageStatus', status)`

Server-side behavior on successful sendMessage

- The gateway calls `messageService.sendMessage(...)` to persist the message in DynamoDB.
- After persisting, the gateway emits two things:
  1. `messageStatus` (emitted only to the sender client) — indicates success and echoes message text/timestamp.
     - Payload: `MessageStatusDto` (see DTOs below). Includes `success: true` on successful persistence.
     - Emitted via: `client.emit('messageStatus', status)`
  2. `newMessage` (emitted to recipient sockets whose authenticated `sub` equals `toId`) — real-time delivery to online recipient(s).
     - Payload: `NewMessageDto` (see DTOs below).
     - Emitted via: `socket.emit('newMessage', message)` for each matching socket.

Events summary

- Client -> Server
  - `sendMessage` : SendMessageDto
- Server -> Client
  - `messageStatus` : MessageStatusDto (to sender)
  - `newMessage` : NewMessageDto (to recipient)
  - `ws-error` or `exception` : error payload (depending on server exception filter/adapter)

---

## DTO / Schema reference

All the DTOs below are derived from the source in `src/domain` and usage in the gateway/service.

### SendMessageDto

Validation rules (applies for WebSocket `sendMessage`):

- `fromId`: string (non-empty)
- `toId`: string (non-empty)
- `timestamp_utc`: integer (number) — the DTO uses `@IsInt()` and the gateway `ValidationPipe` uses `transform: true`, so numeric conversion is applied when possible.
- `text`: string (non-empty)

JSON example

```json
{
  "fromId": "alice",
  "toId": "bob",
  "timestamp_utc": 1629999999000,
  "text": "Hello Bob!"
}
```

Behavior on invalid payload

- The `ValidationPipe` will reject invalid payloads:
  - Missing required fields
  - Wrong type (e.g., text sent as an object)
  - Extra fields (if `forbidNonWhitelisted` is true)
- When validation fails a `WsException` containing the validation errors is thrown. The `SendMessageExceptionFilter` (or a `WsExceptionsFilter`) should catch it, log it, and emit a socket-level error event the client can handle (e.g., `ws-error` or `exception`).

### MessageStatusDto

Sent to sender after successful persistence.

Fields:

- `fromId`: string
- `toId`: string
- `timestamp_utc`: number
- `text`: string
- `success`: boolean

Example

```json
{
  "fromId": "alice",
  "toId": "bob",
  "timestamp_utc": 1629999999000,
  "text": "Hello Bob!",
  "success": true
}
```

### NewMessageDto

Sent to recipient(s) when a new message arrives.

Fields:

- `fromId`: string
- `toId`: string
- `timestamp_utc`: number
- `text`: string

Example

```json
{
  "fromId": "alice",
  "toId": "bob",
  "timestamp_utc": 1629999999000,
  "text": "Hello Bob!"
}
```

### Message (DynamoDB / storage model)

The `MessageService` stores a message object with these fields (marshall/unmarshall used for DynamoDB):

- `chatid`: string (composed by `getChatId(from,to)` which sorts the two ids and joins with `:` — used as the partition/key)
- `timestamp_utc`: number
- `text`: string
- `from`: string

Example stored item

```json
{
  "chatid": "alice:bob",
  "timestamp_utc": 1629999999000,
  "text": "Hello Bob!",
  "from": "alice"
}
```

---

## Client examples

Socket.IO client example (send message + handle errors/acks):

```js
// create socket and include Authorization header in handshake
const socket = io('https://your-server', {
  transports: ['websocket'],
  extraHeaders: { Authorization: `Bearer ${token}` },
});

// Listen for server-side global errors emitted by filters
socket.on('ws-error', (err) => console.error('Server WS error', err));
socket.on('exception', (err) => console.error('Server exception', err));

// Send message with ack callback
const payload = {
  fromId: 'alice',
  toId: 'bob',
  timestamp_utc: Date.now(),
  text: 'Hey Bob!',
};

socket.emit('sendMessage', payload, (ack) => {
  // If you implement explicit ack responses server-side, handle them here.
  if (ack && ack.error) console.error('send failed', ack.error);
  else console.log('send acknowledged', ack);
});

// Listen for incoming messages
socket.on('newMessage', (msg) => console.log('New message', msg));
socket.on('messageStatus', (s) => console.log('Message status', s));
```

HTTP client example (fetch messages)

```js
fetch('https://your-server/messages/bob', {
  headers: { Authorization: 'Bearer ' + token },
})
  .then((r) => r.json())
  .then((messages) => console.log(messages));
```

---

## Troubleshooting and notes

- Validation appears to stop handlers (by throwing `WsException`) but will not automatically emit a user-facing socket event unless an exception filter emits one. Ensure you have a WebSocket exception filter (e.g., `SendMessageExceptionFilter` or `WsExceptionsFilter`) that logs and emits `ws-error` or a standard event the client listens for.
- Socket.IO acknowledgement pattern is the most robust way to give the client a synchronous success/error response for a particular emit.
- The gateway disconnects unauthenticated sockets during handshake — make sure the client sends the Authorization header on the handshake.

---

If you'd like, I can:

- Add a `WsExceptionsFilter` implementation to the repo that logs and emits `ws-error` with structured details, or
- Convert `sendMessage` to respond via the socket ack callback with `{ success: boolean, error?: { ... } }` for clearer client handling.
