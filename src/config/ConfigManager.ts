/**
 * Configuration Manager with validation support
 * Provides centralized configuration management with validation, error handling, and hot reload
 */

import { AppConfiguration, ConfigChangeListener } from './types';
import { DEFAULT_CONFIG as defaultConfig } from './defaultConfig';
import { createConfigValidator, validateConfigurationLogic } from './validationRules';
import { ConfigValidator, ValidationResult } from './validation';
import { mergeConfig, deepClone, getConfigValue, setConfigValue, compareConfigs } from './utils';
import { ConfigFilePersistence, createFilePersistence, FileLoadResult, FileSaveResult } from './filePersistence';
import { ConfigHotReloader, createHotReloader, HotReloadNotification, HotReloadErrorRecovery } from './hotReload';
import { HotReloadNotificationManager, createHotReloadNotificationManager, HotReloadMessageFormatter } from './hotReloadNotifications';

export interface ConfigManagerOptions {
  enableValidation?: boolean;
  enableHotReload?: boolean;
  configPath?: string;
  createBackup?: boolean;
  backupExtension?: string;
  formatJson?: boolean;
  jsonIndent?: number;
  onConfigChange?: (config: AppConfiguration, errors: string[]) => void;
  onValidationError?: (errors: string[], warnings: string[]) => void;
  onFileError?: (error: string, operation: 'load' | 'save') => void;
}

export interface ConfigLoadResult {
  config: AppConfiguration;
  isValid: boolean;
  errors: string[];
  warnings: string[];
  isDefaultCreated?: boolean;
  backupRestored?: boolean;
}

/**
 * Configuration Manager class
 * Handles loading, validation, and management of application configuration
 */
export class ConfigManager {
  private config: AppConfiguration;
  private validator: ConfigValidator;
  private options: Required<ConfigManagerOptions>;
  private configPath: string;
  private isInitialized: boolean = false;
  private listeners: Set<ConfigChangeListener> = new Set();
  private filePersistence: ConfigFilePersistence;
  private hotReloader: ConfigHotReloader | null = null;
  private notificationManager: HotReloadNotificationManager;

  constructor(options: ConfigManagerOptions = {}) {
    this.options = {
      enableValidation: true,
      enableHotReload: false,
      configPath: './config.json',
      createBackup: true,
      backupExtension: '.backup',
      formatJson: true,
      jsonIndent: 2,
      onConfigChange: () => {},
      onValidationError: () => {},
      onFileError: () => {},
      ...options
    };

    this.configPath = this.options.configPath;
    this.validator = createConfigValidator();
    this.config = deepClone(defaultConfig);
    
    // Initialize file persistence with options
    this.filePersistence = createFilePersistence({
      configPath: this.options.configPath,
      createBackup: this.options.createBackup,
      backupExtension: this.options.backupExtension,
      formatJson: this.options.formatJson,
      jsonIndent: this.options.jsonIndent
    });

    // Initialize notification manager
    this.notificationManager = createHotReloadNotificationManager({
      duration: 3000,
      maxNotifications: 5,
      allowDismiss: true
    });
  }

  /**
   * Initialize the configuration manager
   */
  async initialize(): Promise<ConfigLoadResult> {
    try {
      const result = await this.loadConfiguration();
      this.isInitialized = true;
      
      if (this.options.enableHotReload) {
        await this.setupHotReload();
      }
      
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown initialization error';
      // Ensure we always have a valid config even on error
      if (!this.config) {
        this.config = deepClone(defaultConfig);
      }
      return {
        config: this.config,
        isValid: false,
        errors: [errorMessage],
        warnings: []
      };
    }
  }

