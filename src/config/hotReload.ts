/**
 * Configuration Hot Reload System
 * Provides file system monitoring and automatic configuration reloading
 */

import { AppConfiguration } from './types';

export interface HotReloadOptions {
  configPath: string;
  debounceDelay?: number;
  enableNotifications?: boolean;
  onReloadSuccess?: (config: AppConfiguration) => void;
  onReloadError?: (error: string) => void;
  onFileChange?: (path: string) => void;
}

export interface HotReloadNotification {
  type: 'success' | 'error' | 'info';
  message: string;
  timestamp: Date;
}

export type HotReloadListener = (notification: HotReloadNotification) => void;

/**
 * File System Watcher for configuration hot reload
 */
export class ConfigHotReloader {
  private options: Required<HotReloadOptions>;
  private watcher: any = null;
  private debounceTimer: NodeJS.Timeout | null = null;
  private isEnabled: boolean = false;
  private listeners: Set<HotReloadListener> = new Set();
  private lastModified: number = 0;

  constructor(options: HotReloadOptions) {
    this.options = {
      debounceDelay: 300,
      enableNotifications: true,
      onReloadSuccess: () => {},
      onReloadError: () => {},
      onFileChange: () => {},
      ...options
    };
  }

  /**
   * Start watching the configuration file
   */
  async start(): Promise<{ success: boolean; error?: string }> {
    if (typeof window !== 'undefined') {
      const error = 'Hot reload not supported in browser environment';
      this.notifyListeners({
        type: 'error',
        message: error,
        timestamp: new Date()
      });
      return { success: false, error };
    }

    if (this.isEnabled) {
      return { success: true };
    }

    try {
      // Dynamic import for Node.js fs module
      const fs = await import('fs');
      const path = await import('path');

      // Check if file exists
      const configPath = path.resolve(this.options.configPath);
      
      try {
        const stats = await fs.promises.stat(configPath);
        this.lastModified = stats.mtime.getTime();
      } catch (error) {
        // File doesn't exist yet, that's okay
        this.lastModified = 0;
      }

      // Start watching the file
      fs.watchFile(configPath, {
        interval: 1000, // Check every second
        persistent: true
      }, (curr, prev) => {
        this.handleFileChange(curr, prev);
      });
      
      this.watcher = { configPath }; // Store reference for cleanup

      this.isEnabled = true;

      this.notifyListeners({
        type: 'info',
        message: `Hot reload enabled for ${this.options.configPath}`,
        timestamp: new Date()
      });

      return { success: true };
    } catch (error) {
      const errorMessage = `Failed to start hot reload: ${error instanceof Error ? error.message : 'Unknown error'}`;
      
      this.notifyListeners({
        type: 'error',
        message: errorMessage,
        timestamp: new Date()
      });

      return { success: false, error: errorMessage };
    }
  }

  /**
   * Stop watching the configuration file
   */
  async stop(): Promise<void> {
    if (!this.isEnabled) {
      return;
    }

    try {
      if (this.watcher) {
        // Dynamic import for Node.js fs module
        const fs = await import('fs');
        fs.unwatchFile(this.options.configPath);
        this.watcher = null;
      }

      if (this.debounceTimer) {
        clearTimeout(this.debounceTimer);
        this.debounceTimer = null;
      }

      this.isEnabled = false;

      this.notifyListeners({
        type: 'info',
        message: 'Hot reload disabled',
        timestamp: new Date()
      });
    } catch (error) {
      const errorMessage = `Error stopping hot reload: ${error instanceof Error ? error.message : 'Unknown error'}`;
      
      this.notifyListeners({
        type: 'error',
        message: errorMessage,
        timestamp: new Date()
      });
    }
  }

  /**
   * Handle file change events
   */
  private handleFileChange(curr: any, prev: any): void {
    // Check if file actually changed (not just accessed)
    if (curr.mtime.getTime() === this.lastModified) {
      return;
    }

    this.lastModified = curr.mtime.getTime();

    // Clear existing debounce timer
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }

    // Debounce file changes to avoid multiple rapid reloads
    this.debounceTimer = setTimeout(() => {
      this.reloadConfiguration();
    }, this.options.debounceDelay);

