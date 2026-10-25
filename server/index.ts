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

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  assertBootEnvironment();

  const app = express();
  const server = createServer(app);

  // Apply Enterprise Security Layer
  app.use(securityHeaders);
  app.use(corsMiddleware);
  app.use(apiRateLimiter);

  app.use(express.json({ limit: "10mb" }));
  app.use(express.urlencoded({ extended: true, limit: "10mb" }));

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
    console.log(`Server running on http://localhost:${port}/`);
  });
}

startServer().catch(console.error);
