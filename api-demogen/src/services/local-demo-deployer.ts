import path from 'path';
import * as fs from 'fs-extra';
import { exec } from 'child_process';
import { promisify } from 'util';
import getPort from 'get-port';

const execAsync = promisify(exec);

export interface DeploymentResult {
  url: string;
  port: number;
  demoId: string;
  directory: string;
}

export class LocalDemoDeployer {
  private activeServers: Record<string, { port: number; dir: string; process: any }> = {};
  private readonly basePort = 4000;
  private readonly maxPort = 4020;

  /**
   * Deploy a React demo locally and return the deployment result
   */
  async deployReactDemo(demoId: string, reactCode: string): Promise<DeploymentResult> {
    try {
      console.log(`🚀 Starting local deployment for demo: ${demoId}`);
      
      // 1. Create temp directory for this demo
      const tempDir = path.join(__dirname, '../../tmp', demoId);
      await fs.ensureDir(tempDir);

      // 2. Create React app structure
      await this.createReactApp(tempDir, reactCode, demoId);

      // 3. Find an available port
      const port = await getPort({ 
        port: Array.from({ length: this.maxPort - this.basePort + 1 }, (_, i) => this.basePort + i)
      });

      // 4. Install dependencies and start server
      const serverProcess = await this.startDemoServer(tempDir, port);

      // 5. Track server
      this.activeServers[demoId] = { 
        port, 
        dir: tempDir, 
        process: serverProcess 
      };

      const url = `http://localhost:${port}`;
      
      console.log(`✅ Demo deployed successfully: ${demoId} at ${url}`);
      
      return {
        url,
        port,
        demoId,
        directory: tempDir
      };
    } catch (error) {
      console.error(`❌ Failed to deploy demo ${demoId}:`, error);
      throw new Error(`Local deployment failed for demo ${demoId}: ${error}`);
    }
  }

  /**
   * Create React app structure with the generated code
   */
  private async createReactApp(tempDir: string, reactCode: string, demoId: string): Promise<void> {
    console.log(`📁 Creating React app structure for ${demoId}...`);
    
    // Create src directory
    const srcDir = path.join(tempDir, 'src');
    await fs.ensureDir(srcDir);

    // Write the main App component (using the v0 generated code)
    await fs.writeFile(path.join(srcDir, 'App.tsx'), this.wrapReactCode(reactCode));

    // Write index.tsx
    const indexTsx = `import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);`;
    await fs.writeFile(path.join(srcDir, 'index.tsx'), indexTsx);

    // Write basic CSS with Tailwind
    const indexCss = `@tailwind base;
@tailwind components;
@tailwind utilities;

body {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
    'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
    sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}`;
    await fs.writeFile(path.join(srcDir, 'index.css'), indexCss);

    // Write package.json with all dependencies
    const packageJson = {
      name: `demo-${demoId}`,
      version: '1.0.0',
      private: true,
      scripts: {
        start: 'vite --host 0.0.0.0',
        build: 'vite build',
        preview: 'vite preview'
      },
      dependencies: {
        'react': '^18.2.0',
        'react-dom': '^18.2.0'
      },
      devDependencies: {
        '@types/react': '^18.2.0',
        '@types/react-dom': '^18.2.0',
        '@vitejs/plugin-react': '^4.0.0',
        'autoprefixer': '^10.4.14',
        'postcss': '^8.4.24',
        'tailwindcss': '^3.3.0',
        'typescript': '^5.0.0',
        'vite': '^4.4.0'
      }
    };
    await fs.writeFile(path.join(tempDir, 'package.json'), JSON.stringify(packageJson, null, 2));

    // Write vite.config.ts
    const viteConfig = `import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: process.env.PORT ? parseInt(process.env.PORT) : 4000,
    host: true
  }
});`;
    await fs.writeFile(path.join(tempDir, 'vite.config.ts'), viteConfig);

    // Write tailwind.config.js
    const tailwindConfig = `module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}`;
    await fs.writeFile(path.join(tempDir, 'tailwind.config.js'), tailwindConfig);

    // Write postcss.config.js
    const postcssConfig = `module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}`;
    await fs.writeFile(path.join(tempDir, 'postcss.config.js'), postcssConfig);

    // Write tsconfig.json
    const tsConfig = {
      compilerOptions: {
        target: 'ES2020',
        useDefineForClassFields: true,
        lib: ['ES2020', 'DOM', 'DOM.Iterable'],
        module: 'ESNext',
        skipLibCheck: true,
        moduleResolution: 'bundler',
        allowImportingTsExtensions: true,
        resolveJsonModule: true,
        isolatedModules: true,
        noEmit: true,
        jsx: 'react-jsx',
        strict: true,
        noUnusedLocals: false,
        noUnusedParameters: false,
        noFallthroughCasesInSwitch: true
      },
      include: ['src']
    };
    await fs.writeFile(path.join(tempDir, 'tsconfig.json'), JSON.stringify(tsConfig, null, 2));

    // Write index.html
    const indexHtml = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Demo: ${demoId}</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/index.tsx"></script>
  </body>
</html>`;
    await fs.writeFile(path.join(tempDir, 'index.html'), indexHtml);
  }

  /**
   * Wrap the v0-generated code to ensure it works as a proper React component
   */
  private wrapReactCode(reactCode: string): string {
    // If code already has proper imports and exports, use as-is
    if (reactCode.includes('export default') && reactCode.includes('import')) {
      return reactCode;
    }

    // Wrap v0 code in a proper React component
    return `import React from 'react';

${reactCode}

export default function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Component />
    </div>
  );
}`;
  }

  /**
   * Start the demo server
   */
  private async startDemoServer(tempDir: string, port: number): Promise<any> {
    console.log(`📦 Installing dependencies for demo...`);
    
    // Install dependencies
    await execAsync('npm install', { cwd: tempDir });
    
    console.log(`🚀 Starting demo server on port ${port}...`);
    
    // Start the server
    const child = exec(`npm start`, {
      cwd: tempDir,
      env: { ...process.env, PORT: port.toString() }
    });

    child.stdout?.on('data', (data) => {
      console.log(`[Demo ${path.basename(tempDir)}]: ${data}`);
    });

    child.stderr?.on('data', (data) => {
      console.error(`[Demo ${path.basename(tempDir)} Error]: ${data}`);
    });

    // Give the server time to start
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    return child;
  }

  /**
   * Stop a specific demo server
   */
  async stopDemo(demoId: string): Promise<void> {
    const server = this.activeServers[demoId];
    if (server) {
      console.log(`🛑 Stopping demo: ${demoId}`);
      server.process.kill();
      await fs.remove(server.dir);
      delete this.activeServers[demoId];
    }
  }

  /**
   * Stop all demo servers
   */
  async stopAllDemos(): Promise<void> {
    const demoIds = Object.keys(this.activeServers);
    await Promise.all(demoIds.map(id => this.stopDemo(id)));
  }

  /**
   * Get active demos
   */
  getActiveDemos(): Record<string, { port: number; url: string }> {
    const result: Record<string, { port: number; url: string }> = {};
    for (const [demoId, server] of Object.entries(this.activeServers)) {
      result[demoId] = {
        port: server.port,
        url: `http://localhost:${server.port}`
      };
    }
    return result;
  }

  /**
   * Legacy method for compatibility
   */
  async cleanupDemo(demoId: string): Promise<void> {
    await this.stopDemo(demoId);
  }
}
