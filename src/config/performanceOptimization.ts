/**
 * 配置系统性能优化工具
 * 提供配置访问缓存、批量更新优化和性能监控功能
 */

import { AppConfiguration, ConfigPath } from './types';
import { deepClone } from './utils';

// 配置缓存接口
interface ConfigCache {
  get<T = any>(key: string): T | undefined;
  set<T = any>(key: string, value: T, ttl?: number): void;
  has(key: string): boolean;
  delete(key: string): boolean;
  clear(): void;
  size(): number;
  getStats(): CacheStats;
}

// 缓存统计信息
interface CacheStats {
  hits: number;
  misses: number;
  hitRate: number;
  size: number;
  maxSize: number;
}

// 缓存项
interface CacheItem<T = any> {
  value: T;
  timestamp: number;
  ttl: number;
  accessCount: number;
  lastAccess: number;
}

// 性能监控指标
interface PerformanceMetrics {
  configAccess: {
    totalCount: number;
    averageTime: number;
    maxTime: number;
    minTime: number;
  };
  configUpdate: {
    totalCount: number;
    averageTime: number;
    maxTime: number;
    minTime: number;
  };
  validation: {
    totalCount: number;
    averageTime: number;
    maxTime: number;
    minTime: number;
  };
  cache: CacheStats;
}

/**
 * LRU缓存实现
 */
class LRUCache implements ConfigCache {
  private cache = new Map<string, CacheItem>();
  private maxSize: number;
  private stats: CacheStats;

  constructor(maxSize: number = 1000) {
    this.maxSize = maxSize;
    this.stats = {
      hits: 0,
      misses: 0,
      hitRate: 0,
      size: 0,
      maxSize
    };
  }

  get<T = any>(key: string): T | undefined {
    const item = this.cache.get(key);
    
    if (!item) {
      this.stats.misses++;
      this.updateHitRate();
      return undefined;
    }

    // 检查是否过期
    if (this.isExpired(item)) {
      this.cache.delete(key);
      this.stats.misses++;
      this.updateHitRate();
      return undefined;
    }

    // 更新访问信息
    item.accessCount++;
    item.lastAccess = Date.now();
    
    // 移到最前面（LRU）
    this.cache.delete(key);
    this.cache.set(key, item);

    this.stats.hits++;
    this.updateHitRate();
    
    return item.value as T;
  }

  set<T = any>(key: string, value: T, ttl: number = 300000): void {
    // 如果缓存已满，删除最久未使用的项
    if (this.cache.size >= this.maxSize && !this.cache.has(key)) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) {
        this.cache.delete(firstKey);
      }
    }

    const item: CacheItem<T> = {
      value,
      timestamp: Date.now(),
      ttl,
      accessCount: 1,
      lastAccess: Date.now()
    };

    this.cache.set(key, item);
    this.stats.size = this.cache.size;
  }

  has(key: string): boolean {
    const item = this.cache.get(key);
    return item !== undefined && !this.isExpired(item);
  }

  delete(key: string): boolean {
    const deleted = this.cache.delete(key);
    this.stats.size = this.cache.size;
    return deleted;
  }

  clear(): void {
    this.cache.clear();
    this.stats.size = 0;
    this.stats.hits = 0;
    this.stats.misses = 0;
    this.stats.hitRate = 0;
  }

  size(): number {
    return this.cache.size;
  }

  getStats(): CacheStats {
    return { ...this.stats };
  }

  private isExpired(item: CacheItem): boolean {
    return Date.now() - item.timestamp > item.ttl;
  }

  private updateHitRate(): void {
    const total = this.stats.hits + this.stats.misses;
    this.stats.hitRate = total > 0 ? this.stats.hits / total : 0;
  }

  // 清理过期项
  cleanup(): number {
    let cleaned = 0;
    const now = Date.now();
    
    for (const [key, item] of this.cache.entries()) {
      if (now - item.timestamp > item.ttl) {
        this.cache.delete(key);
        cleaned++;
      }
    }
    
    this.stats.size = this.cache.size;
    return cleaned;
  }
}

