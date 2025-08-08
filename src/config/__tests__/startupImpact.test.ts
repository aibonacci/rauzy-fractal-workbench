/**
 * 配置系统启动时间影响测试
 * 验证配置系统对应用启动时间的影响
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createConfigManager } from '../ConfigManager';
import { DEFAULT_CONFIG } from '../defaultConfig';

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

describe('配置系统启动时间影响测试', () => {
  beforeEach(() => {
    // Clear localStorage mocks
    localStorageMock.getItem.mockClear();
    localStorageMock.setItem.mockClear();
    localStorageMock.removeItem.mockClear();
    localStorageMock.clear.mockClear();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('配置管理器初始化时间', () => {
    it('应该快速创建配置管理器实例', () => {
      const iterations = 1000;
      const times: number[] = [];

      for (let i = 0; i < iterations; i++) {
        const startTime = performance.now();
        const configManager = createConfigManager();
        const endTime = performance.now();
        
        times.push(endTime - startTime);
        configManager.dispose();
      }

      const avgTime = times.reduce((sum, time) => sum + time, 0) / times.length;
      const maxTime = Math.max(...times);
      const minTime = Math.min(...times);

      console.log(`配置管理器创建时间: 平均 ${avgTime.toFixed(4)}ms, 最大 ${maxTime.toFixed(4)}ms, 最小 ${minTime.toFixed(4)}ms`);

      // 创建配置管理器实例应该非常快（小于1ms）
      expect(avgTime).toBeLessThan(1);
      expect(maxTime).toBeLessThan(5);
    });

    it('应该快速初始化配置系统', async () => {
      const fs = await import('fs/promises');
      vi.mocked(fs.readFile).mockResolvedValue(JSON.stringify(DEFAULT_CONFIG));
      vi.mocked(fs.access).mockResolvedValue(undefined);

      const iterations = 50;
      const times: number[] = [];

      for (let i = 0; i < iterations; i++) {
        const configManager = createConfigManager();
        
        const startTime = performance.now();
        await configManager.initialize();
        const endTime = performance.now();
        
        times.push(endTime - startTime);
        await configManager.dispose();
      }

      const avgTime = times.reduce((sum, time) => sum + time, 0) / times.length;
      const maxTime = Math.max(...times);
      const minTime = Math.min(...times);

      console.log(`配置系统初始化时间: 平均 ${avgTime.toFixed(2)}ms, 最大 ${maxTime.toFixed(2)}ms, 最小 ${minTime.toFixed(2)}ms`);

      // 配置系统初始化应该在合理时间内完成
      expect(avgTime).toBeLessThan(50);
      expect(maxTime).toBeLessThan(100);
    });

    it('应该快速处理配置文件不存在的情况', async () => {
      const fs = await import('fs/promises');
      vi.mocked(fs.readFile).mockRejectedValue({ code: 'ENOENT' });
      vi.mocked(fs.writeFile).mockResolvedValue(undefined);
      vi.mocked(fs.mkdir).mockResolvedValue(undefined);

      const iterations = 20;
      const times: number[] = [];

      for (let i = 0; i < iterations; i++) {
        const configManager = createConfigManager();
        
        const startTime = performance.now();
        await configManager.initialize();
        const endTime = performance.now();
        
        times.push(endTime - startTime);
        await configManager.dispose();
      }

      const avgTime = times.reduce((sum, time) => sum + time, 0) / times.length;
      const maxTime = Math.max(...times);

      console.log(`配置文件不存在时初始化时间: 平均 ${avgTime.toFixed(2)}ms, 最大 ${maxTime.toFixed(2)}ms`);

      // 即使需要创建默认配置文件，初始化时间也应该在合理范围内
      expect(avgTime).toBeLessThan(100);
      expect(maxTime).toBeLessThan(200);
    });
  });

  describe('配置验证启动影响', () => {
    it('应该测量启用验证对启动时间的影响', async () => {
      const fs = await import('fs/promises');
      vi.mocked(fs.readFile).mockResolvedValue(JSON.stringify(DEFAULT_CONFIG));
      vi.mocked(fs.access).mockResolvedValue(undefined);

      const iterations = 30;
      
      // 测试启用验证的情况
      const enabledTimes: number[] = [];
      for (let i = 0; i < iterations; i++) {
        const configManager = createConfigManager({ enableValidation: true });
        
        const startTime = performance.now();
        await configManager.initialize();
        const endTime = performance.now();
        
        enabledTimes.push(endTime - startTime);
        await configManager.dispose();
      }

      // 测试禁用验证的情况
      const disabledTimes: number[] = [];
      for (let i = 0; i < iterations; i++) {
        const configManager = createConfigManager({ enableValidation: false });
        
        const startTime = performance.now();
        await configManager.initialize();
        const endTime = performance.now();
        
        disabledTimes.push(endTime - startTime);
        await configManager.dispose();
      }

      const avgEnabledTime = enabledTimes.reduce((sum, time) => sum + time, 0) / enabledTimes.length;
      const avgDisabledTime = disabledTimes.reduce((sum, time) => sum + time, 0) / disabledTimes.length;
      const validationOverhead = avgEnabledTime - avgDisabledTime;

      console.log(`验证启用时初始化时间: ${avgEnabledTime.toFixed(2)}ms`);
      console.log(`验证禁用时初始化时间: ${avgDisabledTime.toFixed(2)}ms`);
      console.log(`验证开销: ${validationOverhead.toFixed(2)}ms`);

      // 验证开销应该在合理范围内
      expect(validationOverhead).toBeLessThan(20);
      expect(avgEnabledTime).toBeLessThan(80);
    });
  });

  describe('热重载启动影响', () => {
    it('应该测量启用热重载对启动时间的影响', async () => {
      const fs = await import('fs/promises');
      vi.mocked(fs.readFile).mockResolvedValue(JSON.stringify(DEFAULT_CONFIG));
      vi.mocked(fs.access).mockResolvedValue(undefined);

      const iterations = 20;
      
      // 测试启用热重载的情况（在Node.js环境中会被跳过）
      const enabledTimes: number[] = [];
      for (let i = 0; i < iterations; i++) {
        const configManager = createConfigManager({ enableHotReload: true });
        
        const startTime = performance.now();
        await configManager.initialize();
        const endTime = performance.now();
        
        enabledTimes.push(endTime - startTime);
        await configManager.dispose();
      }

      // 测试禁用热重载的情况
      const disabledTimes: number[] = [];
      for (let i = 0; i < iterations; i++) {
        const configManager = createConfigManager({ enableHotReload: false });
        
        const startTime = performance.now();
        await configManager.initialize();
        const endTime = performance.now();
        
        disabledTimes.push(endTime - startTime);
        await configManager.dispose();
      }

      const avgEnabledTime = enabledTimes.reduce((sum, time) => sum + time, 0) / enabledTimes.length;
      const avgDisabledTime = disabledTimes.reduce((sum, time) => sum + time, 0) / disabledTimes.length;
      const hotReloadOverhead = avgEnabledTime - avgDisabledTime;

      console.log(`热重载启用时初始化时间: ${avgEnabledTime.toFixed(2)}ms`);
      console.log(`热重载禁用时初始化时间: ${avgDisabledTime.toFixed(2)}ms`);
      console.log(`热重载开销: ${hotReloadOverhead.toFixed(2)}ms`);

      // 在浏览器环境中，热重载会被跳过，所以开销应该很小
      expect(Math.abs(hotReloadOverhead)).toBeLessThan(10);
    });
  });

  describe('大型配置文件启动影响', () => {
    it('应该测量大型配置文件对启动时间的影响', async () => {
      const fs = await import('fs/promises');
      
      // 创建大型配置对象
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

      const largeConfigJson = JSON.stringify(largeConfig);
      const normalConfigJson = JSON.stringify(DEFAULT_CONFIG);

      console.log(`普通配置文件大小: ${(normalConfigJson.length / 1024).toFixed(2)}KB`);
      console.log(`大型配置文件大小: ${(largeConfigJson.length / 1024).toFixed(2)}KB`);

      const iterations = 20;

      // 测试普通配置文件
      vi.mocked(fs.readFile).mockResolvedValue(normalConfigJson);
      vi.mocked(fs.access).mockResolvedValue(undefined);

      const normalTimes: number[] = [];
      for (let i = 0; i < iterations; i++) {
        const configManager = createConfigManager();
        
        const startTime = performance.now();
        await configManager.initialize();
        const endTime = performance.now();
        
        normalTimes.push(endTime - startTime);
        await configManager.dispose();
      }

      // 测试大型配置文件
      vi.mocked(fs.readFile).mockResolvedValue(largeConfigJson);

      const largeTimes: number[] = [];
      for (let i = 0; i < iterations; i++) {
        const configManager = createConfigManager();
        
        const startTime = performance.now();
        await configManager.initialize();
        const endTime = performance.now();
        
        largeTimes.push(endTime - startTime);
        await configManager.dispose();
      }

      const avgNormalTime = normalTimes.reduce((sum, time) => sum + time, 0) / normalTimes.length;
      const avgLargeTime = largeTimes.reduce((sum, time) => sum + time, 0) / largeTimes.length;
      const sizeOverhead = avgLargeTime - avgNormalTime;

      console.log(`普通配置文件初始化时间: ${avgNormalTime.toFixed(2)}ms`);
      console.log(`大型配置文件初始化时间: ${avgLargeTime.toFixed(2)}ms`);
      console.log(`大小开销: ${sizeOverhead.toFixed(2)}ms`);

      // 大型配置文件的开销应该在合理范围内
      expect(sizeOverhead).toBeLessThan(50);
      expect(avgLargeTime).toBeLessThan(150);
    });
  });

  describe('并发初始化影响', () => {
    it('应该测量并发初始化多个配置管理器的影响', async () => {
      const fs = await import('fs/promises');
      vi.mocked(fs.readFile).mockResolvedValue(JSON.stringify(DEFAULT_CONFIG));
      vi.mocked(fs.access).mockResolvedValue(undefined);

      const concurrency = 10;
      const iterations = 5;

      // 测试串行初始化
      const serialTimes: number[] = [];
      for (let i = 0; i < iterations; i++) {
        const managers: Array<ReturnType<typeof createConfigManager>> = [];
        
        const startTime = performance.now();
        
        for (let j = 0; j < concurrency; j++) {
          const manager = createConfigManager();
          await manager.initialize();
          managers.push(manager);
        }
        
        const endTime = performance.now();
        serialTimes.push(endTime - startTime);
        
        // 清理
        await Promise.all(managers.map(m => m.dispose()));
      }

      // 测试并行初始化
      const parallelTimes: number[] = [];
      for (let i = 0; i < iterations; i++) {
        const managers: Array<ReturnType<typeof createConfigManager>> = [];
        
        // 创建管理器
        for (let j = 0; j < concurrency; j++) {
          managers.push(createConfigManager());
        }
        
        const startTime = performance.now();
        
        // 并行初始化
        await Promise.all(managers.map(m => m.initialize()));
        
        const endTime = performance.now();
        parallelTimes.push(endTime - startTime);
        
        // 清理
        await Promise.all(managers.map(m => m.dispose()));
      }

      const avgSerialTime = serialTimes.reduce((sum, time) => sum + time, 0) / serialTimes.length;
      const avgParallelTime = parallelTimes.reduce((sum, time) => sum + time, 0) / parallelTimes.length;
      const parallelSpeedup = avgSerialTime / avgParallelTime;

      console.log(`串行初始化${concurrency}个管理器时间: ${avgSerialTime.toFixed(2)}ms`);
      console.log(`并行初始化${concurrency}个管理器时间: ${avgParallelTime.toFixed(2)}ms`);
      console.log(`并行加速比: ${parallelSpeedup.toFixed(2)}x`);

      // 并行初始化应该比串行快
      expect(avgParallelTime).toBeLessThan(avgSerialTime);
      expect(parallelSpeedup).toBeGreaterThan(1);
    });
  });

  describe('内存使用启动影响', () => {
    it('应该测量配置系统对启动内存使用的影响', async () => {
      const fs = await import('fs/promises');
      vi.mocked(fs.readFile).mockResolvedValue(JSON.stringify(DEFAULT_CONFIG));
      vi.mocked(fs.access).mockResolvedValue(undefined);

      // 获取初始内存使用
      const initialMemory = (performance as any).memory?.usedJSHeapSize || 0;

      // 创建并初始化配置管理器
      const configManager = createConfigManager();
      await configManager.initialize();

      const afterInitMemory = (performance as any).memory?.usedJSHeapSize || 0;
      const initMemoryIncrease = afterInitMemory - initialMemory;

      // 执行一些配置操作
      for (let i = 0; i < 100; i++) {
        configManager.get('app.points.min');
        configManager.set('app.points.min', 100 + i);
      }

      const afterOperationsMemory = (performance as any).memory?.usedJSHeapSize || 0;
      const operationsMemoryIncrease = afterOperationsMemory - afterInitMemory;

      console.log(`配置系统初始化内存增长: ${(initMemoryIncrease / 1024).toFixed(2)}KB`);
      console.log(`配置操作内存增长: ${(operationsMemoryIncrease / 1024).toFixed(2)}KB`);

      // 清理
      await configManager.dispose();

      const afterCleanupMemory = (performance as any).memory?.usedJSHeapSize || 0;
      const memoryFreed = afterOperationsMemory - afterCleanupMemory;

      console.log(`清理后释放内存: ${(memoryFreed / 1024).toFixed(2)}KB`);

      // 内存使用应该在合理范围内
      expect(initMemoryIncrease).toBeLessThan(1024 * 1024); // 小于1MB
      expect(operationsMemoryIncrease).toBeLessThan(512 * 1024); // 小于512KB
    });
  });

  describe('启动时间基准测试', () => {
    it('应该建立配置系统启动时间基准', async () => {
      const fs = await import('fs/promises');
      vi.mocked(fs.readFile).mockResolvedValue(JSON.stringify(DEFAULT_CONFIG));
      vi.mocked(fs.access).mockResolvedValue(undefined);

      const iterations = 100;
      const times: number[] = [];

      // 执行基准测试
      for (let i = 0; i < iterations; i++) {
        const configManager = createConfigManager({
          enableValidation: true,
          enableHotReload: false
        });
        
        const startTime = performance.now();
        await configManager.initialize();
        const endTime = performance.now();
        
        times.push(endTime - startTime);
        await configManager.dispose();
      }

      // 计算统计数据
      times.sort((a, b) => a - b);
      const avgTime = times.reduce((sum, time) => sum + time, 0) / times.length;
      const medianTime = times[Math.floor(times.length / 2)];
      const p95Time = times[Math.floor(times.length * 0.95)];
      const p99Time = times[Math.floor(times.length * 0.99)];
      const minTime = times[0];
      const maxTime = times[times.length - 1];

      console.log('=== 配置系统启动时间基准 ===');
      console.log(`平均时间: ${avgTime.toFixed(2)}ms`);
      console.log(`中位数时间: ${medianTime.toFixed(2)}ms`);
      console.log(`95%分位数: ${p95Time.toFixed(2)}ms`);
      console.log(`99%分位数: ${p99Time.toFixed(2)}ms`);
      console.log(`最小时间: ${minTime.toFixed(2)}ms`);
      console.log(`最大时间: ${maxTime.toFixed(2)}ms`);

      // 设置性能基准
      expect(avgTime).toBeLessThan(50); // 平均启动时间小于50ms
      expect(p95Time).toBeLessThan(100); // 95%的情况下小于100ms
      expect(p99Time).toBeLessThan(150); // 99%的情况下小于150ms
      expect(maxTime).toBeLessThan(200); // 最大时间小于200ms
    });
  });
});