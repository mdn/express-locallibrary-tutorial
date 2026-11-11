import path from "node:path";
import createError from "http-errors";
import express from "express";
import logger from "morgan";
import compression from "compression";
import helmet from "helmet";
import RateLimit from "express-rate-limit";

import indexRouter from "./routes/index.js";
import usersRouter from "./routes/users.js";
import catalogRouter from "./routes/catalog.js"; // Import routes for "catalog" area of site

const app = express();

// Set up rate limiter: maximum of twenty requests per minute
const limiter = RateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 20,
});
// Apply rate limiter to all requests
app.use(limiter);

// Add helmet to the middleware chain.
// Set CSP headers to allow our Bootstrap scripts to be served
app.use(
  helmet.contentSecurityPolicy({
    directives: {
      "script-src": ["'self'", "cdn.jsdelivr.net"],
    },
  }),
);

// view engine setup
app.set("views", path.join(import.meta.dirname, "views"));
app.set("view engine", "pug");

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(compression()); // Compress all routes

app.use(express.static(path.join(import.meta.dirname, "public")));

app.use("/", indexRouter);
app.use("/users", usersRouter);
app.use("/catalog", catalogRouter); // Add catalog routes to middleware chain.

// catch 404 and forward to error handler
app.use((req, res, next) => {
  next(createError(404));
});

// error handler
app.use((err, req, res, next) => {
  if (res.headersSent) {
    next(err);
    return;
  }

  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};
  res.status(err.status ?? 500);
  res.render("error");
});

export default app;