/**
 * 性能监控器
 */
class PerformanceMonitor {
  private metrics: PerformanceMetrics;
  private cache: ConfigCache;

  constructor(cache: ConfigCache) {
    this.cache = cache;
    this.metrics = {
      configAccess: {
        totalCount: 0,
        averageTime: 0,
        maxTime: 0,
        minTime: Infinity
      },
      configUpdate: {
        totalCount: 0,
        averageTime: 0,
        maxTime: 0,
        minTime: Infinity
      },
      validation: {
        totalCount: 0,
        averageTime: 0,
        maxTime: 0,
        minTime: Infinity
      },
      cache: cache.getStats()
    };
  }

  // 测量配置访问性能
  measureConfigAccess<T>(operation: () => T): T {
    const startTime = performance.now();
    const result = operation();
    const endTime = performance.now();
    const duration = endTime - startTime;

    this.updateMetrics('configAccess', duration);
    return result;
  }

  // 测量配置更新性能
  measureConfigUpdate<T>(operation: () => T): T {
    const startTime = performance.now();
    const result = operation();
    const endTime = performance.now();
    const duration = endTime - startTime;

    this.updateMetrics('configUpdate', duration);
    return result;
  }

  // 测量验证性能
  measureValidation<T>(operation: () => T): T {
    const startTime = performance.now();
    const result = operation();
    const endTime = performance.now();
    const duration = endTime - startTime;

    this.updateMetrics('validation', duration);
    return result;
  }

  // 获取性能指标
  getMetrics(): PerformanceMetrics {
    return {
      ...this.metrics,
      cache: this.cache.getStats()
    };
  }

  // 重置指标
  resetMetrics(): void {
    this.metrics = {
      configAccess: {
        totalCount: 0,
        averageTime: 0,
        maxTime: 0,
        minTime: Infinity
      },
      configUpdate: {
        totalCount: 0,
        averageTime: 0,
        maxTime: 0,
        minTime: Infinity
      },
      validation: {
        totalCount: 0,
        averageTime: 0,
        maxTime: 0,
        minTime: Infinity
      },
      cache: this.cache.getStats()
    };
  }

  private updateMetrics(type: 'configAccess' | 'configUpdate' | 'validation', duration: number): void {
    const metric = this.metrics[type];
    
    metric.totalCount++;
    metric.maxTime = Math.max(metric.maxTime, duration);
    metric.minTime = Math.min(metric.minTime, duration);
    
    // 计算移动平均值
    metric.averageTime = (metric.averageTime * (metric.totalCount - 1) + duration) / metric.totalCount;
  }
}

/**
 * 批量更新优化器
 */
class BatchUpdateOptimizer {
  private pendingUpdates = new Map<string, any>();
  private batchTimeout: NodeJS.Timeout | null = null;
  private batchDelay: number;
  private onBatchUpdate: (updates: Record<string, any>) => void;

  constructor(batchDelay: number = 50, onBatchUpdate: (updates: Record<string, any>) => void) {
    this.batchDelay = batchDelay;
    this.onBatchUpdate = onBatchUpdate;
  }

  // 添加更新到批次
  addUpdate(path: string, value: any): void {
    this.pendingUpdates.set(path, value);
    
    // 重置批次定时器
    if (this.batchTimeout) {
      clearTimeout(this.batchTimeout);
    }
    
    this.batchTimeout = setTimeout(() => {
      this.flushUpdates();
    }, this.batchDelay);
  }

  // 立即执行所有待处理的更新
  flushUpdates(): void {
    if (this.pendingUpdates.size === 0) {
      return;
    }

    const updates = Object.fromEntries(this.pendingUpdates);
    this.pendingUpdates.clear();
    
    if (this.batchTimeout) {
      clearTimeout(this.batchTimeout);
      this.batchTimeout = null;
    }

    this.onBatchUpdate(updates);
  }

  // 取消所有待处理的更新
  cancelUpdates(): void {
    this.pendingUpdates.clear();
    
    if (this.batchTimeout) {
      clearTimeout(this.batchTimeout);
      this.batchTimeout = null;
    }
  }

