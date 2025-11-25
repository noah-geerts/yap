# Yap Backend

The initial backend uses TypeScript with Express and WebSockets. No DI, no class-based services, just exported functions. Ultra simple: not even any package.json scripts. The goal is to keep it as clean as possible and run all commands/tools manually so I know exactly what is happening and how everything fits together rather than getting bogged down in config files, abstract away what I'm running with scripts, and forget how the project is actually set up. I will build on this later.

For testing I used vitest, because setting up jest to run with typescript and ESM is a nightmare: jest expects CommonJS modules by default, and it does not natively support typescript.

## Quick Start

1. Ensure Node.js and npm are installed
2. Run `npm install`
3. Run `npx tsc` to compile the project
4. Run `node dist/index.js` to start the project
5. Run `npx vitest` to test the project

## Layered (clean-esque) Architecture

### Controller Layer

The Controller Layer exposes APIs to the client.

Contains REST controllers to fetch messages and room names and a WebSocket Gateway for sending and retrieving messages. See [Rest API Reference](#rest-api) for more details.

### Service Layer

The Service Layer handles business logic.

#### `MessageService`

At this point it is simply a passthrough to the `MessageRepository` for creating and retrieving messages.

#### `RoomService`

At this point it is simply a passthrough to the `RoomRepository` for fetching all room names.

### Repository Layer

The Repository Layer handles interacting with the database to modify and retrieve data while enforcing data integrity. In this version, we have a very simply repository structure:

#### `MessageRepository`

Contains methods for adding a new message to a room and getting recent messages from a room.

#### `RoomRepository`

Contains methods to create, find, and list rooms.

### Persistence Layer

The Persistence Layer is simply for creating and managing a database connection.

In this version, we simply store a javascript `Map<String, Room>`, where the key is a room name and the value is a Room object storing the room name and all of its messages in no particular order. This of course means there is no persistence between server starts.

### Domain "Layer"

I call this a "layer" in quotes because it simply holds some types that can be used at any other layer, but doesn't actually contain any functionality. It simply enforces data shape based on business rules.

#### Message

```typescript
type Message = {
  room: string;
  from: string;
  timestamp_utc: number;
  text: string;
};
```

#### Room

```typescript
type Room = {
  name: string;
  messages: Message[];
};
```

## API Specification

## REST API

All requests are expected to include an authorization header containing a JWT signed by Auth0 for this backend service.

### `GET /messages/:room`

**Description:**  
Retrieve all messages for the specified room in order of timestamp descending (most recent first)

**Request:**

- **Method:** `GET`
- **Body:** none
- **Query Params:**
  - `limit` (optional, integer) — maximum number of messages to return; defaults to 20.
  - `offset` (optional, integer) — number of messages to skip from the start of the result set; defaults to 0.

**Responses:**

- ✅ **200 OK** — returns all messages for the given room, or an empty array if the room doesn't exist

**Return type:**
`Message[]`

---

### `GET /rooms`

**Description:**  
Retrieves an array containing the names of all valid rooms.

**Request:**

- **Method:** `GET`
- **Body:** none

**Responses:**

- ✅ **200 OK** — returns all room names

**Return type:**
`string[]`

---

## WebSocket

**All client connections are expected to include the room query param to specify which room the client wants to connect to. Only connections with valid rooms will be accepted (see the e2e tests).** All WebSocket messages use the **text opcode (`0x2`)** and contain **stringified JSON data**, which should be parsed on the receiving end. All client connections are also expected to include an Authorization header in the Upgrade request. Otherwise, the client will receive `401 Unauthorized` instead of `101 Switching` Protocols.

### Server → Client Messages

All messages from the **server to client** have the `Message` type, indicating that the server is pushing a new message to the client for a room the client is connected to.

---

### Client → Server Messages

All messages from the **client to server** have the `Message` type, indicating that the client is sending a new message for the given room.

## E2E Testing Websockets

It is innately difficult to e2e test WebSockets due to their event-driven nature: you cannot use synchronous tests or await them directly. As a result I took the following approach:

### Helper Functions

- `closeAllClients()` closes all WebSocket connections from the server's end. Used to reset gateway state before tests.
- `waitForAllClientsClosed()` uses a 20ms tick to wait until there are no remaining connections to the server using `WebSocketServer.clients.size === 0`
- `waitForSocketClosed(ws: WebSocket)` uses a 20ms tick to wait until a single WebSocket is closed
- `waitForSocketOpen(ws: WebSocket)` waits for a socket to open.

### BeforeEach

The following BeforeEach is used to ensure all connections are closed and all clients are cleared from the map we use to manage clients by room. This ensures a blank slate before each test:

```typescript
beforeEach(async () => {
  // Clear all connections
  closeAllClients();
  await waitForAllClientsClosed();

  // Clear clients map
  [...clients.keys()].forEach((key) => clients.set(key, new Set()));
});
```

### Test Format

To ensure consistent and deterministic WebSocket behavior (avoiding race conditions or missed event timing), each test follows this structured pattern:

1. **Connect to the server**

   - Create a new WebSocket connection to the test server.
   - Optionally include headers (e.g., `location`) to simulate valid or invalid room joins.

2. **Wait for the connection to open**

   - Use `await waitForSocketOpen(ws)` to ensure the connection is fully established before making assertions.
   - Immediately check that any expected state changes (e.g., client registration) have occurred.

3. **Prepare event listeners and tracking variables**

   - Define variables to capture expected outcomes (e.g., messages received, whether the server closed the connection, etc.).
   - Register `ws.on("message")` and/or `ws.on("close")` handlers to update these variables and, when appropriate, close the socket once all expected events have fired.

4. **Set up a timeout fallback**

   - Use `setTimeout` to forcibly close the client connection after a short delay (e.g., 200 ms) if expected events do not occur.
   - This ensures the test does not hang and lets you mark whether the closure was **client-initiated** (meaning the server failed to behave as expected).

5. **Wait for complete closure**

   - Use both `await waitForAllClientsClosed()` and `await waitForSocketClosed(ws)` to guarantee that:
     - The server has cleaned up all client connections.
     - The client socket has fully transitioned to the `CLOSED` state.
   - This prevents assertions from running before cleanup is complete.

6. **Assert final state**
   - Verify that all tracking variables reflect the expected behavior, such as:
     - The correct message(s) were received (or none if invalid).
     - The correct side (client or server) closed the connection.
     - The internal room/client mappings are updated appropriately.
     - The database is updated or not updated as expected.
