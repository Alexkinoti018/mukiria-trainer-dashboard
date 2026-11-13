import * as Sentry from "@sentry/node";
import type { Request, Response, NextFunction } from "express";

const SENTRY_DSN = process.env.SENTRY_DSN || "";
const APP_VERSION = process.env.APP_VERSION || "1.0.0";
const ENVIRONMENT = process.env.NODE_ENV || "development";

let isServerSentryInitialized = false;

/**
 * Initialize Sentry SDK on Node.js/Express server.
 * Gracefully no-ops if SENTRY_DSN is unset.
 */
export function initServerSentry(): void {
  if (!SENTRY_DSN || isServerSentryInitialized) {
    return;
  }

  try {
    Sentry.init({
      dsn: SENTRY_DSN,
      environment: ENVIRONMENT,
      release: `mukiria-trainer-dashboard@${APP_VERSION}`,
      tracesSampleRate: 0.1,
      beforeSend(event) {
        // Strip out auth headers, cookie credentials, and body secrets
        if (event.request?.headers) {
          delete event.request.headers["authorization"];
          delete event.request.headers["cookie"];
          delete event.request.headers["x-access-token"];
        }
        if (event.user) {
          delete event.user.email;
          delete event.user.ip_address;
        }
        return event;
      },
    });

    Sentry.setTag("app_version", APP_VERSION);
    isServerSentryInitialized = true;
    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      level: "info",
      event: "sentry_initialized",
      environment: ENVIRONMENT,
      app_version: APP_VERSION,
    }));
  } catch (err) {
    console.warn("[Sentry Server] Failed to initialize:", err);
  }
}

/**
 * Express middleware to tag Sentry scopes with safe non-PII operational context
 */
export function sentryContextMiddleware(req: Request, _res: Response, next: NextFunction): void {
  if (isServerSentryInitialized) {
    const user = (req as any).user;
    if (user) {
      if (user.role) Sentry.setTag("user.role", String(user.role).toLowerCase());
      if (user.cohort_id || user.department_id) {
        Sentry.setTag("cohort", String(user.cohort_id || user.department_id));
      }
      Sentry.setUser({ id: user.id || user.user_id || "authenticated" });
    }
  }
  next();
}

/**
 * Capture server-side exception with non-PII metadata
 */
export function captureServerException(error: unknown, context?: Record<string, any>): void {
  if (!isServerSentryInitialized) return;

  Sentry.withScope((scope) => {
    if (context) {
      const sanitized: Record<string, any> = {};
      for (const [k, v] of Object.entries(context)) {
        if (!k.toLowerCase().includes("password") && !k.toLowerCase().includes("secret") && !k.toLowerCase().includes("token")) {
          sanitized[k] = v;
        }
      }
      scope.setExtras(sanitized);
    }
    Sentry.captureException(error);
  });
}