    // Notify about file change
    this.options.onFileChange(this.options.configPath);
  }

  /**
   * Reload configuration from file
   */
  private async reloadConfiguration(): Promise<void> {
    try {
      // Dynamic import for Node.js fs module
      const fs = await import('fs');
      
      // Read and parse configuration file
      const configContent = await fs.promises.readFile(this.options.configPath, 'utf-8');
      const config: AppConfiguration = JSON.parse(configContent);

      // Update last modified timestamp
      config.lastModified = new Date().toISOString();

      // Notify success
      this.options.onReloadSuccess(config);
      
      this.notifyListeners({
        type: 'success',
        message: 'Configuration reloaded successfully',
        timestamp: new Date()
      });

    } catch (error) {
      const errorMessage = `Failed to reload configuration: ${error instanceof Error ? error.message : 'Unknown error'}`;
      
      this.options.onReloadError(errorMessage);
      
      this.notifyListeners({
        type: 'error',
        message: errorMessage,
        timestamp: new Date()
      });
    }
  }

  /**
   * Check if hot reload is currently enabled
   */
  isActive(): boolean {
    return this.isEnabled;
  }

  /**
   * Get current configuration file path
   */
  getConfigPath(): string {
    return this.options.configPath;
  }

  /**
   * Update hot reload options
   */
  updateOptions(newOptions: Partial<HotReloadOptions>): void {
    this.options = { ...this.options, ...newOptions };
  }

  /**
   * Subscribe to hot reload notifications
   */
  subscribe(listener: HotReloadListener): () => void {
    this.listeners.add(listener);
    
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Unsubscribe from hot reload notifications
   */
  unsubscribe(listener: HotReloadListener): void {
    this.listeners.delete(listener);
  }

  /**
   * Clear all notification listeners
   */
  clearListeners(): void {
    this.listeners.clear();
  }

  /**
   * Notify all listeners about hot reload events
   */
  private notifyListeners(notification: HotReloadNotification): void {
    if (!this.options.enableNotifications) {
      return;
    }

    this.listeners.forEach(listener => {
      try {
        listener(notification);
      } catch (error) {
        console.error('Error in hot reload notification listener:', error);
      }
    });
  }

  /**
   * Force reload configuration (manual trigger)
   */
  async forceReload(): Promise<void> {
    if (!this.isEnabled) {
      throw new Error('Hot reload is not enabled');
    }

    await this.reloadConfiguration();
  }

  /**
   * Get hot reload status information
   */
  getStatus(): {
    isEnabled: boolean;
    configPath: string;
    lastModified: number;
    listenerCount: number;
  } {
    return {
      isEnabled: this.isEnabled,
      configPath: this.options.configPath,
      lastModified: this.lastModified,
      listenerCount: this.listeners.size
    };
  }
}

/**
 * Create a new hot reload instance
 */
export function createHotReloader(options: HotReloadOptions): ConfigHotReloader {
  return new ConfigHotReloader(options);
}

/**
 * Hot reload error recovery strategies
 */
export class HotReloadErrorRecovery {
  private static readonly MAX_RETRY_ATTEMPTS = 3;
  private static readonly RETRY_DELAY = 1000; // 1 second

  /**
   * Attempt to recover from hot reload errors
   */
  static async attemptRecovery(
    hotReloader: ConfigHotReloader,
    error: string,
    onRecoveryAttempt?: (attempt: number, maxAttempts: number) => void,
    onRecoverySuccess?: () => void,
    onRecoveryFailed?: (finalError: string) => void
  ): Promise<boolean> {
    let lastError = error;

    for (let attempt = 1; attempt <= this.MAX_RETRY_ATTEMPTS; attempt++) {
      try {
        onRecoveryAttempt?.(attempt, this.MAX_RETRY_ATTEMPTS);

        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, this.RETRY_DELAY * attempt));

        // Stop and restart hot reload
        await hotReloader.stop();
        const result = await hotReloader.start();

        if (result.success) {
          onRecoverySuccess?.();
          return true;
        } else {
          lastError = result.error || 'Unknown recovery error';
        }
      } catch (recoveryError) {
        lastError = recoveryError instanceof Error ? recoveryError.message : 'Unknown recovery error';
      }
    }

    onRecoveryFailed?.(lastError);
    return false;
  }

  /**
   * Create a resilient hot reloader with automatic error recovery
   */
  static createResilientHotReloader(options: HotReloadOptions): ConfigHotReloader {
    const hotReloader = createHotReloader({
      ...options,
      onReloadError: (error) => {
        // Attempt automatic recovery
        this.attemptRecovery(
          hotReloader,
          error,
          (attempt, maxAttempts) => {
            console.log(`Hot reload recovery attempt ${attempt}/${maxAttempts}`);
          },
          () => {
            console.log('Hot reload recovered successfully');
          },
          (finalError) => {
            console.error('Hot reload recovery failed:', finalError);
            options.onReloadError?.(finalError);
          }
        );
      }
    });

    return hotReloader;
  }
}