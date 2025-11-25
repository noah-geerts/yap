import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";
import rooms, { clearDb } from "../persistence/persistence.js";
import Room from "../domain/Room.js";
import server, { bootstrapServer, wsServer } from "./server.js";
import WebSocket, { WebSocketServer } from "ws";
import { clients } from "./message.gateway.js";
import Message from "../domain/Message.js";
import { getValidJWT } from "../common/test.helpers.js";

const TIMEOUT_MS = 200;

// Helper function to close all clients between tests
function closeAllClients() {
  wsServer.clients.forEach((client) => {
    if (
      client.readyState === client.OPEN ||
      client.readyState === client.CONNECTING
    ) {
      client.close();
      // Safety kill in case client never responds
      setTimeout(() => {
        if (client.readyState !== client.CLOSED) client.terminate();
      }, 100);
    }
  });
}

// Helper function to wait for all connections to be closed on the server
async function waitForAllClientsClosed() {
  return new Promise<void>((resolve) => {
    const check = () => {
      if (wsServer.clients.size === 0) return resolve();
      setTimeout(check, 20);
    };
    check();
  });
}

// Helper function to wait for a socket to be closed
async function waitForSocketClosed(ws: WebSocket) {
  return new Promise<void>((resolve) => {
    const check = () => {
      if (ws.readyState === WebSocket.CLOSED) return resolve();
      setTimeout(check, 20);
    };
    check();
  });
}

// Helper function to wait for a connection to be opened
async function waitForSocketOpen(ws: WebSocket) {
  return new Promise<void>((resolve) => ws.once("open", resolve));
}

