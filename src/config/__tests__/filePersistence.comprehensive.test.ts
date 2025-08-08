/**
 * 配置文件持久化完整测试
 * 验证文件加载、保存、备份和错误处理的所有场景
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createFilePersistence, ConfigFilePersistence } from '../filePersistence';
import { DEFAULT_CONFIG } from '../defaultConfig';
import { AppConfiguration } from '../types';

// Mock file system operations
const mockFs = {
  readFile: vi.fn(),
  writeFile: vi.fn(),
  access: vi.fn(),
  stat: vi.fn(),
  mkdir: vi.fn(),
  readdir: vi.fn(),
  unlink: vi.fn()
};

vi.mock('fs/promises', () => mockFs);

describe('配置文件持久化完整测试', () => {
  let filePersistence: ConfigFilePersistence;
  const testConfigPath = './test-config.json';
  const testBackupPath = './test-config.json.backup';

  beforeEach(() => {
    filePersistence = createFilePersistence({
      configPath: testConfigPath,
      createBackup: true,
      backupExtension: '.backup',
      formatJson: true,
      jsonIndent: 2
    });

    // Reset all mocks
    vi.clearAllMocks();
  });

  describe('配置文件加载', () => {
    it('应该成功加载有效的配置文件', async () => {
      const mockConfig = { app: { points: { min: 200 } } };
      mockFs.readFile.mockResolvedValue(JSON.stringify(mockConfig));

      const result = await filePersistence.loadConfigFile();

      expect(result.success).toBe(true);
      expect(result.config).toEqual(mockConfig);
      expect(result.error).toBeUndefined();
      expect(mockFs.readFile).toHaveBeenCalledWith(testConfigPath, 'utf-8');
    });

    it('应该在文件不存在时创建默认配置文件', async () => {
      mockFs.readFile.mockRejectedValue({ code: 'ENOENT' });
      mockFs.writeFile.mockResolvedValue(undefined);
      mockFs.mkdir.mockResolvedValue(undefined);

      const result = await filePersistence.loadConfigFile();

      expect(result.success).toBe(true);
      expect(result.config).toEqual(DEFAULT_CONFIG);
      expect(result.isDefaultCreated).toBe(true);
      expect(mockFs.writeFile).toHaveBeenCalled();
    });

    it('应该在JSON解析失败时尝试从备份恢复', async () => {
      const validBackupConfig = { app: { points: { min: 300 } } };
      
      mockFs.readFile
        .mockRejectedValueOnce(new Error('Invalid JSON'))
        .mockResolvedValueOnce(JSON.stringify(validBackupConfig));
      mockFs.access.mockResolvedValue(undefined);

      const result = await filePersistence.loadConfigFile();

      expect(result.success).toBe(true);
      expect(result.config).toEqual(validBackupConfig);
      expect(result.error).toContain('restored from backup');
    });

    it('应该在备份也失败时返回错误', async () => {
      mockFs.readFile.mockRejectedValue(new Error('Invalid JSON'));
      mockFs.access.mockRejectedValue({ code: 'ENOENT' });

      const result = await filePersistence.loadConfigFile();

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid JSON');
    });

    it('应该处理权限错误', async () => {
      mockFs.readFile.mockRejectedValue({ code: 'EACCES' });

      const result = await filePersistence.loadConfigFile();

      expect(result.success).toBe(false);
      expect(result.error).toContain('Permission denied');
    });
  });

  describe('配置文件保存', () => {
    const testConfig: AppConfiguration = {
      ...DEFAULT_CONFIG,
      app: { ...DEFAULT_CONFIG.app, points: { min: 500, max: 5000 } }
    };

    it('应该成功保存配置文件', async () => {
      mockFs.writeFile.mockResolvedValue(undefined);
      mockFs.mkdir.mockResolvedValue(undefined);

      const result = await filePersistence.saveConfigFile(testConfig);

      expect(result.success).toBe(true);
      expect(mockFs.writeFile).toHaveBeenCalledWith(
        testConfigPath,
        expect.stringContaining('"min": 500'),
        'utf-8'
      );
    });

    it('应该在保存前创建备份', async () => {
      mockFs.access.mockResolvedValue(undefined);
      mockFs.readFile.mockResolvedValue(JSON.stringify(DEFAULT_CONFIG));
      mockFs.writeFile.mockResolvedValue(undefined);
      mockFs.mkdir.mockResolvedValue(undefined);

      const result = await filePersistence.saveConfigFile(testConfig);

      expect(result.success).toBe(true);
      expect(result.backupCreated).toBe(true);
      expect(result.backupPath).toBe(testBackupPath);
      expect(mockFs.writeFile).toHaveBeenCalledWith(
        testBackupPath,
        expect.any(String),
        'utf-8'
      );
    });

    it('应该在目录不存在时创建目录', async () => {
      mockFs.writeFile.mockRejectedValueOnce({ code: 'ENOENT' });
      mockFs.mkdir.mockResolvedValue(undefined);
      mockFs.writeFile.mockResolvedValueOnce(undefined);

      const result = await filePersistence.saveConfigFile(testConfig);

      expect(result.success).toBe(true);
      expect(mockFs.mkdir).toHaveBeenCalled();
    });

    it('应该处理保存失败', async () => {
      mockFs.writeFile.mockRejectedValue(new Error('Disk full'));

      const result = await filePersistence.saveConfigFile(testConfig);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Disk full');
    });

    it('应该正确格式化JSON输出', async () => {
      mockFs.writeFile.mockResolvedValue(undefined);
      mockFs.mkdir.mockResolvedValue(undefined);

      await filePersistence.saveConfigFile(testConfig);

      const writeCall = mockFs.writeFile.mock.calls.find(call => 
        call[0] === testConfigPath
      );
      const jsonContent = writeCall[1];

      expect(jsonContent).toContain('\n');
      expect(jsonContent).toContain('  ');
      expect(() => JSON.parse(jsonContent)).not.toThrow();
    });
  });

  describe('配置文件元数据', () => {
    it('应该正确检查文件是否存在', async () => {
      mockFs.access.mockResolvedValue(undefined);

      const exists = await filePersistence.configFileExists();

      expect(exists).toBe(true);
      expect(mockFs.access).toHaveBeenCalledWith(testConfigPath);
    });

    it('应该在文件不存在时返回false', async () => {
      mockFs.access.mockRejectedValue({ code: 'ENOENT' });

      const exists = await filePersistence.configFileExists();

      expect(exists).toBe(false);
    });

    it('应该正确获取文件元数据', async () => {
      const mockStats = {
        size: 1024,
        mtime: new Date('2023-01-01'),
        isFile: () => true
      };
      
      mockFs.access.mockResolvedValue(undefined);
      mockFs.stat.mockResolvedValue(mockStats);

      const metadata = await filePersistence.getConfigFileMetadata();

      expect(metadata.exists).toBe(true);
      expect(metadata.size).toBe(1024);
      expect(metadata.lastModified).toEqual(new Date('2023-01-01'));
      expect(metadata.isReadable).toBe(true);
      expect(metadata.isWritable).toBe(true);
    });

    it('应该处理文件不存在的元数据请求', async () => {
      mockFs.access.mockRejectedValue({ code: 'ENOENT' });

      const metadata = await filePersistence.getConfigFileMetadata();

      expect(metadata.exists).toBe(false);
      expect(metadata.size).toBeUndefined();
      expect(metadata.lastModified).toBeUndefined();
    });
  });

  describe('备份管理', () => {
    it('应该正确清理旧备份文件', async () => {
      const backupFiles = [
        'config.json.backup.1',
        'config.json.backup.2',
        'config.json.backup.3',
        'config.json.backup.4',
        'config.json.backup.5',
        'config.json.backup.6'
      ];

      mockFs.readdir.mockResolvedValue(backupFiles);
      mockFs.unlink.mockResolvedValue(undefined);

      const result = await filePersistence.cleanupBackups(3);

      expect(result.cleaned).toBe(3);
      expect(mockFs.unlink).toHaveBeenCalledTimes(3);
    });

    it('应该在没有多余备份时不删除文件', async () => {
      const backupFiles = ['config.json.backup.1', 'config.json.backup.2'];

      mockFs.readdir.mockResolvedValue(backupFiles);

      const result = await filePersistence.cleanupBackups(5);

      expect(result.cleaned).toBe(0);
      expect(mockFs.unlink).not.toHaveBeenCalled();
    });

    it('应该处理备份清理错误', async () => {
      mockFs.readdir.mockRejectedValue(new Error('Permission denied'));

      const result = await filePersistence.cleanupBackups(3);

      expect(result.cleaned).toBe(0);
      expect(result.error).toContain('Permission denied');
    });
  });

  describe('默认配置文件创建', () => {
    it('应该成功创建默认配置文件', async () => {
      mockFs.writeFile.mockResolvedValue(undefined);
      mockFs.mkdir.mockResolvedValue(undefined);

      const result = await filePersistence.createDefaultConfigFile();

      expect(result.success).toBe(true);
      expect(mockFs.writeFile).toHaveBeenCalledWith(
        testConfigPath,
        expect.stringContaining('"version"'),
        'utf-8'
      );
    });

    it('应该在创建默认文件时处理目录创建', async () => {
      mockFs.writeFile.mockRejectedValueOnce({ code: 'ENOENT' });
      mockFs.mkdir.mockResolvedValue(undefined);
      mockFs.writeFile.mockResolvedValueOnce(undefined);

      const result = await filePersistence.createDefaultConfigFile();

      expect(result.success).toBe(true);
      expect(mockFs.mkdir).toHaveBeenCalled();
    });
  });

  describe('错误处理和边界情况', () => {
    it('应该处理空配置文件', async () => {
      mockFs.readFile.mockResolvedValue('');

      const result = await filePersistence.loadConfigFile();

      expect(result.success).toBe(false);
      expect(result.error).toContain('empty');
    });

    it('应该处理格式错误的JSON', async () => {
      mockFs.readFile.mockResolvedValue('{ invalid json }');
      mockFs.access.mockRejectedValue({ code: 'ENOENT' }); // 没有备份

      const result = await filePersistence.loadConfigFile();

      expect(result.success).toBe(false);
      expect(result.error).toContain('JSON');
    });

    it('应该处理非常大的配置文件', async () => {
      const largeConfig = {
        ...DEFAULT_CONFIG,
        largeData: new Array(10000).fill(0).map((_, i) => ({ id: i, data: `item${i}` }))
      };

      mockFs.writeFile.mockResolvedValue(undefined);
      mockFs.mkdir.mockResolvedValue(undefined);

      const result = await filePersistence.saveConfigFile(largeConfig as any);

      expect(result.success).toBe(true);
    });

    it('应该处理特殊字符和Unicode', async () => {
      const unicodeConfig = {
        ...DEFAULT_CONFIG,
        unicode: {
          chinese: '中文测试',
          emoji: '🚀🎉',
          special: 'Special chars: !@#$%^&*()'
        }
      };

      mockFs.writeFile.mockResolvedValue(undefined);
      mockFs.mkdir.mockResolvedValue(undefined);

      const result = await filePersistence.saveConfigFile(unicodeConfig as any);

      expect(result.success).toBe(true);

      const writeCall = mockFs.writeFile.mock.calls.find(call => 
        call[0] === testConfigPath
      );
      const jsonContent = writeCall[1];
      const parsed = JSON.parse(jsonContent);

      expect(parsed.unicode.chinese).toBe('中文测试');
      expect(parsed.unicode.emoji).toBe('🚀🎉');
    });

    it('应该处理并发访问', async () => {
      mockFs.writeFile.mockResolvedValue(undefined);
      mockFs.mkdir.mockResolvedValue(undefined);

      const promises = Array.from({ length: 10 }, (_, i) => 
        filePersistence.saveConfigFile({
          ...DEFAULT_CONFIG,
          concurrent: { id: i }
        } as any)
      );

      const results = await Promise.all(promises);

      expect(results.every(r => r.success)).toBe(true);
      expect(mockFs.writeFile).toHaveBeenCalledTimes(10);
    });
  });

  describe('配置选项', () => {
    it('应该支持禁用备份', async () => {
      const noBacupPersistence = createFilePersistence({
        configPath: testConfigPath,
        createBackup: false
      });

      mockFs.writeFile.mockResolvedValue(undefined);
      mockFs.mkdir.mockResolvedValue(undefined);

      const result = await noBacupPersistence.saveConfigFile(DEFAULT_CONFIG);

      expect(result.success).toBe(true);
      expect(result.backupCreated).toBe(false);
      expect(mockFs.writeFile).toHaveBeenCalledTimes(1); // 只保存主文件
    });

    it('应该支持自定义备份扩展名', async () => {
      const customBackupPersistence = createFilePersistence({
        configPath: testConfigPath,
        createBackup: true,
        backupExtension: '.bak'
      });

      mockFs.access.mockResolvedValue(undefined);
      mockFs.readFile.mockResolvedValue(JSON.stringify(DEFAULT_CONFIG));
      mockFs.writeFile.mockResolvedValue(undefined);
      mockFs.mkdir.mockResolvedValue(undefined);

      const result = await customBackupPersistence.saveConfigFile(DEFAULT_CONFIG);

      expect(result.success).toBe(true);
      expect(result.backupPath).toBe('./test-config.json.bak');
    });

    it('应该支持压缩JSON格式', async () => {
      const compactPersistence = createFilePersistence({
        configPath: testConfigPath,
        formatJson: false
      });

      mockFs.writeFile.mockResolvedValue(undefined);
      mockFs.mkdir.mockResolvedValue(undefined);

      await compactPersistence.saveConfigFile(DEFAULT_CONFIG);

      const writeCall = mockFs.writeFile.mock.calls.find(call => 
        call[0] === testConfigPath
      );
      const jsonContent = writeCall[1];

      expect(jsonContent).not.toContain('\n');
      expect(jsonContent).not.toContain('  ');
    });

    it('应该支持自定义JSON缩进', async () => {
      const customIndentPersistence = createFilePersistence({
        configPath: testConfigPath,
        formatJson: true,
        jsonIndent: 4
      });

      mockFs.writeFile.mockResolvedValue(undefined);
      mockFs.mkdir.mockResolvedValue(undefined);

      await customIndentPersistence.saveConfigFile(DEFAULT_CONFIG);

      const writeCall = mockFs.writeFile.mock.calls.find(call => 
        call[0] === testConfigPath
      );
      const jsonContent = writeCall[1];

      expect(jsonContent).toContain('    '); // 4个空格缩进
    });
  });
});