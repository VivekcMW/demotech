import * as Sentry from "@sentry/node";
import { profilingIntegration } from "@sentry/profiling-node";

export function initSentry() {
  if (!process.env.SENTRY_DSN) {
    console.warn("SENTRY_DSN not configured, skipping Sentry initialization");
    return;
  }

  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV || "development",
    release: process.env.npm_package_version || "1.0.0",
    
    // Performance monitoring
    tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
    profilesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
    
    // Integrations
    integrations: [
      profilingIntegration(),
    ],
    
    // Error filtering
    beforeSend(event, hint) {
      // Filter out known non-critical errors
      const error = hint.originalException;
      if (error instanceof Error) {
        // Ignore network errors during graceful shutdown
        if (error.message.includes("ECONNREFUSED") || error.message.includes("connection refused")) {
          return null;
        }
        // Ignore JWT expiration (handled by auth middleware)
        if (error.message.includes("JwtTokenExpired") || error.message.includes("JwtTokenInvalid")) {
          return null;
        }
      }
      return event;
    },
    
    // Context enrichment
    initialScope: {
      tags: {
        service: "aarogya-backend",
        component: "api",
      },
    },
  });

  console.log("Sentry initialized for", process.env.NODE_ENV);
}

export { Sentry };