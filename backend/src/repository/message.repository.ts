import ConstraintViolationError from "../domain/repository_errors/ConstraintViolationError.js";
import ForeignKeyError from "../domain/repository_errors/ForeignKeyError.js";
import Message from "../domain/Message.js";
import Room from "../domain/Room.js";
import rooms from "../persistence/persistence.js";

// Enforces data integrity: no duplicate message by composite key: room, user, timestamp_utc

// add a message (should enforce fk constraint and pk constraints)
export function addMessage(message: Message) {
  // FK constraint: room exists
  const room: Room | undefined = rooms.get(message.room);
  if (room === undefined)
    throw new ForeignKeyError("Room provided is an invalid FK");

  // PK constraint: no message with the composite PK exists already
  const existing: Message | undefined = room.messages.find(
    (m) => m.from === message.from && m.timestamp_utc === message.timestamp_utc
  );
  if (existing !== undefined)
    throw new ConstraintViolationError(
      "Message with given room, user, and timestamp_utc already exists"
    );

  // Add the message
  room.messages.push(message);
}

// get all messages sorted by largest timestamp first with a limit and offset
export function getMessages(roomName: string, offset: number, limit: number) {
  // If the room doesn't exist we find no messages
  const room: Room | undefined = rooms.get(roomName);
  if (room === undefined) return [];

  // Otherwise sort by timestamp decreasing (most recent is largest timestamp)
  room.messages.sort((a, b) => b.timestamp_utc - a.timestamp_utc);

  // And return using limit and offset
  return room.messages.slice(offset, offset + limit);
}
