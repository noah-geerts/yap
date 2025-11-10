import Room from "../domain/Room.js";
import rooms from "../persistence/persistence.js";
import { describe, beforeEach, afterEach, it, expect, beforeAll } from "vitest";
import { bootstrapServer } from "./server.js";

describe("Room Controller", () => {
  let port: number = 9997;
  let baseUrl: string = `http://localhost:${port}/rooms`;

  beforeAll(() => {
    bootstrapServer(port);
  });

  beforeEach(() => {
    // Seed some rooms
    rooms.set("Room1", { name: "Room1", messages: [] });
    rooms.set("Room2", { name: "Room2", messages: [] });
  });

  afterEach(() => {
    rooms.clear();
  });

  describe("GET /rooms", () => {
    it("Should return all room names", async () => {
      // Arrange

      // Act
      const result = await fetch(baseUrl);
      const rooms: string[] = await result.json();

      // Assert
      expect(rooms.length).toBe(2);
      expect(rooms).toContain("Room1");
      expect(rooms).toContain("Room2");
    });
  });
});