  /**
   * Load configuration from file or use defaults
   */
  async loadConfiguration(): Promise<ConfigLoadResult> {
    const errors: string[] = [];
    const warnings: string[] = [];
    let isDefaultCreated = false;
    let backupRestored = false;

    try {
      // Load configuration using file persistence
      const fileResult: FileLoadResult = await this.filePersistence.loadConfigFile();
      
      let loadedConfig: Partial<AppConfiguration> = {};
      
      if (fileResult.success && fileResult.config) {
        loadedConfig = fileResult.config;
        
        // Check if default file was created
        if (fileResult.isDefaultCreated) {
          isDefaultCreated = true;
          warnings.push('Configuration file not found, created default configuration file');
        }
        
        // Check if backup was restored
        if (fileResult.error && fileResult.error.includes('restored from backup')) {
          backupRestored = true;
          warnings.push(fileResult.error);
        }
      } else {
        // File loading failed
        if (fileResult.error) {
          errors.push(fileResult.error);
          this.options.onFileError(fileResult.error, 'load');
        }
        
        // Use empty config to merge with defaults
        loadedConfig = {};
        warnings.push('Using default configuration due to file loading failure');
      }

      // Merge with defaults - ensure we always have a complete configuration
      const mergedConfig = mergeConfig(deepClone(defaultConfig), loadedConfig) as AppConfiguration;

      // Validate configuration if enabled
      let validationResult: ValidationResult = { isValid: true, errors: [], warnings: [] };
      
      if (this.options.enableValidation) {
        try {
          validationResult = validateConfigurationLogic(mergedConfig);
          
          if (!validationResult.isValid) {
            errors.push(...validationResult.errors.map(e => `Validation error at ${e.path}: ${e.message}`));
          }
          
          if (validationResult.warnings.length > 0) {
            warnings.push(...validationResult.warnings.map(w => `Validation warning at ${w.path}: ${w.message}`));
          }
        } catch (validationError) {
          errors.push(`Configuration validation failed: ${validationError instanceof Error ? validationError.message : 'Unknown validation error'}`);
        }
      }

      // Update internal configuration
      this.config = mergedConfig;

      // Notify listeners
      if (errors.length > 0 || warnings.length > 0) {
        this.options.onValidationError(errors, warnings);
      }

      this.options.onConfigChange(this.config, errors);

      return {
        config: this.config,
        isValid: validationResult.isValid && errors.length === 0,
        errors,
        warnings,
        isDefaultCreated,
        backupRestored
      };
    } catch (error) {
      const errorMessage = `Critical error loading configuration: ${error instanceof Error ? error.message : 'Unknown error'}`;
      errors.push(errorMessage);
      this.options.onFileError(errorMessage, 'load');
      
      // Ensure we always have a valid configuration
      this.config = deepClone(defaultConfig);
      
      return {
        config: this.config,
        isValid: false,
        errors,
        warnings
      };
    }
  }

  /**
   * Get the current configuration
   */
  getConfig(): AppConfiguration {
    if (!this.isInitialized) {
      throw new Error('ConfigManager not initialized. Call initialize() first.');
    }
    return deepClone(this.config);
  }

  /**
   * Get a specific configuration value by path
   */
  get<T = any>(path: string): T | undefined {
    if (!this.isInitialized) {
      throw new Error('ConfigManager not initialized. Call initialize() first.');
    }
    return getConfigValue(this.config, path as any) as T;
  }

