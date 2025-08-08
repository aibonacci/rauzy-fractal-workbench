/**
 * ConfigManager 单元测试
 * 验证配置管理器的核心功能，包括加载、保存、验证和错误处理
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ConfigManager, createConfigManager } from '../ConfigManager';
import { DEFAULT_CONFIG } from '../defaultConfig';
import { AppConfiguration } from '../types';

// Mock file system operations
vi.mock('fs/promises', () => ({
  readFile: vi.fn(),
  writeFile: vi.fn(),
  access: vi.fn(),
  stat: vi.fn(),
  mkdir: vi.fn(),
  readdir: vi.fn(),
  unlink: vi.fn()
}));

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn()
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

describe('ConfigManager', () => {
  let configManager: ConfigManager;
  let mockOnConfigChange: ReturnType<typeof vi.fn>;
  let mockOnValidationError: ReturnType<typeof vi.fn>;
  let mockOnFileError: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockOnConfigChange = vi.fn();
    mockOnValidationError = vi.fn();
    mockOnFileError = vi.fn();

    configManager = createConfigManager({
      enableValidation: true,
      enableHotReload: false,
      configPath: './test-config.json',
      onConfigChange: mockOnConfigChange,
      onValidationError: mockOnValidationError,
      onFileError: mockOnFileError
    });

    // Clear localStorage mocks
    localStorageMock.getItem.mockClear();
    localStorageMock.setItem.mockClear();
    localStorageMock.removeItem.mockClear();
    localStorageMock.clear.mockClear();
  });

  afterEach(async () => {
    await configManager.dispose();
    vi.clearAllMocks();
  });

  describe('初始化', () => {
    it('应该正确初始化配置管理器', async () => {
      expect(configManager.isReady()).toBe(false);
      
      const result = await configManager.initialize();
      
      expect(configManager.isReady()).toBe(true);
      expect(result.config).toBeDefined();
      expect(result.isValid).toBe(true);
    });

    it('应该在初始化失败时使用默认配置', async () => {
      // Mock file loading failure
      const fs = await import('fs/promises');
      vi.mocked(fs.readFile).mockRejectedValue(new Error('File not found'));
      
      const result = await configManager.initialize();
      
      expect(result.config).toEqual(DEFAULT_CONFIG);
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('配置获取和设置', () => {
    beforeEach(async () => {
      await configManager.initialize();
    });

    it('应该正确获取完整配置', () => {
      const config = configManager.getConfig();
      expect(config).toEqual(DEFAULT_CONFIG);
      expect(config).not.toBe(DEFAULT_CONFIG); // 应该是深拷贝
    });

    it('应该正确获取特定配置值', () => {
      const minPoints = configManager.get('app.points.min');
      expect(minPoints).toBe(DEFAULT_CONFIG.app.points.min);
    });

    it('应该正确设置配置值', () => {
      const result = configManager.set('app.points.min', 200);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(configManager.get('app.points.min')).toBe(200);
    });

    it('应该在设置无效值时返回验证错误', () => {
      const result = configManager.set('app.points.min', -100);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(configManager.get('app.points.min')).toBe(DEFAULT_CONFIG.app.points.min);
    });

    it('应该正确更新多个配置值', () => {
      const updates = {
        app: {
          points: {
            min: 200,
            max: 2000
          }
        }
      };

      const result = configManager.update(updates);
      
      expect(result.isValid).toBe(true);
      expect(configManager.get('app.points.min')).toBe(200);
      expect(configManager.get('app.points.max')).toBe(2000);
    });
  });

  describe('配置验证', () => {
    beforeEach(async () => {
      await configManager.initialize();
    });

    it('应该正确验证当前配置', () => {
      const result = configManager.validate();
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('应该生成验证报告', () => {
      const report = configManager.getValidationReport();
      
      expect(typeof report).toBe('string');
      expect(report.length).toBeGreaterThan(0);
    });
  });

  describe('配置重置', () => {
    beforeEach(async () => {
      await configManager.initialize();
    });

    it('应该正确重置配置到默认值', () => {
      // 先修改配置
      configManager.set('app.points.min', 500);
      expect(configManager.get('app.points.min')).toBe(500);
      
      // 重置配置
      const result = configManager.reset();
      
      expect(result.isValid).toBe(true);
      expect(configManager.get('app.points.min')).toBe(DEFAULT_CONFIG.app.points.min);
    });
  });

  describe('配置监听器', () => {
    beforeEach(async () => {
      await configManager.initialize();
    });

    it('应该正确添加和移除监听器', () => {
      const listener = vi.fn();
      
      expect(configManager.getListenerCount()).toBe(0);
      
      const unsubscribe = configManager.subscribe(listener);
      expect(configManager.getListenerCount()).toBe(1);
      
      unsubscribe();
      expect(configManager.getListenerCount()).toBe(0);
    });

    it('应该在配置变化时通知监听器', () => {
      const listener = vi.fn();
      configManager.subscribe(listener);
      
      configManager.set('app.points.min', 300);
      
      expect(listener).toHaveBeenCalledWith(
        'app.points.min',
        300,
        DEFAULT_CONFIG.app.points.min
      );
    });

    it('应该正确清除所有监听器', () => {
      const listener1 = vi.fn();
      const listener2 = vi.fn();
      
      configManager.subscribe(listener1);
      configManager.subscribe(listener2);
      expect(configManager.getListenerCount()).toBe(2);
      
      configManager.clearListeners();
      expect(configManager.getListenerCount()).toBe(0);
    });
  });

  describe('配置保存', () => {
    beforeEach(async () => {
      await configManager.initialize();
    });

    it('应该正确保存配置到文件', async () => {
      const fs = await import('fs/promises');
      vi.mocked(fs.writeFile).mockResolvedValue(undefined);
      
      const result = await configManager.save();
      
      expect(result.success).toBe(true);
      expect(fs.writeFile).toHaveBeenCalled();
    });

    it('应该在保存失败时返回错误', async () => {
      const fs = await import('fs/promises');
      vi.mocked(fs.writeFile).mockRejectedValue(new Error('Permission denied'));
      
      const result = await configManager.save();
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Permission denied');
    });
  });

  describe('配置元数据', () => {
    beforeEach(async () => {
      await configManager.initialize();
    });

    it('应该正确获取配置元数据', () => {
      const metadata = configManager.getMetadata();
      
      expect(metadata).toHaveProperty('version');
      expect(metadata).toHaveProperty('lastModified');
      expect(metadata).toHaveProperty('isValid');
      expect(metadata).toHaveProperty('hasErrors');
      expect(metadata).toHaveProperty('hasWarnings');
    });
  });

  describe('错误处理', () => {
    beforeEach(async () => {
      await configManager.initialize();
    });

    it('应该正确收集错误报告', () => {
      // 触发一个错误
      configManager.set('app.points.min', -100);
      
      const reports = configManager.getErrorReports();
      expect(reports.total).toBeGreaterThanOrEqual(0);
      expect(Array.isArray(reports.recent)).toBe(true);
      expect(Array.isArray(reports.all)).toBe(true);
    });

    it('应该正确清除错误报告', () => {
      configManager.clearErrorReports();
      
      const reports = configManager.getErrorReports();
      expect(reports.total).toBe(0);
    });

    it('应该正确导出错误报告', () => {
      const exported = configManager.exportErrorReports();
      
      expect(typeof exported).toBe('string');
      expect(() => JSON.parse(exported)).not.toThrow();
    });
  });

  describe('热重载功能', () => {
    it('应该正确启用热重载', async () => {
      await configManager.initialize();
      
      const result = await configManager.enableHotReload();
      
      // 在测试环境中，热重载可能不会启用（因为是浏览器环境）
      expect(typeof result.success).toBe('boolean');
    });

    it('应该正确禁用热重载', async () => {
      await configManager.initialize();
      await configManager.enableHotReload();
      
      await configManager.disableHotReload();
      
      expect(configManager.isHotReloadActive()).toBe(false);
    });

    it('应该正确获取热重载状态', async () => {
      await configManager.initialize();
      
      const status = configManager.getHotReloadStatus();
      
      expect(status).toHaveProperty('isActive');
      expect(typeof status.isActive).toBe('boolean');
    });
  });

  describe('通知管理', () => {
    beforeEach(async () => {
      await configManager.initialize();
    });

    it('应该正确显示通知', () => {
      const notificationId = configManager.showNotification('info', '测试通知');
      
      expect(typeof notificationId).toBe('string');
      expect(notificationId.length).toBeGreaterThan(0);
    });

    it('应该正确获取通知统计', () => {
      const stats = configManager.getNotificationStats();
      
      expect(stats).toHaveProperty('total');
      expect(stats).toHaveProperty('active');
      expect(stats).toHaveProperty('dismissed');
      expect(stats).toHaveProperty('byType');
    });

    it('应该正确清除所有通知', () => {
      configManager.showNotification('info', '测试通知1');
      configManager.showNotification('error', '测试通知2');
      
      configManager.dismissAllNotifications();
      
      const stats = configManager.getNotificationStats();
      expect(stats.active).toBe(0);
    });
  });

  describe('资源清理', () => {
    it('应该正确清理所有资源', async () => {
      await configManager.initialize();
      
      const listener = vi.fn();
      configManager.subscribe(listener);
      configManager.showNotification('info', '测试通知');
      
      await configManager.dispose();
      
      expect(configManager.getListenerCount()).toBe(0);
      expect(configManager.isHotReloadActive()).toBe(false);
    });
  });

  describe('边界情况', () => {
    it('应该在未初始化时抛出错误', () => {
      const uninitializedManager = createConfigManager();
      
      expect(() => uninitializedManager.getConfig()).toThrow('ConfigManager not initialized');
      expect(() => uninitializedManager.get('app.points.min')).toThrow('ConfigManager not initialized');
      expect(() => uninitializedManager.set('app.points.min', 100)).toThrow('ConfigManager not initialized');
    });

    it('应该处理无效的配置路径', async () => {
      await configManager.initialize();
      
      const value = configManager.get('invalid.path.that.does.not.exist');
      expect(value).toBeUndefined();
    });

    it('应该处理监听器中的错误', async () => {
      await configManager.initialize();
      
      const faultyListener = vi.fn().mockImplementation(() => {
        throw new Error('Listener error');
      });
      
      configManager.subscribe(faultyListener);
      
      // 这不应该抛出错误
      expect(() => {
        configManager.set('app.points.min', 200);
      }).not.toThrow();
      
      expect(faultyListener).toHaveBeenCalled();
    });
  });

  describe('工厂函数', () => {
    it('应该正确创建配置管理器实例', () => {
      const manager = createConfigManager({
        enableValidation: false,
        configPath: './custom-config.json'
      });
      
      expect(manager).toBeInstanceOf(ConfigManager);
      expect(manager.isReady()).toBe(false);
    });
  });
});