/**
 * Mukiria Technical Training Institute (MTTI)
 * Type-Safe Server Environment & Configuration Layer
 *
 * Implements strict, typed schema validation using Zod for server-side
 * environment variables, preventing misconfigured boot failures and credential issues.
 */

import { z } from "zod";
import { validateServerEnv } from "../shared/envValidator.ts";

const ServerConfigSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().min(1).max(65535).default(3000),
  AUTH_MODE: z.enum(["supabase", "demo"]).default(
    process.env.NODE_ENV === "production" ? "supabase" : "demo"
  ),
  ALLOW_DEMO_AUTH: z
    .string()
    .optional()
    .transform((val) => val === "true" || val === "1"),
  DATABASE_URL: z.string().optional(),
  SUPABASE_DB_PASSWORD: z.string().optional(),
  SUPABASE_URL: z.string().url().optional().or(z.literal("")),
  SUPABASE_ANON_KEY: z.string().optional(),
  SUPABASE_JWT_SECRET: z.string().optional(),
  STRICT_DB: z
    .string()
    .optional()
    .transform((val) => val === "true" || val === "1"),
});

export type ServerConfig = z.infer<typeof ServerConfigSchema>;

/**
 * Parses and returns validated server configuration.
 */
export function loadServerConfig(): ServerConfig & {
  isProduction: boolean;
  isTest: boolean;
  isDevelopment: boolean;
  allowDemoAuth: boolean;
} {
  const parsed = ServerConfigSchema.parse(process.env);

  const isProduction = parsed.NODE_ENV === "production";
  const isTest = parsed.NODE_ENV === "test";
  const isDevelopment = parsed.NODE_ENV === "development";

  // Demo auth is allowed if explicitly permitted or if running in demo mode in non-production
  const allowDemoAuth = parsed.ALLOW_DEMO_AUTH || (parsed.AUTH_MODE === "demo" && !isProduction);

  return {
    ...parsed,
    isProduction,
    isTest,
    isDevelopment,
    allowDemoAuth,
  };
}

export const serverConfig = loadServerConfig();

/**
 * Validates environment on boot and prints diagnostics.
 */
export function assertBootEnvironment(): void {
  const result = validateServerEnv();
  if (!result.valid) {
    if (serverConfig.isProduction) {
      console.error("❌ [MTTI Fatal Server Environment Failure]:\n" + result.errors.join("\n"));
      process.exit(1);
    } else {
      console.warn("⚠️ [MTTI Server Environment Warning]:\n" + result.errors.join("\n"));
    }
  } else if (result.warnings.length > 0) {
    result.warnings.forEach((w) => console.warn(w));
  }
}