  /**
   * Set a configuration value by path
   */
  set<T = any>(path: string, value: T): ConfigLoadResult {
    if (!this.isInitialized) {
      throw new Error('ConfigManager not initialized. Call initialize() first.');
    }

    try {
      // Store old value for listener notification
      const oldValue = getConfigValue(this.config, path as any);
      
      // Update configuration
      const newConfig = setConfigValue(this.config, path as any, value);
      
      // Validate the new configuration
      let validationResult: ValidationResult = { isValid: true, errors: [], warnings: [] };
      const errors: string[] = [];
      const warnings: string[] = [];
      
      if (this.options.enableValidation) {
        validationResult = validateConfigurationLogic(newConfig);
        
        if (!validationResult.isValid) {
          errors.push(...validationResult.errors.map(e => `${e.path}: ${e.message}`));
        }
        
        if (validationResult.warnings.length > 0) {
          warnings.push(...validationResult.warnings.map(w => `${w.path}: ${w.message}`));
        }
      }

      // Only update if validation passes or validation is disabled
      if (validationResult.isValid || !this.options.enableValidation) {
        this.config = newConfig;
        
        // Notify listeners about the change
        this.notifyListeners(path, value, oldValue);
        
        this.options.onConfigChange(this.config, errors);
      }

      // Notify about validation issues even if we don't update
      if (errors.length > 0 || warnings.length > 0) {
        this.options.onValidationError(errors, warnings);
      }

      return {
        config: this.config,
        isValid: validationResult.isValid,
        errors,
        warnings
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error setting configuration';
      return {
        config: this.config,
        isValid: false,
        errors: [errorMessage],
        warnings: []
      };
    }
  }

  /**
   * Update multiple configuration values
   */
  update(updates: Partial<AppConfiguration>): ConfigLoadResult {
    if (!this.isInitialized) {
      throw new Error('ConfigManager not initialized. Call initialize() first.');
    }

    try {
      // Store old config for change detection
      const oldConfig = deepClone(this.config);
      
      // Merge updates with current configuration
      const newConfig = mergeConfig(this.config, updates) as AppConfiguration;
      
      // Validate the new configuration
      let validationResult: ValidationResult = { isValid: true, errors: [], warnings: [] };
      const errors: string[] = [];
      const warnings: string[] = [];
      
      if (this.options.enableValidation) {
        validationResult = validateConfigurationLogic(newConfig);
        
        if (!validationResult.isValid) {
          errors.push(...validationResult.errors.map(e => `${e.path}: ${e.message}`));
        }
        
        if (validationResult.warnings.length > 0) {
          warnings.push(...validationResult.warnings.map(w => `${w.path}: ${w.message}`));
        }
      }

      // Only update if validation passes or validation is disabled
      if (validationResult.isValid || !this.options.enableValidation) {
        this.config = newConfig;
        
        // Notify listeners about all changes
        this.notifyListenersForChanges(oldConfig, newConfig);
        
        this.options.onConfigChange(this.config, errors);
      }

      // Notify about validation issues even if we don't update
      if (errors.length > 0 || warnings.length > 0) {
        this.options.onValidationError(errors, warnings);
      }

      return {
        config: this.config,
        isValid: validationResult.isValid,
        errors,
        warnings
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error updating configuration';
      return {
        config: this.config,
        isValid: false,
        errors: [errorMessage],
        warnings: []
      };
    }
  }

  /**
   * Validate the current configuration
   */
  validate(): ValidationResult {
    if (!this.isInitialized) {
      throw new Error('ConfigManager not initialized. Call initialize() first.');
    }

    if (!this.options.enableValidation) {
      return { isValid: true, errors: [], warnings: [] };
    }

    return validateConfigurationLogic(this.config);
  }

  /**
   * Reset configuration to defaults
   */
  reset(): ConfigLoadResult {
    const oldConfig = deepClone(this.config);
    this.config = deepClone(defaultConfig);
    
    // Notify listeners about all changes
    this.notifyListenersForChanges(oldConfig, this.config);
    
    this.options.onConfigChange(this.config, []);
    
    return {
      config: this.config,
      isValid: true,
      errors: [],
      warnings: []
    };
  }

  /**
   * Save configuration to file
   */
  async save(filePath?: string): Promise<{ success: boolean; error?: string; backupCreated?: boolean; backupPath?: string }> {
    if (!this.isInitialized) {
      return { success: false, error: 'ConfigManager not initialized. Call initialize() first.' };
    }

    try {
      // Create a temporary file persistence instance if custom path is provided
      const persistence = filePath 
        ? createFilePersistence({
            configPath: filePath,
            createBackup: this.options.createBackup,
            backupExtension: this.options.backupExtension,
            formatJson: this.options.formatJson,
            jsonIndent: this.options.jsonIndent
          })
        : this.filePersistence;

      const saveResult: FileSaveResult = await persistence.saveConfigFile(this.config);
      
      if (!saveResult.success) {
        this.options.onFileError(saveResult.error || 'Unknown save error', 'save');
        return {
          success: false,
          error: saveResult.error
        };
      }

      return {
        success: true,
        backupCreated: saveResult.backupCreated,
        backupPath: saveResult.backupPath
      };
    } catch (error) {
      const errorMessage = `Failed to save configuration: ${error instanceof Error ? error.message : 'Unknown error'}`;
      this.options.onFileError(errorMessage, 'save');
      return { 
        success: false, 
        error: errorMessage
      };
    }
  }

  /**
   * Setup hot reload functionality
   */
  private async setupHotReload(): Promise<void> {
    if (typeof window !== 'undefined') {
      console.warn('Hot reload not supported in browser environment');
      return;
    }

    try {
      // Create hot reloader with error recovery
      this.hotReloader = HotReloadErrorRecovery.createResilientHotReloader({
        configPath: this.configPath,
        debounceDelay: 300,
        enableNotifications: true,
        onReloadSuccess: (config) => {
          this.handleHotReloadSuccess(config);
        },
        onReloadError: (error) => {
          this.handleHotReloadError(error);
        },
        onFileChange: (path) => {
          this.notificationManager.show({
            type: 'info',
            message: HotReloadMessageFormatter.info('fileChanged', path),
            timestamp: new Date()
          });
        }
      });

      // Subscribe to hot reload notifications
      this.hotReloader.subscribe((notification) => {
        this.handleHotReloadNotification(notification);
      });

      // Start watching
      const result = await this.hotReloader.start();
      
      if (!result.success) {
        console.error('Failed to start hot reload:', result.error);
        this.options.onFileError(result.error || 'Failed to start hot reload', 'load');
      }
    } catch (error) {
      const errorMessage = `Failed to setup hot reload: ${error instanceof Error ? error.message : 'Unknown error'}`;
      console.error(errorMessage);
      this.options.onFileError(errorMessage, 'load');
    }
  }

  /**
   * Handle successful hot reload
   */
  private handleHotReloadSuccess(newConfig: AppConfiguration): void {
    try {
      // Store old config for change detection
      const oldConfig = deepClone(this.config);

      // Validate the new configuration if validation is enabled
      let validationResult: ValidationResult = { isValid: true, errors: [], warnings: [] };
      const errors: string[] = [];
      const warnings: string[] = [];

      if (this.options.enableValidation) {
        validationResult = validateConfigurationLogic(newConfig);
        
        if (!validationResult.isValid) {
          errors.push(...validationResult.errors.map(e => `Hot reload validation error at ${e.path}: ${e.message}`));
        }
        
        if (validationResult.warnings.length > 0) {
          warnings.push(...validationResult.warnings.map(w => `Hot reload validation warning at ${w.path}: ${w.message}`));
        }
      }

      // Only update if validation passes or validation is disabled
      if (validationResult.isValid || !this.options.enableValidation) {
        // Merge with defaults to ensure completeness
        this.config = mergeConfig(deepClone(defaultConfig), newConfig) as AppConfiguration;
        
        // Notify listeners about all changes
        this.notifyListenersForChanges(oldConfig, this.config);
        
        // Notify configuration change callback
        this.options.onConfigChange(this.config, errors);
        
        // Show success notification
        this.notificationManager.show({
          type: 'success',
          message: HotReloadMessageFormatter.success('reloaded'),
          timestamp: new Date()
        });
      } else {
        // Show validation error notification
        this.notificationManager.show({
          type: 'error',
          message: HotReloadMessageFormatter.error('validation', HotReloadMessageFormatter.validationError(errors)),
          timestamp: new Date()
        });
        this.options.onValidationError(errors, warnings);
      }

      // Always notify about validation issues
      if (errors.length > 0 || warnings.length > 0) {
        this.options.onValidationError(errors, warnings);
      }
    } catch (error) {
      const errorMessage = `Error processing hot reload: ${error instanceof Error ? error.message : 'Unknown error'}`;
      console.error(errorMessage);
      this.handleHotReloadError(errorMessage);
    }
  }

  /**
   * Handle hot reload errors
   */
  private handleHotReloadError(error: string): void {
    // Show error notification
    this.notificationManager.show({
      type: 'error',
      message: HotReloadMessageFormatter.error('failed', error),
      timestamp: new Date()
    });
    
    this.options.onFileError(error, 'load');
  }

  /**
   * Handle hot reload notifications
   */
  private handleHotReloadNotification(notification: HotReloadNotification): void {
    const timestamp = notification.timestamp.toISOString();
    
    switch (notification.type) {
      case 'success':
        console.log(`[${timestamp}] Hot reload success: ${notification.message}`);
        break;
      case 'error':
        console.error(`[${timestamp}] Hot reload error: ${notification.message}`);
        break;
      case 'info':
        console.info(`[${timestamp}] Hot reload info: ${notification.message}`);
        break;
    }
  }

  /**
   * Notify all listeners about a configuration change
   * @param path The configuration path that changed
   * @param newValue The new value
   * @param oldValue The old value
   */
  private notifyListeners(path: string, newValue: any, oldValue: any): void {
    if (this.listeners.size === 0) {
      return;
    }

    // Notify listeners in a try-catch to prevent one failing listener from affecting others
    this.listeners.forEach(listener => {
      try {
        listener(path, newValue, oldValue);
      } catch (error) {
        console.error('Error in configuration change listener:', error);
      }
    });
  }

  /**
   * Notify listeners about multiple configuration changes
   * @param oldConfig The old configuration
   * @param newConfig The new configuration
   */
  private notifyListenersForChanges(oldConfig: AppConfiguration, newConfig: AppConfiguration): void {
    if (this.listeners.size === 0) {
      return;
    }

    // Compare configurations and notify about each change
    const differences = compareConfigs(oldConfig, newConfig);
    
    Object.entries(differences).forEach(([path, { old: oldValue, new: newValue }]) => {
      this.notifyListeners(path, newValue, oldValue);
    });
  }

  /**
   * Get validation report
   */
  getValidationReport(): string {
    const result = this.validate();
    return this.validator.createReport(result);
  }

  /**
   * Subscribe to configuration changes
   * @param listener The listener function to call when configuration changes
   * @returns A function to unsubscribe the listener
   */
  subscribe(listener: ConfigChangeListener): () => void {
    this.listeners.add(listener);
    
    // Return unsubscribe function
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Unsubscribe a configuration change listener
   * @param listener The listener to remove
   */
  unsubscribe(listener: ConfigChangeListener): void {
    this.listeners.delete(listener);
  }

  /**
   * Clear all configuration change listeners
   */
  clearListeners(): void {
    this.listeners.clear();
  }

  /**
   * Get the number of active listeners
   */
  getListenerCount(): number {
    return this.listeners.size;
  }

  /**
   * Check if configuration manager is initialized
   */
  isReady(): boolean {
    return this.isInitialized;
  }

  /**
   * Get configuration metadata
   */
  getMetadata(): {
    version: string;
    lastModified: string;
    isValid: boolean;
    hasErrors: boolean;
    hasWarnings: boolean;
  } {
    const validation = this.validate();
    
    return {
      version: this.config.version,
      lastModified: this.config.lastModified,
      isValid: validation.isValid,
      hasErrors: validation.errors.length > 0,
      hasWarnings: validation.warnings.length > 0
    };
  }

  /**
   * Check if configuration file exists
   */
  async configFileExists(): Promise<boolean> {
    return await this.filePersistence.configFileExists();
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
    return await this.filePersistence.getConfigFileMetadata();
  }

  /**
   * Create default configuration file
   */
  async createDefaultConfigFile(): Promise<{ success: boolean; error?: string }> {
    try {
      const saveResult = await this.filePersistence.createDefaultConfigFile();
      
      if (!saveResult.success) {
        this.options.onFileError(saveResult.error || 'Failed to create default config file', 'save');
        return {
          success: false,
          error: saveResult.error
        };
      }

      return { success: true };
    } catch (error) {
      const errorMessage = `Failed to create default configuration file: ${error instanceof Error ? error.message : 'Unknown error'}`;
      this.options.onFileError(errorMessage, 'save');
      return {
        success: false,
        error: errorMessage
      };
    }
  }

  /**
   * Clean up old backup files
   */
  async cleanupBackups(keepCount: number = 5): Promise<{ cleaned: number; error?: string }> {
    return await this.filePersistence.cleanupBackups(keepCount);
  }

  /**
   * Reload configuration from file
   */
  async reload(): Promise<ConfigLoadResult> {
    if (!this.isInitialized) {
      throw new Error('ConfigManager not initialized. Call initialize() first.');
    }

    return await this.loadConfiguration();
  }

  /**
   * Enable hot reload functionality
   */
  async enableHotReload(): Promise<{ success: boolean; error?: string }> {
    if (!this.isInitialized) {
      return { success: false, error: 'ConfigManager not initialized. Call initialize() first.' };
    }

    if (this.hotReloader?.isActive()) {
      return { success: true };
    }

    this.options.enableHotReload = true;
    await this.setupHotReload();
    
    return this.hotReloader?.isActive() 
      ? { success: true }
      : { success: false, error: 'Failed to enable hot reload' };
  }

  /**
   * Disable hot reload functionality
   */
  async disableHotReload(): Promise<void> {
    this.options.enableHotReload = false;
    
    if (this.hotReloader) {
      await this.hotReloader.stop();
      this.hotReloader.clearListeners();
      this.hotReloader = null;
    }
  }

  /**
   * Check if hot reload is currently active
   */
  isHotReloadActive(): boolean {
    return this.hotReloader?.isActive() ?? false;
  }

  /**
   * Get hot reload status information
   */
  getHotReloadStatus(): {
    isActive: boolean;
    configPath?: string;
    lastModified?: number;
    listenerCount?: number;
  } {
    if (!this.hotReloader) {
      return { isActive: false };
    }

    return this.hotReloader.getStatus();
  }

  /**
   * Force hot reload (manual trigger)
   */
  async forceHotReload(): Promise<void> {
    if (!this.hotReloader?.isActive()) {
      throw new Error('Hot reload is not active');
    }

    await this.hotReloader.forceReload();
  }

  /**
   * Get the hot reload notification manager
   */
  getNotificationManager(): HotReloadNotificationManager {
    return this.notificationManager;
  }

  /**
   * Show a custom hot reload notification
   */
  showNotification(type: 'success' | 'error' | 'info', message: string): string {
    return this.notificationManager.show({
      type,
      message,
      timestamp: new Date()
    });
  }

  /**
   * Dismiss a hot reload notification
   */
  dismissNotification(id: string): boolean {
    return this.notificationManager.dismiss(id);
  }

  /**
   * Dismiss all hot reload notifications
   */
  dismissAllNotifications(): void {
    this.notificationManager.dismissAll();
  }

  /**
   * Get hot reload notification statistics
   */
  getNotificationStats(): {
    total: number;
    active: number;
    dismissed: number;
    byType: Record<string, number>;
  } {
    return this.notificationManager.getStats();
  }

  /**
   * Clean up resources and stop hot reload
   */
  async dispose(): Promise<void> {
    await this.disableHotReload();
    this.clearListeners();
    this.notificationManager.clearHandlers();
    this.notificationManager.dismissAll();
  }
}

// Export a default instance
export const configManager = new ConfigManager();

// Export factory function for custom instances
export function createConfigManager(options: ConfigManagerOptions = {}): ConfigManager {
  return new ConfigManager(options);
}