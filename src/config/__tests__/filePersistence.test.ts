/**
 * Tests for Configuration File Persistence
 */

import { describe, it, expect, beforeEach, afterEach, vi, Mock } from 'vitest';
import { ConfigFilePersistence, createFilePersistence } from '../filePersistence';
import { DEFAULT_CONFIG } from '../defaultConfig';
import { AppConfiguration } from '../types';

// Mock fs and path modules
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
  constants: {
    R_OK: 4,
    W_OK: 2
  }
};

const mockPath = {
  resolve: vi.fn((path: string) => path),
  dirname: vi.fn((path: string) => path.split('/').slice(0, -1).join('/') || '.'),
  basename: vi.fn((path: string) => path.split('/').pop() || path),
  join: vi.fn((...paths: string[]) => paths.join('/'))
};

// Mock fetch for browser environment
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock dynamic imports
vi.mock('fs', () => mockFs);
vi.mock('path', () => mockPath);

describe('ConfigFilePersistence', () => {
  let persistence: ConfigFilePersistence;
  let originalWindow: any;

  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks();
    
    // Store original window object
    originalWindow = global.window;
    
    // Create persistence instance
    persistence = new ConfigFilePersistence({
      configPath: './test-config.json',
      createBackup: true,
      backupExtension: '.backup',
      formatJson: true,
      jsonIndent: 2
    });
  });

  afterEach(() => {
    // Restore window object
    global.window = originalWindow;
  });

  describe('Node.js Environment', () => {
    beforeEach(() => {
      // Simulate Node.js environment
      delete (global as any).window;
    });

    describe('loadConfigFile', () => {
      it('should load existing configuration file successfully', async () => {
        const testConfig = { ...DEFAULT_CONFIG, version: '2.0.0' };
        
        mockFs.existsSync.mockReturnValue(true);
        mockFs.readFileSync.mockReturnValue(JSON.stringify(testConfig));

        const result = await persistence.loadConfigFile();

        expect(result.success).toBe(true);
        expect(result.config).toEqual(testConfig);
        expect(result.error).toBeUndefined();
        expect(mockFs.existsSync).toHaveBeenCalledWith('./test-config.json');
        expect(mockFs.readFileSync).toHaveBeenCalledWith('./test-config.json', 'utf-8');
      });

      it('should create default config file when file does not exist', async () => {
        mockFs.existsSync.mockReturnValue(false);
        mockPath.dirname.mockReturnValue('./');
        mockFs.writeFileSync.mockImplementation(() => {});

        const result = await persistence.loadConfigFile();

        expect(result.success).toBe(true);
        expect(result.config).toEqual(DEFAULT_CONFIG);
        expect(result.isDefaultCreated).toBe(true);
        expect(mockFs.writeFileSync).toHaveBeenCalled();
      });

      it('should handle empty configuration file', async () => {
        mockFs.existsSync.mockReturnValue(true);
        mockFs.readFileSync.mockReturnValue('   ');

        const result = await persistence.loadConfigFile();

        expect(result.success).toBe(false);
        expect(result.error).toBe('Configuration file is empty');
      });

      it('should handle JSON parsing errors and attempt recovery', async () => {
        const corruptedJson = '{ "version": "1.0.0", invalid json }';
        
        mockFs.existsSync.mockReturnValue(true);
        mockFs.readFileSync.mockReturnValue(corruptedJson);
        mockFs.writeFileSync.mockImplementation(() => {}); // For backup creation
        mockFs.readdirSync.mockReturnValue(['test-config.json.backup.2025-01-01']);
        mockFs.statSync.mockReturnValue({ mtime: new Date() });

        // Mock backup file reading
        mockFs.readFileSync
          .mockReturnValueOnce(corruptedJson) // First call for main file
          .mockReturnValueOnce(JSON.stringify(DEFAULT_CONFIG)); // Second call for backup

        const result = await persistence.loadConfigFile();

        expect(result.success).toBe(true);
        expect(result.config).toEqual(DEFAULT_CONFIG);
        expect(result.error).toContain('restored from backup');
      });

      it('should create new default file when no backup is available', async () => {
        const corruptedJson = '{ invalid json }';
        
        mockFs.existsSync.mockReturnValue(true);
        mockFs.readFileSync.mockReturnValue(corruptedJson);
        mockFs.writeFileSync.mockImplementation(() => {});
        mockFs.readdirSync.mockReturnValue([]); // No backup files
        mockPath.dirname.mockReturnValue('./');

        const result = await persistence.loadConfigFile();

        expect(result.success).toBe(true);
        expect(result.config).toEqual(DEFAULT_CONFIG);
        expect(result.error).toContain('corrupted and has been reset to defaults');
      });

      it('should handle file system errors gracefully', async () => {
        mockFs.existsSync.mockImplementation(() => {
          throw new Error('File system error');
        });

        const result = await persistence.loadConfigFile();

        expect(result.success).toBe(false);
        expect(result.error).toContain('Node.js file loading error');
      });
    });

    describe('saveConfigFile', () => {
      it('should save configuration file successfully', async () => {
        const testConfig = { ...DEFAULT_CONFIG, version: '2.0.0' };
        
        mockFs.existsSync.mockReturnValue(false); // No existing file to backup
        mockPath.dirname.mockReturnValue('./');
        mockFs.writeFileSync.mockImplementation(() => {});

        const result = await persistence.saveConfigFile(testConfig);

        expect(result.success).toBe(true);
        expect(result.backupCreated).toBe(false);
        expect(mockFs.writeFileSync).toHaveBeenCalledWith(
          './test-config.json',
          expect.stringContaining('"version": "2.0.0"'),
          'utf-8'
        );
      });

      it('should create backup before saving when file exists', async () => {
        const testConfig = { ...DEFAULT_CONFIG, version: '2.0.0' };
        
        mockFs.existsSync.mockReturnValue(true); // Existing file
        mockPath.dirname.mockReturnValue('./');
        mockFs.copyFileSync.mockImplementation(() => {});
        mockFs.writeFileSync.mockImplementation(() => {});

        const result = await persistence.saveConfigFile(testConfig);

        expect(result.success).toBe(true);
        expect(result.backupCreated).toBe(true);
        expect(result.backupPath).toContain('.backup.');
        expect(mockFs.copyFileSync).toHaveBeenCalled();
      });

      it('should create directory if it does not exist', async () => {
        const testConfig = { ...DEFAULT_CONFIG, version: '2.0.0' };
        
        mockFs.existsSync
          .mockReturnValueOnce(false) // No existing file
          .mockReturnValueOnce(false); // Directory doesn't exist
        mockPath.dirname.mockReturnValue('./config');
        mockFs.mkdirSync.mockImplementation(() => {});
        mockFs.writeFileSync.mockImplementation(() => {});

        const result = await persistence.saveConfigFile(testConfig);

        expect(result.success).toBe(true);
        expect(mockFs.mkdirSync).toHaveBeenCalledWith('./config', { recursive: true });
      });

      it('should handle save errors gracefully', async () => {
        const testConfig = { ...DEFAULT_CONFIG, version: '2.0.0' };
        
        mockFs.existsSync.mockReturnValue(false);
        mockPath.dirname.mockReturnValue('./');
        mockFs.writeFileSync.mockImplementation(() => {
          throw new Error('Write permission denied');
        });

        const result = await persistence.saveConfigFile(testConfig);

        expect(result.success).toBe(false);
        expect(result.error).toContain('Write permission denied');
      });

      it('should update lastModified timestamp when saving', async () => {
        const testConfig = { ...DEFAULT_CONFIG, version: '2.0.0' };
        const originalLastModified = testConfig.lastModified;
        
        mockFs.existsSync.mockReturnValue(false);
        mockPath.dirname.mockReturnValue('./');
        
        let savedData = '';
        mockFs.writeFileSync.mockImplementation((path, data) => {
          savedData = data as string;
        });

        await persistence.saveConfigFile(testConfig);

        const savedConfig = JSON.parse(savedData);
        expect(savedConfig.lastModified).not.toBe(originalLastModified);
        expect(new Date(savedConfig.lastModified)).toBeInstanceOf(Date);
      });
    });

    describe('configFileExists', () => {
      it('should return true when file exists', async () => {
        mockFs.existsSync.mockReturnValue(true);

        const exists = await persistence.configFileExists();

        expect(exists).toBe(true);
        expect(mockFs.existsSync).toHaveBeenCalledWith('./test-config.json');
      });

      it('should return false when file does not exist', async () => {
        mockFs.existsSync.mockReturnValue(false);

        const exists = await persistence.configFileExists();

        expect(exists).toBe(false);
      });

      it('should handle errors gracefully', async () => {
        mockFs.existsSync.mockImplementation(() => {
          throw new Error('File system error');
        });

        const exists = await persistence.configFileExists();

        expect(exists).toBe(false);
      });
    });

    describe('getConfigFileMetadata', () => {
      it('should return metadata for existing file', async () => {
        const mockStats = {
          size: 1024,
          mtime: new Date('2025-01-08T10:00:00Z')
        };

        mockFs.existsSync.mockReturnValue(true);
        mockFs.statSync.mockReturnValue(mockStats);
        mockFs.accessSync.mockImplementation(() => {}); // No error = accessible

        const metadata = await persistence.getConfigFileMetadata();

        expect(metadata.exists).toBe(true);
        expect(metadata.size).toBe(1024);
        expect(metadata.lastModified).toEqual(mockStats.mtime);
        expect(metadata.isReadable).toBe(true);
        expect(metadata.isWritable).toBe(true);
      });

      it('should return exists: false for non-existent file', async () => {
        mockFs.existsSync.mockReturnValue(false);

        const metadata = await persistence.getConfigFileMetadata();

        expect(metadata.exists).toBe(false);
        expect(metadata.size).toBeUndefined();
      });
    });

    describe('cleanupBackups', () => {
      it('should clean up old backup files', async () => {
        const backupFiles = [
          'test-config.json.backup.2025-01-08',
          'test-config.json.backup.2025-01-07',
          'test-config.json.backup.2025-01-06',
          'test-config.json.backup.2025-01-05',
          'test-config.json.backup.2025-01-04',
          'test-config.json.backup.2025-01-03', // Should be deleted
          'test-config.json.backup.2025-01-02'  // Should be deleted
        ];

        mockPath.dirname.mockReturnValue('./');
        mockPath.basename.mockReturnValue('test-config.json');
        mockPath.join.mockImplementation((...paths) => paths.join('/'));
        mockFs.readdirSync.mockReturnValue(backupFiles);
        
        // Mock stats for sorting by modification time
        mockFs.statSync.mockImplementation((file) => ({
          mtime: new Date(`2025-01-${file.split('.').pop()}T10:00:00Z`)
        }));
        
        mockFs.unlinkSync.mockImplementation(() => {});

        const result = await persistence.cleanupBackups(5);

        expect(result.cleaned).toBe(2);
        expect(mockFs.unlinkSync).toHaveBeenCalledTimes(2);
      });

      it('should handle cleanup errors gracefully', async () => {
        mockPath.dirname.mockReturnValue('./');
        mockPath.basename.mockReturnValue('test-config.json');
        mockFs.readdirSync.mockImplementation(() => {
          throw new Error('Directory read error');
        });

        const result = await persistence.cleanupBackups(5);

        expect(result.cleaned).toBe(0);
        expect(result.error).toContain('Backup cleanup failed');
      });
    });
  });

  describe('Browser Environment', () => {
    beforeEach(() => {
      // Simulate browser environment
      (global as any).window = {};
    });

    describe('loadConfigFile', () => {
      it('should load configuration via fetch successfully', async () => {
        const testConfig = { ...DEFAULT_CONFIG, version: '2.0.0' };
        
        mockFetch.mockResolvedValue({
          ok: true,
          text: () => Promise.resolve(JSON.stringify(testConfig))
        });

        const result = await persistence.loadConfigFile();

        expect(result.success).toBe(true);
        expect(result.config).toEqual(testConfig);
        expect(mockFetch).toHaveBeenCalledWith('./test-config.json');
      });

      it('should handle 404 errors gracefully', async () => {
        mockFetch.mockResolvedValue({
          ok: false,
          status: 404,
          statusText: 'Not Found'
        });

        const result = await persistence.loadConfigFile();

        expect(result.success).toBe(false);
        expect(result.error).toContain('Configuration file not found');
      });

      it('should handle fetch errors', async () => {
        mockFetch.mockRejectedValue(new Error('Network error'));

        const result = await persistence.loadConfigFile();

        expect(result.success).toBe(false);
        expect(result.error).toContain('Browser file loading error');
      });

      it('should handle empty response', async () => {
        mockFetch.mockResolvedValue({
          ok: true,
          text: () => Promise.resolve('   ')
        });

        const result = await persistence.loadConfigFile();

        expect(result.success).toBe(false);
        expect(result.error).toBe('Configuration file is empty');
      });

      it('should handle JSON parsing errors', async () => {
        mockFetch.mockResolvedValue({
          ok: true,
          text: () => Promise.resolve('{ invalid json }')
        });

        const result = await persistence.loadConfigFile();

        expect(result.success).toBe(false);
        expect(result.error).toContain('JSON parsing error');
      });
    });

    describe('saveConfigFile', () => {
      it('should return error for browser environment', async () => {
        const testConfig = { ...DEFAULT_CONFIG, version: '2.0.0' };

        const result = await persistence.saveConfigFile(testConfig);

        expect(result.success).toBe(false);
        expect(result.error).toBe('File saving not supported in browser environment');
      });
    });

    describe('configFileExists', () => {
      it('should check file existence via HEAD request', async () => {
        mockFetch.mockResolvedValue({ ok: true });

        const exists = await persistence.configFileExists();

        expect(exists).toBe(true);
        expect(mockFetch).toHaveBeenCalledWith('./test-config.json', { method: 'HEAD' });
      });

      it('should return false for failed HEAD request', async () => {
        mockFetch.mockResolvedValue({ ok: false });

        const exists = await persistence.configFileExists();

        expect(exists).toBe(false);
      });

      it('should handle fetch errors', async () => {
        mockFetch.mockRejectedValue(new Error('Network error'));

        const exists = await persistence.configFileExists();

        expect(exists).toBe(false);
      });
    });

    describe('cleanupBackups', () => {
      it('should return error for browser environment', async () => {
        const result = await persistence.cleanupBackups(5);

        expect(result.cleaned).toBe(0);
        expect(result.error).toBe('Backup cleanup not supported in browser environment');
      });
    });
  });

  describe('Factory Function', () => {
    it('should create persistence instance with custom options', () => {
      const customPersistence = createFilePersistence({
        configPath: './custom-config.json',
        createBackup: false,
        formatJson: false
      });

      expect(customPersistence).toBeInstanceOf(ConfigFilePersistence);
    });

    it('should create persistence instance with default options', () => {
      const defaultPersistence = createFilePersistence();

      expect(defaultPersistence).toBeInstanceOf(ConfigFilePersistence);
    });
  });
});