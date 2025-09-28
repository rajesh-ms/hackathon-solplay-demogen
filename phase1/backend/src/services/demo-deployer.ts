import * as fs from 'fs/promises';
import * as path from 'path';
import { LoggingService } from './logging-service';
import { V0DemoResult } from './v0-demo-builder';

export interface DeploymentResult {
  success: boolean;
  componentPath?: string;
  pageUpdated?: boolean;
  error?: string;
  metadata: {
    timestamp: Date;
    demoTitle: string;
    duration?: number;
  };
}

export class DemoDeployer {
  private logger: LoggingService;
  private demoAppPath: string;

  constructor() {
    this.logger = LoggingService.getInstance();
    this.demoAppPath = path.resolve(process.cwd(), 'demo-app');

    this.logger.info('DemoDeployer initialized', {
      demoAppPath: this.demoAppPath
    }, 'DemoDeployer');
  }

  /**
   * Deploys generated demo code to the demo-app directory
   */
  async deployDemo(demoResult: V0DemoResult, useCaseTitle: string): Promise<DeploymentResult> {
    const startTime = Date.now();

    try {
      this.logger.info('Starting demo deployment', {
        useCase: useCaseTitle,
        hasDemoCode: !!demoResult.demoCode
      }, 'DemoDeployer', 'deployDemo');

      if (!demoResult.success || !demoResult.demoCode) {
        throw new Error('Demo generation was not successful or no code available');
      }

      // Ensure demo-app directory structure exists
      await this.ensureDemoAppStructure();

      // Generate component name from use case title
      const componentName = this.generateComponentName(useCaseTitle);

      // Save component file
      const componentPath = await this.saveComponent(componentName, demoResult.demoCode);

      // Update main page to use the component
      await this.updateMainPage(componentName);

      const duration = Date.now() - startTime;

      this.logger.info('Demo deployment completed', {
        componentPath,
        componentName,
        duration
      }, 'DemoDeployer', 'deployDemo');

      return {
        success: true,
        componentPath,
        pageUpdated: true,
        metadata: {
          timestamp: new Date(),
          demoTitle: useCaseTitle,
          duration
        }
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      this.logger.error('Demo deployment failed', {
        useCase: useCaseTitle,
        error: errorMessage,
        duration
      }, 'DemoDeployer', 'deployDemo');

      return {
        success: false,
        error: errorMessage,
        metadata: {
          timestamp: new Date(),
          demoTitle: useCaseTitle,
          duration
        }
      };
    }
  }

  /**
   * Ensures the demo-app directory structure exists
   */
  private async ensureDemoAppStructure(): Promise<void> {
    const requiredDirs = [
      this.demoAppPath,
      path.join(this.demoAppPath, 'src'),
      path.join(this.demoAppPath, 'src', 'app'),
      path.join(this.demoAppPath, 'src', 'components')
    ];

    for (const dir of requiredDirs) {
      try {
        await fs.access(dir);
      } catch {
        this.logger.warn(`Directory does not exist: ${dir}`, {}, 'DemoDeployer');
        throw new Error(`Required directory missing: ${dir}. Please ensure demo-app is set up.`);
      }
    }
  }

  /**
   * Generates a valid React component name from use case title
   */
  private generateComponentName(title: string): string {
    // Remove special characters and convert to PascalCase
    const cleanTitle = title
      .replace(/[^a-zA-Z0-9\s]/g, '')
      .split(/\s+/)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join('');

    return cleanTitle || 'GeneratedDemo';
  }

  /**
   * Saves the component code to a file
   */
  private async saveComponent(componentName: string, code: string): Promise<string> {
    const componentFileName = `${componentName}.tsx`;
    const componentPath = path.join(this.demoAppPath, 'src', 'components', componentFileName);

    // Extract just the component code if it's wrapped in markdown code blocks
    let cleanCode = code;
    const codeBlockMatch = code.match(/```(?:tsx|typescript|jsx|javascript)?\n([\s\S]*?)\n```/);
    if (codeBlockMatch) {
      cleanCode = codeBlockMatch[1];
    }

    // Ensure the code has proper imports if missing
    if (!cleanCode.includes('import React')) {
      cleanCode = `'use client';\n\nimport React from 'react';\n${cleanCode}`;
    } else if (!cleanCode.includes('use client')) {
      cleanCode = `'use client';\n\n${cleanCode}`;
    }

    await fs.writeFile(componentPath, cleanCode, 'utf-8');

    this.logger.info('Component saved', {
      componentName,
      componentPath,
      codeLength: cleanCode.length
    }, 'DemoDeployer', 'saveComponent');

    return componentPath;
  }

  /**
   * Updates the main page.tsx to import and render the component
   */
  private async updateMainPage(componentName: string): Promise<void> {
    const pagePath = path.join(this.demoAppPath, 'src', 'app', 'page.tsx');

    const pageContent = `import ${componentName} from '@/components/${componentName}';

export default function Home() {
  return <${componentName} />;
}
`;

    await fs.writeFile(pagePath, pageContent, 'utf-8');

    this.logger.info('Main page updated', {
      pagePath,
      componentName
    }, 'DemoDeployer', 'updateMainPage');
  }

  /**
   * Validates that demo-app can be deployed to
   */
  async validateDemoApp(): Promise<{ valid: boolean; errors: string[] }> {
    const errors: string[] = [];

    try {
      // Check if demo-app exists
      await fs.access(this.demoAppPath);
    } catch {
      errors.push('demo-app directory not found');
      return { valid: false, errors };
    }

    // Check for package.json
    try {
      const packageJsonPath = path.join(this.demoAppPath, 'package.json');
      await fs.access(packageJsonPath);
    } catch {
      errors.push('demo-app/package.json not found');
    }

    // Check for required directories
    const requiredDirs = ['src', 'src/app', 'src/components'];
    for (const dir of requiredDirs) {
      try {
        await fs.access(path.join(this.demoAppPath, dir));
      } catch {
        errors.push(`demo-app/${dir} directory not found`);
      }
    }

    return { valid: errors.length === 0, errors };
  }
}