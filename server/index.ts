import crypto from "crypto";
import express from "express";
import { createServer } from "http";
import path from "path";
import { fileURLToPath } from "url";
import { apiRouter } from "./routes.ts";
import { serverConfig, assertBootEnvironment } from "./config.ts";
import {
  securityHeaders,
  corsMiddleware,
  apiRateLimiter,
} from "./security.ts";
import { initServerSentry, sentryContextMiddleware, captureServerException } from "./sentry.ts";
import { logger } from "./logger.ts";
import { ensureSchemaInitialized } from "./db.ts";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  assertBootEnvironment();

  // Initialize Sentry SDK for production exception tracking (no-op if SENTRY_DSN unset)
  initServerSentry();

  // Ensure database schema and seed accounts exist
  ensureSchemaInitialized().catch(() => {});

  const app = express();
  app.set("trust proxy", 1);
  const server = createServer(app);

  // Apply Enterprise Security Layer
  app.use(securityHeaders);
  app.use(corsMiddleware);

  app.use(express.json({ limit: "10mb" }));
  app.use(express.urlencoded({ extended: true, limit: "10mb" }));

  // Attach safe non-PII Sentry scope context
  app.use(sentryContextMiddleware);

  // Global lab-safe rate limiter (runs after body parsers so identity payload can be resolved)
  app.use(apiRateLimiter);

  app.use("/api", apiRouter);

  // Global sanitized API error handler (Zero Stack/DB Leakage)
  app.use("/api", (err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    const reqId = (req.headers["x-request-id"] as string) || crypto.randomUUID();
    logger.error("Unhandled API Error", { requestId: reqId, method: req.method, url: req.url, error: err?.message, stack: err?.stack });
    captureServerException(err, { requestId: reqId });
    if (res.headersSent) {
      return next(err);
    }
    const status = typeof err?.status === "number" ? err.status : typeof err?.statusCode === "number" ? err.statusCode : 500;
    let clientMessage = "An internal server error occurred.";
    if (status === 400 && err?.isClientSafe) {
      clientMessage = err.message;
    } else if (status === 404) {
      clientMessage = "Resource not found.";
    } else if (status === 403) {
      clientMessage = "Forbidden: Access denied.";
    } else if (status === 401) {
      clientMessage = "Unauthorized: Authentication required.";
    }
    res.status(status).json({ error: clientMessage, request_id: reqId });
  });

  // Serve static files from dist/public in production
  const staticPath = serverConfig.isProduction
    ? path.resolve(__dirname, "public")
    : path.resolve(__dirname, "..", "dist", "public");

  app.use(express.static(staticPath));

  // Handle client-side routing - serve index.html for all routes
  app.get("*", (_req, res) => {
    res.sendFile(path.join(staticPath, "index.html"));
  });

  const port = serverConfig.PORT;

  server.listen(port, () => {
    logger.info("Server started", {
      event: "server_boot",
      port,
      environment: serverConfig.isProduction ? "production" : "development",
    });
  });
}

startServer().catch((err) => {
  logger.error("Fatal server boot failure", { error: err });
  process.exit(1);
});
