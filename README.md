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

[See docs here](https://github.com/noah-geerts/yap/frontend/README.md)

## Backend

[See docs here](https://github.com/noah-geerts/yap/backend/README.md)

## Description

- You can join any of the rooms in a dropdown
- When you join that room, a duplex connection with the server is initiated
- You can push messages to the server, and the server can push new messages to you for that room
- Rooms are handled manually by the server since the basic WebSocket protocol only allows you to open a bi-directional communication channel with the server as a whole, and does not specify subchannels or namespaces

## API Specification

## REST API

### `Message` Type

```typescript
class Message {
  room: string;
  from: string;
  timestamp_utc: number;
  text: string;
}
```

### `GET /messages/:room`

**Description:**  
Retrieve all messages for the specified room.

**Request:**

- **Method:** `GET`
- **Path Parameter:** `room` — the name of the room
- **Body / Query Params:** none

**Responses:**

- ✅ **200 OK** — returns all messages for the given room
- ❌ **404 Not Found** — if the room does not exist

**Return type:**
`Message[]`

---

## WebSocket

All WebSocket messages use the **text opcode (`0x2`)** and contain **stringified JSON data**, which should be parsed on the receiving end.

### Server → Client Messages

All messages from the **server to client** have the `Message` type, indicating that the server is pushing a new message to the client for a room the client is connected to.

---

### Client → Server Messages

All messages from the **client to server** have the `Message` type, indicating that the client is sending a new message for the given room.
