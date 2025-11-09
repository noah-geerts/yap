import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";
import app from "./message.controller.js";
import rooms, { clearDb } from "../persistence/persistence.js";
import Room from "../domain/Room.js";
import Message from "../domain/Message.js";

describe("message controller e2e tests", () => {
  let port: number = 9999;
  let baseUrl: string = `http://localhost:${port}/messages`;

  beforeEach(() => {
    // Seed some messages
    const existingRoom: Room = {
      name: "Room1",
      messages: [],
    };
    rooms.set("Room1", existingRoom);

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
    // Clear the map
    clearDb();
  });

  beforeAll(() => {
    app.listen(port, () => {
      console.log(`Test server listening on port ${port}`);
    });
  });

  describe("GET /messages/:room", () => {
    it("should return empty array for room with no chats and no query params", async () => {
      // Act
      const url = baseUrl + "/epicroom";
      const result = await fetch(url);
      const data = await result.json();

      // Assert
      expect(result.status).toBe(200);
      expect(data).toEqual([]);
    });

    it.each([
      [1, "hi"],
      ["no", "bye"],
      ["a", 2],
    ])(
      "should return 500 status when the query params are not parseable as ints",
      async (limit: any, offset: any) => {
        // Act
        const url = baseUrl + `/epicroom?limit=${limit}&offset=${offset}`;
        const result = await fetch(url);

        // Assert
        expect(result.status).toBe(500);
      }
    );

    it("should return empty array for room with no chats and valid query params", async () => {
      // Act
      const url = baseUrl + `/epicroom?limit=2&offset=4`;
      const result = await fetch(url);
      const data = await result.json();

      // Assert
      expect(result.status).toBe(200);
      expect(data).toEqual([]);
    });

    it("should return existing chats for room with chats in descending order", async () => {
      // Act
      const url = baseUrl + `/Room1`;
      const result = await fetch(url);
      const data = await result.json();

      // Assert
      const expected: Message[] = [];
      for (let i = 2; i >= 0; i--) {
        expected.push({
          room: "Room1",
          from: "fakeuser",
          text: "Hello World",
          timestamp_utc: i,
        });
      }
      expect(result.status).toBe(200);
      expect(data).toEqual(expected);
    });

    it("should return correct subarray when using limit and offset", async () => {
      // Act
      const url = baseUrl + `/Room1?offset=1&limit=1`;
      const result = await fetch(url);
      const data = await result.json();

      // Assert
      const expected: Message[] = [];
      for (let i = 1; i >= 1; i--) {
        expected.push({
          room: "Room1",
          from: "fakeuser",
          text: "Hello World",
          timestamp_utc: i,
        });
      }
      expect(result.status).toBe(200);
      expect(data).toEqual(expected);
    });
  });
});
