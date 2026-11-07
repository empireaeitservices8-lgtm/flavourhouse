// Simple in-memory rate limiter to guard against brute-force
const requestCounts = new Map();

function createRateLimiter(options = {}) {
  const windowMs = options.windowMs || 15 * 60 * 1000; // 15 mins
  const max = options.max || 100;
  const message = options.message || "Too many requests. Please try again later.";

  // Clean up periodically
  setInterval(() => {
    const now = Date.now();
    for (const [key, record] of requestCounts.entries()) {
      if (now - record.startTime > windowMs) {
        requestCounts.delete(key);
      }
    }
  }, windowMs);

  return (req, res, next) => {
    const ip = req.ip || req.headers["x-forwarded-for"] || req.socket.remoteAddress || "global";
    const key = `${req.baseUrl || req.path}:${ip}`;
    const now = Date.now();

    const record = requestCounts.get(key);
    if (!record) {
      requestCounts.set(key, { count: 1, startTime: now });
      return next();
    }

    if (now - record.startTime > windowMs) {
      requestCounts.set(key, { count: 1, startTime: now });
      return next();
    }

    record.count += 1;
    if (record.count > max) {
      return res.status(429).json({ success: false, error: message });
    }

    next();
  };
}

module.exports = {
  createRateLimiter,
};