describe("message gateway e2e tests", () => {
  let port: number = 9998;
  let baseUrl: string = `ws://localhost:${port}`;
  let httpUrl: string = `http://localhost:${port}`;
  let validJwt: string;
  const invalidJwt =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiYWRtaW4iOnRydWUsImlhdCI6MTUxNjIzOTAyMn0.KMUFsIDTnFmyG3nMiGM6H9FNFUROf3wh7SmqJp-QV30";
  const upgradeHeaders = {
    Upgrade: "websocket",
    Connection: "Upgrade",
    "Sec-WebSocket-Key": Buffer.from("test-key").toString("base64"),
    "Sec-WebSocket-Version": "13",
  };

  beforeEach(async () => {
    // Clear all connections
    closeAllClients();
    await waitForAllClientsClosed();

    // Clear clients map
    [...clients.keys()].forEach((key) => clients.set(key, new Set()));
  });

  afterEach(() => {
    // Clear the messages
    clearDb();
  });

  beforeAll(async () => {
    // Get a valid jwt
    validJwt = await getValidJWT();

    // Seed 2 rooms
    const existingRoom: Room = {
      name: "Room1",
      messages: [],
    };
    rooms.set("Room1", existingRoom);

    const existingRoom2: Room = {
      name: "Room2",
      messages: [],
    };
    rooms.set("Room2", existingRoom2);

    // Bootstrap the server
    bootstrapServer(port);
  });

  describe("Connection", () => {
    it("Should deny connection without auth query param", async () => {
      await new Promise<void>((resolve, reject) => {
        const ws = new WebSocket(baseUrl + "?room=Room1");
        // No authorization header in WebSocket options

        ws.on("error", () => resolve()); // Expected
        ws.on("close", (code) => {
          if (code === 1006)
            resolve(); // Connection closed abnormally (auth rejection)
          else reject(new Error("Unexpected close code: " + code));
        });
        ws.on("open", () => reject(new Error("Should have been denied")));

        setTimeout(() => reject(new Error("Timeout")), 1000);
      });
    });

    it("Should get closed by server if no room provided", async () => {
      // Connect to the server
      const ws = new WebSocket(baseUrl + `?auth=${validJwt}`, [], {
        headers: { authorization: `Bearer ${validJwt}` },
      });

      // Wait for the connection to open
      await waitForSocketOpen(ws);
      expect(clients.get("Room2")!.size).toBe(0); // expect no clients to be registered

      // Define booleans for expected behavior
      let clientClosedConnection = false;
      let closed = false;
      ws.on("close", () => {
        closed = true;
      });

      setTimeout(() => {
        // If the connection is still open after 200ms, indicate that the server didn't
        // close it as expected and close it from the client instead
        if (!closed) {
          clientClosedConnection = true;
          ws.close();
        }
      }, TIMEOUT_MS);

      // Disconnect from the server and wait for it to also close the connection
      await waitForAllClientsClosed();
      await waitForSocketClosed(ws);

      // Do checks on booleans
      expect(closed).toBe(true);
      expect(clientClosedConnection).toBe(false);
    });

    it("Should get closed by server if invalid room provided", async () => {
      // Connect to the server
      const ws = new WebSocket(baseUrl + `?auth=${validJwt}&room=Room3`);

      // Wait for the connection to open
      await waitForSocketOpen(ws);
      expect(clients.get("Room2")!.size).toBe(0); // expect no clients to be registered

      // Define booleans for expected behavior
      let clientClosedConnection = false;
      let closed = false;
      ws.on("close", () => {
        closed = true;
      });

      setTimeout(() => {
        // If the connection is still open after 200ms, indicate that the server didn't
        // close it as expected and close it from the client instead
        if (!closed) {
          clientClosedConnection = true;
          ws.close();
        }
      }, TIMEOUT_MS);

      // Disconnect from the server and wait for it to also close the connection
      await waitForAllClientsClosed();
      await waitForSocketClosed(ws);

      // Do checks on booleans
      expect(closed).toBe(true);
      expect(clientClosedConnection).toBe(false);
    });

    it("Should register client, keep connection open, then unregister client on close", async () => {
      // Connect to the server
      const ws = new WebSocket(baseUrl + `?auth=${validJwt}&room=Room2`);

      // Wait for the connection to open
      await waitForSocketOpen(ws);
      expect(clients.get("Room2")!.size).toBe(1); // expect the client to be registered

      // Define booleans for expected behavior
      let clientClosedConnection = false;
      let closed = false;
      ws.on("close", () => {
        closed = true;
      });

      setTimeout(() => {
        // If the connection is still open after 200ms, closed it from the client
        if (!closed) {
          clientClosedConnection = true;
          ws.close();
        }
      }, TIMEOUT_MS);

      // Disconnect from the server and wait for it to also close the connection
      await waitForAllClientsClosed();
      await waitForSocketClosed(ws);

      // Do checks on booleans
      expect(closed).toBe(true);
      expect(clientClosedConnection).toBe(true);
      expect(clients.get("Room2")!.size).toBe(0); // Expect the client to be unregistered
    });
  });

  describe("Send Message", () => {
    it("Message in valid room should persist and be sent to sender", async () => {
      // Connect to the server
      const ws = new WebSocket(baseUrl + `?auth=${validJwt}&room=Room2`);

      // Wait for the connection to open
      await waitForSocketOpen(ws);

      // Define variables for expected behavior
      let messageReceived: Message | undefined = undefined;
      let newMessage: Message = {
        from: "ws",
        room: "Room2",
        timestamp_utc: 0,
        text: "hi",
      };
      ws.send(JSON.stringify(newMessage));
      ws.on("message", (data) => {
        messageReceived = JSON.parse(data.toString());
        ws.close();
      });

      setTimeout(() => {
        // If the connection is still open (we haven't received the message from the server) after 200ms, close it
        if (ws.readyState !== WebSocket.CLOSED) ws.close();
      }, TIMEOUT_MS);

      // Disconnect from the server and wait for it to also close the connection
      await waitForAllClientsClosed();
      await waitForSocketClosed(ws);

      // Do checks on variables
      expect(messageReceived).toEqual(newMessage);
      expect(rooms.get("Room2")?.messages).toEqual([newMessage]);
    });

    it("Message in valid room should persist and be sent to all clients in that room", async () => {
      // Connect to the server
      const ws1 = new WebSocket(baseUrl + `?auth=${validJwt}&room=Room2`);
      const ws2 = new WebSocket(baseUrl + `?auth=${validJwt}&room=Room2`);
      const ws3 = new WebSocket(baseUrl + `?auth=${validJwt}&room=Room1`);

      // Wait for the connections to open
      await waitForSocketOpen(ws1);
      await waitForSocketOpen(ws2);
      await waitForSocketOpen(ws3);

      // Define variables for expected behavior
      let messageReceived1: Message | undefined = undefined;
      let messageReceived2: Message | undefined = undefined;
      let messageReceived3: Message | undefined = undefined;
      let newMessage: Message = {
        from: "ws",
        room: "Room2",
        timestamp_utc: 0,
        text: "hi",
      };
      ws1.send(JSON.stringify(newMessage));
      ws1.on("message", (data) => {
        messageReceived1 = JSON.parse(data.toString());
        ws1.close();
      });
      ws2.on("message", (data) => {
        messageReceived2 = JSON.parse(data.toString());
        ws2.close();
      });
      ws3.on("message", (data) => {
        messageReceived3 = JSON.parse(data.toString());
        ws3.close();
      });

      setTimeout(() => {
        // If the connection is still open (we haven't received the message from the server) after 200ms, close it
        if (ws1.readyState !== WebSocket.CLOSED) ws1.close();
        if (ws2.readyState !== WebSocket.CLOSED) ws2.close();
        if (ws3.readyState !== WebSocket.CLOSED) ws3.close();
      }, TIMEOUT_MS);

      // Disconnect from the server and wait for it to also close the connection
      await waitForAllClientsClosed();
      await waitForSocketClosed(ws1);
      await waitForSocketClosed(ws2);
      await waitForSocketClosed(ws3);

      // Do checks on variables
      expect(messageReceived1).toEqual(newMessage); // ws1 is in Room2 so it should receive the new Message
      expect(messageReceived2).toEqual(newMessage); // ws2 is in Room2 so it should receive the new Message
      expect(messageReceived3).toEqual(undefined); // ws3 is in Room1 so it should get no new message
      expect(rooms.get("Room2")?.messages).toEqual([newMessage]);
    });

    it("Non-JSON Message should not be sent or persisted", async () => {
      // Connect to the server
      const ws = new WebSocket(baseUrl + `?auth=${validJwt}&room=Room2`);

      // Wait for the connection to open
      await waitForSocketOpen(ws);

      // Define variables for expected behavior
      let messageReceived: Message | undefined = undefined;
      ws.send("NOTJSON");
      ws.on("message", (data) => {
        messageReceived = JSON.parse(data.toString());
        ws.close();
      });

      setTimeout(() => {
        // If the connection is still open (we haven't received the message from the server) after 200ms, close it
        if (ws.readyState !== WebSocket.CLOSED) ws.close();
      }, TIMEOUT_MS);

      // Disconnect from the server and wait for it to also close the connection
      await waitForAllClientsClosed();
      await waitForSocketClosed(ws);

      // Do checks on variables
      expect(messageReceived).toEqual(undefined);
      expect(rooms.get("Room2")?.messages).toEqual([]);
      expect(rooms.get("Room1")?.messages).toEqual([]);
    });

    it.each([
      [{ room: "Room2", from: "sender", timestamp_utc: 0 }], // missing field text
      [{ from: "sender", timestamp_utc: 0, text: "hi" }], // missing field room
      [{ room: "Room2", timestamp_utc: 0, text: "hi" }], // missing field from
      [{ room: "Room2", from: "sender", text: "hi" }], // missing field timestamp_utc
      [{ room: "Room2", from: 0, timestamp_utc: 0, text: "hi" }], // from must be a string
      [{ room: 2.2, from: "sender", timestamp_utc: 0, text: "hi" }], // room must be a string
      [{ room: "Room2", from: "sender", timestamp_utc: 0, text: false }], // text must be a string
      [{ room: "Room2", from: 0, timestamp_utc: true, text: "hi" }], // timestamp_utc must be a number
      [{}], // empty object is not a Message
    ])(
      "Incorrect Message objects should not be sent or persisted",
      async (newMessage: any) => {
        // Connect to the server
        const ws = new WebSocket(baseUrl + `?auth=${validJwt}&room=Room2`);

        // Wait for the connection to open
        await waitForSocketOpen(ws);

        // Define variables for expected behavior
        let messageReceived: Message | undefined = undefined;
        ws.send(JSON.stringify(newMessage));
        ws.on("message", (data) => {
          messageReceived = JSON.parse(data.toString());
          ws.close();
        });

        setTimeout(() => {
          // If the connection is still open (we haven't received the message from the server) after 200ms, close it
          if (ws.readyState !== WebSocket.CLOSED) ws.close();
        }, TIMEOUT_MS);

        // Disconnect from the server and wait for it to also close the connection
        await waitForAllClientsClosed();
        await waitForSocketClosed(ws);

        // Do checks on variables
        expect(messageReceived).toEqual(undefined);
        expect(rooms.get("Room2")?.messages).toEqual([]);
        expect(rooms.get("Room1")?.messages).toEqual([]);
      }
    );

    it("Message in invalid room should not be sent or persisted", async () => {
      // Connect to the server
      const ws = new WebSocket(baseUrl + `?auth=${validJwt}&room=Room2`);

      // Wait for the connection to open
      await waitForSocketOpen(ws);

      // Define variables for expected behavior
      let messageReceived: Message | undefined = undefined;
      let newMessage: Message = {
        from: "ws",
        room: "nonexistentRoom",
        timestamp_utc: 0,
        text: "hi",
      };
      ws.send(JSON.stringify(newMessage));
      ws.on("message", (data) => {
        messageReceived = JSON.parse(data.toString());
        ws.close();
      });

      setTimeout(() => {
        // If the connection is still open (we haven't received the message from the server) after 200ms, close it
        if (ws.readyState !== WebSocket.CLOSED) ws.close();
      }, TIMEOUT_MS);

      // Disconnect from the server and wait for it to also close the connection
      await waitForAllClientsClosed();
      await waitForSocketClosed(ws);

      // Do checks on variables
      expect(messageReceived).toEqual(undefined);
      expect(rooms.get("Room2")?.messages).toEqual([]);
      expect(rooms.get("Room1")?.messages).toEqual([]);
    });

    it("Duplicate message should not be persisted", async () => {
      // Connect to the server
      const ws = new WebSocket(baseUrl + `?auth=${validJwt}&room=Room2`);

      // Wait for the connection to open
      await waitForSocketOpen(ws);

      // Define variables for expected behavior
      let messageReceived: Message | undefined = undefined;
      let newMessage: Message = {
        from: "ws",
        room: "Room2",
        timestamp_utc: 0,
        text: "hi",
      };
      rooms.get("Room2")!.messages.push(newMessage); // push the new message already
      ws.send(JSON.stringify(newMessage));
      ws.on("message", (data) => {
        messageReceived = JSON.parse(data.toString());
        ws.close();
      });

      setTimeout(() => {
        // If the connection is still open (we haven't received the message from the server) after 200ms, close it
        if (ws.readyState !== WebSocket.CLOSED) ws.close();
      }, TIMEOUT_MS);

      // Disconnect from the server and wait for it to also close the connection
      await waitForAllClientsClosed();
      await waitForSocketClosed(ws);

      // Do checks on variables
      expect(messageReceived).toEqual(undefined);
      expect(rooms.get("Room2")?.messages).toEqual([newMessage]); // should only have one copy
      expect(rooms.get("Room1")?.messages).toEqual([]);
    });
  });
});
