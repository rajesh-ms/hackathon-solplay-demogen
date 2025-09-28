import { spawn, ChildProcess } from 'child_process';
import * as path from 'path';
import { LoggingService } from './logging-service';

export interface DevServerResult {
  success: boolean;
  serverUrl?: string;
  processId?: number;
  error?: string;
  metadata: {
    timestamp: Date;
    startupTime?: number;
  };
}

export interface DevServerStatus {
  running: boolean;
  processId?: number;
  serverUrl?: string;
  uptime?: number;
}

export class DevServer {
  private logger: LoggingService;
  private demoAppPath: string;
  private serverProcess: ChildProcess | null = null;
  private serverUrl: string = 'http://localhost:3000';
  private startTime: number | null = null;

  constructor() {
    this.logger = LoggingService.getInstance();
    this.demoAppPath = path.resolve(process.cwd(), 'demo-app');

    this.logger.info('DevServer initialized', {
      demoAppPath: this.demoAppPath,
      serverUrl: this.serverUrl
    }, 'DevServer');
  }

  /**
   * Starts the Next.js development server
   */
  async startServer(): Promise<DevServerResult> {
    const startupStart = Date.now();

    try {
      this.logger.info('Starting Next.js development server', {
        cwd: this.demoAppPath
      }, 'DevServer', 'startServer');

      if (this.serverProcess) {
        this.logger.warn('Server process already running', {
          processId: this.serverProcess.pid
        }, 'DevServer', 'startServer');

        return {
          success: true,
          serverUrl: this.serverUrl,
          processId: this.serverProcess.pid,
          metadata: {
            timestamp: new Date(),
            startupTime: 0
          }
        };
      }

      // Spawn npm run dev process
      this.serverProcess = spawn('npm', ['run', 'dev'], {
        cwd: this.demoAppPath,
        stdio: ['ignore', 'pipe', 'pipe'],
        detached: false,
        shell: true
      });

      this.startTime = Date.now();

      // Track if server started successfully
      let serverStarted = false;
      let startupError: string | null = null;

      // Listen for stdout
      this.serverProcess.stdout?.on('data', (data) => {
        const output = data.toString();

        // Log output for debugging
        if (process.env.ENABLE_VERBOSE_LOGGING === 'true') {
          this.logger.info('Dev server output', {
            output: output.substring(0, 200)
          }, 'DevServer', 'startServer');
        }

        // Check if server is ready
        if (output.includes('Local:') || output.includes('localhost:3000') || output.includes('Ready in')) {
          serverStarted = true;
        }
      });

      // Listen for stderr
      this.serverProcess.stderr?.on('data', (data) => {
        const error = data.toString();

        // Only log actual errors, not warnings
        if (error.includes('error') || error.includes('Error')) {
          this.logger.warn('Dev server stderr', {
            error: error.substring(0, 200)
          }, 'DevServer', 'startServer');
        }
      });

      // Handle process exit
      this.serverProcess.on('exit', (code, signal) => {
        this.logger.info('Dev server process exited', {
          code,
          signal
        }, 'DevServer', 'startServer');

        this.serverProcess = null;
        this.startTime = null;
      });

      // Handle process error
      this.serverProcess.on('error', (error) => {
        startupError = error.message;
        this.logger.error('Dev server process error', {
          error: error.message
        }, 'DevServer', 'startServer');
      });

      // Wait for server to be ready (with timeout)
      const maxWaitTime = 30000; // 30 seconds
      const checkInterval = 500; // Check every 500ms
      let waited = 0;

      while (!serverStarted && !startupError && waited < maxWaitTime) {
        await new Promise(resolve => setTimeout(resolve, checkInterval));
        waited += checkInterval;
      }

      if (startupError) {
        throw new Error(startupError);
      }

      if (!serverStarted) {
        this.logger.warn('Server startup timeout - server may still be starting', {
          waited
        }, 'DevServer', 'startServer');
      }

      const startupTime = Date.now() - startupStart;

      this.logger.info('Dev server started', {
        serverUrl: this.serverUrl,
        processId: this.serverProcess.pid,
        startupTime
      }, 'DevServer', 'startServer');

      return {
        success: true,
        serverUrl: this.serverUrl,
        processId: this.serverProcess.pid,
        metadata: {
          timestamp: new Date(),
          startupTime
        }
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const startupTime = Date.now() - startupStart;

      this.logger.error('Failed to start dev server', {
        error: errorMessage,
        startupTime
      }, 'DevServer', 'startServer');

      // Clean up process if it exists
      if (this.serverProcess) {
        this.serverProcess.kill();
        this.serverProcess = null;
        this.startTime = null;
      }

      return {
        success: false,
        error: errorMessage,
        metadata: {
          timestamp: new Date(),
          startupTime
        }
      };
    }
  }

  /**
   * Stops the development server
   */
  async stopServer(): Promise<{ success: boolean; error?: string }> {
    try {
      this.logger.info('Stopping dev server', {
        hasProcess: !!this.serverProcess,
        processId: this.serverProcess?.pid
      }, 'DevServer', 'stopServer');

      if (!this.serverProcess) {
        this.logger.warn('No server process to stop', {}, 'DevServer', 'stopServer');
        return { success: true };
      }

      // Kill the process
      this.serverProcess.kill('SIGTERM');

      // Wait for process to exit
      await new Promise((resolve) => {
        const timeout = setTimeout(() => {
          if (this.serverProcess) {
            this.serverProcess.kill('SIGKILL');
          }
          resolve(null);
        }, 5000);

        if (this.serverProcess) {
          this.serverProcess.on('exit', () => {
            clearTimeout(timeout);
            resolve(null);
          });
        }
      });

      this.serverProcess = null;
      this.startTime = null;

      this.logger.info('Dev server stopped', {}, 'DevServer', 'stopServer');

      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      this.logger.error('Failed to stop dev server', {
        error: errorMessage
      }, 'DevServer', 'stopServer');

      return { success: false, error: errorMessage };
    }
  }

  /**
   * Gets the status of the development server
   */
  getStatus(): DevServerStatus {
    const running = this.serverProcess !== null && !this.serverProcess.killed;
    const uptime = running && this.startTime ? Date.now() - this.startTime : undefined;

    return {
      running,
      processId: this.serverProcess?.pid,
      serverUrl: running ? this.serverUrl : undefined,
      uptime
    };
  }

  /**
   * Waits for the server to be accessible
   */
  private async waitForServer(maxWaitTime: number = 30000): Promise<boolean> {
    const checkInterval = 1000;
    let waited = 0;

    while (waited < maxWaitTime) {
      try {
        const response = await fetch(this.serverUrl);
        if (response.ok || response.status === 404) {
          // Server is responding (404 is fine, it means server is up)
          return true;
        }
      } catch {
        // Server not ready yet
      }

      await new Promise(resolve => setTimeout(resolve, checkInterval));
      waited += checkInterval;
    }

    return false;
  }

  /**
   * Restarts the development server
   */
  async restartServer(): Promise<DevServerResult> {
    this.logger.info('Restarting dev server', {}, 'DevServer', 'restartServer');

    await this.stopServer();

    // Wait a bit before restarting
    await new Promise(resolve => setTimeout(resolve, 2000));

    return await this.startServer();
  }
}