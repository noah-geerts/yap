import Room from "../domain/Room.js";
import rooms from "../persistence/persistence.js";
import { describe, beforeEach, afterEach, it, expect, beforeAll } from "vitest";
import { bootstrapServer } from "./server.js";
import { getValidJWT } from "../common/test.helpers.js";

const invalidJwt =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiYWRtaW4iOnRydWUsImlhdCI6MTUxNjIzOTAyMn0.KMUFsIDTnFmyG3nMiGM6H9FNFUROf3wh7SmqJp-QV30";

describe("Room Controller", () => {
  let port: number = 9997;
  let baseUrl: string = `http://localhost:${port}/rooms`;
  let validJwt: string;

  beforeAll(async () => {
    bootstrapServer(port);
    validJwt = await getValidJWT();
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
    it("Should return 401 when no auth header provided", async () => {
      // Arrange

      // Act
      const result = await fetch(baseUrl);

      // Assert
      expect(result.status).toBe(401);
      expect(result.statusText).toBe("Unauthorized");
      await expect(result.json()).rejects.toThrow(SyntaxError); // Empty body should throw error when parsing as json
    });

    it("Should return 401 when incorrectly formatted auth header provided", async () => {
      // Arrange

      // Act
      const result = await fetch(baseUrl, {
        headers: { authorization: "???" },
      });

      // Assert
      expect(result.status).toBe(401);
      expect(result.statusText).toBe("Unauthorized");
      await expect(result.json()).rejects.toThrow(SyntaxError); // Empty body should throw error when parsing as json
    });

    it("Should return 401 when invalid token provided", async () => {
      // Arrange

      // Act
      const result = await fetch(baseUrl, {
        headers: { authorization: `Bearer ${invalidJwt}` },
      });

      // Assert
      expect(result.status).toBe(401);
      expect(result.statusText).toBe("Unauthorized");
      await expect(result.json()).rejects.toThrow(SyntaxError); // Empty body should throw error when parsing as json
    });

    it("Should return all room names when authorized", async () => {
      // Arrange

      // Act
      const result = await fetch(baseUrl, {
        headers: { authorization: `Bearer ${validJwt}` },
      });
      const rooms: string[] = await result.json();

      // Assert
      expect(rooms.length).toBe(2);
      expect(rooms).toContain("Room1");
      expect(rooms).toContain("Room2");
    });
  });
});
