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
  for (let i = 1; i <= 5; i++) {
    rooms.set("Room " + i, { name: "Room " + i, messages: [] });
  }

  // Bootstrap server
  bootstrapServer(Number(process.env.PORT) || 3000);
}

startServer().catch(console.error);
