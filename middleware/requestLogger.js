function requestLogger(req, res, next) {
  const now = new Date().toISOString();
  console.log(`[RequestLogger] ${now} ${req.method} ${req.originalUrl} from ${req.ip}`);
  res.locals.requestTime = now;
  next();
}

module.exports = requestLogger;