  // 获取待处理更新数量
  getPendingCount(): number {
    return this.pendingUpdates.size;
  }
}

/**
 * 配置访问优化器
 */
class ConfigAccessOptimizer {
  private cache: ConfigCache;
  private monitor: PerformanceMonitor;
  private batchOptimizer: BatchUpdateOptimizer;

  constructor(
    cacheSize: number = 1000,
    batchDelay: number = 50,
    onBatchUpdate: (updates: Record<string, any>) => void
  ) {
    this.cache = new LRUCache(cacheSize);
    this.monitor = new PerformanceMonitor(this.cache);
    this.batchOptimizer = new BatchUpdateOptimizer(batchDelay, onBatchUpdate);
  }

  // 优化的配置获取
  getConfig<T = any>(key: string, getter: () => T): T {
    return this.monitor.measureConfigAccess(() => {
      // 尝试从缓存获取
      const cached = this.cache.get<T>(key);
      if (cached !== undefined) {
        return cached;
      }

      // 缓存未命中，执行实际获取
      const value = getter();
      
      // 缓存结果
      this.cache.set(key, value);
      
      return value;
    });
  }

  // 优化的配置设置
  setConfig(path: string, value: any): void {
    this.monitor.measureConfigUpdate(() => {
      // 清除相关缓存
      this.invalidateCache(path);
      
      // 添加到批量更新
      this.batchOptimizer.addUpdate(path, value);
    });
  }

  // 批量配置更新
  batchUpdate(updates: Record<string, any>): void {
    this.monitor.measureConfigUpdate(() => {
      // 清除所有相关缓存
      Object.keys(updates).forEach(path => {
        this.invalidateCache(path);
      });

      // 执行批量更新
      Object.entries(updates).forEach(([path, value]) => {
        this.batchOptimizer.addUpdate(path, value);
      });
    });
  }

  // 立即执行待处理的更新
  flushUpdates(): void {
    this.batchOptimizer.flushUpdates();
  }

  // 清除缓存
  clearCache(): void {
    this.cache.clear();
  }

  // 清理过期缓存
  cleanupCache(): number {
    if (this.cache instanceof LRUCache) {
      return this.cache.cleanup();
    }
    return 0;
  }

  // 获取性能指标
  getPerformanceMetrics(): PerformanceMetrics {
    return this.monitor.getMetrics();
  }

  // 重置性能指标
  resetPerformanceMetrics(): void {
    this.monitor.resetMetrics();
  }

  // 获取缓存统计
  getCacheStats(): CacheStats {
    return this.cache.getStats();
  }

  // 预热缓存
  warmupCache(config: AppConfiguration, paths: ConfigPath[]): void {
    paths.forEach(path => {
      const value = this.getConfigValueByPath(config, path);
      this.cache.set(path, value);
    });
  }

  private invalidateCache(path: string): void {
    // 删除精确匹配的缓存
    this.cache.delete(path);
    
    // 删除相关的父路径和子路径缓存
    const pathParts = path.split('.');
    
    // 删除父路径缓存
    for (let i = pathParts.length - 1; i > 0; i--) {
      const parentPath = pathParts.slice(0, i).join('.');
      this.cache.delete(parentPath);
    }
    
    // 删除子路径缓存（通过遍历所有缓存键）
    const cacheKeys = Array.from((this.cache as any).cache?.keys() || []);
    cacheKeys.forEach(key => {
      if (key.startsWith(path + '.')) {
        this.cache.delete(key);
      }
    });
  }

  private getConfigValueByPath(config: any, path: string): any {
    const keys = path.split('.');
    let current = config;
    
    for (const key of keys) {
      if (current && typeof current === 'object' && key in current) {
        current = current[key];
      } else {
        return undefined;
      }
    }
    
    return current;
  }
}

/**
 * 性能优化工厂函数
 */
export function createPerformanceOptimizer(options: {
  cacheSize?: number;
  batchDelay?: number;
  onBatchUpdate: (updates: Record<string, any>) => void;
}): ConfigAccessOptimizer {
  return new ConfigAccessOptimizer(
    options.cacheSize || 1000,
    options.batchDelay || 50,
    options.onBatchUpdate
  );
}

