import {
  LogLevel,
  LoggerOptions,
  LoggerColors,
  LogArgs,
  FormattedLogParts
} from './types.js';

class Logger {
  private options: Required<LoggerOptions>;
  private readonly colors: LoggerColors;

  constructor(options?: Partial<LoggerOptions>) {
    this.options = {
      enabled: false,
      level: 'info',
      prefix: '',
      timestamp: true,
      colors: true,
      ...options
    };

    this.colors = {
      debug: '#6c757d',  // gray
      info: '#0d6efd',   // blue
      warn: '#ffc107',   // yellow
      error: '#dc3545',  // red
      reset: '#000000'   // black
    };
  }

  setOptions(options: Partial<LoggerOptions>): void {
    this.options = { ...this.options, ...options };
  }

  private shouldLog(level: LogLevel): boolean {
    if (!this.options.enabled) return false;
    
    const levels: LogLevel[] = ['debug', 'info', 'warn', 'error'];
    return levels.indexOf(level) >= levels.indexOf(this.options.level);
  }

  private formatMessage(level: LogLevel, args: LogArgs): FormattedLogParts {
    const parts: FormattedLogParts = {
      level: level.toUpperCase(),
      args
    };
    
    if (this.options.timestamp) {
      parts.timestamp = new Date().toISOString();
    }

    if (this.options.prefix) {
      parts.prefix = this.options.prefix;
    }

    if (this.options.colors) {
      parts.colorStyle = `color: ${this.colors[level]}`;
    }

    return parts;
  }

  private formatLogOutput(parts: FormattedLogParts): LogArgs {
    const output: LogArgs = [];
    
    if (parts.timestamp) {
      output.push(`[${parts.timestamp}]`);
    }

    if (parts.prefix) {
      output.push(`[${parts.prefix}]`);
    }

    if (parts.colorStyle) {
      output.push(`%c[${parts.level}]`);
      output.push(parts.colorStyle);
    } else {
      output.push(`[${parts.level}]`);
    }

    return [...output, ...parts.args];
  }

  private log(level: LogLevel, ...args: LogArgs): void {
    if (!this.shouldLog(level)) return;

    const formattedParts = this.formatMessage(level, args);
    const formattedArgs = this.formatLogOutput(formattedParts);
    
    switch (level) {
      case 'debug':
        console.debug(...formattedArgs);
        break;
      case 'info':
        console.info(...formattedArgs);
        break;
      case 'warn':
        console.warn(...formattedArgs);
        break;
      case 'error':
        console.error(...formattedArgs);
        break;
    }
  }

  debug(...args: LogArgs): void {
    this.log('debug', ...args);
  }

  info(...args: LogArgs): void {
    this.log('info', ...args);
  }

  warn(...args: LogArgs): void {
    this.log('warn', ...args);
  }

  error(...args: LogArgs): void {
    this.log('error', ...args);
  }

  child(prefix: string): Logger {
    return new Logger({
      ...this.options,
      prefix: this.options.prefix ? `${this.options.prefix}:${prefix}` : prefix
    });
  }

  withLogging<T>(fn: () => T): T {
    const wasEnabled = this.options.enabled;
    this.options.enabled = true;
    try {
      return fn();
    } finally {
      this.options.enabled = wasEnabled;
    }
  }
}

// Export a singleton instance
export const logger = new Logger();

// Export the class for testing or custom instances
export { Logger }; 