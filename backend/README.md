# Yap Backend

The initial backend uses TypeScript with Express and WebSockets. No DI, no class-based services, just exported functions. Ultra simple: not even any package.json scripts. The goal is to keep it as clean as possible and run all commands/tools manually so I know exactly what is happening and how everything fits together rather than getting bogged down in config files, abstract away what I'm running with scripts, and forget how the project is actually set up. I will build on this later.

For testing I used vitest, because setting up jest to run with typescript and ESM is a nightmare: jest expects CommonJS modules by default, and it does not natively support typescript.

## Quick Start

1. Ensure Node.js and npm are installed
2. Run `npm install`
3. Run `npx tsc` to compile the project
4. Run `node dist/index.js` to start the project
5. Run `npx jest` to test the project

## Layered (clean-esque) Architecture

### Controller Layer

The Controller Layer exposes APIs to the client.

Contains a REST controller and a WebSocket Gateway for sending and retrieving messages. See [Rest API Reference](#rest-api) for more details.

### Service Layer

The Service Layer handles business logic.

#### `MessageService`

This is the only service in this version, since we do currently support creation or modification of rooms. At this point it is simply a passthrough to the `MessageRepository` for creating and retrieving messages.

### Repository Layer

The Repository Layer handles interacting with the database to modify and retrieve data while enforcing data integrity. In this version, we have a very simply repository structure:

#### `MessageRepository`

Contains methods for adding a new message to a room and getting recent messages from a room.

#### `RoomRepository`

Contains methods to create and find a room.

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