/**
 * 性能分析工具
 */
export class PerformanceAnalyzer {
  private optimizer: ConfigAccessOptimizer;

  constructor(optimizer: ConfigAccessOptimizer) {
    this.optimizer = optimizer;
  }

  // 分析性能瓶颈
  analyzePerformance(): {
    recommendations: string[];
    metrics: PerformanceMetrics;
    issues: string[];
  } {
    const metrics = this.optimizer.getPerformanceMetrics();
    const recommendations: string[] = [];
    const issues: string[] = [];

    // 分析配置访问性能
    if (metrics.configAccess.averageTime > 1) {
      issues.push('配置访问平均时间过长');
      recommendations.push('考虑增加缓存大小或优化配置结构');
    }

    // 分析缓存命中率
    if (metrics.cache.hitRate < 0.8) {
      issues.push('缓存命中率较低');
      recommendations.push('考虑调整缓存策略或增加缓存大小');
    }

    // 分析配置更新性能
    if (metrics.configUpdate.averageTime > 5) {
      issues.push('配置更新平均时间过长');
      recommendations.push('考虑使用批量更新或优化验证逻辑');
    }

    // 分析验证性能
    if (metrics.validation.averageTime > 10) {
      issues.push('配置验证平均时间过长');
      recommendations.push('考虑优化验证规则或使用异步验证');
    }

    return {
      recommendations,
      metrics,
      issues
    };
  }

  // 生成性能报告
  generateReport(): string {
    const analysis = this.analyzePerformance();
    const { metrics, recommendations, issues } = analysis;

    let report = '# 配置系统性能报告\n\n';
    
    report += '## 性能指标\n\n';
    report += `- 配置访问: 平均 ${metrics.configAccess.averageTime.toFixed(2)}ms, 总计 ${metrics.configAccess.totalCount} 次\n`;
    report += `- 配置更新: 平均 ${metrics.configUpdate.averageTime.toFixed(2)}ms, 总计 ${metrics.configUpdate.totalCount} 次\n`;
    report += `- 配置验证: 平均 ${metrics.validation.averageTime.toFixed(2)}ms, 总计 ${metrics.validation.totalCount} 次\n`;
    report += `- 缓存命中率: ${(metrics.cache.hitRate * 100).toFixed(1)}% (${metrics.cache.hits}/${metrics.cache.hits + metrics.cache.misses})\n\n`;

    if (issues.length > 0) {
      report += '## 发现的问题\n\n';
      issues.forEach((issue, index) => {
        report += `${index + 1}. ${issue}\n`;
      });
      report += '\n';
    }

    if (recommendations.length > 0) {
      report += '## 优化建议\n\n';
      recommendations.forEach((rec, index) => {
        report += `${index + 1}. ${rec}\n`;
      });
      report += '\n';
    }

    return report;
  }
}

// 导出类型和工具
export {
  ConfigCache,
  CacheStats,
  PerformanceMetrics,
  LRUCache,
  PerformanceMonitor,
  BatchUpdateOptimizer,
  ConfigAccessOptimizer
};

/**
 * 使用示例：
 * 
 * ```typescript
 * // 创建性能优化器
 * const optimizer = createPerformanceOptimizer({
 *   cacheSize: 1000,
 *   batchDelay: 50,
 *   onBatchUpdate: (updates) => {
 *     // 处理批量更新
 *     console.log('批量更新:', updates);
 *   }
 * });
 * 
 * // 优化的配置访问
 * const theme = optimizer.getConfig('ui.theme', () => config.ui.theme);
 * 
 * // 优化的配置更新
 * optimizer.setConfig('ui.theme', 'dark');
 * 
 * // 获取性能指标
 * const metrics = optimizer.getPerformanceMetrics();
 * console.log('性能指标:', metrics);
 * 
 * // 性能分析
 * const analyzer = new PerformanceAnalyzer(optimizer);
 * const report = analyzer.generateReport();
 * console.log(report);
 * ```
 */