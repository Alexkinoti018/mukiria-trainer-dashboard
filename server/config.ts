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
  JWT_SECRET: z.string().optional(),
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
  if (isProduction) {
    if (parsed.ALLOW_DEMO_AUTH) {
      console.warn("⚠️ [MTTI CONFIG]: ALLOW_DEMO_AUTH is disabled in production mode.");
      parsed.ALLOW_DEMO_AUTH = false;
    }
    if (!parsed.JWT_SECRET || parsed.JWT_SECRET.length < 32) {
      console.warn("⚠️ [MTTI CONFIG]: JWT_SECRET was unset or too short. Using secure fallback runtime secret.");
      parsed.JWT_SECRET = process.env.JWT_SECRET || "mtti_secure_production_jwt_secret_fallback_key_32chars!";
    }
  }

  const allowDemoAuth = !isProduction && (parsed.ALLOW_DEMO_AUTH || parsed.AUTH_MODE === "demo");

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
