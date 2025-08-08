/**
 * 配置系统最终验证测试
 * 验证整个配置系统的完整性、性能和稳定性
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createConfigManager } from '../ConfigManager';
import { DEFAULT_CONFIG } from '../defaultConfig';
import { validateConfig } from '../validation';
import { 
  getConfigValue, 
  setConfigValue, 
  mergeConfig, 
  deepClone,
  exportConfigToJson,
  importConfigFromJson
} from '../utils';
import { createPerformanceOptimizer, PerformanceAnalyzer } from '../performanceOptimization';
import { ConfigError, ConfigErrorType } from '../errorHandling';

// Mock file system operations
const mockFs = {
  readFile: vi.fn(),
  writeFile: vi.fn(),
  access: vi.fn(),
  stat: vi.fn(),
  mkdir: vi.fn(),
  readdir: vi.fn(),
  unlink: vi.fn(),
  watch: vi.fn()
};

vi.mock('fs/promises', () => mockFs);
vi.mock('fs', () => ({ watch: mockFs.watch }));

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

describe('配置系统最终验证测试', () => {
  let configManager: ReturnType<typeof createConfigManager>;

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Setup default mock responses
    mockFs.readFile.mockResolvedValue(JSON.stringify(DEFAULT_CONFIG));
    mockFs.writeFile.mockResolvedValue(undefined);
    mockFs.access.mockResolvedValue(undefined);
    mockFs.stat.mockResolvedValue({
      size: 1024,
      mtime: new Date(),
      isFile: () => true,
      isDirectory: () => false
    });
    mockFs.mkdir.mockResolvedValue(undefined);
    mockFs.readdir.mockResolvedValue([]);
    mockFs.unlink.mockResolvedValue(undefined);
    mockFs.watch.mockReturnValue({
      close: vi.fn(),
      on: vi.fn()
    });

    localStorageMock.getItem.mockReturnValue(null);
    localStorageMock.setItem.mockReturnValue(undefined);
    localStorageMock.removeItem.mockReturnValue(undefined);
    localStorageMock.clear.mockReturnValue(undefined);

    configManager = createConfigManager({
      enableValidation: true,
      enableHotReload: false,
      configPath: './test-config.json'
    });
  });

  afterEach(async () => {
    if (configManager) {
      await configManager.dispose();
    }
  });

  describe('系统完整性验证', () => {
    it('应该成功初始化配置系统', async () => {
      const result = await configManager.initialize();
      
      expect(result.isValid).toBe(true);
      expect(result.config).toBeDefined();
      expect(result.errors).toHaveLength(0);
      expect(result.config.version).toBe('1.0.0');
    });

    it('应该包含所有必需的配置项', async () => {
      await configManager.initialize();
      const config = configManager.getConfig();

      // 验证应用配置
      expect(config.app).toBeDefined();
      expect(config.app.points).toBeDefined();
      expect(config.app.points.min).toBe(100);
      expect(config.app.points.max).toBe(1000000);
      expect(config.app.points.default).toBe(100000);

      // 验证UI配置
      expect(config.ui).toBeDefined();
      expect(config.ui.theme).toBe('dark');
      expect(config.ui.colors).toBeDefined();
      expect(config.ui.colors.primary).toBe('#3b82f6');

      // 验证性能配置
      expect(config.performance).toBeDefined();
      expect(config.performance.cache).toBeDefined();
      expect(config.performance.cache.enabled).toBe(true);

      // 验证开发配置
      expect(config.development).toBeDefined();
      expect(config.development.debug).toBeDefined();
      expect(config.development.debug.enabled).toBe(false);
    });

    it('应该正确验证配置结构', async () => {
      await configManager.initialize();
      const config = configManager.getConfig();
      
      const validationResult = validateConfig(config);
      expect(validationResult.isValid).toBe(true);
      expect(validationResult.errors).toHaveLength(0);
    });

    it('应该支持所有配置路径访问', async () => {
      await configManager.initialize();

      // 测试所有主要配置路径
      const testPaths = [
        'app.points.min',
        'app.points.max',
        'app.points.default',
        'ui.theme',
        'ui.colors.primary',
        'ui.colors.background',
        'performance.cache.enabled',
        'performance.cache.maxSize',
        'development.debug.enabled',
        'development.debug.logLevel'
      ];

      testPaths.forEach(path => {
        const value = configManager.get(path);
        expect(value).toBeDefined();
      });
    });
  });

  describe('功能完整性验证', () => {
    it('应该支持配置的读取和写入', async () => {
      await configManager.initialize();

      // 读取配置
      const originalTheme = configManager.get('ui.theme');
      expect(originalTheme).toBe('dark');

      // 写入配置
      const updateResult = configManager.set('ui.theme', 'light');
      expect(updateResult.isValid).toBe(true);

      // 验证更新
      const newTheme = configManager.get('ui.theme');
      expect(newTheme).toBe('light');
    });

    it('应该支持批量配置更新', async () => {
      await configManager.initialize();

      const updates = {
        ui: { theme: 'light' },
        app: { points: { min: 200, max: 500000 } },
        performance: { cache: { enabled: false } }
      };

      const result = configManager.update(updates);
      expect(result.isValid).toBe(true);

      // 验证更新结果
      expect(configManager.get('ui.theme')).toBe('light');
      expect(configManager.get('app.points.min')).toBe(200);
      expect(configManager.get('app.points.max')).toBe(500000);
      expect(configManager.get('performance.cache.enabled')).toBe(false);
    });

    it('应该支持配置重置', async () => {
      await configManager.initialize();

      // 修改配置
      configManager.set('ui.theme', 'light');
      configManager.set('app.points.min', 500);

      // 重置配置
      const resetResult = configManager.reset();
      expect(resetResult.isValid).toBe(true);

      // 验证重置结果
      expect(configManager.get('ui.theme')).toBe('dark');
      expect(configManager.get('app.points.min')).toBe(100);
    });

    it('应该支持配置保存和加载', async () => {
      await configManager.initialize();

      // 修改配置
      configManager.set('ui.theme', 'light');
      configManager.set('app.points.min', 300);

      // 保存配置
      const saveResult = await configManager.save();
      expect(saveResult.success).toBe(true);
      expect(mockFs.writeFile).toHaveBeenCalled();

      // 验证保存的内容
      const savedContent = mockFs.writeFile.mock.calls[0][1];
      const savedConfig = JSON.parse(savedContent);
      expect(savedConfig.ui.theme).toBe('light');
      expect(savedConfig.app.points.min).toBe(300);
    });

    it('应该支持配置变化监听', async () => {
      await configManager.initialize();

      let changeCount = 0;
      let lastChange: any = null;

      const unsubscribe = configManager.subscribe((path, newValue, oldValue) => {
        changeCount++;
        lastChange = { path, newValue, oldValue };
      });

      // 触发配置变化
      configManager.set('ui.theme', 'light');

      expect(changeCount).toBe(1);
      expect(lastChange.path).toBe('ui.theme');
      expect(lastChange.newValue).toBe('light');
      expect(lastChange.oldValue).toBe('dark');

      unsubscribe();
    });
  });

  describe('错误处理验证', () => {
    it('应该处理无效配置值', async () => {
      await configManager.initialize();

      // 尝试设置无效的点数值
      const result = configManager.set('app.points.min', -100);
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);

      // 配置应该保持原值
      expect(configManager.get('app.points.min')).toBe(100);
    });

    it('应该处理类型错误', async () => {
      await configManager.initialize();

      // 尝试设置错误类型的值
      const result = configManager.set('app.points.min', 'invalid');
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('应该处理文件操作错误', async () => {
      mockFs.readFile.mockRejectedValue(new Error('文件读取失败'));

      const errorConfigManager = createConfigManager({
        enableValidation: true,
        configPath: './error-config.json'
      });

      const result = await errorConfigManager.initialize();
      
      // 应该使用默认配置
      expect(result.config).toBeDefined();
      expect(result.config.version).toBe('1.0.0');

      await errorConfigManager.dispose();
    });

    it('应该处理保存错误', async () => {
      await configManager.initialize();
      mockFs.writeFile.mockRejectedValue(new Error('文件写入失败'));

      const saveResult = await configManager.save();
      expect(saveResult.success).toBe(false);
      expect(saveResult.error).toBeDefined();
    });
  });

  describe('性能验证', () => {
    it('应该在合理时间内完成配置访问', async () => {
      await configManager.initialize();

      const iterations = 1000;
      const startTime = performance.now();

      for (let i = 0; i < iterations; i++) {
        configManager.get('ui.theme');
        configManager.get('app.points.min');
        configManager.get('performance.cache.enabled');
      }

      const endTime = performance.now();
      const duration = endTime - startTime;
      const avgTime = duration / iterations;

      // 期望平均访问时间小于0.1ms
      expect(avgTime).toBeLessThan(0.1);
    });

    it('应该在合理时间内完成配置更新', async () => {
      await configManager.initialize();

      const iterations = 100;
      const startTime = performance.now();

      for (let i = 0; i < iterations; i++) {
        configManager.set('app.points.min', 100 + i);
      }

      const endTime = performance.now();
      const duration = endTime - startTime;
      const avgTime = duration / iterations;

      // 期望平均更新时间小于5ms
      expect(avgTime).toBeLessThan(5);
    });

    it('应该正确处理大量并发操作', async () => {
      await configManager.initialize();

      const promises = Array.from({ length: 50 }, async (_, i) => {
        configManager.set('app.points.min', 100 + i);
        return configManager.get('app.points.min');
      });

      const results = await Promise.all(promises);
      expect(results).toHaveLength(50);
      
      // 最终值应该是有效的
      const finalValue = configManager.get('app.points.min');
      expect(finalValue).toBeGreaterThanOrEqual(100);
      expect(finalValue).toBeLessThanOrEqual(149);
    });

    it('应该有效管理内存使用', async () => {
      await configManager.initialize();

      const initialMemory = (performance as any).memory?.usedJSHeapSize || 0;

      // 执行大量操作
      for (let i = 0; i < 1000; i++) {
        const config = configManager.getConfig();
        const cloned = deepClone(config);
        const updated = setConfigValue(cloned, 'app.points.min', 100 + i);
        validateConfig(updated);
      }

      // 强制垃圾回收（如果可用）
      if (global.gc) {
        global.gc();
      }

      const finalMemory = (performance as any).memory?.usedJSHeapSize || 0;
      const memoryIncrease = finalMemory - initialMemory;

      // 期望内存增长小于5MB
      expect(memoryIncrease).toBeLessThan(5 * 1024 * 1024);
    });
  });

  describe('工具函数验证', () => {
    it('应该正确处理配置路径访问', async () => {
      await configManager.initialize();
      const config = configManager.getConfig();

      // 测试深度路径访问
      expect(getConfigValue(config, 'app.points.min')).toBe(100);
      expect(getConfigValue(config, 'ui.colors.primary')).toBe('#3b82f6');
      expect(getConfigValue(config, 'performance.cache.enabled')).toBe(true);

      // 测试不存在的路径
      expect(getConfigValue(config, 'nonexistent.path')).toBeUndefined();
    });

    it('应该正确处理配置值设置', async () => {
      await configManager.initialize();
      const config = configManager.getConfig();

      const updatedConfig = setConfigValue(config, 'ui.theme', 'light');
      expect(getConfigValue(updatedConfig, 'ui.theme')).toBe('light');
      
      // 原配置应该保持不变
      expect(getConfigValue(config, 'ui.theme')).toBe('dark');
    });

    it('应该正确合并配置', async () => {
      await configManager.initialize();
      const baseConfig = configManager.getConfig();

      const overrideConfig = {
        ui: { theme: 'light' as const },
        app: { points: { min: 200 } }
      };

      const mergedConfig = mergeConfig(baseConfig, overrideConfig);
      
      expect(mergedConfig.ui.theme).toBe('light');
      expect(mergedConfig.app.points.min).toBe(200);
      expect(mergedConfig.app.points.max).toBe(1000000); // 保持原值
    });

    it('应该正确处理配置序列化', async () => {
      await configManager.initialize();
      const config = configManager.getConfig();

      // 导出配置
      const jsonString = exportConfigToJson(config, true);
      expect(jsonString).toContain('"version": "1.0.0"');
      expect(jsonString).toContain('"theme": "dark"');

      // 导入配置
      const importedConfig = importConfigFromJson(jsonString);
      expect(importedConfig.version).toBe('1.0.0');
      expect(importedConfig.ui?.theme).toBe('dark');
    });
  });

  describe('性能优化验证', () => {
    it('应该正确使用性能优化器', async () => {
      await configManager.initialize();

      let batchUpdateCalled = false;
      const optimizer = createPerformanceOptimizer({
        cacheSize: 100,
        batchDelay: 10,
        onBatchUpdate: (updates) => {
          batchUpdateCalled = true;
          expect(updates).toBeDefined();
        }
      });

      // 测试缓存访问
      const theme1 = optimizer.getConfig('ui.theme', () => configManager.get('ui.theme'));
      const theme2 = optimizer.getConfig('ui.theme', () => configManager.get('ui.theme'));
      
      expect(theme1).toBe('dark');
      expect(theme2).toBe('dark');

      // 测试批量更新
      optimizer.setConfig('ui.theme', 'light');
      optimizer.setConfig('app.points.min', 200);

      // 等待批量更新触发
      await new Promise(resolve => setTimeout(resolve, 20));
      expect(batchUpdateCalled).toBe(true);

      // 获取性能指标
      const metrics = optimizer.getPerformanceMetrics();
      expect(metrics.configAccess.totalCount).toBeGreaterThan(0);
      expect(metrics.cache.size).toBeGreaterThan(0);
    });

    it('应该生成有用的性能分析报告', async () => {
      await configManager.initialize();

      const optimizer = createPerformanceOptimizer({
        onBatchUpdate: () => {}
      });

      // 执行一些操作以生成指标
      for (let i = 0; i < 10; i++) {
        optimizer.getConfig(`test-${i}`, () => `value-${i}`);
        optimizer.setConfig(`test-${i}`, `updated-${i}`);
      }

      const analyzer = new PerformanceAnalyzer(optimizer);
      const analysis = analyzer.analyzePerformance();

      expect(analysis.metrics).toBeDefined();
      expect(analysis.recommendations).toBeDefined();
      expect(analysis.issues).toBeDefined();

      const report = analyzer.generateReport();
      expect(report).toContain('配置系统性能报告');
      expect(report).toContain('性能指标');
    });
  });

  describe('启动时间影响验证', () => {
    it('应该快速初始化配置系统', async () => {
      const startTime = performance.now();
      
      const fastConfigManager = createConfigManager({
        enableValidation: true,
        enableHotReload: false
      });

      await fastConfigManager.initialize();
      
      const endTime = performance.now();
      const initTime = endTime - startTime;

      // 期望初始化时间小于100ms
      expect(initTime).toBeLessThan(100);

      await fastConfigManager.dispose();
    });

    it('应该支持延迟加载', async () => {
      const lazyConfigManager = createConfigManager({
        enableValidation: false, // 禁用验证以加快启动
        enableHotReload: false
      });

      const startTime = performance.now();
      await lazyConfigManager.initialize();
      const endTime = performance.now();

      const initTime = endTime - startTime;
      
      // 禁用验证后应该更快
      expect(initTime).toBeLessThan(50);

      await lazyConfigManager.dispose();
    });
  });

  describe('回归测试验证', () => {
    it('应该保持向后兼容性', async () => {
      // 测试旧版本配置格式的兼容性
      const oldFormatConfig = {
        version: '0.9.0',
        app: {
          points: { min: 100, max: 1000000, default: 100000 }
        },
        ui: {
          theme: 'dark',
          colors: { primary: '#3b82f6' }
        }
      };

      mockFs.readFile.mockResolvedValue(JSON.stringify(oldFormatConfig));

      const compatConfigManager = createConfigManager({
        enableValidation: false // 暂时禁用验证以测试兼容性
      });

      const result = await compatConfigManager.initialize();
      expect(result.config).toBeDefined();
      expect(result.config.app.points.min).toBe(100);

      await compatConfigManager.dispose();
    });

    it('应该正确处理配置升级', async () => {
      await configManager.initialize();

      // 模拟配置升级场景
      const currentConfig = configManager.getConfig();
      expect(currentConfig.version).toBe('1.0.0');

      // 验证所有新功能都可用
      expect(currentConfig.development).toBeDefined();
      expect(currentConfig.performance).toBeDefined();
    });
  });
});

/**
 * 最终验证测试总结
 * 
 * 这个测试套件提供了配置系统的全面验证：
 * 
 * 1. 系统完整性验证 - 确保所有组件正确初始化和配置
 * 2. 功能完整性验证 - 验证所有核心功能正常工作
 * 3. 错误处理验证 - 确保各种错误场景得到正确处理
 * 4. 性能验证 - 验证系统在各种负载下的性能表现
 * 5. 工具函数验证 - 确保所有工具函数正确工作
 * 6. 性能优化验证 - 验证性能优化功能的有效性
 * 7. 启动时间影响验证 - 确保配置系统不会显著影响应用启动
 * 8. 回归测试验证 - 确保向后兼容性和升级路径
 * 
 * 通过这些全面的验证，确保配置系统在生产环境中的可靠性和性能。
 */