import { TShirtSize, ARIARole, UseCaseCategory } from './types';

/**
 * Utility functions for ARIA v4 workflow management
 */

/**
 * Determines the appropriate ARIA workflow path based on T-shirt size
 */
export function getWorkflowPath(size: TShirtSize): 'shallow' | 'deep' {
  return size === 'XS' || size === 'S' ? 'shallow' : 'deep';
}

/**
 * Gets the list of active roles based on T-shirt size and project requirements
 */
export function getActiveRoles(
  size: TShirtSize,
  hasUserInterface: boolean = true,
  hasCloudDeployment: boolean = true,
  hasSecurityRequirements: boolean = true
): ARIARole[] {
  const roles: ARIARole[] = ['ScrumMaster', 'PM']; // Always active

  // Size-based activation
  if (size !== 'XS') {
    roles.push('Developer');
  }
  if (size === 'M' || size === 'L' || size === 'XL') {
    roles.push('Architect', 'Tester');
  }

  // Conditional activation
  if (hasUserInterface && (size === 'M' || size === 'L' || size === 'XL')) {
    roles.push('UXDesigner');
  }
  if (hasCloudDeployment && (size === 'M' || size === 'L' || size === 'XL')) {
    roles.push('DevOpsEngineer');
  }
  if (hasSecurityRequirements && (size === 'M' || size === 'L' || size === 'XL')) {
    roles.push('SecurityEngineer');
  }

  return roles;
}

/**
 * Estimates development time based on T-shirt size
 */
export function estimateTimeHours(size: TShirtSize): number {
  switch (size) {
    case 'XS': return 0.5;
    case 'S': return 2;
    case 'M': return 8;
    case 'L': return 24;
    case 'XL': return 72;
    default: return 2;
  }
}

/**
 * Generates a unique session ID for ARIA processing
 */
export function generateSessionId(): string {
  return `aria-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Generates a unique use case ID
 */
export function generateUseCaseId(category: UseCaseCategory): string {
  const prefix = category.split('-').map(s => s.charAt(0).toUpperCase()).join('');
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
}

/**
 * Validates email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Formats file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Formats duration in milliseconds to human readable format
 */
export function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  
  if (hours > 0) {
    return `${hours}h ${minutes % 60}m`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  } else {
    return `${seconds}s`;
  }
}

/**
 * Debounce function for search and input handling
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

/**
 * Sleep utility for async operations
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Safely parse JSON with error handling
 */
export function safeJsonParse<T>(json: string, fallback: T): T {
  try {
    return JSON.parse(json);
  } catch {
    return fallback;
  }
}

/**
 * Create a retry function with exponential backoff
 */
export function createRetryFunction<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): () => Promise<T> {
  return async () => {
    let lastError: Error;
    
    for (let i = 0; i <= maxRetries; i++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error as Error;
        
        if (i === maxRetries) {
          throw lastError;
        }
        
        const delay = baseDelay * Math.pow(2, i);
        await sleep(delay);
      }
    }
    
    throw lastError!;
  };
}