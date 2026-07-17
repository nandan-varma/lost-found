type LogLevel = "debug" | "info" | "warn" | "error";

type LogContext = Record<string, unknown>;

const COLORS = {
  reset: "\x1b[0m",
  bold: "\x1b[1m",
  dim: "\x1b[2m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
  white: "\x1b[37m",
  gray: "\x1b[90m",
};

const LEVEL_COLORS: Record<LogLevel, string> = {
  debug: COLORS.gray,
  info: COLORS.green,
  warn: COLORS.yellow,
  error: COLORS.red,
};

const LEVEL_ICONS: Record<LogLevel, string> = {
  debug: "○",
  info: "●",
  warn: "▲",
  error: "✖",
};

const STACK_LINE_REGEX = /at (.+) \((.+):(\d+):(\d+)\)/;

function formatTimestamp(date: Date): string {
  return date.toLocaleTimeString("en-US", {
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function formatValue(value: unknown, indent = ""): string {
  if (value === null) {
    return `${COLORS.gray}null${COLORS.reset}`;
  }
  if (value === undefined) {
    return `${COLORS.gray}undefined${COLORS.reset}`;
  }
  if (typeof value === "string") {
    if (value.length > 60) {
      return `"${value.slice(0, 57)}…"`;
    }
    return `"${value}"`;
  }
  if (typeof value === "number" || typeof value === "boolean") {
    return `${COLORS.cyan}${value}${COLORS.reset}`;
  }
  if (value instanceof Error) {
    return [
      `${COLORS.red}${value.message}${COLORS.reset}`,
      value.stack ? `\n${indent}  ${formatStack(value.stack)}` : "",
    ].join("");
  }
  if (Array.isArray(value)) {
    if (value.length === 0) {
      return `${COLORS.gray}[]${COLORS.reset}`;
    }
    const items = value.map((v) => `${indent}    ${formatValue(v, indent)}`);
    return `[\n${items.join(",\n")}\n${indent}  ]`;
  }
  if (typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>);
    if (entries.length === 0) {
      return `${COLORS.gray}{}${COLORS.reset}`;
    }
    const formatted = entries.map(([k, v]) => {
      const key = `${COLORS.blue}${k}${COLORS.reset}`;
      const val = formatValue(v, indent);
      return `${indent}  ${key}: ${val}`;
    });
    return `{\n${formatted.join(",\n")}\n${indent}}`;
  }
  return String(value);
}

function formatStack(stack: string): string {
  return stack
    .split("\n")
    .slice(1, 4)
    .map((line) => {
      const match = line.match(STACK_LINE_REGEX);
      if (match) {
        const [, fn, file, lineNum] = match;
        return `  at ${COLORS.yellow}${fn}${COLORS.reset} (${COLORS.gray}${file}:${lineNum}${COLORS.reset})`;
      }
      return line;
    })
    .join("\n");
}

function formatContext(message: string, context: LogContext): string {
  const lines: string[] = [];
  const indent = "          ";

  lines.push(`  ${COLORS.cyan}${message}${COLORS.reset}`);

  for (const [key, value] of Object.entries(context)) {
    const keyStr = `${COLORS.blue}${key}${COLORS.reset}`;
    const valStr = formatValue(value, indent);
    lines.push(`${indent}${keyStr}: ${valStr}`);
  }

  return lines.join("\n");
}

function log(level: LogLevel, message: string, context: LogContext = {}) {
  if (process.env.NODE_ENV === "production") {
    console.log(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        level,
        message,
        ...context,
      })
    );
    return;
  }

  const icon = LEVEL_ICONS[level];
  const timestamp = formatTimestamp(new Date());

  const lines = [
    `${COLORS.gray}[${timestamp}]${COLORS.reset} ${LEVEL_COLORS[level]}${icon}${COLORS.reset} ${formatContext(message, context)}`,
  ];

  if (level === "error" && context.error instanceof Error) {
    lines.push(`          ${formatStack(context.error.stack || "")}`);
  }

  if (level === "error") {
    console.error(lines.join("\n"));
    return;
  }

  if (level === "warn") {
    console.warn(lines.join("\n"));
    return;
  }

  console.log(lines.join("\n"));
}

export const logger = {
  debug: (message: string, context?: LogContext) =>
    log("debug", message, context),
  info: (message: string, context?: LogContext) =>
    log("info", message, context),
  warn: (message: string, context?: LogContext) =>
    log("warn", message, context),
  error: (message: string, context?: LogContext) =>
    log("error", message, context),
};

export function createScopedLogger(scope: string) {
  return {
    debug: (message: string, context?: LogContext) =>
      log("debug", `${scope}: ${message}`, context),
    info: (message: string, context?: LogContext) =>
      log("info", `${scope}: ${message}`, context),
    warn: (message: string, context?: LogContext) =>
      log("warn", `${scope}: ${message}`, context),
    error: (message: string, context?: LogContext) =>
      log("error", `${scope}: ${message}`, context),
  };
}
