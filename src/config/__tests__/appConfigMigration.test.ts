/**
 * 应用核心配置迁移测试
 * 测试从constants.ts中的APP_CONFIG迁移到新配置系统的功能
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { DEFAULT_CONFIG } from '../defaultConfig';
import { ConfigManager } from '../ConfigManager';
import { AppConfiguration } from '../types';
import { validateConfigurationLogic } from '../validationRules';

describe('应用核心配置迁移', () => {
  let configManager: ConfigManager;

  beforeEach(async () => {
    configManager = new ConfigManager({
      enableValidation: true,
      enableHotReload: false,
      configPath: './test-config.json'
    });
    await configManager.initialize();
  });

  describe('点数配置迁移', () => {
    it('应该正确迁移点数范围配置', () => {
      const config = DEFAULT_CONFIG;
      
      // 验证点数配置结构
      expect(config.app.points).toBeDefined();
      expect(config.app.points.min).toBe(10000);
      expect(config.app.points.max).toBe(2000000);
      expect(config.app.points.step).toBe(10000);
      expect(config.app.points.default).toBe(50000);
    });

    it('应该支持通过配置路径访问点数配置', () => {
      expect(configManager.get('app.points.min')).toBe(10000);
      expect(configManager.get('app.points.max')).toBe(2000000);
      expect(configManager.get('app.points.step')).toBe(10000);
      expect(configManager.get('app.points.default')).toBe(50000);
    });

    it('应该支持动态修改点数配置', () => {
      configManager.set('app.points.min', 5000);
      configManager.set('app.points.max', 1000000);
      
      expect(configManager.get('app.points.min')).toBe(5000);
      expect(configManager.get('app.points.max')).toBe(1000000);
    });
  });

  describe('路径配置迁移', () => {
    it('应该正确迁移路径限制配置', () => {
      const config = DEFAULT_CONFIG;
      
      expect(config.app.paths).toBeDefined();
      expect(config.app.paths.maxCount).toBe(20000);
    });

    it('应该支持通过配置路径访问路径配置', () => {
      expect(configManager.get('app.paths.maxCount')).toBe(20000);
    });

    it('应该支持动态修改路径限制', () => {
      configManager.set('app.paths.maxCount', 30000);
      
      expect(configManager.get('app.paths.maxCount')).toBe(30000);
    });
  });

  describe('画布配置迁移', () => {
    it('应该正确迁移画布配置', () => {
      const config = DEFAULT_CONFIG;
      
      expect(config.app.canvas).toBeDefined();
      expect(config.app.canvas.aspectRatio).toBe(4 / 3);
      expect(config.app.canvas.defaultWidth).toBe(800);
      expect(config.app.canvas.defaultHeight).toBe(600);
    });

    it('应该支持通过配置路径访问画布配置', () => {
      expect(configManager.get('app.canvas.aspectRatio')).toBe(4 / 3);
      expect(configManager.get('app.canvas.defaultWidth')).toBe(800);
      expect(configManager.get('app.canvas.defaultHeight')).toBe(600);
    });

    it('应该支持动态修改画布配置', () => {
      configManager.set('app.canvas.aspectRatio', 16 / 9);
      configManager.set('app.canvas.defaultWidth', 1200);
      
      expect(configManager.get('app.canvas.aspectRatio')).toBe(16 / 9);
      expect(configManager.get('app.canvas.defaultWidth')).toBe(1200);
    });
  });

  describe('配置验证', () => {
    it('应该验证点数配置的有效性', () => {
      const invalidConfig: Partial<AppConfiguration> = {
        app: {
          points: {
            min: -1000, // 无效的负数
            max: 100, // 最大值小于最小值
            step: 0, // 无效的步长
            default: 5000000 // 超出范围的默认值
          },
          paths: { maxCount: 20000 },
          canvas: { aspectRatio: 4/3, defaultWidth: 800, defaultHeight: 600 }
        }
      };

      const result = validateConfigurationLogic(invalidConfig as AppConfiguration);
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('应该验证路径配置的有效性', () => {
      const invalidConfig: Partial<AppConfiguration> = {
        app: {
          points: { min: 10000, max: 2000000, step: 10000, default: 50000 },
          paths: {
            maxCount: -100 // 无效的负数
          },
          canvas: { aspectRatio: 4/3, defaultWidth: 800, defaultHeight: 600 }
        }
      };

      const result = validateConfigurationLogic(invalidConfig as AppConfiguration);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.path.includes('paths.maxCount'))).toBe(true);
    });

    it('应该验证画布配置的有效性', () => {
      const invalidConfig: Partial<AppConfiguration> = {
        app: {
          points: { min: 10000, max: 2000000, step: 10000, default: 50000 },
          paths: { maxCount: 20000 },
          canvas: {
            aspectRatio: 0, // 无效的宽高比
            defaultWidth: -800, // 无效的负宽度
            defaultHeight: -600 // 无效的负高度
          }
        }
      };

      const result = validateConfigurationLogic(invalidConfig as AppConfiguration);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.path.includes('canvas'))).toBe(true);
    });
  });

  describe('向后兼容性', () => {
    it('应该保持与原APP_CONFIG常量相同的默认值', () => {
      const config = DEFAULT_CONFIG;
      
      // 验证迁移后的值与原常量值一致
      expect(config.app.points.min).toBe(10000); // 原 MIN_POINTS
      expect(config.app.points.max).toBe(2000000); // 原 MAX_POINTS
      expect(config.app.points.step).toBe(10000); // 原 POINTS_STEP
      expect(config.app.points.default).toBe(50000); // 原 DEFAULT_POINTS
      expect(config.app.paths.maxCount).toBe(20000); // 原 MAX_PATHS
      expect(config.app.canvas.aspectRatio).toBe(4 / 3); // 原 CANVAS_ASPECT_RATIO
    });

    it('应该支持配置文件格式的版本控制', () => {
      const config = DEFAULT_CONFIG;
      
      expect(config.version).toBeDefined();
      expect(typeof config.version).toBe('string');
      expect(config.lastModified).toBeDefined();
    });
  });

  describe('类型安全性', () => {
    it('应该提供完整的TypeScript类型支持', () => {
      // 这些调用应该通过TypeScript类型检查
      const minPoints: number = configManager.get('app.points.min');
      const maxPaths: number = configManager.get('app.paths.maxCount');
      const aspectRatio: number = configManager.get('app.canvas.aspectRatio');
      
      expect(typeof minPoints).toBe('number');
      expect(typeof maxPaths).toBe('number');
      expect(typeof aspectRatio).toBe('number');
    });
  });
});