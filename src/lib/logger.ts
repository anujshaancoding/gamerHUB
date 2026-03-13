/**
 * Structured logger for server-side logging.
 * Outputs JSON in production for log aggregation, readable format in dev.
 * Replaces raw console.log/error throughout the codebase.
 */

type LogLevel = "debug" | "info" | "warn" | "error";

interface LogContext {
  [key: string]: unknown;
}

const isProd = process.env.NODE_ENV === "production";

function formatMessage(level: LogLevel, message: string, context?: LogContext) {
  if (isProd) {
    // JSON format for production log aggregation
    return JSON.stringify({
      timestamp: new Date().toISOString(),
      level,
      message,
      ...context,
    });
  }

  // Readable format for development
  const prefix = `[${level.toUpperCase()}]`;
  if (context && Object.keys(context).length > 0) {
    return `${prefix} ${message} ${JSON.stringify(context, null, 2)}`;
  }
  return `${prefix} ${message}`;
}

export const logger = {
  debug(message: string, context?: LogContext) {
    if (!isProd) {
      console.debug(formatMessage("debug", message, context));
    }
  },

  info(message: string, context?: LogContext) {
    console.info(formatMessage("info", message, context));
  },

  warn(message: string, context?: LogContext) {
    console.warn(formatMessage("warn", message, context));
  },

  error(message: string, error?: unknown, context?: LogContext) {
    const errorContext: LogContext = { ...context };

    if (error instanceof Error) {
      errorContext.error_message = error.message;
      errorContext.error_name = error.name;
      if (!isProd) {
        errorContext.stack = error.stack;
      }
    } else if (error !== undefined) {
      errorContext.error_raw = String(error);
    }

    console.error(formatMessage("error", message, errorContext));
  },
};
