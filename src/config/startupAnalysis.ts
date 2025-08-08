/**
 * 配置系统启动时间影响分析
 * 分析和优化配置系统对应用启动时间的影响
 */

import { createConfigManager } from './ConfigManager';
import { DEFAULT_CONFIG } from './defaultConfig';
import { AppConfiguration } from './types';

// 启动时间指标
interface StartupMetrics {
  configInitTime: number;
  validationTime: number;
  fileLoadTime: number;
  totalStartupTime: number;
  memoryUsage: {
    initial: number;
    afterConfig: number;
    increase: number;
  };
}

// 启动优化选项
interface StartupOptimizationOptions {
  enableValidation: boolean;
  enableHotReload: boolean;
  preloadConfig: boolean;
  useCache: boolean;
  lazyLoad: boolean;
}

/**
 * 启动时间分析器
 */
export class StartupAnalyzer {
  private metrics: StartupMetrics[] = [];

  /**
   * 分析配置系统启动时间
   */
  async analyzeStartupTime(options: Partial<StartupOptimizationOptions> = {}): Promise<StartupMetrics> {
    const defaultOptions: StartupOptimizationOptions = {
      enableValidation: true,
      enableHotReload: false,
      preloadConfig: false,
      useCache: true,
      lazyLoad: false,
      ...options
    };

    // 记录初始内存使用
    const initialMemory = this.getMemoryUsage();
    const totalStartTime = performance.now();

    // 配置初始化时间
    const configStartTime = performance.now();
    const configManager = createConfigManager({
      enableValidation: defaultOptions.enableValidation,
      enableHotReload: defaultOptions.enableHotReload,
      configPath: './config.json'
    });
    const configEndTime = performance.now();
    const configInitTime = configEndTime - configStartTime;

    // 文件加载时间
    const fileLoadStartTime = performance.now();
    await configManager.initialize();
    const fileLoadEndTime = performance.now();
    const fileLoadTime = fileLoadEndTime - fileLoadStartTime;

    // 验证时间
    const validationStartTime = performance.now();
    if (defaultOptions.enableValidation) {
      const config = configManager.getConfig();
      configManager.validate();
    }
    const validationEndTime = performance.now();
    const validationTime = validationEndTime - validationStartTime;

    const totalEndTime = performance.now();
    const totalStartupTime = totalEndTime - totalStartTime;

    // 记录配置后内存使用
    const afterConfigMemory = this.getMemoryUsage();

    const metrics: StartupMetrics = {
      configInitTime,
      validationTime,
      fileLoadTime,
      totalStartupTime,
      memoryUsage: {
        initial: initialMemory,
        afterConfig: afterConfigMemory,
        increase: afterConfigMemory - initialMemory
      }
    };

    this.metrics.push(metrics);

    // 清理
    await configManager.dispose();

    return metrics;
  }

  /**
   * 比较不同配置选项的启动时间
   */
  async compareStartupOptions(): Promise<{
    baseline: StartupMetrics;
    optimized: StartupMetrics;
    improvement: {
      timeReduction: number;
      memoryReduction: number;
      percentageImprovement: number;
    };
  }> {
    console.log('分析基线启动时间...');
    const baseline = await this.analyzeStartupTime({
      enableValidation: true,
      enableHotReload: true,
      preloadConfig: false,
      useCache: false,
      lazyLoad: false
    });

    console.log('分析优化后启动时间...');
    const optimized = await this.analyzeStartupTime({
      enableValidation: false, // 延迟验证
      enableHotReload: false,  // 生产环境禁用
      preloadConfig: true,     // 预加载配置
      useCache: true,          // 启用缓存
      lazyLoad: true           // 延迟加载
    });

    const timeReduction = baseline.totalStartupTime - optimized.totalStartupTime;
    const memoryReduction = baseline.memoryUsage.increase - optimized.memoryUsage.increase;
    const percentageImprovement = (timeReduction / baseline.totalStartupTime) * 100;

    return {
      baseline,
      optimized,
      improvement: {
        timeReduction,
        memoryReduction,
        percentageImprovement
      }
    };
  }

