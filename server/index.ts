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
import { initServerSentry, sentryContextMiddleware } from "./sentry.ts";
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
