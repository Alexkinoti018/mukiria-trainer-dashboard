import * as Sentry from "@sentry/react";

const SENTRY_DSN = import.meta.env.VITE_SENTRY_DSN || "";
const APP_VERSION = import.meta.env.VITE_APP_VERSION || "1.0.0";
const ENVIRONMENT = import.meta.env.MODE || "production";

let isSentryInitialized = false;

/**
 * Initialize Sentry SDK for client error tracking.
 * Gracefully no-ops if VITE_SENTRY_DSN is unset.
 */
export function initClientSentry(): void {
  if (!SENTRY_DSN || isSentryInitialized) {
    if (!SENTRY_DSN && import.meta.env.DEV) {
      // Dev diagnostics only
      // console.debug("[Sentry Client] VITE_SENTRY_DSN is unset; running in zero-overhead no-op mode.");
    }
    return;
  }

  try {
    Sentry.init({
      dsn: SENTRY_DSN,
      environment: ENVIRONMENT,
      release: `mukiria-trainer-dashboard@${APP_VERSION}`,
      tracesSampleRate: 0.1,
      beforeSend(event) {
        // Strip out passwords, tokens, auth headers, and email addresses from breadcrumbs and payloads
        if (event.request?.headers) {
          delete event.request.headers["Authorization"];
          delete event.request.headers["authorization"];
          delete event.request.headers["cookie"];
        }
        if (event.user) {
          delete event.user.email;
          delete event.user.ip_address;
        }
        return event;
      },
    });

    Sentry.setTag("app_version", APP_VERSION);
    isSentryInitialized = true;
  } catch (err) {
    console.warn("[Sentry Client] Failed to initialize:", err);
  }
}

/**
 * Tag Sentry events with non-PII operational context: user.role and cohort.
 */
export function setSentryUserContext(user?: { role?: string; cohort?: string; id?: string } | null): void {
  if (!isSentryInitialized) return;

  if (!user) {
    Sentry.setUser(null);
    return;
  }

  // Tag strictly non-PII attributes
  if (user.role) Sentry.setTag("user.role", user.role.toLowerCase());
  if (user.cohort) Sentry.setTag("cohort", user.cohort);
  Sentry.setTag("app_version", APP_VERSION);

  Sentry.setUser({
    id: user.id || "anonymous",
  });
}

/**
 * Capture an error with safe non-PII context tags
 */
export function captureClientError(error: unknown, extraContext?: Record<string, any>): void {
  if (!isSentryInitialized) return;

  Sentry.withScope((scope) => {
    if (extraContext) {
      const sanitized: Record<string, any> = {};
      for (const [k, v] of Object.entries(extraContext)) {
        if (!k.toLowerCase().includes("password") && !k.toLowerCase().includes("token") && !k.toLowerCase().includes("secret")) {
          sanitized[k] = v;
        }
      }
      scope.setExtras(sanitized);
    }
    Sentry.captureException(error);
  });
}
