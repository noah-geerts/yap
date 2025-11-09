import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";
import rooms, { clearDb } from "../persistence/persistence.js";
import Room from "../domain/Room.js";
import server, { bootstrapServer } from "./server.js";
import WebSocket from "ws";
import Message from "../domain/Message.js";
import { clients } from "./message.gateway.js";

describe("message gateway e2e tests", () => {
  let port: number = 9998;
  let baseUrl: string = `ws://localhost:${port}`;

  beforeEach(() => {
    // Seed some messages
    const existingRoom = rooms.get("Room1")!;
    for (let i = 0; i < 3; i++) {
      existingRoom.messages.push({
        room: "Room1",
        from: "fakeuser",
        text: "Hello World",
        timestamp_utc: i,
      });
    }
  });

  afterEach(() => {
    // Clear the messages
    clearDb();
  });

  beforeAll(() => {
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
    it("Should immediately close connection when no room provided", async () => {
      await new Promise<void>((resolve, reject) => {
        // Connect to the websocket server
        const ws1 = new WebSocket(baseUrl);

        // Register event handlers
        ws1.on("close", () => resolve()); // test passes if we are disconnected quickly
        setTimeout(() => reject(), 200); // fail if we are still connected after 200ms
        ws1.on("open", () => expect(clients.get("Room1")!.size).toBe(0)); // ensure no new client registered
      });
    });

    it("Should immediately close connection when invalid room provided", async () => {
      await new Promise<void>((resolve, reject) => {
        // Connect to the websocket server
        const ws1 = new WebSocket(baseUrl, [], {
          headers: { location: "nonexistentRoom" },
        });

        // Register event handlers
        ws1.on("close", () => resolve()); // test passes if we are disconnected quickly
        setTimeout(() => reject(), 200); // fail if we are still connected after 200ms
        ws1.on("open", () => expect(clients.get("Room1")!.size).toBe(0)); // ensure no new client registered
      });
    });

    it("Should keep connection open and register client in room when valid room provided", async () => {
      await new Promise<void>((resolve, reject) => {
        // Connect to the websocket server
        const ws1 = new WebSocket(baseUrl, [], {
          headers: { location: "Room1" },
        });

        // Register event handlers
        ws1.on("close", () => reject()); // test fails if we are disconnected
        ws1.on("open", () => expect(clients.get("Room1")!.size).toBe(1)); // client registered on connection
        setTimeout(() => {
          resolve();
        }, 200); // pass if we are still connected after 200ms
      });
    });
  });
});
