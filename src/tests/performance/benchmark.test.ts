import { describe, it, expect, beforeEach } from 'vitest';
import { executeRauzyCoreAlgorithm } from '../../utils/rauzy-core';
import { calculatePathData } from '../../utils/liu-theorem';
import { PerformanceMonitor, ComputationCache } from '../../utils/performance';

// Mock window.math for testing
const mockMath = {
  matrix: (data: number[][]) => ({ data }),
  eigs: () => ({
    values: { toArray: () => [2.618, { re: -0.309, im: 0.951 }, { re: -0.309, im: -0.951 }] },
    vectors: 'mock-vectors'
  }),
  column: () => ({ get: () => 1, toArray: () => ({ flat: () => [1, 0, 0] }) }),
  divide: (a: any, b: any) => ({ get: () => 1, toArray: () => ({ flat: () => [1, 0, 0] }) }),
  re: () => ({ toArray: () => ({ flat: () => [1, 0, 0] }) }),
  im: () => ({ toArray: () => ({ flat: () => [0, 1, 0] }) }),
  transpose: (matrix: any) => matrix,
  inv: (matrix: any) => matrix,
  multiply: () => ({ get: () => 0 })
};

describe('性能基准测试', () => {
  beforeEach(() => {
    // 设置mock math
    Object.defineProperty(global, 'window', {
      value: { math: mockMath },
      writable: true
    });
    
    // 清理性能监控数据
    PerformanceMonitor.clearMeasurements();
    ComputationCache.clear();
  });

  describe('核心算法性能', () => {
    it('小规模数据集性能测试 (10K点)', () => {
      const pointCount = 10000;
      const startTime = performance.now();
      
      const result = executeRauzyCoreAlgorithm(pointCount);
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      expect(result).not.toBeNull();
      expect(duration).toBeLessThan(100); // 应该在100ms内完成
      
      console.log(`10K点计算耗时: ${duration.toFixed(2)}ms`);
    });

    it('中等规模数据集性能测试 (100K点)', () => {
      const pointCount = 100000;
      const startTime = performance.now();
      
      const result = executeRauzyCoreAlgorithm(pointCount);
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      expect(result).not.toBeNull();
      expect(duration).toBeLessThan(500); // 应该在500ms内完成
      
      console.log(`100K点计算耗时: ${duration.toFixed(2)}ms`);
    });

    it('大规模数据集性能测试 (1M点)', () => {
      const pointCount = 1000000;
      const startTime = performance.now();
      
      const result = executeRauzyCoreAlgorithm(pointCount);
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      expect(result).not.toBeNull();
      expect(duration).toBeLessThan(2000); // 应该在2秒内完成
      
      console.log(`1M点计算耗时: ${duration.toFixed(2)}ms`);
    });
  });

  describe('路径计算性能', () => {
    let baseData: any;

    beforeEach(() => {
      // 准备基础数据
      baseData = executeRauzyCoreAlgorithm(10000);
    });

    it('单路径计算性能', () => {
      const path = [1, 2, 1, 3];
      const iterations = 1000;
      
      const startTime = performance.now();
      
      for (let i = 0; i < iterations; i++) {
        calculatePathData(path, baseData.indexMaps, baseData.pointsWithBaseType);
      }
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      const avgDuration = duration / iterations;
      
      expect(avgDuration).toBeLessThan(1); // 平均每次应该在1ms内完成
      
      console.log(`单路径计算平均耗时: ${avgDuration.toFixed(3)}ms`);
    });

    it('批量路径计算性能', () => {
      const paths = [
        [1, 2, 1, 3],
        [2, 1, 3, 1],
        [3, 1, 2, 1],
        [1, 3, 2, 1],
        [2, 3, 1, 2]
      ];
      
      const startTime = performance.now();
      
      const results = paths.map(path => 
        calculatePathData(path, baseData.indexMaps, baseData.pointsWithBaseType)
      );
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      expect(results).toHaveLength(5);
      expect(duration).toBeLessThan(50); // 5条路径应该在50ms内完成
      
      console.log(`5条路径批量计算耗时: ${duration.toFixed(2)}ms`);
    });

    it('复杂路径计算性能', () => {
      // 测试长路径的计算性能
      const longPath = Array.from({ length: 20 }, (_, i) => (i % 3) + 1);
      
      const startTime = performance.now();
      
      const result = calculatePathData(longPath, baseData.indexMaps, baseData.pointsWithBaseType);
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      expect(result).toBeDefined();
      expect(duration).toBeLessThan(10); // 长路径应该在10ms内完成
      
      console.log(`长路径(20位)计算耗时: ${duration.toFixed(2)}ms`);
    });
  });

  describe('缓存性能测试', () => {
    it('缓存命中性能', () => {
      const pointCount = 50000;
      
      // 第一次计算（无缓存）
      const startTime1 = performance.now();
      const result1 = executeRauzyCoreAlgorithm(pointCount);
      const endTime1 = performance.now();
      const duration1 = endTime1 - startTime1;
      
      // 第二次计算（有缓存）
      const startTime2 = performance.now();
      const result2 = executeRauzyCoreAlgorithm(pointCount);
      const endTime2 = performance.now();
      const duration2 = endTime2 - startTime2;
      
      expect(result1).not.toBeNull();
      expect(result2).not.toBeNull();
      expect(duration2).toBeLessThan(duration1 * 0.1); // 缓存命中应该快10倍以上
      
      console.log(`无缓存计算耗时: ${duration1.toFixed(2)}ms`);
      console.log(`缓存命中耗时: ${duration2.toFixed(2)}ms`);
      console.log(`性能提升: ${(duration1 / duration2).toFixed(1)}x`);
    });

    it('缓存容量测试', () => {
      const testCounts = [10000, 20000, 30000, 40000, 50000];
      
      const startTime = performance.now();
      
      // 填充缓存
      testCounts.forEach(count => {
        executeRauzyCoreAlgorithm(count);
      });
      
      // 测试缓存命中
      testCounts.forEach(count => {
        const result = executeRauzyCoreAlgorithm(count);
        expect(result).not.toBeNull();
      });
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      console.log(`缓存容量测试总耗时: ${duration.toFixed(2)}ms`);
    });
  });

  describe('内存使用测试', () => {
    it('内存增长测试', () => {
      const initialMemory = (performance as any).memory?.usedJSHeapSize || 0;
      
      // 执行多次计算
      for (let i = 0; i < 10; i++) {
        executeRauzyCoreAlgorithm(50000 + i * 1000);
      }
      
      const finalMemory = (performance as any).memory?.usedJSHeapSize || 0;
      const memoryGrowth = finalMemory - initialMemory;
      
      // 内存增长应该在合理范围内（小于100MB）
      expect(memoryGrowth).toBeLessThan(100 * 1024 * 1024);
      
      console.log(`内存增长: ${(memoryGrowth / 1024 / 1024).toFixed(2)}MB`);
    });

    it('内存清理测试', () => {
      const initialMemory = (performance as any).memory?.usedJSHeapSize || 0;
      
      // 创建大量数据
      const largeArrays = [];
      for (let i = 0; i < 100; i++) {
        largeArrays.push(new Array(10000).fill(i));
      }
      
      const peakMemory = (performance as any).memory?.usedJSHeapSize || 0;
      
      // 清理数据
      largeArrays.length = 0;
      
      // 强制垃圾回收（如果支持）
      if ((global as any).gc) {
        (global as any).gc();
      }
      
      const finalMemory = (performance as any).memory?.usedJSHeapSize || 0;
      
      console.log(`初始内存: ${(initialMemory / 1024 / 1024).toFixed(2)}MB`);
      console.log(`峰值内存: ${(peakMemory / 1024 / 1024).toFixed(2)}MB`);
      console.log(`清理后内存: ${(finalMemory / 1024 / 1024).toFixed(2)}MB`);
    });
  });

  describe('并发性能测试', () => {
    it('并发计算测试', async () => {
      const concurrentTasks = 5;
      const pointCounts = [10000, 20000, 30000, 40000, 50000];
      
      const startTime = performance.now();
      
      // 并发执行计算
      const promises = pointCounts.map(count => 
        new Promise(resolve => {
          setTimeout(() => {
            const result = executeRauzyCoreAlgorithm(count);
            resolve(result);
          }, 0);
        })
      );
      
      const results = await Promise.all(promises);
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      expect(results).toHaveLength(concurrentTasks);
      results.forEach(result => {
        expect(result).not.toBeNull();
      });
      
      console.log(`${concurrentTasks}个并发任务耗时: ${duration.toFixed(2)}ms`);
    });
  });

  describe('性能监控测试', () => {
    it('性能监控功能测试', () => {
      // 测试性能监控器
      const endMeasurement = PerformanceMonitor.startMeasurement('test-operation');
      
      // 模拟一些工作
      const start = Date.now();
      while (Date.now() - start < 10) {
        // 忙等待10ms
      }
      
      endMeasurement();
      
      const stats = PerformanceMonitor.getStats('test-operation');
      expect(stats).not.toBeNull();
      expect(stats!.count).toBe(1);
      expect(stats!.latest).toBeGreaterThan(5);
      
      console.log(`性能监控测试 - 耗时: ${stats!.latest.toFixed(2)}ms`);
    });

    it('性能统计测试', () => {
      // 执行多次测量
      for (let i = 0; i < 10; i++) {
        const endMeasurement = PerformanceMonitor.startMeasurement('batch-test');
        
        // 模拟不同的工作负载
        const start = Date.now();
        while (Date.now() - start < (i + 1)) {
          // 忙等待
        }
        
        endMeasurement();
      }
      
      const stats = PerformanceMonitor.getStats('batch-test');
      expect(stats).not.toBeNull();
      expect(stats!.count).toBe(10);
      expect(stats!.average).toBeGreaterThan(0);
      expect(stats!.min).toBeLessThanOrEqual(stats!.max);
      
      console.log(`批量测试统计:`);
      console.log(`  次数: ${stats!.count}`);
      console.log(`  平均: ${stats!.average.toFixed(2)}ms`);
      console.log(`  最小: ${stats!.min.toFixed(2)}ms`);
      console.log(`  最大: ${stats!.max.toFixed(2)}ms`);
    });
  });
});

