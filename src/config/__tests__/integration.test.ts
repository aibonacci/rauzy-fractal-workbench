/**
 * Integration tests for configuration file persistence
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ConfigManager } from '../ConfigManager';
import { ConfigFilePersistence } from '../filePersistence';
import { DEFAULT_CONFIG } from '../defaultConfig';
import { AppConfiguration } from '../types';

// Mock fs for Node.js environment
const mockFs = {
  existsSync: vi.fn(),
  readFileSync: vi.fn(),
  writeFileSync: vi.fn(),
  mkdirSync: vi.fn(),
  copyFileSync: vi.fn(),
  readdirSync: vi.fn(),
  statSync: vi.fn(),
  unlinkSync: vi.fn(),
  accessSync: vi.fn(),
  constants: { R_OK: 4, W_OK: 2 }
};

const mockPath = {
  resolve: vi.fn((path: string) => path),
  dirname: vi.fn((path: string) => path.split('/').slice(0, -1).join('/') || '.'),
  basename: vi.fn((path: string) => path.split('/').pop() || path),
  join: vi.fn((...paths: string[]) => paths.join('/'))
};

vi.mock('fs', () => mockFs);
vi.mock('path', () => mockPath);

describe('Configuration File Persistence Integration', () => {
  let configManager: ConfigManager;
  let filePersistence: ConfigFilePersistence;

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Simulate Node.js environment
    delete (global as any).window;
    
    configManager = new ConfigManager({
      configPath: './test-config.json',
      enableValidation: true,
      createBackup: true
    });
    
    filePersistence = new ConfigFilePersistence({
      configPath: './test-config.json'
    });
  });

  describe('File Loading Scenarios', () => {
    it('should handle successful file loading', async () => {
      const testConfig = { ...DEFAULT_CONFIG, version: '2.0.0' };
      
      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue(JSON.stringify(testConfig));

      const result = await filePersistence.loadConfigFile();

      expect(result.success).toBe(true);
      expect(result.config).toEqual(testConfig);
    });

    it('should create default file when none exists', async () => {
      mockFs.existsSync.mockReturnValue(false);
      mockPath.dirname.mockReturnValue('./');
      mockFs.writeFileSync.mockImplementation(() => {});

      const result = await filePersistence.loadConfigFile();

      expect(result.success).toBe(true);
      expect(result.isDefaultCreated).toBe(true);
      expect(mockFs.writeFileSync).toHaveBeenCalled();
    });

    it('should handle corrupted JSON with backup recovery', async () => {
      const corruptedJson = '{ "version": "1.0.0", invalid }';
      const backupConfig = { ...DEFAULT_CONFIG, version: '1.5.0' };
      
      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync
        .mockReturnValueOnce(corruptedJson) // Main file
        .mockReturnValueOnce(JSON.stringify(backupConfig)); // Backup file
      
      mockFs.writeFileSync.mockImplementation(() => {}); // For corrupted backup
      mockFs.readdirSync.mockReturnValue(['test-config.json.backup.2025-01-08']);
      mockFs.statSync.mockReturnValue({ mtime: new Date() });
      mockFs.copyFileSync.mockImplementation(() => {}); // For restoration

      const result = await filePersistence.loadConfigFile();

      expect(result.success).toBe(true);
      expect(result.config).toEqual(backupConfig);
      expect(result.error).toContain('restored from backup');
    });
  });

  describe('File Saving Scenarios', () => {
    it('should save configuration with backup', async () => {
      const testConfig = { ...DEFAULT_CONFIG, version: '3.0.0' };
      
      mockFs.existsSync.mockReturnValue(true); // File exists for backup
      mockPath.dirname.mockReturnValue('./');
      mockFs.copyFileSync.mockImplementation(() => {}); // Backup creation
      mockFs.writeFileSync.mockImplementation(() => {}); // Save operation

      const result = await filePersistence.saveConfigFile(testConfig);

      expect(result.success).toBe(true);
      expect(result.backupCreated).toBe(true);
      expect(mockFs.copyFileSync).toHaveBeenCalled();
      expect(mockFs.writeFileSync).toHaveBeenCalled();
    });

    it('should handle save errors gracefully', async () => {
      const testConfig = { ...DEFAULT_CONFIG, version: '3.0.0' };
      
      mockFs.existsSync.mockReturnValue(false);
      mockPath.dirname.mockReturnValue('./');
      mockFs.writeFileSync.mockImplementation(() => {
        throw new Error('Permission denied');
      });

      const result = await filePersistence.saveConfigFile(testConfig);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Permission denied');
    });
  });

  describe('File Management Operations', () => {
    it('should check file existence correctly', async () => {
      mockFs.existsSync.mockReturnValue(true);

      const exists = await filePersistence.configFileExists();

      expect(exists).toBe(true);
      expect(mockFs.existsSync).toHaveBeenCalled();
    });

    it('should return file metadata', async () => {
      const mockStats = {
        size: 2048,
        mtime: new Date('2025-01-08T12:00:00Z')
      };

      mockFs.existsSync.mockReturnValue(true);
      mockFs.statSync.mockReturnValue(mockStats);
      mockFs.accessSync.mockImplementation(() => {}); // No error = accessible

      const metadata = await filePersistence.getConfigFileMetadata();

      expect(metadata.exists).toBe(true);
      expect(metadata.size).toBe(2048);
      expect(metadata.isReadable).toBe(true);
      expect(metadata.isWritable).toBe(true);
    });

    it('should clean up old backups', async () => {
      const backupFiles = [
        'test-config.json.backup.2025-01-08',
        'test-config.json.backup.2025-01-07',
        'test-config.json.backup.2025-01-06'
      ];

      mockPath.dirname.mockReturnValue('./');
      mockPath.basename.mockReturnValue('test-config.json');
      mockPath.join.mockImplementation((...paths) => paths.join('/'));
      mockFs.readdirSync.mockReturnValue(backupFiles);
      mockFs.statSync.mockImplementation((file) => ({
        mtime: new Date(`2025-01-${file.split('.').pop()}T10:00:00Z`)
      }));
      mockFs.unlinkSync.mockImplementation(() => {});

      const result = await filePersistence.cleanupBackups(2);

      expect(result.cleaned).toBe(1); // Should remove 1 old backup
      expect(mockFs.unlinkSync).toHaveBeenCalledTimes(1);
    });
  });

  describe('Error Recovery Scenarios', () => {
    it('should recover from corrupted file without backup', async () => {
      const corruptedJson = '{ invalid json }';
      
      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue(corruptedJson);
      mockFs.writeFileSync.mockImplementation(() => {}); // For corrupted backup and new default
      mockFs.readdirSync.mockReturnValue([]); // No backup files
      mockPath.dirname.mockReturnValue('./');

      const result = await filePersistence.loadConfigFile();

      expect(result.success).toBe(true);
      expect(result.config).toEqual(DEFAULT_CONFIG);
      expect(result.error).toContain('corrupted and has been reset to defaults');
    });

    it('should handle file system errors', async () => {
      mockFs.existsSync.mockImplementation(() => {
        throw new Error('File system unavailable');
      });

      const result = await filePersistence.loadConfigFile();

      expect(result.success).toBe(false);
      expect(result.error).toContain('Node.js file loading error');
    });
  });

  describe('Browser Environment', () => {
    beforeEach(() => {
      // Simulate browser environment
      (global as any).window = {};
    });

    it('should handle fetch-based loading', async () => {
      const testConfig = { ...DEFAULT_CONFIG, version: '2.0.0' };
      
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        text: () => Promise.resolve(JSON.stringify(testConfig))
      });

      const result = await filePersistence.loadConfigFile();

      expect(result.success).toBe(true);
      expect(result.config).toEqual(testConfig);
    });

    it('should handle fetch errors', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
        statusText: 'Not Found'
      });

      const result = await filePersistence.loadConfigFile();

      expect(result.success).toBe(false);
      expect(result.error).toContain('Configuration file not found');
    });

    it('should reject save operations in browser', async () => {
      const testConfig = { ...DEFAULT_CONFIG, version: '2.0.0' };

      const result = await filePersistence.saveConfigFile(testConfig);

      expect(result.success).toBe(false);
      expect(result.error).toBe('File saving not supported in browser environment');
    });
  });
});