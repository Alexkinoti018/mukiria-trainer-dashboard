import express from "express";
import { apiRouter } from "./routes.ts";
import {
  securityHeaders,
  corsMiddleware,
  apiRateLimiter,
} from "./security.ts";
import { initServerSentry, sentryContextMiddleware, captureServerException } from "./sentry.ts";
import { logger } from "./logger.ts";

// Initialize Sentry for serverless functions (no-op if SENTRY_DSN unset)
initServerSentry();

// Guard against unhandled process crashes in serverless environment
process.on("unhandledRejection", (reason) => {
  logger.error("API Serverless Unhandled Rejection", { error: reason });
  captureServerException(reason);
});
process.on("uncaughtException", (error) => {
  logger.error("API Serverless Uncaught Exception", { error });
  captureServerException(error);
});

const app = express();

// Apply Enterprise Security Layer
app.use(securityHeaders);
app.use(corsMiddleware);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Attach safe non-PII Sentry scope context
app.use(sentryContextMiddleware);

// Lab-safe identity-based rate limiter (runs after body parsers so candidate identity can be resolved)
app.use(apiRateLimiter);

// Normalize request URL if rewritten by Vercel serverless layer
app.use((req, res, next) => {
  const matchedPath = (req.headers["x-matched-path"] || req.headers["x-now-route-matches"]) as string;
  if (matchedPath && (req.url.includes("index") || req.url === "/" || req.url === "/api")) {
    const qIdx = req.url.indexOf("?");
    const query = qIdx >= 0 ? req.url.slice(qIdx) : "";
    req.url = matchedPath + query;
  }
  next();
});

// Mount on both /api and root to handle any rewrite variant from Vercel
app.use("/api", apiRouter);
app.use(apiRouter);

// Fallback JSON 404 handler (prevents hanging requests on serverless runtime)
app.use((req, res) => {
  res.status(404).json({ error: `Endpoint not found: ${req.method} ${req.url}` });
});

// Global error handler (always returns valid JSON, preventing unexpected token errors)
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error("[API Serverless Error]", { error: err?.message, stack: err?.stack });
  captureServerException(err);
  if (res.headersSent) {
    return next(err);
  }
  res.status(err?.status || 500).json({ error: err?.message || "Internal server error" });
});

export default app;
