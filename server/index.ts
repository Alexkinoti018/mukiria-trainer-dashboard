import express from "express";
import { createServer } from "http";
import path from "path";
import { fileURLToPath } from "url";
import { apiRouter } from "./routes.ts";
import { validateServerEnv } from "../shared/envValidator.ts";
import {
  securityHeaders,
  corsMiddleware,
  apiRateLimiter,
} from "./security.ts";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const envValidation = validateServerEnv();
  if (!envValidation.valid) {
    if (process.env.NODE_ENV === "production") {
      console.error("❌ [MTTI Fatal Server Environment Failure]:\n" + envValidation.errors.join("\n"));
      process.exit(1);
    } else {
      console.warn("⚠️ [MTTI Server Environment Warning]:\n" + envValidation.errors.join("\n"));
    }
  } else if (envValidation.warnings.length > 0) {
    envValidation.warnings.forEach((w) => console.warn(w));
  }

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
  const staticPath =
    process.env.NODE_ENV === "production"
      ? path.resolve(__dirname, "public")
      : path.resolve(__dirname, "..", "dist", "public");

  app.use(express.static(staticPath));

  // Handle client-side routing - serve index.html for all routes
  app.get("*", (_req, res) => {
    res.sendFile(path.join(staticPath, "index.html"));
  });

  const port = process.env.PORT || 3000;

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}

startServer().catch(console.error);
