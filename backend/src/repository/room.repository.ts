// Enforces data integrity for rooms and allows us to manage them
import Room from "../domain/Room.js";
import rooms from "../persistence/persistence.js";

// Find a room
export function findRoom(roomName: string): Room | undefined {
  return rooms.get(roomName);
}

// Add a room
export function addRoom(roomName: string): void {
  const newRoom: Room = { name: roomName, messages: [] };
  rooms.set(roomName, newRoom);
}

// Get all room names
export function getRoomNames(): string[] {
  return [...rooms.keys()];
}
