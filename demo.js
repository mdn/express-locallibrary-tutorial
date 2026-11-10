// Run the LocalLibrary with a temporary in-memory database that is filled with sample data.
// No MongoDB installation is needed. All data is discarded when the server stops.
// Usage: npm run demo

import { spawn } from "node:child_process";
import { once } from "node:events";
import path from "node:path";
import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";

console.log("Starting in-memory MongoDB (the first run downloads MongoDB)...");
const mongoServer = await MongoMemoryServer.create();
const mongoDB = mongoServer.getUri("local_library");

async function shutdown() {
  await mongoose.disconnect();
  await mongoServer.stop();
  process.exit();
}
process.once("SIGINT", shutdown);
process.once("SIGTERM", shutdown);

// Add the sample data by running populatedb.js against the in-memory database.
const populate = spawn(
  process.execPath,
  [path.join(import.meta.dirname, "populatedb.js"), mongoDB],
  { stdio: "inherit" },
);
const [exitCode] = await once(populate, "exit");
if (exitCode !== 0) {
  await mongoServer.stop();
  throw new Error(`populatedb.js failed with exit code ${exitCode}`);
}

// Start the app. server.js reads the database URL from MONGODB_URI.
process.env.MONGODB_URI = mongoDB;
await import("./server.js");

const port = process.env.PORT ?? 3000;
console.log(`
LocalLibrary demo running at http://localhost:${port}/
The database is in memory: your changes are lost when you stop the server (Ctrl+C).`);
