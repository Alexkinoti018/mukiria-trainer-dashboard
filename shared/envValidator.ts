/**
 * Mukiria Technical Training Institute (MTTI) / Nolimit
 * Environment Validation Engine & Boot-Time Health Guard
 *
 * Ensures rigorous validation of client and server environment configuration,
 * preventing silent failures, credential leaks, and misconfigured deployments.
 */

export interface EnvValidationResult {
  valid: boolean;
  isDemo: boolean;
  errors: string[];
  warnings: string[];
  config: Record<string, string | number | boolean | undefined>;
}

/**
 * Safely extracts environment variable across both Node.js (process.env)
 * and Vite client (import.meta.env / window.__SUPABASE_CONFIG__) runtimes.
 */
function readEnv(key: string): string | undefined {
  // 1. Process environment (Node.js runtime / Vitest / Express server)
  if (typeof process !== "undefined" && process?.env && process.env[key]) {
    return process.env[key];
  }

  // 2. Browser window fallback configs
  if (typeof window !== "undefined") {
    const win = window as any;
    if (key === "VITE_SUPABASE_URL" && win.__SUPABASE_CONFIG__?.url) {
      return win.__SUPABASE_CONFIG__.url;
    }
    if (key === "VITE_SUPABASE_ANON_KEY" && win.__SUPABASE_CONFIG__?.anonKey) {
      return win.__SUPABASE_CONFIG__.anonKey;
    }
    if (win.__ENV__?.[key]) {
      return win.__ENV__[key];
    }
  }

  // 3. Vite import.meta.env
  try {
    // @ts-ignore
    if (typeof import.meta !== "undefined" && import.meta?.env?.[key]) {
      // @ts-ignore
      return import.meta.env[key];
    }
  } catch {
    // Silently continue if import.meta is unavailable
  }

  return undefined;
}

/**
 * Validates Client-Side Environment Variables (Vite / Browser).
 */
export function validateClientEnv(options: { strict?: boolean } = {}): EnvValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  const supabaseUrl = readEnv("VITE_SUPABASE_URL");
  const supabaseAnonKey = readEnv("VITE_SUPABASE_ANON_KEY");
  const nodeEnv = readEnv("NODE_ENV") || readEnv("MODE") || "development";
  const isProduction = nodeEnv === "production" || options.strict === true;

  const isPlaceholderUrl = !supabaseUrl || supabaseUrl.includes("placeholder.supabase.co");
  const isPlaceholderKey = !supabaseAnonKey || supabaseAnonKey === "placeholder-anon-key";
  const isDemo = isPlaceholderUrl || isPlaceholderKey;

  // URL Format Verification
  if (!supabaseUrl) {
    errors.push("Missing required client variable: VITE_SUPABASE_URL");
  } else if (!supabaseUrl.startsWith("https://") && !supabaseUrl.startsWith("http://")) {
    errors.push(`Invalid VITE_SUPABASE_URL: Must start with https:// (got: ${supabaseUrl.substring(0, 15)}...)`);
  } else {
    try {
      new URL(supabaseUrl);
    } catch {
      errors.push(`Malformed VITE_SUPABASE_URL: ${supabaseUrl}`);
    }
  }

  // Key Format Verification
  if (!supabaseAnonKey) {
    errors.push("Missing required client variable: VITE_SUPABASE_ANON_KEY");
  } else if (supabaseAnonKey.length < 20 && !isPlaceholderKey) {
    warnings.push("VITE_SUPABASE_ANON_KEY appears unusually short for a valid Supabase anon key.");
  }

  if (isDemo && !isProduction) {
    warnings.push(
      "⚠️ [MTTI Client Environment]: Running in demo/offline mode with mock credentials. Local IndexedDB fallback active."
    );
  }

  const valid = errors.length === 0 && (!isProduction || !isDemo);

  if (isProduction && isDemo) {
    errors.push("Production deployment rejected: Cannot use placeholder Supabase credentials in production mode.");
  }

  return {
    valid,
    isDemo,
    errors,
    warnings,
    config: {
      VITE_SUPABASE_URL: supabaseUrl,
      isConfigured: !isDemo,
      environment: nodeEnv,
    },
  };
}

/**
 * Validates Server-Side Environment Variables (Node.js / Express Gateway).
 */
export function validateServerEnv(options: { strict?: boolean } = {}): EnvValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  const databaseUrl = readEnv("DATABASE_URL");
  const supabaseDbPassword = readEnv("SUPABASE_DB_PASSWORD");
  const portStr = readEnv("PORT");
  const nodeEnv = readEnv("NODE_ENV") || "development";
  const isProduction = nodeEnv === "production" || options.strict === true;

  let parsedPort = 3000;
  if (portStr) {
    const num = parseInt(portStr, 10);
    if (isNaN(num) || num < 1 || num > 65535) {
      errors.push(`Invalid PORT specified: ${portStr}. Must be an integer between 1 and 65535.`);
    } else {
      parsedPort = num;
    }
  }

  // Database Connection Validation
  if (databaseUrl) {
    if (!databaseUrl.startsWith("postgresql://") && !databaseUrl.startsWith("postgres://")) {
      errors.push("Invalid DATABASE_URL scheme: Must begin with 'postgresql://' or 'postgres://'");
    }
  } else if (!supabaseDbPassword) {
    if (isProduction) {
      errors.push(
        "Missing production database configuration: Either DATABASE_URL or SUPABASE_DB_PASSWORD must be configured."
      );
    } else {
      warnings.push(
        "⚠️ [MTTI Server]: Neither DATABASE_URL nor SUPABASE_DB_PASSWORD configured. Operating with local seed fixtures & in-memory cache."
      );
    }
  }

  const valid = errors.length === 0;

  return {
    valid,
    isDemo: !databaseUrl && !supabaseDbPassword,
    errors,
    warnings,
    config: {
      PORT: parsedPort,
      NODE_ENV: nodeEnv,
      hasDatabaseUrl: Boolean(databaseUrl),
      hasDbPassword: Boolean(supabaseDbPassword),
    },
  };
}
