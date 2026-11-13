const APP_VERSION = process.env.APP_VERSION || "1.0.0";

export type LogLevel = "info" | "warn" | "error" | "debug";

export interface LogContext {
  event?: string;
  user_id?: string;
  role?: string;
  cohort?: string;
  path?: string;
  method?: string;
  status?: number;
  duration_ms?: number;
  error?: any;
  [key: string]: any;
}

function sanitizeValue(key: string, value: any): any {
  const lowerKey = key.toLowerCase();
  if (
    lowerKey.includes("password") ||
    lowerKey.includes("secret") ||
    lowerKey.includes("token") ||
    lowerKey.includes("cookie") ||
    lowerKey.includes("authorization")
  ) {
    return "[REDACTED]";
  }
  if (value instanceof Error) {
    return {
      name: value.name,
      message: value.message,
      stack: process.env.NODE_ENV === "production" ? undefined : value.stack,
    };
  }
  return value;
}

function formatLog(level: LogLevel, message: string, context?: LogContext): string {
  const payload: Record<string, any> = {
    timestamp: new Date().toISOString(),
    level,
    message,
    app_version: APP_VERSION,
  };

  if (context && typeof context === "object") {
    for (const [k, v] of Object.entries(context)) {
      payload[k] = sanitizeValue(k, v);
    }
  }

  return JSON.stringify(payload);
}

/**
 * Lightweight structured JSON logger for production observability.
 * Emits uniform JSON lines parseable by Datadog, CloudWatch, Papertrail, and Grafana Loki.
 */
export const logger = {
  info(message: string, context?: LogContext): void {
    console.log(formatLog("info", message, context));
  },
  warn(message: string, context?: LogContext): void {
    console.warn(formatLog("warn", message, context));
  },
  error(message: string, context?: LogContext): void {
    console.error(formatLog("error", message, context));
  },
  debug(message: string, context?: LogContext): void {
    if (process.env.NODE_ENV !== "production" || process.env.DEBUG === "true") {
      console.log(formatLog("debug", message, context));
    }
  },
};