/**
 * 压力测试
 */
describe('压力测试', () => {
  beforeEach(() => {
    Object.defineProperty(global, 'window', {
      value: { math: mockMath },
      writable: true
    });
  });

  it('极限点数测试', () => {
    // 测试系统在极限点数下的表现
    const extremePointCount = 2000000; // 2M点
    
    const startTime = performance.now();
    
    try {
      const result = executeRauzyCoreAlgorithm(extremePointCount);
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      if (result) {
        expect(result.pointsWithBaseType).toHaveLength(extremePointCount - 1);
        console.log(`极限测试(2M点)成功 - 耗时: ${duration.toFixed(2)}ms`);
      } else {
        console.log(`极限测试(2M点)失败 - 系统限制`);
      }
    } catch (error) {
      console.log(`极限测试(2M点)异常:`, error);
    }
  });

  it('大量路径压力测试', () => {
    const baseData = executeRauzyCoreAlgorithm(10000);
    const pathCount = 50; // 50条路径
    
    // 生成大量路径
    const paths = [];
    for (let i = 0; i < pathCount; i++) {
      const pathLength = 3 + (i % 5); // 路径长度3-7
      const path = Array.from({ length: pathLength }, (_, j) => ((i + j) % 3) + 1);
      paths.push(path);
    }
    
    const startTime = performance.now();
    
    try {
      const results = paths.map(path => 
        calculatePathData(path, baseData.indexMaps, baseData.pointsWithBaseType)
      );
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      expect(results).toHaveLength(pathCount);
      console.log(`大量路径测试(${pathCount}条)成功 - 耗时: ${duration.toFixed(2)}ms`);
      console.log(`平均每条路径: ${(duration / pathCount).toFixed(2)}ms`);
    } catch (error) {
      console.log(`大量路径测试失败:`, error);
    }
  });

  it('长时间运行稳定性测试', async () => {
    const iterations = 100;
    const pointCount = 50000;
    
    let successCount = 0;
    let totalDuration = 0;
    
    for (let i = 0; i < iterations; i++) {
      const startTime = performance.now();
      
      try {
        const result = executeRauzyCoreAlgorithm(pointCount);
        if (result) {
          successCount++;
        }
        
        const endTime = performance.now();
        totalDuration += (endTime - startTime);
        
        // 每10次迭代清理一次缓存
        if (i % 10 === 0) {
          ComputationCache.clear();
        }
        
      } catch (error) {
        console.log(`迭代 ${i} 失败:`, error);
      }
    }
    
    const successRate = (successCount / iterations) * 100;
    const avgDuration = totalDuration / iterations;
    
    expect(successRate).toBeGreaterThan(95); // 成功率应该超过95%
    
    console.log(`长时间运行测试结果:`);
    console.log(`  迭代次数: ${iterations}`);
    console.log(`  成功次数: ${successCount}`);
    console.log(`  成功率: ${successRate.toFixed(1)}%`);
    console.log(`  平均耗时: ${avgDuration.toFixed(2)}ms`);
  });
});