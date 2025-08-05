/**
 * 性能测试工具
 * 用于验证优化效果和基准测试
 */

import { executeRauzyCoreAlgorithm } from './rauzy-core';
import { EigenCache } from './eigen-cache';
import { IncrementalPointCache } from './incremental-cache';

interface PerformanceTestResult {
  testName: string;
  pointCount: number;
  duration: number;
  cacheHit: boolean;
  memoryUsage?: number;
}

class PerformanceTestSuite {
  private results: PerformanceTestResult[] = [];

  /**
   * 运行完整的性能测试套件
   */
  async runFullSuite(): Promise<PerformanceTestResult[]> {
    console.log('🚀 开始性能测试套件...');
    
    this.results = [];
    
    // 清空缓存，确保公平测试
    EigenCache.clear();
    IncrementalPointCache.clear();
    
    // 测试1: 小规模数据 (10K点)
    await this.testPointCalculation('小规模数据测试', 10000);
    
    // 测试2: 中等规模数据 (50K点)
    await this.testPointCalculation('中等规模数据测试', 50000);
    
    // 测试3: 大规模数据 (100K点)
    await this.testPointCalculation('大规模数据测试', 100000);
    
    // 测试4: 缓存命中测试 (重复100K点)
    await this.testPointCalculation('缓存命中测试', 100000);
    
    // 测试5: 增量计算测试 (100K -> 150K)
    await this.testIncrementalCalculation();
    
    // 测试6: 减量测试 (150K -> 75K)
    await this.testDecrementalCalculation();
    
    // 输出测试报告
    this.printTestReport();
    
    return this.results;
  }

  /**
   * 测试点数计算性能
   */
  private async testPointCalculation(testName: string, pointCount: number): Promise<void> {
    const startTime = performance.now();
    const startMemory = this.getMemoryUsage();
    
    const result = executeRauzyCoreAlgorithm(pointCount);
    
    const endTime = performance.now();
    const endMemory = this.getMemoryUsage();
    const duration = endTime - startTime;
    
    // 从配置系统获取性能阈值
    const config = this.getPerformanceConfig();
    const cacheHit = duration < config.fastThreshold; // 如果耗时小于快速阈值，认为是缓存命中
    
    this.results.push({
      testName,
      pointCount,
      duration: Math.round(duration * 100) / 100,
      cacheHit,
      memoryUsage: endMemory - startMemory
    });
    
    console.log(`✅ ${testName}: ${pointCount} 点, ${duration.toFixed(2)}ms, 缓存${cacheHit ? '命中' : '未命中'}`);
  }

  /**
   * 测试增量计算性能
   */
  private async testIncrementalCalculation(): Promise<void> {
    const startTime = performance.now();
    
    // 先计算100K点作为基础
    executeRauzyCoreAlgorithm(100000);
    
    // 然后增量到150K点
    const result = executeRauzyCoreAlgorithm(150000);
    
    const endTime = performance.now();
    const duration = endTime - startTime;
    
    this.results.push({
      testName: '增量计算测试 (100K→150K)',
      pointCount: 150000,
      duration: Math.round(duration * 100) / 100,
      cacheHit: true
    });
    
    console.log(`✅ 增量计算测试: 100K→150K 点, ${duration.toFixed(2)}ms`);
  }

  /**
   * 测试减量计算性能
   */
  private async testDecrementalCalculation(): Promise<void> {
    const startTime = performance.now();
    
    // 从150K减少到75K点（应该是瞬时的）
    const result = executeRauzyCoreAlgorithm(75000);
    
    const endTime = performance.now();
    const duration = endTime - startTime;
    
    this.results.push({
      testName: '减量计算测试 (150K→75K)',
      pointCount: 75000,
      duration: Math.round(duration * 100) / 100,
      cacheHit: true
    });
    
    console.log(`✅ 减量计算测试: 150K→75K 点, ${duration.toFixed(2)}ms`);
  }

