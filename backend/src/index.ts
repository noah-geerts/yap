// Load environment variables FIRST before any other imports
import dotenv from "dotenv";

const envPath =
  process.env.NODE_ENV === "production"
    ? ".env.production"
    : ".env.development";

dotenv.config({
  path: envPath,
});

// Now dynamically import modules that depend on environment variables
async function startServer() {
  const { bootstrapServer } = await import("./controller/server.js");
  const rooms = (await import("./persistence/persistence.js")).default;

  // Seed some rooms in persistence
  for (let room of [
    "General",
    "University",
    "Over 30",
    "Politics",
    "Looking for Friends",
  ]) {
    rooms.set(room, { name: room, messages: [] });
  }

  // Bootstrap server
  bootstrapServer(Number(process.env.PORT) || 3000);
}

startServer().catch(console.error);
