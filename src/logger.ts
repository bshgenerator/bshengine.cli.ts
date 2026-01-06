/**
 * Global logger utility for terminal output
 * Provides color-coded, formatted logging with different log levels
 */

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  SUCCESS = 2,
  WARN = 3,
  ERROR = 4,
  SILENT = 5,
}

interface LoggerConfig {
  level?: LogLevel;
  enableTimestamp?: boolean;
  enableColors?: boolean;
}

/**
 * ANSI color codes for terminal output
 */
const Colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  
  // Text colors
  black: '\x1b[30m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  
  // Background colors
  bgRed: '\x1b[41m',
  bgGreen: '\x1b[42m',
  bgYellow: '\x1b[43m',
  bgBlue: '\x1b[44m',
} as const;

/**
 * Logger class for formatted terminal output
 */
class Logger {
  private config: Required<LoggerConfig>;
  private isTTY: boolean;

  constructor(config: LoggerConfig = {}) {
    this.config = {
      level: config.level ?? LogLevel.INFO,
      enableTimestamp: config.enableTimestamp ?? false,
      enableColors: config.enableColors ?? (typeof process !== 'undefined' && process.stdout?.isTTY),
    };
    this.isTTY = typeof process !== 'undefined' && process.stdout?.isTTY;
  }

  /**
   * Configure the logger
   */
  configure(config: Partial<LoggerConfig>): void {
    this.config = {
      ...this.config,
      ...config,
    };
  }

  /**
   * Set the log level
   */
  setLevel(level: LogLevel): void {
    this.config.level = level;
  }

  /**
   * Format timestamp
   */
  private getTimestamp(): string {
    if (!this.config.enableTimestamp) return '';
    const now = new Date();
    return `[${now.toISOString()}] `;
  }

  /**
   * Apply color to text if colors are enabled
   */
  private colorize(text: string, color: string): string {
    if (!this.config.enableColors || !this.isTTY) {
      return text;
    }
    return `${color}${text}${Colors.reset}`;
  }

  /**
   * Format log message with prefix and color
   */
  private formatMessage(level: string, color: string, message: string, ...args: unknown[]): string {
    const timestamp = this.getTimestamp();
    const prefix = this.colorize(level, color);
    const formattedMessage = this.formatArgs(message, ...args);
    return `${timestamp}${prefix} ${formattedMessage}`;
  }

  /**
   * Format arguments into a string
   */
  private formatArgs(message: string, ...args: unknown[]): string {
    if (args.length === 0) {
      return message;
    }

    // If message contains placeholders, try to format them
    let formatted = message;
    let argIndex = 0;

    // Simple placeholder replacement for %s, %d, %j, %o
    formatted = formatted.replace(/%[sdjo%]/g, (match) => {
      if (match === '%%') return '%';
      if (argIndex >= args.length) return match;
      
      const arg = args[argIndex++];
      switch (match) {
        case '%s':
          return String(arg);
        case '%d':
          return String(Number(arg));
        case '%j':
          return JSON.stringify(arg, null, 2);
        case '%o':
          return typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg);
        default:
          return match;
      }
    });

    // Append remaining args
    if (argIndex < args.length) {
      const remaining = args.slice(argIndex).map(arg => 
        typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
      );
      formatted += ' ' + remaining.join(' ');
    }

    return formatted;
  }

  /**
   * Log debug message
   */
  debug(message: string, ...args: unknown[]): void {
    if (this.config.level > LogLevel.DEBUG) return;
    const formatted = this.formatMessage(
      '[DEBUG]',
      Colors.dim + Colors.cyan,
      message,
      ...args
    );
    console.debug(formatted);
  }

  /**
   * Log info message
   */
  info(message: string, ...args: unknown[]): void {
    if (this.config.level > LogLevel.INFO) return;
    const formatted = this.formatMessage(
      '[INFO]',
      Colors.blue,
      message,
      ...args
    );
    console.log(formatted);
  }

  /**
   * Log success message
   */
  success(message: string, ...args: unknown[]): void {
    if (this.config.level > LogLevel.SUCCESS) return;
    const formatted = this.formatMessage(
      '[SUCCESS]',
      Colors.green,
      message,
      ...args
    );
    console.log(formatted);
  }

  /**
   * Log warning message
   */
  warn(message: string, ...args: unknown[]): void {
    if (this.config.level > LogLevel.WARN) return;
    const formatted = this.formatMessage(
      '[WARN]',
      Colors.yellow,
      message,
      ...args
    );
    console.warn(formatted);
  }

  /**
   * Log error message
   */
  error(message: string, ...args: unknown[]): void {
    if (this.config.level > LogLevel.ERROR) return;
    const formatted = this.formatMessage(
      '[ERROR]',
      Colors.red,
      message,
      ...args
    );
    console.error(formatted);
  }

  /**
   * Log a raw message without formatting
   */
  raw(message: string, ...args: unknown[]): void {
    console.log(message, ...args);
  }

  /**
   * Log a separator line
   */
  separator(char: string = '=', length: number = 50): void {
    if (this.config.level > LogLevel.INFO) return;
    const line = char.repeat(length);
    console.log(this.colorize(line, Colors.dim));
  }

  /**
   * Log a section header
   */
  section(title: string): void {
    if (this.config.level > LogLevel.INFO) return;
    this.separator();
    const formatted = this.colorize(title, Colors.bright + Colors.cyan);
    console.log(formatted);
    this.separator();
  }
}

// Create and export a singleton logger instance
let loggerInstance: Logger | null = null;

/**
 * Get the global logger instance
 */
export function getLogger(): Logger {
  if (!loggerInstance) {
    loggerInstance = new Logger();
  }
  return loggerInstance;
}

/**
 * Create a new logger instance with custom configuration
 */
export function createLogger(config: LoggerConfig = {}): Logger {
  return new Logger(config);
}

/**
 * Configure the global logger
 */
export function configureLogger(config: Partial<LoggerConfig>): void {
  getLogger().configure(config);
}

/**
 * Set the global logger level
 */
export function setLogLevel(level: LogLevel): void {
  getLogger().setLevel(level);
}

// Export convenience functions that use the global logger
export const logger = {
  debug: (message: string, ...args: unknown[]) => getLogger().debug(message, ...args),
  info: (message: string, ...args: unknown[]) => getLogger().info(message, ...args),
  success: (message: string, ...args: unknown[]) => getLogger().success(message, ...args),
  warn: (message: string, ...args: unknown[]) => getLogger().warn(message, ...args),
  error: (message: string, ...args: unknown[]) => getLogger().error(message, ...args),
  raw: (message: string, ...args: unknown[]) => getLogger().raw(message, ...args),
  separator: (char?: string, length?: number) => getLogger().separator(char, length),
  section: (title: string) => getLogger().section(title),
};

// Export the Logger class for advanced usage
export { Logger };

