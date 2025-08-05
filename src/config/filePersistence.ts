/**
 * Configuration File Persistence Module
 * Handles loading and saving configuration files with error handling and backup functionality
 */

import { AppConfiguration } from './types';
import { DEFAULT_CONFIG } from './defaultConfig';

export interface FileLoadResult {
  config: Partial<AppConfiguration> | null;
  success: boolean;
  error?: string;
  isDefaultCreated?: boolean;
}

export interface FileSaveResult {
  success: boolean;
  error?: string;
  backupCreated?: boolean;
  backupPath?: string;
}

export interface FilePersistenceOptions {
  configPath: string;
  createBackup: boolean;
  backupExtension: string;
  formatJson: boolean;
  jsonIndent: number;
}

/**
 * Configuration File Persistence class
 * Handles all file operations for configuration management
 */
export class ConfigFilePersistence {
  private options: FilePersistenceOptions;

  constructor(options: Partial<FilePersistenceOptions> = {}) {
    this.options = {
      configPath: './config.json',
      createBackup: true,
      backupExtension: '.backup',
      formatJson: true,
      jsonIndent: 2,
      ...options
    };
  }

  /**
   * Load configuration from file
   * Handles file not found, JSON parsing errors, and creates default file if needed
   */
  async loadConfigFile(): Promise<FileLoadResult> {
    try {
      // Check if we're in Node.js or browser environment
      if (typeof window === 'undefined') {
        return await this.loadConfigFileNode();
      } else {
        return await this.loadConfigFileBrowser();
      }
    } catch (error) {
      return {
        config: null,
        success: false,
        error: `Failed to load configuration: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Load configuration file in Node.js environment
   */
  private async loadConfigFileNode(): Promise<FileLoadResult> {
    try {
      const fs = await import('fs');
      const path = await import('path');
      
      const configFilePath = path.resolve(this.options.configPath);
      
      // Check if configuration file exists
      if (!fs.existsSync(configFilePath)) {
        // Create default configuration file
        const createResult = await this.createDefaultConfigFile();
        if (createResult.success) {
          return {
            config: DEFAULT_CONFIG,
            success: true,
            isDefaultCreated: true
          };
        } else {
          return {
            config: null,
            success: false,
            error: `Configuration file not found and failed to create default: ${createResult.error}`
          };
        }
      }

      // Read and parse configuration file
      const configData = fs.readFileSync(configFilePath, 'utf-8');
      
      if (!configData.trim()) {
        return {
          config: null,
          success: false,
          error: 'Configuration file is empty'
        };
      }

      try {
        const parsedConfig = JSON.parse(configData);
        return {
          config: parsedConfig,
          success: true
        };
      } catch (parseError) {
        // JSON parsing failed - try to recover
        const recoveryResult = await this.recoverFromCorruptedFile(configFilePath, configData);
        return recoveryResult;
      }
    } catch (error) {
      return {
        config: null,
        success: false,
        error: `Node.js file loading error: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Load configuration file in browser environment
   */
  private async loadConfigFileBrowser(): Promise<FileLoadResult> {
    try {
      const response = await fetch(this.options.configPath);
      
      if (!response.ok) {
        if (response.status === 404) {
          return {
            config: null,
            success: false,
            error: `Configuration file not found at ${this.options.configPath}. In browser environment, the file must exist.`
          };
        } else {
          return {
            config: null,
            success: false,
            error: `Failed to fetch configuration: HTTP ${response.status} ${response.statusText}`
          };
        }
      }

      const configText = await response.text();
      
      if (!configText.trim()) {
        return {
          config: null,
          success: false,
          error: 'Configuration file is empty'
        };
      }

      try {
        const parsedConfig = JSON.parse(configText);
        return {
          config: parsedConfig,
          success: true
        };
      } catch (parseError) {
        return {
          config: null,
          success: false,
          error: `JSON parsing error: ${parseError instanceof Error ? parseError.message : 'Invalid JSON format'}`
        };
      }
    } catch (error) {
      return {
        config: null,
        success: false,
        error: `Browser file loading error: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Save configuration to file
   * Creates backup if enabled and handles formatting
   */
  async saveConfigFile(config: AppConfiguration): Promise<FileSaveResult> {
    // Browser environment doesn't support file saving
    if (typeof window !== 'undefined') {
      return {
        success: false,
        error: 'File saving not supported in browser environment'
      };
    }

    try {
      const fs = await import('fs');
      const path = await import('path');
      
      const configFilePath = path.resolve(this.options.configPath);
      
      // Create backup if enabled and file exists
      let backupResult: { created: boolean; path?: string } = { created: false };
      if (this.options.createBackup && fs.existsSync(configFilePath)) {
        backupResult = await this.createBackup(configFilePath);
      }

      // Ensure directory exists
      const dir = path.dirname(configFilePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      // Update lastModified timestamp
      const configToSave = {
        ...config,
        lastModified: new Date().toISOString()
      };

      // Format JSON data
      const jsonData = this.options.formatJson 
        ? JSON.stringify(configToSave, null, this.options.jsonIndent)
        : JSON.stringify(configToSave);

      // Write configuration file
      fs.writeFileSync(configFilePath, jsonData, 'utf-8');

      return {
        success: true,
        backupCreated: backupResult.created,
        backupPath: backupResult.path
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to save configuration: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Create default configuration file
   */
  async createDefaultConfigFile(): Promise<FileSaveResult> {
    return await this.saveConfigFile(DEFAULT_CONFIG);
  }

  /**
   * Create backup of existing configuration file
   */
  private async createBackup(configFilePath: string): Promise<{ created: boolean; path?: string }> {
    try {
      const fs = await import('fs');
      const path = await import('path');
      
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupPath = `${configFilePath}${this.options.backupExtension}.${timestamp}`;
      
      fs.copyFileSync(configFilePath, backupPath);
      
      return {
        created: true,
        path: backupPath
      };
    } catch (error) {
      console.warn(`Failed to create backup: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return { created: false };
    }
  }

  /**
   * Attempt to recover from corrupted configuration file
   */
  private async recoverFromCorruptedFile(filePath: string, corruptedData: string): Promise<FileLoadResult> {
    try {
      const fs = await import('fs');
      
      // Create backup of corrupted file
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const corruptedBackupPath = `${filePath}.corrupted.${timestamp}`;
      
      try {
        fs.writeFileSync(corruptedBackupPath, corruptedData, 'utf-8');
      } catch (backupError) {
        console.warn(`Failed to backup corrupted file: ${backupError}`);
      }

      // Try to find and restore from backup
      const backupResult = await this.findAndRestoreBackup(filePath);
      if (backupResult.success && backupResult.config) {
        return backupResult;
      }

      // If no backup available, create new default file
      const createResult = await this.createDefaultConfigFile();
      if (createResult.success) {
        return {
          config: DEFAULT_CONFIG,
          success: true,
          error: `Configuration file was corrupted and has been reset to defaults. Corrupted file backed up to: ${corruptedBackupPath}`
        };
      } else {
        return {
          config: null,
          success: false,
          error: `Configuration file is corrupted and recovery failed: ${createResult.error}`
        };
      }
    } catch (error) {
      return {
        config: null,
        success: false,
        error: `Recovery from corrupted file failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Find and restore from the most recent backup
   */
  private async findAndRestoreBackup(configFilePath: string): Promise<FileLoadResult> {
    try {
      const fs = await import('fs');
      const path = await import('path');
      
      const dir = path.dirname(configFilePath);
      const baseName = path.basename(configFilePath);
      
      // Find all backup files
      const files = fs.readdirSync(dir);
      const backupFiles = files
        .filter(file => file.startsWith(`${baseName}${this.options.backupExtension}`))
        .map(file => ({
          name: file,
          path: path.join(dir, file),
          stat: fs.statSync(path.join(dir, file))
        }))
        .sort((a, b) => b.stat.mtime.getTime() - a.stat.mtime.getTime()); // Sort by modification time, newest first

      if (backupFiles.length === 0) {
        return {
          config: null,
          success: false,
          error: 'No backup files found'
        };
      }

      // Try to restore from the most recent backup
      const mostRecentBackup = backupFiles[0];
      const backupData = fs.readFileSync(mostRecentBackup.path, 'utf-8');
      
      try {
        const parsedConfig = JSON.parse(backupData);
        
        // Restore the backup to the main config file
        fs.copyFileSync(mostRecentBackup.path, configFilePath);
        
        return {
          config: parsedConfig,
          success: true,
          error: `Configuration restored from backup: ${mostRecentBackup.name}`
        };
      } catch (parseError) {
        return {
          config: null,
          success: false,
          error: `Most recent backup is also corrupted: ${parseError instanceof Error ? parseError.message : 'Invalid JSON'}`
        };
      }
    } catch (error) {
      return {
        config: null,
        success: false,
        error: `Backup restoration failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Check if configuration file exists
   */
  async configFileExists(): Promise<boolean> {
    if (typeof window !== 'undefined') {
      // In browser, try to fetch the file
      try {
        const response = await fetch(this.options.configPath, { method: 'HEAD' });
        return response.ok;
      } catch {
        return false;
      }
    } else {
      // In Node.js, check file system
      try {
        const fs = await import('fs');
        const path = await import('path');
        return fs.existsSync(path.resolve(this.options.configPath));
      } catch {
        return false;
      }
    }
  }

  /**
   * Get configuration file metadata
   */
  async getConfigFileMetadata(): Promise<{
    exists: boolean;
    size?: number;
    lastModified?: Date;
    isReadable?: boolean;
    isWritable?: boolean;
  }> {
    if (typeof window !== 'undefined') {
      // Limited metadata in browser environment
      const exists = await this.configFileExists();
      return { exists };
    }

    try {
      const fs = await import('fs');
      const path = await import('path');
      
      const configFilePath = path.resolve(this.options.configPath);
      
      if (!fs.existsSync(configFilePath)) {
        return { exists: false };
      }

      const stats = fs.statSync(configFilePath);
      
      // Check permissions
      let isReadable = false;
      let isWritable = false;
      
      try {
        fs.accessSync(configFilePath, fs.constants.R_OK);
        isReadable = true;
      } catch {}
      
      try {
        fs.accessSync(configFilePath, fs.constants.W_OK);
        isWritable = true;
      } catch {}

      return {
        exists: true,
        size: stats.size,
        lastModified: stats.mtime,
        isReadable,
        isWritable
      };
    } catch (error) {
      return {
        exists: false
      };
    }
  }

  /**
   * Clean up old backup files
   * Keeps only the specified number of most recent backups
   */
  async cleanupBackups(keepCount: number = 5): Promise<{ cleaned: number; error?: string }> {
    if (typeof window !== 'undefined') {
      return { cleaned: 0, error: 'Backup cleanup not supported in browser environment' };
    }

    try {
      const fs = await import('fs');
      const path = await import('path');
      
      const configFilePath = path.resolve(this.options.configPath);
      const dir = path.dirname(configFilePath);
      const baseName = path.basename(configFilePath);
      
      // Find all backup files
      const files = fs.readdirSync(dir);
      const backupFiles = files
        .filter(file => file.startsWith(`${baseName}${this.options.backupExtension}`))
        .map(file => ({
          name: file,
          path: path.join(dir, file),
          stat: fs.statSync(path.join(dir, file))
        }))
        .sort((a, b) => b.stat.mtime.getTime() - a.stat.mtime.getTime()); // Sort by modification time, newest first

      // Remove old backups beyond keepCount
      const filesToDelete = backupFiles.slice(keepCount);
      let cleanedCount = 0;

      for (const file of filesToDelete) {
        try {
          fs.unlinkSync(file.path);
          cleanedCount++;
        } catch (deleteError) {
          console.warn(`Failed to delete backup file ${file.name}:`, deleteError);
        }
      }

      return { cleaned: cleanedCount };
    } catch (error) {
      return {
        cleaned: 0,
        error: `Backup cleanup failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }
}

// Export factory function for creating file persistence instances
export function createFilePersistence(options: Partial<FilePersistenceOptions> = {}): ConfigFilePersistence {
  return new ConfigFilePersistence(options);
}

// Export default instance
export const defaultFilePersistence = new ConfigFilePersistence();