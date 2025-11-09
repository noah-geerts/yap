import { bootstrapServer } from "./controller/server.js";
import rooms from "./persistence/persistence.js";

// Seed some rooms in persistence
for (let i = 1; i <= 5; i++) {
  rooms.set("Room " + i, { name: "Room " + i, messages: [] });
}

// Bootstrap server
bootstrapServer(3000);
