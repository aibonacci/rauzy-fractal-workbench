/**
 * 配置系统性能基准测试
 * 测试配置访问、更新、验证等操作的性能
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createConfigManager } from '../ConfigManager';
import { DEFAULT_CONFIG } from '../defaultConfig';
import { deepClone, getConfigValue, setConfigValue } from '../utils';

// Mock file system operations for performance tests
vi.mock('fs/promises', () => ({
  readFile: vi.fn().mockResolvedValue(JSON.stringify(DEFAULT_CONFIG)),
  writeFile: vi.fn().mockResolvedValue(undefined),
  access: vi.fn().mockResolvedValue(undefined),
  stat: vi.fn().mockResolvedValue({ mtime: new Date() }),
  mkdir: vi.fn().mockResolvedValue(undefined)
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

describe('配置系统性能测试', () => {
  let configManager: ReturnType<typeof createConfigManager>;

  beforeEach(async () => {
    configManager = createConfigManager({
      enableValidation: true,
      enableHotReload: false
    });
    await configManager.initialize();
    
    // Clear localStorage mocks
    localStorageMock.getItem.mockClear();
    localStorageMock.setItem.mockClear();
  });

  afterEach(async () => {
    await configManager.dispose();
    vi.clearAllMocks();
  });

  describe('配置访问性能', () => {
    it('应该快速获取配置值', () => {
      const iterations = 10000;
      const startTime = performance.now();

      for (let i = 0; i < iterations; i++) {
        configManager.get('app.points.min');
        configManager.get('ui.colors.primary');
        configManager.get('performance.cache.enabled');
      }

      const endTime = performance.now();
      const duration = endTime - startTime;
      const avgTime = duration / iterations;

      console.log(`配置访问性能: ${iterations} 次操作耗时 ${duration.toFixed(2)}ms, 平均 ${avgTime.toFixed(4)}ms/次`);
      
      // 每次配置访问应该在 0.1ms 以内
      expect(avgTime).toBeLessThan(0.1);
    });

    it('应该快速获取完整配置', () => {
      const iterations = 1000;
      const startTime = performance.now();

      for (let i = 0; i < iterations; i++) {
        configManager.getConfig();
      }

      const endTime = performance.now();
      const duration = endTime - startTime;
      const avgTime = duration / iterations;

      console.log(`完整配置获取性能: ${iterations} 次操作耗时 ${duration.toFixed(2)}ms, 平均 ${avgTime.toFixed(4)}ms/次`);
      
      // 每次完整配置获取应该在 1ms 以内
      expect(avgTime).toBeLessThan(1);
    });

    it('应该快速进行深度路径访问', () => {
      const config = DEFAULT_CONFIG;
      const iterations = 50000;
      const paths = [
        'app.points.min',
        'ui.colors.primary',
        'performance.cache.maxSize',
        'development.debug.enabled',
        'ui.animations.duration'
      ];

      const startTime = performance.now();

      for (let i = 0; i < iterations; i++) {
        const path = paths[i % paths.length];
        getConfigValue(config, path as any);
      }

      const endTime = performance.now();
      const duration = endTime - startTime;
      const avgTime = duration / iterations;

      console.log(`深度路径访问性能: ${iterations} 次操作耗时 ${duration.toFixed(2)}ms, 平均 ${avgTime.toFixed(4)}ms/次`);
      
      // 每次深度路径访问应该在 0.01ms 以内
      expect(avgTime).toBeLessThan(0.01);
    });
  });

  describe('配置更新性能', () => {
    it('应该快速设置单个配置值', async () => {
      const iterations = 1000;
      const startTime = performance.now();

      for (let i = 0; i < iterations; i++) {
        configManager.set('app.points.min', 100 + i);
      }

      const endTime = performance.now();
      const duration = endTime - startTime;
      const avgTime = duration / iterations;

      console.log(`单个配置设置性能: ${iterations} 次操作耗时 ${duration.toFixed(2)}ms, 平均 ${avgTime.toFixed(4)}ms/次`);
      
      // 每次配置设置应该在 5ms 以内（包含验证时间）
      expect(avgTime).toBeLessThan(5);
    });

    it('应该快速进行批量配置更新', async () => {
      const iterations = 100;
      const startTime = performance.now();

      for (let i = 0; i < iterations; i++) {
        configManager.update({
          app: {
            points: { min: 100 + i, max: 1000 + i }
          },
          ui: {
            colors: { primary: `#${i.toString(16).padStart(6, '0')}` }
          }
        });
      }

      const endTime = performance.now();
      const duration = endTime - startTime;
      const avgTime = duration / iterations;

      console.log(`批量配置更新性能: ${iterations} 次操作耗时 ${duration.toFixed(2)}ms, 平均 ${avgTime.toFixed(2)}ms/次`);
      
      // 每次批量更新应该在 10ms 以内
      expect(avgTime).toBeLessThan(10);
    });

    it('应该快速进行配置值设置（工具函数）', () => {
      const config = deepClone(DEFAULT_CONFIG);
      const iterations = 10000;
      const startTime = performance.now();

      for (let i = 0; i < iterations; i++) {
        setConfigValue(config, 'app.points.min', 100 + i);
      }

      const endTime = performance.now();
      const duration = endTime - startTime;
      const avgTime = duration / iterations;

      console.log(`配置值设置工具函数性能: ${iterations} 次操作耗时 ${duration.toFixed(2)}ms, 平均 ${avgTime.toFixed(4)}ms/次`);
      
      // 每次配置值设置应该在 0.1ms 以内
      expect(avgTime).toBeLessThan(0.1);
    });
  });

  describe('配置验证性能', () => {
    it('应该快速验证配置', () => {
      const iterations = 1000;
      const startTime = performance.now();

      for (let i = 0; i < iterations; i++) {
        configManager.validate();
      }

      const endTime = performance.now();
      const duration = endTime - startTime;
      const avgTime = duration / iterations;

      console.log(`配置验证性能: ${iterations} 次操作耗时 ${duration.toFixed(2)}ms, 平均 ${avgTime.toFixed(4)}ms/次`);
      
      // 每次配置验证应该在 2ms 以内
      expect(avgTime).toBeLessThan(2);
    });

    it('应该快速生成验证报告', () => {
      const iterations = 100;
      const startTime = performance.now();

      for (let i = 0; i < iterations; i++) {
        configManager.getValidationReport();
      }

      const endTime = performance.now();
      const duration = endTime - startTime;
      const avgTime = duration / iterations;

      console.log(`验证报告生成性能: ${iterations} 次操作耗时 ${duration.toFixed(2)}ms, 平均 ${avgTime.toFixed(4)}ms/次`);
      
      // 每次验证报告生成应该在 5ms 以内
      expect(avgTime).toBeLessThan(5);
    });
  });

  describe('配置克隆性能', () => {
    it('应该快速深拷贝配置', () => {
      const iterations = 1000;
      const startTime = performance.now();

      for (let i = 0; i < iterations; i++) {
        deepClone(DEFAULT_CONFIG);
      }

      const endTime = performance.now();
      const duration = endTime - startTime;
      const avgTime = duration / iterations;

      console.log(`配置深拷贝性能: ${iterations} 次操作耗时 ${duration.toFixed(2)}ms, 平均 ${avgTime.toFixed(4)}ms/次`);
      
      // 每次深拷贝应该在 1ms 以内
      expect(avgTime).toBeLessThan(1);
    });
  });

  describe('监听器性能', () => {
    it('应该快速处理配置变化监听', () => {
      const iterations = 1000;
      const listeners: Array<() => void> = [];

      // 添加多个监听器
      for (let i = 0; i < 10; i++) {
        const unsubscribe = configManager.subscribe(() => {
          // 空监听器
        });
        listeners.push(unsubscribe);
      }

      const startTime = performance.now();

      for (let i = 0; i < iterations; i++) {
        configManager.set('app.points.min', 100 + i);
      }

      const endTime = performance.now();
      const duration = endTime - startTime;
      const avgTime = duration / iterations;

      console.log(`配置变化监听性能: ${iterations} 次操作耗时 ${duration.toFixed(2)}ms, 平均 ${avgTime.toFixed(4)}ms/次`);
      
      // 清理监听器
      listeners.forEach(unsubscribe => unsubscribe());
      
      // 每次配置变化通知应该在 10ms 以内
      expect(avgTime).toBeLessThan(10);
    });

    it('应该快速添加和移除监听器', () => {
      const iterations = 10000;
      const startTime = performance.now();

      for (let i = 0; i < iterations; i++) {
        const unsubscribe = configManager.subscribe(() => {});
        unsubscribe();
      }

      const endTime = performance.now();
      const duration = endTime - startTime;
      const avgTime = duration / iterations;

      console.log(`监听器添加/移除性能: ${iterations} 次操作耗时 ${duration.toFixed(2)}ms, 平均 ${avgTime.toFixed(4)}ms/次`);
      
      // 每次监听器操作应该在 0.01ms 以内
      expect(avgTime).toBeLessThan(0.01);
    });
  });

  describe('内存使用测试', () => {
    it('应该有合理的内存占用', () => {
      const initialMemory = (performance as any).memory?.usedJSHeapSize || 0;
      
      // 创建多个配置管理器实例
      const managers: Array<ReturnType<typeof createConfigManager>> = [];
      
      for (let i = 0; i < 100; i++) {
        const manager = createConfigManager();
        managers.push(manager);
      }
      
      const afterCreationMemory = (performance as any).memory?.usedJSHeapSize || 0;
      const memoryIncrease = afterCreationMemory - initialMemory;
      
      console.log(`创建100个配置管理器实例内存增长: ${(memoryIncrease / 1024 / 1024).toFixed(2)}MB`);
      
      // 清理实例
      managers.forEach(manager => manager.dispose());
      
      // 内存增长应该在合理范围内（小于10MB）
      expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024);
    });

    it('应该正确清理资源', async () => {
      const managers: Array<ReturnType<typeof createConfigManager>> = [];
      
      // 创建多个实例
      for (let i = 0; i < 50; i++) {
        const manager = createConfigManager();
        await manager.initialize();
        managers.push(manager);
      }
      
      const beforeCleanup = (performance as any).memory?.usedJSHeapSize || 0;
      
      // 清理所有实例
      await Promise.all(managers.map(manager => manager.dispose()));
      
      // 强制垃圾回收（如果可用）
      if (global.gc) {
        global.gc();
      }
      
      const afterCleanup = (performance as any).memory?.usedJSHeapSize || 0;
      const memoryFreed = beforeCleanup - afterCleanup;
      
      console.log(`清理50个配置管理器实例释放内存: ${(memoryFreed / 1024 / 1024).toFixed(2)}MB`);
      
      // 应该释放一定的内存
      expect(memoryFreed).toBeGreaterThan(0);
    });
  });

  describe('并发性能测试', () => {
    it('应该处理并发配置访问', async () => {
      const concurrency = 100;
      const iterations = 100;
      
      const startTime = performance.now();
      
      const promises = Array.from({ length: concurrency }, async () => {
        for (let i = 0; i < iterations; i++) {
          configManager.get('app.points.min');
          configManager.get('ui.colors.primary');
        }
      });
      
      await Promise.all(promises);
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      const totalOperations = concurrency * iterations * 2;
      const avgTime = duration / totalOperations;
      
      console.log(`并发配置访问性能: ${totalOperations} 次操作耗时 ${duration.toFixed(2)}ms, 平均 ${avgTime.toFixed(4)}ms/次`);
      
      // 并发访问平均时间应该在合理范围内
      expect(avgTime).toBeLessThan(0.1);
    });

    it('应该处理并发配置更新', async () => {
      const concurrency = 10;
      const iterations = 10;
      
      const startTime = performance.now();
      
      const promises = Array.from({ length: concurrency }, async (_, index) => {
        for (let i = 0; i < iterations; i++) {
          configManager.set('app.points.min', 100 + index * iterations + i);
        }
      });
      
      await Promise.all(promises);
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      const totalOperations = concurrency * iterations;
      const avgTime = duration / totalOperations;
      
      console.log(`并发配置更新性能: ${totalOperations} 次操作耗时 ${duration.toFixed(2)}ms, 平均 ${avgTime.toFixed(2)}ms/次`);
      
      // 并发更新平均时间应该在合理范围内
      expect(avgTime).toBeLessThan(20);
    });
  });

  describe('启动性能测试', () => {
    it('应该快速初始化配置管理器', async () => {
      const iterations = 10;
      const times: number[] = [];
      
      for (let i = 0; i < iterations; i++) {
        const manager = createConfigManager();
        
        const startTime = performance.now();
        await manager.initialize();
        const endTime = performance.now();
        
        times.push(endTime - startTime);
        await manager.dispose();
      }
      
      const avgTime = times.reduce((sum, time) => sum + time, 0) / times.length;
      const maxTime = Math.max(...times);
      const minTime = Math.min(...times);
      
      console.log(`配置管理器初始化性能: 平均 ${avgTime.toFixed(2)}ms, 最大 ${maxTime.toFixed(2)}ms, 最小 ${minTime.toFixed(2)}ms`);
      
      // 平均初始化时间应该在合理范围内
      expect(avgTime).toBeLessThan(100);
      expect(maxTime).toBeLessThan(200);
    });
  });

  describe('大数据量测试', () => {
    it('应该处理大型配置对象', () => {
      // 创建一个大型配置对象
      const largeConfig = {
        ...DEFAULT_CONFIG,
        largeSection: {}
      };
      
      // 添加大量配置项
      for (let i = 0; i < 1000; i++) {
        (largeConfig.largeSection as any)[`item${i}`] = {
          id: i,
          name: `Item ${i}`,
          value: Math.random(),
          enabled: i % 2 === 0,
          metadata: {
            created: new Date().toISOString(),
            tags: [`tag${i % 10}`, `category${i % 5}`],
            properties: {
              prop1: `value${i}`,
              prop2: i * 2,
              prop3: i % 3 === 0
            }
          }
        };
      }
      
      const iterations = 100;
      const startTime = performance.now();
      
      for (let i = 0; i < iterations; i++) {
        deepClone(largeConfig);
      }
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      const avgTime = duration / iterations;
      
      console.log(`大型配置对象处理性能: ${iterations} 次操作耗时 ${duration.toFixed(2)}ms, 平均 ${avgTime.toFixed(2)}ms/次`);
      
      // 大型配置对象处理时间应该在合理范围内
      expect(avgTime).toBeLessThan(50);
    });
  });
});