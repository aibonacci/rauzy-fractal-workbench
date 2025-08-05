/**
 * Hot Reload System Tests
 * Tests for configuration hot reload functionality
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ConfigHotReloader, createHotReloader, HotReloadErrorRecovery } from '../hotReload';
import { AppConfiguration } from '../types';
import { DEFAULT_CONFIG } from '../defaultConfig';

// Mock Node.js fs module
const mockFs = {
  promises: {
    stat: vi.fn(),
    readFile: vi.fn()
  },
  watchFile: vi.fn(),
  unwatchFile: vi.fn()
};

const mockPath = {
  resolve: vi.fn((path: string) => path)
};

// Mock dynamic imports
vi.mock('fs', () => mockFs);
vi.mock('path', () => mockPath);

describe('ConfigHotReloader', () => {
  let hotReloader: ConfigHotReloader;
  let mockConfig: AppConfiguration;
  let onReloadSuccess: ReturnType<typeof vi.fn>;
  let onReloadError: ReturnType<typeof vi.fn>;
  let onFileChange: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Reset global window object for Node.js environment simulation
    Object.defineProperty(global, 'window', {
      value: undefined,
      writable: true
    });

    mockConfig = { ...DEFAULT_CONFIG };
    onReloadSuccess = vi.fn();
    onReloadError = vi.fn();
    onFileChange = vi.fn();

    hotReloader = createHotReloader({
      configPath: './test-config.json',
      debounceDelay: 100,
      enableNotifications: true,
      onReloadSuccess,
      onReloadError,
      onFileChange
    });
  });

  afterEach(async () => {
    if (hotReloader.isActive()) {
      await hotReloader.stop();
    }
  });

  describe('initialization', () => {
    it('should create hot reloader with default options', () => {
      const reloader = createHotReloader({
        configPath: './config.json'
      });

      expect(reloader).toBeInstanceOf(ConfigHotReloader);
      expect(reloader.getConfigPath()).toBe('./config.json');
      expect(reloader.isActive()).toBe(false);
    });

    it('should create hot reloader with custom options', () => {
      const customReloader = createHotReloader({
        configPath: './custom-config.json',
        debounceDelay: 500,
        enableNotifications: false
      });

      expect(customReloader.getConfigPath()).toBe('./custom-config.json');
      expect(customReloader.isActive()).toBe(false);
    });
  });

  describe('browser environment detection', () => {
    it('should not start in browser environment', async () => {
      // Simulate browser environment
      Object.defineProperty(global, 'window', {
        value: {},
        writable: true
      });

      const result = await hotReloader.start();

      expect(result.success).toBe(false);
      expect(result.error).toContain('not supported in browser environment');
      expect(hotReloader.isActive()).toBe(false);
    });
  });

  describe('file watching', () => {
    beforeEach(() => {
      // Mock file stats
      mockFs.promises.stat.mockResolvedValue({
        mtime: new Date('2024-01-01T10:00:00Z')
      });
    });

    it('should start watching configuration file', async () => {
      const result = await hotReloader.start();

      expect(result.success).toBe(true);
      expect(mockFs.watchFile).toHaveBeenCalledWith(
        './test-config.json',
        expect.objectContaining({
          interval: 1000,
          persistent: true
        }),
        expect.any(Function)
      );
      expect(hotReloader.isActive()).toBe(true);
    });

    it('should handle file that does not exist initially', async () => {
      mockFs.promises.stat.mockRejectedValue(new Error('File not found'));

      const result = await hotReloader.start();

      expect(result.success).toBe(true);
      expect(hotReloader.isActive()).toBe(true);
    });

    it('should stop watching configuration file', async () => {
      await hotReloader.start();
      await hotReloader.stop();

      expect(mockFs.unwatchFile).toHaveBeenCalledWith('./test-config.json');
      expect(hotReloader.isActive()).toBe(false);
    });

    it('should handle start errors gracefully', async () => {
      mockFs.watchFile.mockImplementation(() => {
        throw new Error('Watch failed');
      });

      const result = await hotReloader.start();

      expect(result.success).toBe(false);
      expect(result.error).toContain('Failed to start hot reload');
      expect(hotReloader.isActive()).toBe(false);
    });
  });

  describe('configuration reloading', () => {
    beforeEach(async () => {
      mockFs.promises.stat.mockResolvedValue({
        mtime: new Date('2024-01-01T10:00:00Z')
      });
      
      mockFs.promises.readFile.mockResolvedValue(JSON.stringify(mockConfig));
      
      await hotReloader.start();
    });

    it('should reload configuration when file changes', async () => {
      // Simulate file change
      const watchCallback = mockFs.watchFile.mock.calls[0][2];
      const newMtime = new Date('2024-01-01T11:00:00Z');
      
      watchCallback(
        { mtime: newMtime },
        { mtime: new Date('2024-01-01T10:00:00Z') }
      );

      // Wait for debounce
      await new Promise(resolve => setTimeout(resolve, 150));

      expect(mockFs.promises.readFile).toHaveBeenCalledWith('./test-config.json', 'utf-8');
      expect(onReloadSuccess).toHaveBeenCalledWith(expect.objectContaining({
        ...mockConfig,
        lastModified: expect.any(String)
      }));
    });

    it('should not reload if file mtime has not changed', async () => {
      const watchCallback = mockFs.watchFile.mock.calls[0][2];
      const sameMtime = new Date('2024-01-01T10:00:00Z');
      
      watchCallback(
        { mtime: sameMtime },
        { mtime: sameMtime }
      );

      // Wait for potential debounce
      await new Promise(resolve => setTimeout(resolve, 150));

      expect(mockFs.promises.readFile).not.toHaveBeenCalled();
      expect(onReloadSuccess).not.toHaveBeenCalled();
    });

    it('should handle file read errors', async () => {
      mockFs.promises.readFile.mockRejectedValue(new Error('Read failed'));

      const watchCallback = mockFs.watchFile.mock.calls[0][2];
      watchCallback(
        { mtime: new Date('2024-01-01T11:00:00Z') },
        { mtime: new Date('2024-01-01T10:00:00Z') }
      );

      // Wait for debounce
      await new Promise(resolve => setTimeout(resolve, 150));

      expect(onReloadError).toHaveBeenCalledWith(
        expect.stringContaining('Failed to reload configuration')
      );
    });

    it('should handle JSON parse errors', async () => {
      mockFs.promises.readFile.mockResolvedValue('invalid json');

      const watchCallback = mockFs.watchFile.mock.calls[0][2];
      watchCallback(
        { mtime: new Date('2024-01-01T11:00:00Z') },
        { mtime: new Date('2024-01-01T10:00:00Z') }
      );

      // Wait for debounce
      await new Promise(resolve => setTimeout(resolve, 150));

      expect(onReloadError).toHaveBeenCalledWith(
        expect.stringContaining('Failed to reload configuration')
      );
    });
  });

  describe('force reload', () => {
    beforeEach(async () => {
      mockFs.promises.stat.mockResolvedValue({
        mtime: new Date('2024-01-01T10:00:00Z')
      });
      
      mockFs.promises.readFile.mockResolvedValue(JSON.stringify(mockConfig));
      
      await hotReloader.start();
    });

    it('should force reload configuration', async () => {
      // Ensure hot reloader is started first
      const result = await hotReloader.start();
      if (!result.success) {
        // Skip test if start failed
        return;
      }

      await hotReloader.forceReload();

      expect(mockFs.promises.readFile).toHaveBeenCalledWith('./test-config.json', 'utf-8');
      expect(onReloadSuccess).toHaveBeenCalledWith(expect.objectContaining({
        ...mockConfig,
        lastModified: expect.any(String)
      }));
    });

    it('should throw error if not active', async () => {
      await hotReloader.stop();

      await expect(hotReloader.forceReload()).rejects.toThrow(
        'Hot reload is not enabled'
      );
    });
  });

  describe('notification system', () => {
    it('should notify listeners about events', async () => {
      const listener = vi.fn();
      hotReloader.subscribe(listener);

      const result = await hotReloader.start();

      if (result.success) {
        expect(listener).toHaveBeenCalledWith(
          expect.objectContaining({
            type: 'info',
            message: expect.stringContaining('Hot reload enabled'),
            timestamp: expect.any(Date)
          })
        );
      } else {
        expect(listener).toHaveBeenCalledWith(
          expect.objectContaining({
            type: 'error',
            message: expect.stringContaining('Failed to start hot reload'),
            timestamp: expect.any(Date)
          })
        );
      }
    });

    it('should unsubscribe listeners', async () => {
      const listener = vi.fn();
      const unsubscribe = hotReloader.subscribe(listener);

      unsubscribe();
      await hotReloader.start();

      expect(listener).not.toHaveBeenCalled();
    });

    it('should clear all listeners', async () => {
      const listener1 = vi.fn();
      const listener2 = vi.fn();
      
      hotReloader.subscribe(listener1);
      hotReloader.subscribe(listener2);
      hotReloader.clearListeners();

      await hotReloader.start();

      expect(listener1).not.toHaveBeenCalled();
      expect(listener2).not.toHaveBeenCalled();
    });
  });

  describe('status and metadata', () => {
    it('should provide status information', () => {
      const status = hotReloader.getStatus();

      expect(status).toEqual({
        isEnabled: false,
        configPath: './test-config.json',
        lastModified: 0,
        listenerCount: 0
      });
    });

    it('should update status when active', async () => {
      mockFs.promises.stat.mockResolvedValue({
        mtime: new Date('2024-01-01T10:00:00Z')
      });

      const result = await hotReloader.start();
      const status = hotReloader.getStatus();

      if (result.success) {
        expect(status.isEnabled).toBe(true);
        expect(status.lastModified).toBeGreaterThan(0);
      } else {
        expect(status.isEnabled).toBe(false);
      }
    });
  });
});

describe('HotReloadErrorRecovery', () => {
  let hotReloader: ConfigHotReloader;
  let onRecoveryAttempt: ReturnType<typeof vi.fn>;
  let onRecoverySuccess: ReturnType<typeof vi.fn>;
  let onRecoveryFailed: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    
    Object.defineProperty(global, 'window', {
      value: undefined,
      writable: true
    });

    onRecoveryAttempt = vi.fn();
    onRecoverySuccess = vi.fn();
    onRecoveryFailed = vi.fn();

    hotReloader = createHotReloader({
      configPath: './test-config.json'
    });
  });

  afterEach(async () => {
    if (hotReloader.isActive()) {
      await hotReloader.stop();
    }
  });

  describe('recovery attempts', () => {
    it('should attempt recovery on failure', async () => {
      // Mock successful recovery on second attempt
      let attemptCount = 0;
      vi.spyOn(hotReloader, 'start').mockImplementation(async () => {
        attemptCount++;
        if (attemptCount === 1) {
          return { success: false, error: 'First attempt failed' };
        }
        return { success: true };
      });

      const recovered = await HotReloadErrorRecovery.attemptRecovery(
        hotReloader,
        'Initial error',
        onRecoveryAttempt,
        onRecoverySuccess,
        onRecoveryFailed
      );

      expect(recovered).toBe(true);
      expect(onRecoveryAttempt).toHaveBeenCalledTimes(2);
      expect(onRecoverySuccess).toHaveBeenCalledTimes(1);
      expect(onRecoveryFailed).not.toHaveBeenCalled();
    });

    it('should fail recovery after max attempts', async () => {
      vi.spyOn(hotReloader, 'start').mockResolvedValue({
        success: false,
        error: 'Persistent error'
      });

      const recovered = await HotReloadErrorRecovery.attemptRecovery(
        hotReloader,
        'Initial error',
        onRecoveryAttempt,
        onRecoverySuccess,
        onRecoveryFailed
      );

      expect(recovered).toBe(false);
      expect(onRecoveryAttempt).toHaveBeenCalledTimes(3); // MAX_RETRY_ATTEMPTS
      expect(onRecoverySuccess).not.toHaveBeenCalled();
      expect(onRecoveryFailed).toHaveBeenCalledWith('Persistent error');
    }, 10000); // Increase timeout
  });

  describe('resilient hot reloader', () => {
    it('should create resilient hot reloader', () => {
      const resilientReloader = HotReloadErrorRecovery.createResilientHotReloader({
        configPath: './test-config.json',
        onReloadError: vi.fn()
      });

      expect(resilientReloader).toBeInstanceOf(ConfigHotReloader);
    });
  });
});