import ConstraintViolationError from "../domain/ConstraintViolationError.js";
import ForeignKeyError from "../domain/ForeignKeyError.js";
import Message from "../domain/Message.js";
import Room from "../domain/Room.js";
import rooms, { clearDb } from "../persistence/persistence.js";
import { addMessage, getMessages } from "./message.repository.js";
import { describe, beforeEach, it, expect } from "vitest";

/**
 * @fileoverview Integration tests for the repository layer.
 *
 * Since the repository is a thin wrapper over an in-memory Map,
 * unit tests are skipped in favor of integration tests that verify
 * actual data changes.
 *
 * Test structure:
 * 1. Set up the in-memory database (the Map instance created in persistence.ts).
 * 2. Call the repository method under test.
 * 3. Directly inspect the underlying Map to ensure the data changed as expected.
 */

describe("message repository integration tests", () => {
  beforeEach(() => {
    // Clear the persistence between each test
    clearDb();
  });
  describe("addMessage", () => {
    it("should throw ForeignKeyError for invalid room", () => {
      // Arrange
      const newMessage: Message = {
        room: "doesn't exist",
        from: "fakeuser",
        text: "Hello World",
        timestamp_utc: 0,
      };

      // Act
      expect(() => addMessage(newMessage)).toThrow(ForeignKeyError);

      // Assert
      expect([...rooms.keys()].length).toBe(0); // There should still be no data in the rooms map
    });

    it("should throw ConstraintViolationError if a message with the PK already exists", () => {
      // Arrange (add a message to the map with the same room, from, timestamp_utc)
      const existingMessage: Message = {
        room: "Room1",
        from: "fakeuser",
        text: "Hello World",
        timestamp_utc: 0,
      };
      const newMessage = { ...existingMessage, text: "Goodbye World" };

      const existingRoom: Room = {
        name: "Room1",
        messages: [existingMessage],
      };
      rooms.set("Room1", existingRoom);

      // Act (try to add a duplicate message)
      expect(() => addMessage(newMessage)).toThrow(ConstraintViolationError);

      // Assert (ensure the db still only has the one room and message)
      expect([...rooms.keys()][0]).toBe("Room1");
      expect([...rooms.keys()].length).toBe(1);
      expect(rooms.get("Room1")).toEqual(existingRoom);
    });

    it("should add message successfully if no constraints violated", () => {
      // Arrange (set up an empty room to add to)
      const existingRoom: Room = {
        name: "Room1",
        messages: [],
      };
      rooms.set("Room1", existingRoom);

      const newMessage: Message = {
        room: "Room1",
        from: "fakeuser",
        text: "Hello World",
        timestamp_utc: 0,
      };

      // Act (add the message)
      addMessage(newMessage);

      // Assert (ensure it was added)
      expect([...rooms.keys()][0]).toBe("Room1");
      expect([...rooms.keys()].length).toBe(1);

      const expected: Room = { ...existingRoom, messages: [newMessage] };
      expect(rooms.get("Room1")).toEqual(expected);
    });
  });

  describe("getMessages", () => {
    it("Should return empty array for nonexistent room", () => {
      // Act
      const result: Message[] = getMessages("nonexistentRoom", 0, 10);

      // Assert
      expect(result.length).toBe(0);
    });

    it("Should return sorted messages by timestamp decreasing for existing room", () => {
      // Arrange (set up a room with some messages)
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

      // Act
      let result: Message[] = getMessages("Room1", 0, 10);

      // Assert
      let expected: Message[] = [];
      for (let i = 2; i >= 0; i--) {
        expected.push({
          room: "Room1",
          from: "fakeuser",
          text: "Hello World",
          timestamp_utc: i,
        });
      }
      expect(result).toEqual(expected);

      // Also check that limit and offset work
      result = getMessages("Room1", 1, 1);
      expected = [];
      for (let i = 1; i >= 1; i--) {
        expected.push({
          room: "Room1",
          from: "fakeuser",
          text: "Hello World",
          timestamp_utc: i,
        });
      }
      expect(result).toEqual(expected);
    });
  });
});