  /**
   * 生成启动时间报告
   */
  generateStartupReport(): string {
    if (this.metrics.length === 0) {
      return '没有可用的启动时间数据';
    }

    const avgMetrics = this.calculateAverageMetrics();
    
    let report = '# 配置系统启动时间分析报告\n\n';
    
    report += '## 平均启动时间指标\n\n';
    report += `- 配置初始化时间: ${avgMetrics.configInitTime.toFixed(2)}ms\n`;
    report += `- 文件加载时间: ${avgMetrics.fileLoadTime.toFixed(2)}ms\n`;
    report += `- 验证时间: ${avgMetrics.validationTime.toFixed(2)}ms\n`;
    report += `- 总启动时间: ${avgMetrics.totalStartupTime.toFixed(2)}ms\n\n`;
    
    report += '## 内存使用情况\n\n';
    report += `- 初始内存: ${(avgMetrics.memoryUsage.initial / 1024 / 1024).toFixed(2)}MB\n`;
    report += `- 配置后内存: ${(avgMetrics.memoryUsage.afterConfig / 1024 / 1024).toFixed(2)}MB\n`;
    report += `- 内存增长: ${(avgMetrics.memoryUsage.increase / 1024 / 1024).toFixed(2)}MB\n\n`;
    
    report += '## 性能分析\n\n';
    
    if (avgMetrics.totalStartupTime > 100) {
      report += '⚠️ **警告**: 启动时间超过100ms，可能影响用户体验\n\n';
      report += '### 优化建议:\n';
      report += '1. 考虑禁用开发环境功能（如热重载）\n';
      report += '2. 延迟配置验证到后台执行\n';
      report += '3. 使用配置缓存减少文件I/O\n';
      report += '4. 实现配置的延迟加载\n\n';
    } else {
      report += '✅ **良好**: 启动时间在可接受范围内\n\n';
    }
    
    if (avgMetrics.memoryUsage.increase > 5 * 1024 * 1024) {
      report += '⚠️ **警告**: 内存使用增长超过5MB\n\n';
      report += '### 内存优化建议:\n';
      report += '1. 优化配置数据结构\n';
      report += '2. 实现配置的按需加载\n';
      report += '3. 清理不必要的配置缓存\n\n';
    }
    
    report += '## 详细指标历史\n\n';
    report += '| 测试 | 配置初始化 | 文件加载 | 验证时间 | 总时间 | 内存增长 |\n';
    report += '|------|------------|----------|----------|--------|----------|\n';
    
    this.metrics.forEach((metric, index) => {
      report += `| ${index + 1} | ${metric.configInitTime.toFixed(2)}ms | ${metric.fileLoadTime.toFixed(2)}ms | ${metric.validationTime.toFixed(2)}ms | ${metric.totalStartupTime.toFixed(2)}ms | ${(metric.memoryUsage.increase / 1024 / 1024).toFixed(2)}MB |\n`;
    });
    
    return report;
  }

  /**
   * 获取启动优化建议
   */
  getOptimizationRecommendations(): string[] {
    if (this.metrics.length === 0) {
      return ['请先运行启动时间分析'];
    }

    const avgMetrics = this.calculateAverageMetrics();
    const recommendations: string[] = [];

    // 基于启动时间的建议
    if (avgMetrics.totalStartupTime > 100) {
      recommendations.push('总启动时间过长，考虑以下优化：');
      
      if (avgMetrics.fileLoadTime > 50) {
        recommendations.push('- 文件加载时间过长，考虑使用配置缓存或预加载');
      }
      
      if (avgMetrics.validationTime > 20) {
        recommendations.push('- 验证时间过长，考虑延迟验证或简化验证规则');
      }
      
      if (avgMetrics.configInitTime > 30) {
        recommendations.push('- 配置初始化时间过长，考虑优化初始化逻辑');
      }
    }

    // 基于内存使用的建议
    if (avgMetrics.memoryUsage.increase > 5 * 1024 * 1024) {
      recommendations.push('内存使用过多，考虑以下优化：');
      recommendations.push('- 优化配置数据结构，减少内存占用');
      recommendations.push('- 实现配置的按需加载');
      recommendations.push('- 定期清理配置缓存');
    }

    // 通用优化建议
    recommendations.push('通用优化建议：');
    recommendations.push('- 在生产环境中禁用开发功能（热重载、调试等）');
    recommendations.push('- 使用配置预加载减少运行时开销');
    recommendations.push('- 实现配置的增量更新');
    recommendations.push('- 考虑使用Web Workers进行后台配置处理');

    return recommendations;
  }

  /**
   * 重置分析数据
   */
  reset(): void {
    this.metrics = [];
  }

  /**
   * 获取内存使用情况
   */
  private getMemoryUsage(): number {
    if (typeof performance !== 'undefined' && (performance as any).memory) {
      return (performance as any).memory.usedJSHeapSize;
    }
    return 0;
  }

