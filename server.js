import { createServer } from "node:http";
import createDebug from "debug";
import mongoose from "mongoose";

import app from "./app.js";

const debug = createDebug("express-locallibrary-tutorial:server");
const port = Number(process.env.PORT ?? 3000);
if (!Number.isInteger(port) || port < 0 || port > 65535)
  throw new RangeError("PORT must be an integer between 0 and 65535");
app.set("port", port);

const devDbUrl = "mongodb://127.0.0.1:27017/local_library";
const mongoDB = process.env.MONGODB_URI || devDbUrl;

mongoose.connection.on("error", (err) => {
  console.error("MongoDB connection error:", err);
});

mongoose.connection.on("disconnected", () => {
  console.warn("MongoDB disconnected");
});

await mongoose.connect(mongoDB);

const server = createServer(app);
server.on("error", (err) => {
  throw new Error("Failed to start server", { cause: err });
});
server.on("listening", () => {
  const address = server.address();
  debug(`Listening on port ${address.port}`);
});
server.listen(port);