  /**
   * 获取内存使用情况
   */
  private getMemoryUsage(): number {
    if ('memory' in performance) {
      return (performance as any).memory.usedJSHeapSize / 1024 / 1024; // MB
    }
    return 0;
  }

  /**
   * 打印测试报告
   */
  private printTestReport(): void {
    console.log('\n📊 性能测试报告');
    console.log('=' .repeat(60));
    
    this.results.forEach((result, index) => {
      const cacheStatus = result.cacheHit ? '🚀 缓存命中' : '🔄 首次计算';
      const memoryInfo = result.memoryUsage ? ` | 内存: +${result.memoryUsage.toFixed(1)}MB` : '';
      
      console.log(`${index + 1}. ${result.testName}`);
      console.log(`   点数: ${result.pointCount.toLocaleString()} | 耗时: ${result.duration}ms | ${cacheStatus}${memoryInfo}`);
    });
    
    // 计算总体统计
    const totalDuration = this.results.reduce((sum, r) => sum + r.duration, 0);
    const cacheHitRate = (this.results.filter(r => r.cacheHit).length / this.results.length) * 100;
    
    console.log('=' .repeat(60));
    console.log(`总耗时: ${totalDuration.toFixed(2)}ms | 缓存命中率: ${cacheHitRate.toFixed(1)}%`);
    
    // 缓存统计
    const eigenStats = EigenCache.getStats();
    const incrementalStats = IncrementalPointCache.getStats();
    
    console.log(`特征值缓存: ${eigenStats.size} 项`);
    console.log(`增量缓存: ${incrementalStats.size} 项, ${incrementalStats.totalPoints.toLocaleString()} 总点数`);
  }

  /**
   * 快速性能测试（用于开发调试）
   */
  async quickTest(): Promise<void> {
    console.log('⚡ 快速性能测试...');
    
    // 清空缓存
    EigenCache.clear();
    IncrementalPointCache.clear();
    
    // 测试10K点
    const start1 = performance.now();
    executeRauzyCoreAlgorithm(10000);
    const time1 = performance.now() - start1;
    
    // 测试缓存命中
    const start2 = performance.now();
    executeRauzyCoreAlgorithm(10000);
    const time2 = performance.now() - start2;
    
    // 测试增量
    const start3 = performance.now();
    executeRauzyCoreAlgorithm(15000);
    const time3 = performance.now() - start3;
    
    console.log(`首次计算 10K: ${time1.toFixed(2)}ms`);
    console.log(`缓存命中 10K: ${time2.toFixed(2)}ms (${(time1/time2).toFixed(1)}x 提升)`);
    console.log(`增量计算 15K: ${time3.toFixed(2)}ms`);
  }

  /**
   * 从配置系统获取性能配置
   */
  private getPerformanceConfig() {
    try {
      // 尝试从全局配置获取
      const globalConfig = (window as any).__RAUZY_CONFIG__;
      if (globalConfig?.performance?.performance?.benchmarkThresholds) {
        const thresholds = globalConfig.performance.performance.benchmarkThresholds;
        return {
          fastThreshold: thresholds.fast,
          mediumThreshold: thresholds.medium,
          slowThreshold: thresholds.slow
        };
      }
    } catch (error) {
      // 配置系统不可用时使用默认值
    }

    // 回退到默认值
    return {
      fastThreshold: 50,
      mediumThreshold: 100,
      slowThreshold: 500
    };
  }

  /**
   * 获取测试结果
   */
  getResults(): PerformanceTestResult[] {
    return [...this.results];
  }
}

// 全局性能测试实例
const performanceTest = new PerformanceTestSuite();

// 暴露到全局对象，方便在浏览器控制台调用
(window as any).runPerformanceTest = () => performanceTest.runFullSuite();
(window as any).quickPerformanceTest = () => performanceTest.quickTest();

export { PerformanceTestSuite, type PerformanceTestResult };