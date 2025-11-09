import Room from "../domain/Room.js";
import rooms, { clearDb } from "../persistence/persistence.js";
import { addRoom, findRoom } from "./room.repository.js";
import { describe, beforeEach, it, expect } from "vitest";

/**
 * @fileoverview Integration tests for the room repository.
 *
 * Simple tests that verify `addRoom` and `findRoom` behave as expected
 * when interacting with the in-memory persistence Map.
 */

describe("room repository integration tests", () => {
  beforeEach(() => {
    // Clear the persistence between each test
    clearDb();
  });

  describe("addRoom", () => {
    it("should add room successfully", () => {
      // Act
      addRoom("Room1");

      // Assert
      expect([...rooms.keys()][0]).toBe("Room1");
      expect([...rooms.keys()].length).toBe(1);

      const expected: Room = { name: "Room1", messages: [] };
      expect(rooms.get("Room1")).toEqual(expected);
    });
  });

  describe("findRoom", () => {
    it("should return undefined for nonexistent room", () => {
      // Act & Assert
      expect(findRoom("nonexistentRoom")).toBeUndefined();
    });

    it("should return the room when it exists", () => {
      // Arrange
      const existingRoom: Room = { name: "Room1", messages: [] };
      rooms.set("Room1", existingRoom);

      // Act
      const result = findRoom("Room1");

      // Assert
      expect(result).toEqual(existingRoom);
    });
  });
});
