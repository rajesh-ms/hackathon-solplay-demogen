export interface LogEntry {
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  timestamp: Date;
  context?: any;
  demoId?: string;
  userId?: string;
  ip?: string;
}

export class LoggingService {
  private logs: LogEntry[] = [];
  private logLevel: string;

  constructor() {
    this.logLevel = process.env.LOG_LEVEL || 'info';
  }

  private shouldLog(level: string): boolean {
    const levels = ['debug', 'info', 'warn', 'error'];
    const currentLevel = levels.indexOf(this.logLevel);
    const messageLevel = levels.indexOf(level);
    return messageLevel >= currentLevel;
  }

  private createLogEntry(level: LogEntry['level'], message: string, context?: any): LogEntry {
    return {
      level,
      message,
      timestamp: new Date(),
      context,
      demoId: context?.demoId,
      userId: context?.userId,
      ip: context?.ip
    };
  }

  info(message: string, context?: any): void {
    if (this.shouldLog('info')) {
      const entry = this.createLogEntry('info', message, context);
      this.logs.push(entry);
      console.log(`[INFO] ${entry.timestamp.toISOString()} - ${message}`, context ? JSON.stringify(context) : '');
    }
  }

  warn(message: string, context?: any): void {
    if (this.shouldLog('warn')) {
      const entry = this.createLogEntry('warn', message, context);
      this.logs.push(entry);
      console.warn(`[WARN] ${entry.timestamp.toISOString()} - ${message}`, context ? JSON.stringify(context) : '');
    }
  }

  error(message: string, context?: any): void {
    if (this.shouldLog('error')) {
      const entry = this.createLogEntry('error', message, context);
      this.logs.push(entry);
      console.error(`[ERROR] ${entry.timestamp.toISOString()} - ${message}`, context ? JSON.stringify(context) : '');
    }
  }

  debug(message: string, context?: any): void {
    if (this.shouldLog('debug')) {
      const entry = this.createLogEntry('debug', message, context);
      this.logs.push(entry);
      console.debug(`[DEBUG] ${entry.timestamp.toISOString()} - ${message}`, context ? JSON.stringify(context) : '');
    }
  }

  logApiRequest(method: string, path: string, statusCode: number, responseTime: number, context?: any): void {
    this.info(`${method} ${path} - ${statusCode} - ${responseTime}ms`, {
      type: 'api_request',
      method,
      path,
      statusCode,
      responseTime,
      ...context
    });
  }

  logDemoGeneration(demoId: string, stage: string, duration?: number, context?: any): void {
    this.info(`Demo generation: ${stage}`, {
      type: 'demo_generation',
      demoId,
      stage,
      duration,
      ...context
    });
  }

  logSecurityEvent(event: string, context?: any): void {
    this.warn(`Security event: ${event}`, {
      type: 'security',
      event,
      ...context
    });
  }

  getRecentLogs(limit: number = 100): LogEntry[] {
    return this.logs.slice(-limit);
  }

  getLogs(filters?: {
    level?: LogEntry['level'];
    demoId?: string;
    userId?: string;
    startTime?: Date;
    endTime?: Date;
  }): LogEntry[] {
    let filteredLogs = this.logs;

    if (filters) {
      if (filters.level) {
        filteredLogs = filteredLogs.filter(log => log.level === filters.level);
      }
      if (filters.demoId) {
        filteredLogs = filteredLogs.filter(log => log.demoId === filters.demoId);
      }
      if (filters.userId) {
        filteredLogs = filteredLogs.filter(log => log.userId === filters.userId);
      }
      if (filters.startTime) {
        filteredLogs = filteredLogs.filter(log => log.timestamp >= filters.startTime!);
      }
      if (filters.endTime) {
        filteredLogs = filteredLogs.filter(log => log.timestamp <= filters.endTime!);
      }
    }

    return filteredLogs;
  }

  clearLogs(): void {
    this.logs = [];
  }
}