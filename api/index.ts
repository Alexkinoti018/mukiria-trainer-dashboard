import express from "express";
import { apiRouter } from "../server/routes.ts";

const app = express();
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Mount on both /api and root to handle any rewrite variant from Vercel
app.use("/api", apiRouter);
app.use(apiRouter);

export default app;
