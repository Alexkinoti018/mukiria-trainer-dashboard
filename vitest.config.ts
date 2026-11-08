import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets"),
    },
  },
  test: {
    root: path.resolve(import.meta.dirname),
    include: ["tests/**/*.{test,spec}.?(c|m)[jt]s?(x)"],
    setupFiles: [path.resolve(import.meta.dirname, "tests", "setup_runtime_data.ts")],
    env: {
      NODE_ENV: "test",
      JWT_SECRET: "mtti_test_jwt_secret_min_32_chars_long_and_cryptographically_strong!",
    },
  },
});
