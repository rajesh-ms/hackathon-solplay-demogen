import * as fs from 'fs';
import * as path from 'path';

export interface LogEntry {
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  metadata?: any;
  component?: string;
  operation?: string;
}

export interface V0Interaction {
  timestamp: string;
  operation: 'prompt_generation' | 'api_request' | 'api_response';
  prompt?: string;
  request?: any;
  response?: any;
  error?: string;
  duration?: number;
}

export class LoggingService {
  private static instance: LoggingService;
  private logFilePath: string;
  private v0LogFilePath: string;
  private enableConsole: boolean;
  private logLevel: string;

  private constructor() {
    this.logFilePath = path.join(process.cwd(), 'logs', 'application.log');
    this.v0LogFilePath = path.join(process.cwd(), 'demoapp.log');
    this.enableConsole = process.env.ENABLE_VERBOSE_LOGGING === 'true';
    this.logLevel = process.env.LOG_LEVEL || 'info';
    
    // Ensure log directories exist
    this.ensureLogDirectories();
  }

  public static getInstance(): LoggingService {
    if (!LoggingService.instance) {
      LoggingService.instance = new LoggingService();
    }
    return LoggingService.instance;
  }

  private ensureLogDirectories(): void {
    const logDir = path.dirname(this.logFilePath);
    const v0LogDir = path.dirname(this.v0LogFilePath);
    
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
    
    if (!fs.existsSync(v0LogDir)) {
      fs.mkdirSync(v0LogDir, { recursive: true });
    }
  }

  private formatLogEntry(entry: LogEntry): string {
    const timestamp = new Date().toISOString();
    const metadata = entry.metadata ? JSON.stringify(entry.metadata, null, 2) : '';
    const component = entry.component ? `[${entry.component}]` : '';
    const operation = entry.operation ? `[${entry.operation}]` : '';
    
    return `${timestamp} ${entry.level.toUpperCase()} ${component}${operation} ${entry.message}${metadata ? '\nMetadata: ' + metadata : ''}`;
  }

  private shouldLog(level: string): boolean {
    const levels: Record<string, number> = { error: 0, warn: 1, info: 2, debug: 3 };
    const currentLevel = levels[this.logLevel] || 2;
    const messageLevel = levels[level] || 2;
    return messageLevel <= currentLevel;
  }

  private writeToFile(filePath: string, content: string): void {
    try {
      fs.appendFileSync(filePath, content + '\n');
    } catch (error) {
      console.error('Failed to write to log file:', error);
    }
  }

  private log(level: 'info' | 'warn' | 'error' | 'debug', message: string, metadata?: any, component?: string, operation?: string): void {
    if (!this.shouldLog(level)) return;

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      metadata,
      component,
      operation
    };

    const logLine = this.formatLogEntry(entry);

    // Write to application log
    this.writeToFile(this.logFilePath, logLine);

    // Console output if enabled
    if (this.enableConsole) {
      const consoleMethod = level === 'error' ? console.error : 
                           level === 'warn' ? console.warn :
                           level === 'debug' ? console.debug : console.log;
      consoleMethod(logLine);
    }
  }

  public info(message: string, metadata?: any, component?: string, operation?: string): void {
    this.log('info', message, metadata, component, operation);
  }

  public warn(message: string, metadata?: any, component?: string, operation?: string): void {
    this.log('warn', message, metadata, component, operation);
  }

  public error(message: string, metadata?: any, component?: string, operation?: string): void {
    this.log('error', message, metadata, component, operation);
  }

  public debug(message: string, metadata?: any, component?: string, operation?: string): void {
    this.log('debug', message, metadata, component, operation);
  }

  /**
   * Specialized logging for v0.dev interactions - logs to demoapp.log
   */
  public logV0Interaction(interaction: V0Interaction): void {
    let logContent = '';
    
    switch (interaction.operation) {
      case 'prompt_generation':
        logContent = `${interaction.timestamp} [V0_PROMPT_GENERATION]\nPrompt Generated:\n${interaction.prompt}\n${'='.repeat(80)}\n`;
        break;
        
      case 'api_request':
        logContent = `${interaction.timestamp} [V0_API_REQUEST]\nRequest Data:\n${JSON.stringify(interaction.request, null, 2)}\n${'='.repeat(80)}\n`;
        break;
        
      case 'api_response':
        const status = interaction.error ? 'ERROR' : 'SUCCESS';
        const duration = interaction.duration ? ` (${interaction.duration}ms)` : '';
        logContent = `${interaction.timestamp} [V0_API_RESPONSE_${status}]${duration}\n`;
        
        if (interaction.error) {
          logContent += `Error: ${interaction.error}\n`;
        } else if (interaction.response) {
          logContent += `Response:\n${JSON.stringify(interaction.response, null, 2)}\n`;
        }
        logContent += `${'='.repeat(80)}\n`;
        break;
    }

    this.writeToFile(this.v0LogFilePath, logContent);
    
    // Also log to application log for completeness
    this.info(`V0 ${interaction.operation}`, interaction, 'V0Client');
  }

  /**
   * Log Azure OpenAI interactions
   */
  public logAzureOpenAIInteraction(operation: string, data: any, duration?: number): void {
    const timestamp = new Date().toISOString();
    
    let logContent = `${timestamp} [AZURE_OPENAI_${operation.toUpperCase()}]`;
    if (duration) logContent += ` (${duration}ms)`;
    logContent += `\n${JSON.stringify(data, null, 2)}\n${'='.repeat(80)}\n`;
    
    this.writeToFile(this.v0LogFilePath, logContent);
    this.info(`Azure OpenAI ${operation}`, data, 'AzureOpenAI');
  }

  /**
   * Clear the v0 log file (useful for new workflow runs)
   */
  public clearV0Log(): void {
    try {
      fs.writeFileSync(this.v0LogFilePath, '');
      this.info('V0 log file cleared', {}, 'LoggingService');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.error('Failed to clear V0 log file', { error: errorMessage }, 'LoggingService');
    }
  }

  /**
   * Get the path to the v0 log file
   */
  public getV0LogPath(): string {
    return this.v0LogFilePath;
  }
}