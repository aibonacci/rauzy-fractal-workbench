/**
 * Hot Reload Integration Tests
 * Tests for the complete hot reload system integration
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ConfigManager, createConfigManager } from '../ConfigManager';
import { AppConfiguration } from '../types';
import { DEFAULT_CONFIG } from '../defaultConfig';

// Mock Node.js fs module
const mockFs = {
  promises: {
    stat: vi.fn(),
    readFile: vi.fn(),
    writeFile: vi.fn(),
    access: vi.fn()
  },
  watchFile: vi.fn(),
  unwatchFile: vi.fn(),
  constants: {
    F_OK: 0,
    R_OK: 4,
    W_OK: 2
  }
};

const mockPath = {
  resolve: vi.fn((path: string) => path),
  dirname: vi.fn((path: string) => path.split('/').slice(0, -1).join('/') || '.'),
  extname: vi.fn((path: string) => {
    const parts = path.split('.');
    return parts.length > 1 ? `.${parts[parts.length - 1]}` : '';
  })
};

// Mock dynamic imports
vi.mock('fs', () => mockFs);
vi.mock('path', () => mockPath);

describe('Hot Reload Integration', () => {
  let configManager: ConfigManager;
  let mockConfig: AppConfiguration;
  let onConfigChange: ReturnType<typeof vi.fn>;
  let onValidationError: ReturnType<typeof vi.fn>;
  let onFileError: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Reset global window object for Node.js environment simulation
    Object.defineProperty(global, 'window', {
      value: undefined,
      writable: true
    });

    mockConfig = { ...DEFAULT_CONFIG };
    onConfigChange = vi.fn();
    onValidationError = vi.fn();
    onFileError = vi.fn();

    // Mock file system operations
    mockFs.promises.stat.mockResolvedValue({
      mtime: new Date('2024-01-01T10:00:00Z'),
      size: 1024
    });
    
    mockFs.promises.readFile.mockResolvedValue(JSON.stringify(mockConfig));
    mockFs.promises.writeFile.mockResolvedValue(undefined);
    mockFs.promises.access.mockResolvedValue(undefined);

    configManager = createConfigManager({
      configPath: './test-config.json',
      enableHotReload: true,
      enableValidation: true,
      onConfigChange,
      onValidationError,
      onFileError
    });
  });

  afterEach(async () => {
    if (configManager.isReady()) {
      await configManager.dispose();
    }
  });

  describe('initialization with hot reload', () => {
    it('should initialize with hot reload enabled', async () => {
      const result = await configManager.initialize();

      expect(result.isValid).toBe(true);
      expect(configManager.isHotReloadActive()).toBe(true);
      expect(mockFs.watchFile).toHaveBeenCalled();
    });

    it('should handle initialization errors gracefully', async () => {
      mockFs.watchFile.mockImplementation(() => {
        throw new Error('Watch failed');
      });

      const result = await configManager.initialize();

      expect(result.isValid).toBe(true); // Config should still be loaded
      expect(configManager.isHotReloadActive()).toBe(false);
      expect(onFileError).toHaveBeenCalledWith(
        expect.stringContaining('Failed to setup hot reload'),
        'load'
      );
    });
  });

  describe('hot reload control', () => {
    beforeEach(async () => {
      await configManager.initialize();
    });

    it('should enable hot reload when disabled', async () => {
      await configManager.disableHotReload();
      expect(configManager.isHotReloadActive()).toBe(false);

      const result = await configManager.enableHotReload();

      expect(result.success).toBe(true);
      expect(configManager.isHotReloadActive()).toBe(true);
    });

    it('should disable hot reload when enabled', async () => {
      expect(configManager.isHotReloadActive()).toBe(true);

      await configManager.disableHotReload();

      expect(configManager.isHotReloadActive()).toBe(false);
      expect(mockFs.unwatchFile).toHaveBeenCalled();
    });

    it('should provide hot reload status', async () => {
      const status = configManager.getHotReloadStatus();

      expect(status.isActive).toBe(true);
      expect(status.configPath).toBe('./test-config.json');
      expect(status.lastModified).toBeGreaterThan(0);
    });
  });

  describe('configuration hot reloading', () => {
    beforeEach(async () => {
      await configManager.initialize();
    });

    it('should reload configuration when file changes', async () => {
      const updatedConfig = {
        ...mockConfig,
        app: {
          ...mockConfig.app,
          points: {
            ...mockConfig.app.points,
            default: 150
          }
        }
      };

      mockFs.promises.readFile.mockResolvedValue(JSON.stringify(updatedConfig));

      // Simulate file change
      const watchCallback = mockFs.watchFile.mock.calls[0][2];
      watchCallback(
        { mtime: new Date('2024-01-01T11:00:00Z') },
        { mtime: new Date('2024-01-01T10:00:00Z') }
      );

      // Wait for debounce and reload
      await new Promise(resolve => setTimeout(resolve, 350));

      expect(onConfigChange).toHaveBeenCalledWith(
        expect.objectContaining({
          app: expect.objectContaining({
            points: expect.objectContaining({
              default: 150
            })
          })
        }),
        []
      );

      const currentConfig = configManager.getConfig();
      expect(currentConfig.app.points.default).toBe(150);
    });

    it('should handle validation errors during hot reload', async () => {
      const invalidConfig = {
        ...mockConfig,
        app: {
          ...mockConfig.app,
          points: {
            ...mockConfig.app.points,
            min: 200, // Invalid: min > max
            max: 100
          }
        }
      };

      mockFs.promises.readFile.mockResolvedValue(JSON.stringify(invalidConfig));

      // Simulate file change
      const watchCallback = mockFs.watchFile.mock.calls[0][2];
      watchCallback(
        { mtime: new Date('2024-01-01T11:00:00Z') },
        { mtime: new Date('2024-01-01T10:00:00Z') }
      );

      // Wait for debounce and reload
      await new Promise(resolve => setTimeout(resolve, 350));

      expect(onValidationError).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.stringContaining('validation')
        ]),
        expect.any(Array)
      );

      // Configuration should not be updated due to validation failure
      const currentConfig = configManager.getConfig();
      expect(currentConfig.app.points.min).toBe(mockConfig.app.points.min);
    });

    it('should handle file read errors during hot reload', async () => {
      mockFs.promises.readFile.mockRejectedValue(new Error('File read failed'));

      // Simulate file change
      const watchCallback = mockFs.watchFile.mock.calls[0][2];
      watchCallback(
        { mtime: new Date('2024-01-01T11:00:00Z') },
        { mtime: new Date('2024-01-01T10:00:00Z') }
      );

      // Wait for debounce and reload
      await new Promise(resolve => setTimeout(resolve, 350));

      expect(onFileError).toHaveBeenCalledWith(
        expect.stringContaining('Failed to reload configuration'),
        'load'
      );
    });

    it('should force reload configuration', async () => {
      const updatedConfig = {
        ...mockConfig,
        version: '2.0.0'
      };

      mockFs.promises.readFile.mockResolvedValue(JSON.stringify(updatedConfig));

      await configManager.forceHotReload();

      expect(onConfigChange).toHaveBeenCalledWith(
        expect.objectContaining({
          version: '2.0.0'
        }),
        []
      );
    });
  });

  describe('notification system integration', () => {
    beforeEach(async () => {
      await configManager.initialize();
    });

    it('should show notifications for hot reload events', async () => {
      const notificationManager = configManager.getNotificationManager();
      const listener = vi.fn();
      notificationManager.subscribe(listener);

      // Trigger a successful reload
      const updatedConfig = { ...mockConfig, version: '2.0.0' };
      mockFs.promises.readFile.mockResolvedValue(JSON.stringify(updatedConfig));

      const watchCallback = mockFs.watchFile.mock.calls[0][2];
      watchCallback(
        { mtime: new Date('2024-01-01T11:00:00Z') },
        { mtime: new Date('2024-01-01T10:00:00Z') }
      );

      // Wait for reload
      await new Promise(resolve => setTimeout(resolve, 350));

      expect(listener).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'info',
          message: expect.stringContaining('Configuration file changed')
        })
      );

      expect(listener).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'success',
          message: expect.stringContaining('Configuration reloaded successfully')
        })
      );
    });

    it('should manage notifications through ConfigManager', () => {
      const notificationId = configManager.showNotification('info', 'Test notification');
      
      expect(notificationId).toMatch(/^hot-reload-\d+$/);

      const stats = configManager.getNotificationStats();
      expect(stats.active).toBe(1);

      const dismissed = configManager.dismissNotification(notificationId);
      expect(dismissed).toBe(true);

      const updatedStats = configManager.getNotificationStats();
      expect(updatedStats.active).toBe(0);
    });

    it('should dismiss all notifications', () => {
      configManager.showNotification('info', 'Notification 1');
      configManager.showNotification('success', 'Notification 2');
      configManager.showNotification('error', 'Notification 3');

      let stats = configManager.getNotificationStats();
      expect(stats.active).toBe(3);

      configManager.dismissAllNotifications();

      stats = configManager.getNotificationStats();
      expect(stats.active).toBe(0);
    });
  });

  describe('error recovery', () => {
    beforeEach(async () => {
      await configManager.initialize();
    });

    it('should attempt recovery on hot reload failures', async () => {
      // Mock initial failure followed by success
      let callCount = 0;
      mockFs.promises.readFile.mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return Promise.reject(new Error('Temporary failure'));
        }
        return Promise.resolve(JSON.stringify(mockConfig));
      });

      // Simulate file change
      const watchCallback = mockFs.watchFile.mock.calls[0][2];
      watchCallback(
        { mtime: new Date('2024-01-01T11:00:00Z') },
        { mtime: new Date('2024-01-01T10:00:00Z') }
      );

      // Wait for initial failure and recovery attempt
      await new Promise(resolve => setTimeout(resolve, 350));

      // The error recovery should be handled internally
      expect(onFileError).toHaveBeenCalledWith(
        expect.stringContaining('Failed to reload configuration'),
        'load'
      );
    });
  });

  describe('cleanup and disposal', () => {
    beforeEach(async () => {
      await configManager.initialize();
    });

    it('should clean up resources on disposal', async () => {
      expect(configManager.isHotReloadActive()).toBe(true);

      await configManager.dispose();

      expect(configManager.isHotReloadActive()).toBe(false);
      expect(mockFs.unwatchFile).toHaveBeenCalled();
      expect(configManager.getListenerCount()).toBe(0);
      expect(configManager.getNotificationStats().active).toBe(0);
    });
  });

  describe('browser environment handling', () => {
    it('should handle browser environment gracefully', async () => {
      // Simulate browser environment
      Object.defineProperty(global, 'window', {
        value: {},
        writable: true
      });

      const browserConfigManager = createConfigManager({
        configPath: './test-config.json',
        enableHotReload: true
      });

      const result = await browserConfigManager.initialize();

      expect(result.isValid).toBe(true);
      expect(browserConfigManager.isHotReloadActive()).toBe(false);
    });
  });
});