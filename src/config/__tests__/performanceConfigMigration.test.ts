/**
 * 性能配置迁移测试
 * 验证性能和缓存配置是否正确迁移到配置系统
 */

import { DEFAULT_CONFIG } from '../defaultConfig';
import { setGlobalConfig, getGlobalConfig, getConfigValue } from '../globalConfig';
import { ComputationCache } from '../../utils/performance';

describe('性能配置迁移测试', () => {
  beforeEach(() => {
    // 重置全局配置
    setGlobalConfig(DEFAULT_CONFIG);
    
    // 清空缓存
    ComputationCache.clear();
  });

  describe('缓存配置', () => {
    it('应该从配置系统获取缓存大小', () => {
      const cacheConfig = getConfigValue('performance.cache');
      
      expect(cacheConfig).toBeDefined();
      expect(cacheConfig.maxSize).toBe(100);
      expect(cacheConfig.defaultTTL).toBe(300000); // 5分钟
      expect(cacheConfig.partitionCacheSize).toBe(20);
    });

    it('应该使用配置的缓存大小限制', () => {
      // 设置较小的缓存大小用于测试
      const testConfig = {
        ...DEFAULT_CONFIG,
        performance: {
          ...DEFAULT_CONFIG.performance,
          cache: {
            ...DEFAULT_CONFIG.performance.cache,
            maxSize: 2
          }
        }
      };
      
      setGlobalConfig(testConfig);

      // 添加缓存项直到超过限制
      ComputationCache.set('key1', 'data1');
      ComputationCache.set('key2', 'data2');
      ComputationCache.set('key3', 'data3'); // 应该删除最旧的项

      const stats = ComputationCache.getStats();
      expect(stats.maxSize).toBe(2);
    });

    it('应该使用配置的TTL值', () => {
      const testConfig = {
        ...DEFAULT_CONFIG,
        performance: {
          ...DEFAULT_CONFIG.performance,
          cache: {
            ...DEFAULT_CONFIG.performance.cache,
            defaultTTL: 1000 // 1秒
          }
        }
      };
      
      setGlobalConfig(testConfig);

      ComputationCache.set('testKey', 'testData');
      
      // 立即获取应该成功
      expect(ComputationCache.get('testKey')).toBe('testData');
      
      // 等待TTL过期后应该返回null
      return new Promise<void>((resolve) => {
        setTimeout(() => {
          expect(ComputationCache.get('testKey')).toBeNull();
          resolve();
        }, 1100);
      });
    });
  });

  describe('渲染配置', () => {
    it('应该包含WebGL渲染配置', () => {
      const webglConfig = getConfigValue('performance.rendering.webgl');
      
      expect(webglConfig).toBeDefined();
      expect(webglConfig.pointSize).toBe(3.0);
      expect(webglConfig.maxPointSize).toBe(10.0);
      expect(webglConfig.lineWidth).toBe(2.0);
    });

    it('应该包含Canvas2D渲染配置', () => {
      const canvas2dConfig = getConfigValue('performance.rendering.canvas2d');
      
      expect(canvas2dConfig).toBeDefined();
      expect(canvas2dConfig.lineWidth).toBe(1.0);
      expect(canvas2dConfig.pointRadius).toBe(2.0);
    });
  });

  describe('性能基准配置', () => {
    it('应该包含基准阈值配置', () => {
      const benchmarkConfig = getConfigValue('performance.performance.benchmarkThresholds');
      
      expect(benchmarkConfig).toBeDefined();
      expect(benchmarkConfig.fast).toBe(50);
      expect(benchmarkConfig.medium).toBe(100);
      expect(benchmarkConfig.slow).toBe(500);
    });

    it('应该包含批处理大小配置', () => {
      const batchConfig = getConfigValue('performance.performance.batchSizes');
      
      expect(batchConfig).toBeDefined();
      expect(batchConfig.pathGeneration).toBe(1000);
      expect(batchConfig.rendering).toBe(5000);
    });
  });

  describe('配置动态应用', () => {
    it('应该在配置更新时动态应用新的缓存设置', () => {
      // 初始配置
      let stats = ComputationCache.getStats();
      expect(stats.maxSize).toBe(100);

      // 更新配置
      const newConfig = {
        ...DEFAULT_CONFIG,
        performance: {
          ...DEFAULT_CONFIG.performance,
          cache: {
            ...DEFAULT_CONFIG.performance.cache,
            maxSize: 50
          }
        }
      };
      
      setGlobalConfig(newConfig);

      // 验证新配置生效
      stats = ComputationCache.getStats();
      expect(stats.maxSize).toBe(50);
    });
  });

  describe('配置回退机制', () => {
    it('应该在配置不可用时使用默认值', () => {
      // 清除全局配置
      (window as any).__RAUZY_CONFIG__ = undefined;

      // 缓存应该仍然工作，使用默认值
      ComputationCache.set('fallbackTest', 'data');
      expect(ComputationCache.get('fallbackTest')).toBe('data');

      const stats = ComputationCache.getStats();
      expect(stats.maxSize).toBe(100); // 默认值
    });
  });
});