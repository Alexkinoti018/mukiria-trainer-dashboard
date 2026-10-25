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

// Mount on both /api and root to handle any rewrite variant from Vercel
app.use("/api", apiRouter);
app.use(apiRouter);

export default app;