  /**
   * 计算平均指标
   */
  private calculateAverageMetrics(): StartupMetrics {
    if (this.metrics.length === 0) {
      throw new Error('没有可用的指标数据');
    }

    const sum = this.metrics.reduce((acc, metric) => ({
      configInitTime: acc.configInitTime + metric.configInitTime,
      validationTime: acc.validationTime + metric.validationTime,
      fileLoadTime: acc.fileLoadTime + metric.fileLoadTime,
      totalStartupTime: acc.totalStartupTime + metric.totalStartupTime,
      memoryUsage: {
        initial: acc.memoryUsage.initial + metric.memoryUsage.initial,
        afterConfig: acc.memoryUsage.afterConfig + metric.memoryUsage.afterConfig,
        increase: acc.memoryUsage.increase + metric.memoryUsage.increase
      }
    }), {
      configInitTime: 0,
      validationTime: 0,
      fileLoadTime: 0,
      totalStartupTime: 0,
      memoryUsage: { initial: 0, afterConfig: 0, increase: 0 }
    });

    const count = this.metrics.length;
    
    return {
      configInitTime: sum.configInitTime / count,
      validationTime: sum.validationTime / count,
      fileLoadTime: sum.fileLoadTime / count,
      totalStartupTime: sum.totalStartupTime / count,
      memoryUsage: {
        initial: sum.memoryUsage.initial / count,
        afterConfig: sum.memoryUsage.afterConfig / count,
        increase: sum.memoryUsage.increase / count
      }
    };
  }
}

/**
 * 启动优化工具
 */
export class StartupOptimizer {
  /**
   * 创建优化的配置管理器
   */
  static createOptimizedConfigManager(isProduction: boolean = false) {
    return createConfigManager({
      enableValidation: !isProduction, // 生产环境禁用验证
      enableHotReload: !isProduction,  // 生产环境禁用热重载
      configPath: './config.json',
      onConfigChange: isProduction ? undefined : (config, errors) => {
        if (errors.length > 0) {
          console.warn('配置错误:', errors);
        }
      }
    });
  }

  /**
   * 预热配置系统
   */
  static async warmupConfigSystem(): Promise<void> {
    const configManager = this.createOptimizedConfigManager(true);
    
    try {
      // 预加载配置
      await configManager.initialize();
      
      // 预热常用配置路径
      const commonPaths = [
        'app.points.min',
        'app.points.max',
        'ui.theme',
        'ui.colors.primary',
        'performance.cache.enabled'
      ];
      
      commonPaths.forEach(path => {
        configManager.get(path);
      });
      
    } finally {
      await configManager.dispose();
    }
  }

  /**
   * 获取启动优化配置
   */
  static getOptimizedStartupConfig(): Partial<StartupOptimizationOptions> {
    const isProduction = process.env.NODE_ENV === 'production';
    const isDevelopment = process.env.NODE_ENV === 'development';
    
    return {
      enableValidation: isDevelopment,
      enableHotReload: isDevelopment,
      preloadConfig: true,
      useCache: true,
      lazyLoad: isProduction
    };
  }
}

/**
 * 启动时间基准测试
 */
export async function runStartupBenchmark(): Promise<void> {
  console.log('开始配置系统启动时间基准测试...\n');
  
  const analyzer = new StartupAnalyzer();
  
  // 运行多次测试以获得平均值
  console.log('运行基准测试（5次）...');
  for (let i = 0; i < 5; i++) {
    console.log(`测试 ${i + 1}/5`);
    await analyzer.analyzeStartupTime();
  }
  
  // 生成报告
  const report = analyzer.generateStartupReport();
  console.log('\n' + report);
  
  // 获取优化建议
  const recommendations = analyzer.getOptimizationRecommendations();
  console.log('\n## 优化建议\n');
  recommendations.forEach(rec => console.log(rec));
  
  // 比较优化效果
  console.log('\n开始优化效果对比测试...');
  const comparison = await analyzer.compareStartupOptions();
  
  console.log('\n## 优化效果对比\n');
  console.log(`基线启动时间: ${comparison.baseline.totalStartupTime.toFixed(2)}ms`);
  console.log(`优化后启动时间: ${comparison.optimized.totalStartupTime.toFixed(2)}ms`);
  console.log(`时间减少: ${comparison.improvement.timeReduction.toFixed(2)}ms`);
  console.log(`性能提升: ${comparison.improvement.percentageImprovement.toFixed(1)}%`);
  console.log(`内存减少: ${(comparison.improvement.memoryReduction / 1024 / 1024).toFixed(2)}MB`);
}

// 导出类型
export type { StartupMetrics, StartupOptimizationOptions };

/**
 * 使用示例：
 * 
 * ```typescript
 * // 运行启动时间分析
 * const analyzer = new StartupAnalyzer();
 * const metrics = await analyzer.analyzeStartupTime({
 *   enableValidation: false,
 *   enableHotReload: false
 * });
 * 
 * console.log('启动时间:', metrics.totalStartupTime);
 * 
 * // 生成报告
 * const report = analyzer.generateStartupReport();
 * console.log(report);
 * 
 * // 创建优化的配置管理器
 * const optimizedManager = StartupOptimizer.createOptimizedConfigManager(true);
 * 
 * // 运行完整基准测试
 * await runStartupBenchmark();
 * ```
 */