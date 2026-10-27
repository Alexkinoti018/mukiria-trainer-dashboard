import express from "express";
import { apiRouter } from "../server/routes.ts";
import {
  securityHeaders,
  corsMiddleware,
  apiRateLimiter,
} from "../server/security.ts";

const app = express();

// Apply Enterprise Security Layer
app.use(securityHeaders);
app.use(corsMiddleware);
app.use(apiRateLimiter);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Normalize request URL if rewritten by Vercel serverless layer
app.use((req, res, next) => {
  const matchedPath = (req.headers["x-matched-path"] || req.headers["x-now-route-matches"]) as string;
  if (matchedPath && req.url.includes("index.ts")) {
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
  console.error("[API Serverless Error]:", err);
  res.status(500).json({ error: err?.message || "Internal server error" });
});

export default app;
