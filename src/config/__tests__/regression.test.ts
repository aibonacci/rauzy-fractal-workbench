/**
 * 配置系统回归测试
 * 确保配置系统的所有功能在迁移后正常工作
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createConfigManager } from '../ConfigManager';
import { DEFAULT_CONFIG } from '../defaultConfig';
import { getTestId, getAllTestIds } from '../utils';

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

describe('配置系统回归测试', () => {
  let configManager: ReturnType<typeof createConfigManager>;

  beforeEach(() => {
    configManager = createConfigManager({
      enableValidation: true,
      enableHotReload: false
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

  describe('应用配置回归测试', () => {
    it('应该正确提供所有应用配置值', async () => {
      const fs = await import('fs/promises');
      vi.mocked(fs.readFile).mockResolvedValue(JSON.stringify(DEFAULT_CONFIG));

      await configManager.initialize();

      // 验证点数配置
      expect(configManager.get('app.points.min')).toBe(100);
      expect(configManager.get('app.points.max')).toBe(1000000);
      expect(configManager.get('app.points.default')).toBe(100000);
      expect(configManager.get('app.points.step')).toBe(1000);

      // 验证路径配置
      expect(configManager.get('app.paths.maxCount')).toBe(50);
      expect(configManager.get('app.paths.maxLength')).toBe(20);

      // 验证画布配置
      expect(configManager.get('app.canvas.width')).toBe(800);
      expect(configManager.get('app.canvas.height')).toBe(600);
      expect(configManager.get('app.canvas.backgroundColor')).toBe('#1f2937');
    });

    it('应该正确验证应用配置范围', async () => {
      const fs = await import('fs/promises');
      vi.mocked(fs.readFile).mockResolvedValue(JSON.stringify(DEFAULT_CONFIG));

      await configManager.initialize();

      // 测试有效值
      const validResult = configManager.set('app.points.min', 500);
      expect(validResult.isValid).toBe(true);

      // 测试无效值（负数）
      const invalidResult = configManager.set('app.points.min', -100);
      expect(invalidResult.isValid).toBe(false);
      expect(invalidResult.errors.length).toBeGreaterThan(0);
    });
  });

  describe('UI配置回归测试', () => {
    it('应该正确提供所有UI配置值', async () => {
      const fs = await import('fs/promises');
      vi.mocked(fs.readFile).mockResolvedValue(JSON.stringify(DEFAULT_CONFIG));

      await configManager.initialize();

      // 验证主题配置
      expect(configManager.get('ui.theme')).toBe('dark');

      // 验证颜色配置
      expect(configManager.get('ui.colors.primary')).toBe('#3b82f6');
      expect(configManager.get('ui.colors.secondary')).toBe('#10b981');
      expect(configManager.get('ui.colors.accent')).toBe('#f59e0b');
      expect(configManager.get('ui.colors.background')).toBe('#111827');
      expect(configManager.get('ui.colors.surface')).toBe('#1f2937');
      expect(configManager.get('ui.colors.text')).toBe('#f9fafb');

      // 验证动画配置
      expect(configManager.get('ui.animations.enabled')).toBe(true);
      expect(configManager.get('ui.animations.duration')).toBe(300);
      expect(configManager.get('ui.animations.easing')).toBe('ease-in-out');

      // 验证通知配置
      expect(configManager.get('ui.notifications.enabled')).toBe(true);
      expect(configManager.get('ui.notifications.position')).toBe('top-right');
      expect(configManager.get('ui.notifications.defaultDuration')).toBe(5000);
    });

    it('应该正确处理主题切换', async () => {
      const fs = await import('fs/promises');
      vi.mocked(fs.readFile).mockResolvedValue(JSON.stringify(DEFAULT_CONFIG));

      await configManager.initialize();

      // 切换到浅色主题
      const result = configManager.set('ui.theme', 'light');
      expect(result.isValid).toBe(true);
      expect(configManager.get('ui.theme')).toBe('light');

      // 切换回深色主题
      const result2 = configManager.set('ui.theme', 'dark');
      expect(result2.isValid).toBe(true);
      expect(configManager.get('ui.theme')).toBe('dark');
    });

    it('应该正确验证颜色值格式', async () => {
      const fs = await import('fs/promises');
      vi.mocked(fs.readFile).mockResolvedValue(JSON.stringify(DEFAULT_CONFIG));

      await configManager.initialize();

      // 测试有效颜色值
      const validResult = configManager.set('ui.colors.primary', '#ff0000');
      expect(validResult.isValid).toBe(true);

      // 测试无效颜色值
      const invalidResult = configManager.set('ui.colors.primary', 'invalid-color');
      expect(invalidResult.isValid).toBe(false);
    });
  });

  describe('性能配置回归测试', () => {
    it('应该正确提供所有性能配置值', async () => {
      const fs = await import('fs/promises');
      vi.mocked(fs.readFile).mockResolvedValue(JSON.stringify(DEFAULT_CONFIG));

      await configManager.initialize();

      // 验证缓存配置
      expect(configManager.get('performance.cache.enabled')).toBe(true);
      expect(configManager.get('performance.cache.maxSize')).toBe(1000);
      expect(configManager.get('performance.cache.ttl')).toBe(300000);

      // 验证渲染配置
      expect(configManager.get('performance.rendering.webgl.enabled')).toBe(true);
      expect(configManager.get('performance.rendering.webgl.antialias')).toBe(true);
      expect(configManager.get('performance.rendering.canvas.width')).toBe(800);
      expect(configManager.get('performance.rendering.canvas.height')).toBe(600);

      // 验证计算配置
      expect(configManager.get('performance.computation.maxWorkers')).toBe(4);
      expect(configManager.get('performance.computation.chunkSize')).toBe(10000);
      expect(configManager.get('performance.computation.timeout')).toBe(30000);
    });

    it('应该正确处理性能配置更新', async () => {
      const fs = await import('fs/promises');
      vi.mocked(fs.readFile).mockResolvedValue(JSON.stringify(DEFAULT_CONFIG));

      await configManager.initialize();

      // 更新缓存配置
      const result = configManager.update({
        performance: {
          cache: {
            enabled: false,
            maxSize: 500,
            ttl: 600000
          }
        }
      });

      expect(result.isValid).toBe(true);
      expect(configManager.get('performance.cache.enabled')).toBe(false);
      expect(configManager.get('performance.cache.maxSize')).toBe(500);
      expect(configManager.get('performance.cache.ttl')).toBe(600000);
    });
  });

  describe('开发配置回归测试', () => {
    it('应该正确提供所有开发配置值', async () => {
      const fs = await import('fs/promises');
      vi.mocked(fs.readFile).mockResolvedValue(JSON.stringify(DEFAULT_CONFIG));

      await configManager.initialize();

      // 验证调试配置
      expect(configManager.get('development.debug.enabled')).toBe(false);
      expect(configManager.get('development.debug.logLevel')).toBe('warn');
      expect(configManager.get('development.debug.showPerformanceMetrics')).toBe(false);

      // 验证功能开关
      expect(configManager.get('development.features.hotReload')).toBe(true);
      expect(configManager.get('development.features.typeChecking')).toBe(true);
      expect(configManager.get('development.features.configValidation')).toBe(true);

      // 验证语言配置
      expect(configManager.get('development.language.defaultLanguage')).toBe('en');
      expect(configManager.get('development.language.storageKey')).toBe('rauzy-language');
      expect(configManager.get('development.language.supportedLanguages')).toEqual(['en', 'zh']);
    });

    it('应该正确提供所有测试ID', async () => {
      const fs = await import('fs/promises');
      vi.mocked(fs.readFile).mockResolvedValue(JSON.stringify(DEFAULT_CONFIG));

      await configManager.initialize();
      const config = configManager.getConfig();

      // 验证关键测试ID
      expect(getTestId(config, 'PATH_INPUT')).toBe('path-input');
      expect(getTestId(config, 'ADD_PATH_BUTTON')).toBe('add-path-button');
      expect(getTestId(config, 'PATH_LIST')).toBe('path-list');
      expect(getTestId(config, 'FRACTAL_CANVAS')).toBe('fractal-canvas');
      expect(getTestId(config, 'DATA_PANEL')).toBe('data-panel');

      // 验证所有测试ID都存在
      const allTestIds = getAllTestIds(config);
      const expectedTestIds = [
        'PATH_INPUT', 'ADD_PATH_BUTTON', 'PATH_LIST', 'PATH_ITEM',
        'DELETE_PATH_BUTTON', 'POINTS_SLIDER', 'FRACTAL_CANVAS',
        'DATA_PANEL', 'PATH_DATA_CARD', 'LOADING_INDICATOR',
        'LANGUAGE_TOGGLE', 'EXTERNAL_LINKS', 'PROGRESS_INDICATOR',
        'NOTIFICATION_SYSTEM', 'AXIS_CONTROL_PANEL', 'NUMBER_PARTITION_GENERATOR'
      ];

      expectedTestIds.forEach(testId => {
        expect(allTestIds).toHaveProperty(testId);
        expect(typeof allTestIds[testId]).toBe('string');
        expect(allTestIds[testId].length).toBeGreaterThan(0);
      });
    });
  });

  describe('配置持久化回归测试', () => {
    it('应该正确保存和加载配置', async () => {
      const fs = await import('fs/promises');
      let savedConfig: any = null;

      // Mock file operations
      vi.mocked(fs.readFile).mockImplementation(async () => {
        if (savedConfig) {
          return JSON.stringify(savedConfig);
        }
        return JSON.stringify(DEFAULT_CONFIG);
      });

      vi.mocked(fs.writeFile).mockImplementation(async (path, data) => {
        savedConfig = JSON.parse(data as string);
        return undefined;
      });

      vi.mocked(fs.access).mockResolvedValue(undefined);
      vi.mocked(fs.mkdir).mockResolvedValue(undefined);

      await configManager.initialize();

      // 修改配置
      configManager.set('app.points.min', 200);
      configManager.set('ui.theme', 'light');

      // 保存配置
      const saveResult = await configManager.save();
      expect(saveResult.success).toBe(true);

      // 创建新的配置管理器并加载
      const newConfigManager = createConfigManager();
      await newConfigManager.initialize();

      // 验证配置已正确保存和加载
      expect(newConfigManager.get('app.points.min')).toBe(200);
      expect(newConfigManager.get('ui.theme')).toBe('light');

      await newConfigManager.dispose();
    });

    it('应该正确处理配置文件不存在的情况', async () => {
      const fs = await import('fs/promises');
      
      // Mock file not found
      vi.mocked(fs.readFile).mockRejectedValue({ code: 'ENOENT' });
      vi.mocked(fs.writeFile).mockResolvedValue(undefined);
      vi.mocked(fs.mkdir).mockResolvedValue(undefined);

      const result = await configManager.initialize();

      // 应该创建默认配置
      expect(result.isDefaultCreated).toBe(true);
      expect(result.config).toEqual(DEFAULT_CONFIG);
      expect(configManager.get('app.points.min')).toBe(DEFAULT_CONFIG.app.points.min);
    });
  });

  describe('配置验证回归测试', () => {
    it('应该正确验证所有配置项', async () => {
      const fs = await import('fs/promises');
      vi.mocked(fs.readFile).mockResolvedValue(JSON.stringify(DEFAULT_CONFIG));

      await configManager.initialize();

      // 验证默认配置
      const validationResult = configManager.validate();
      expect(validationResult.isValid).toBe(true);
      expect(validationResult.errors).toHaveLength(0);

      // 测试无效配置
      const invalidResult = configManager.set('app.points.min', -100);
      expect(invalidResult.isValid).toBe(false);
      expect(invalidResult.errors.length).toBeGreaterThan(0);
    });

    it('应该生成正确的验证报告', async () => {
      const fs = await import('fs/promises');
      vi.mocked(fs.readFile).mockResolvedValue(JSON.stringify(DEFAULT_CONFIG));

      await configManager.initialize();

      const report = configManager.getValidationReport();
      expect(typeof report).toBe('string');
      expect(report.length).toBeGreaterThan(0);
      expect(report).toContain('配置验证');
    });
  });

  describe('配置监听回归测试', () => {
    it('应该正确触发配置变化监听', async () => {
      const fs = await import('fs/promises');
      vi.mocked(fs.readFile).mockResolvedValue(JSON.stringify(DEFAULT_CONFIG));

      await configManager.initialize();

      const mockListener = vi.fn();
      const unsubscribe = configManager.subscribe(mockListener);

      // 触发配置变化
      configManager.set('app.points.min', 200);

      expect(mockListener).toHaveBeenCalledWith(
        'app.points.min',
        200,
        DEFAULT_CONFIG.app.points.min
      );

      unsubscribe();
    });

    it('应该正确管理监听器生命周期', async () => {
      const fs = await import('fs/promises');
      vi.mocked(fs.readFile).mockResolvedValue(JSON.stringify(DEFAULT_CONFIG));

      await configManager.initialize();

      const mockListener = vi.fn();
      
      // 添加监听器
      expect(configManager.getListenerCount()).toBe(0);
      const unsubscribe = configManager.subscribe(mockListener);
      expect(configManager.getListenerCount()).toBe(1);

      // 移除监听器
      unsubscribe();
      expect(configManager.getListenerCount()).toBe(0);

      // 验证监听器已移除
      configManager.set('app.points.min', 300);
      expect(mockListener).not.toHaveBeenCalled();
    });
  });

  describe('错误处理回归测试', () => {
    it('应该正确处理配置加载错误', async () => {
      const fs = await import('fs/promises');
      vi.mocked(fs.readFile).mockRejectedValue(new Error('File read error'));

      const result = await configManager.initialize();

      // 应该使用默认配置
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.config).toEqual(DEFAULT_CONFIG);
    });

    it('应该正确收集错误报告', async () => {
      const fs = await import('fs/promises');
      vi.mocked(fs.readFile).mockRejectedValue(new Error('Test error'));

      await configManager.initialize();

      const errorReports = configManager.getErrorReports();
      expect(errorReports.total).toBeGreaterThan(0);
      expect(Array.isArray(errorReports.all)).toBe(true);
      expect(Array.isArray(errorReports.recent)).toBe(true);
    });
  });

  describe('元数据回归测试', () => {
    it('应该正确提供配置元数据', async () => {
      const fs = await import('fs/promises');
      vi.mocked(fs.readFile).mockResolvedValue(JSON.stringify(DEFAULT_CONFIG));

      await configManager.initialize();

      const metadata = configManager.getMetadata();
      expect(metadata).toHaveProperty('version');
      expect(metadata).toHaveProperty('lastModified');
      expect(metadata).toHaveProperty('isValid');
      expect(metadata).toHaveProperty('hasErrors');
      expect(metadata).toHaveProperty('hasWarnings');

      expect(typeof metadata.version).toBe('string');
      expect(typeof metadata.lastModified).toBe('string');
      expect(typeof metadata.isValid).toBe('boolean');
      expect(typeof metadata.hasErrors).toBe('boolean');
      expect(typeof metadata.hasWarnings).toBe('boolean');
    });

    it('应该正确报告初始化状态', async () => {
      const fs = await import('fs/promises');
      vi.mocked(fs.readFile).mockResolvedValue(JSON.stringify(DEFAULT_CONFIG));

      // 初始化前
      expect(configManager.isReady()).toBe(false);

      // 初始化后
      await configManager.initialize();
      expect(configManager.isReady()).toBe(true);
    });
  });

  describe('资源清理回归测试', () => {
    it('应该正确清理所有资源', async () => {
      const fs = await import('fs/promises');
      vi.mocked(fs.readFile).mockResolvedValue(JSON.stringify(DEFAULT_CONFIG));

      await configManager.initialize();

      // 添加监听器
      const mockListener = vi.fn();
      configManager.subscribe(mockListener);
      expect(configManager.getListenerCount()).toBe(1);

      // 清理资源
      await configManager.dispose();

      // 验证资源已清理
      expect(configManager.getListenerCount()).toBe(0);
    });
  });
});