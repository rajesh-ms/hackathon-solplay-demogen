import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs/promises';
import * as path from 'path';
import { LoggingService } from './logging-service';

const execAsync = promisify(exec);

export interface DependencyInstallResult {
  success: boolean;
  installed: string[];
  alreadyInstalled: string[];
  failed: string[];
  error?: string;
  metadata: {
    timestamp: Date;
    duration?: number;
  };
}

export class DependencyInstaller {
  private logger: LoggingService;
  private demoAppPath: string;

  constructor() {
    this.logger = LoggingService.getInstance();
    this.demoAppPath = path.resolve(process.cwd(), 'demo-app');

    this.logger.info('DependencyInstaller initialized', {
      demoAppPath: this.demoAppPath
    }, 'DependencyInstaller');
  }

  /**
   * Detects required dependencies from generated code
   */
  detectDependencies(code: string): string[] {
    const dependencies = new Set<string>();

    // Common libraries used in v0.dev generated components
    const importPatterns = [
      { pattern: /from ['"]recharts['"]/g, package: 'recharts' },
      { pattern: /from ['"]lucide-react['"]/g, package: 'lucide-react' },
      { pattern: /from ['"]@radix-ui\/(.*?)['"]/g, package: '@radix-ui/' },
      { pattern: /from ['"]framer-motion['"]/g, package: 'framer-motion' },
      { pattern: /from ['"]date-fns['"]/g, package: 'date-fns' },
      { pattern: /from ['"]clsx['"]/g, package: 'clsx' },
      { pattern: /from ['"]class-variance-authority['"]/g, package: 'class-variance-authority' },
      { pattern: /from ['"]react-hook-form['"]/g, package: 'react-hook-form' },
      { pattern: /from ['"]zod['"]/g, package: 'zod' },
      { pattern: /from ['"]@hookform\/resolvers['"]/g, package: '@hookform/resolvers' }
    ];

    for (const { pattern, package: pkg } of importPatterns) {
      if (pattern.test(code)) {
        // Handle @radix-ui packages specially
        if (pkg === '@radix-ui/') {
          const radixMatches = code.match(/from ['"]@radix-ui\/(.*?)['"]/g);
          if (radixMatches) {
            radixMatches.forEach(match => {
              const pkgMatch = match.match(/@radix-ui\/([\w-]+)/);
              if (pkgMatch) {
                dependencies.add(`@radix-ui/react-${pkgMatch[1]}`);
              }
            });
          }
        } else {
          dependencies.add(pkg);
        }
      }
    }

    const detectedDeps = Array.from(dependencies);

    this.logger.info('Dependencies detected', {
      count: detectedDeps.length,
      dependencies: detectedDeps
    }, 'DependencyInstaller', 'detectDependencies');

    return detectedDeps;
  }

  /**
   * Checks which dependencies are already installed
   */
  async checkInstalledDependencies(dependencies: string[]): Promise<{
    installed: string[];
    missing: string[];
  }> {
    const packageJsonPath = path.join(this.demoAppPath, 'package.json');

    try {
      const packageJsonContent = await fs.readFile(packageJsonPath, 'utf-8');
      const packageJson = JSON.parse(packageJsonContent);

      const allDeps = {
        ...packageJson.dependencies,
        ...packageJson.devDependencies
      };

      const installed: string[] = [];
      const missing: string[] = [];

      for (const dep of dependencies) {
        if (allDeps[dep]) {
          installed.push(dep);
        } else {
          missing.push(dep);
        }
      }

      this.logger.info('Checked installed dependencies', {
        totalChecked: dependencies.length,
        installed: installed.length,
        missing: missing.length
      }, 'DependencyInstaller', 'checkInstalledDependencies');

      return { installed, missing };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error('Failed to check installed dependencies', {
        error: errorMessage
      }, 'DependencyInstaller', 'checkInstalledDependencies');

      // Assume all are missing if we can't read package.json
      return { installed: [], missing: dependencies };
    }
  }

  /**
   * Installs missing dependencies in demo-app
   */
  async installDependencies(dependencies: string[]): Promise<DependencyInstallResult> {
    const startTime = Date.now();

    try {
      this.logger.info('Starting dependency installation', {
        dependencies,
        count: dependencies.length
      }, 'DependencyInstaller', 'installDependencies');

      if (dependencies.length === 0) {
        return {
          success: true,
          installed: [],
          alreadyInstalled: [],
          failed: [],
          metadata: {
            timestamp: new Date(),
            duration: Date.now() - startTime
          }
        };
      }

      // Check which dependencies are already installed
      const { installed: alreadyInstalled, missing } = await this.checkInstalledDependencies(dependencies);

      if (missing.length === 0) {
        this.logger.info('All dependencies already installed', {
          count: alreadyInstalled.length
        }, 'DependencyInstaller', 'installDependencies');

        return {
          success: true,
          installed: [],
          alreadyInstalled,
          failed: [],
          metadata: {
            timestamp: new Date(),
            duration: Date.now() - startTime
          }
        };
      }

      // Install missing dependencies
      const installed: string[] = [];
      const failed: string[] = [];

      this.logger.info('Installing missing dependencies', {
        missing,
        count: missing.length
      }, 'DependencyInstaller', 'installDependencies');

      try {
        const installCommand = `npm install ${missing.join(' ')}`;
        this.logger.info('Running npm install', {
          command: installCommand,
          cwd: this.demoAppPath
        }, 'DependencyInstaller', 'installDependencies');

        const { stdout, stderr } = await execAsync(installCommand, {
          cwd: this.demoAppPath,
          timeout: 120000 // 2 minute timeout
        });

        if (stderr && !stderr.includes('npm WARN')) {
          this.logger.warn('npm install stderr output', {
            stderr: stderr.substring(0, 500)
          }, 'DependencyInstaller', 'installDependencies');
        }

        // Assume all missing dependencies were installed successfully
        installed.push(...missing);

        this.logger.info('Dependencies installed successfully', {
          installed,
          count: installed.length
        }, 'DependencyInstaller', 'installDependencies');
      } catch (installError) {
        const errorMessage = installError instanceof Error ? installError.message : 'Unknown error';
        this.logger.error('Failed to install dependencies', {
          error: errorMessage,
          missing
        }, 'DependencyInstaller', 'installDependencies');

        // Mark all missing as failed
        failed.push(...missing);
      }

      const duration = Date.now() - startTime;

      return {
        success: failed.length === 0,
        installed,
        alreadyInstalled,
        failed,
        error: failed.length > 0 ? `Failed to install: ${failed.join(', ')}` : undefined,
        metadata: {
          timestamp: new Date(),
          duration
        }
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      this.logger.error('Dependency installation process failed', {
        error: errorMessage,
        duration
      }, 'DependencyInstaller', 'installDependencies');

      return {
        success: false,
        installed: [],
        alreadyInstalled: [],
        failed: dependencies,
        error: errorMessage,
        metadata: {
          timestamp: new Date(),
          duration
        }
      };
    }
  }

  /**
   * Detects and installs dependencies from generated code
   */
  async detectAndInstall(code: string): Promise<DependencyInstallResult> {
    const dependencies = this.detectDependencies(code);
    return await this.installDependencies(dependencies);
  }
}