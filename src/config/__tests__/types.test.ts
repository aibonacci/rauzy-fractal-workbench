/**
 * 配置类型定义测试
 */

import { describe, test, expect } from 'vitest';
import { 
  DEFAULT_CONFIG,
  getConfigValue,
  setConfigValue,
  deepClone,
  mergeConfig,
  TypeConverters
} from '../index';
import type { AppConfiguration, ConfigPath } from '../types';

describe('配置类型定义测试', () => {
  test('默认配置应该包含所有必需的字段', () => {
    expect(DEFAULT_CONFIG).toBeDefined();
    expect(DEFAULT_CONFIG.version).toBe('1.0.0');
    expect(DEFAULT_CONFIG.app).toBeDefined();
    expect(DEFAULT_CONFIG.ui).toBeDefined();
    expect(DEFAULT_CONFIG.performance).toBeDefined();
    expect(DEFAULT_CONFIG.development).toBeDefined();
  });

  test('应用配置应该包含正确的默认值', () => {
    const { app } = DEFAULT_CONFIG;
    
    expect(app.points.min).toBe(10000);
    expect(app.points.max).toBe(2000000);
    expect(app.points.step).toBe(10000);
    expect(app.points.default).toBe(50000);
    expect(app.paths.maxCount).toBe(20000);
    expect(app.canvas.aspectRatio).toBeCloseTo(4/3);
  });

  test('UI配置应该包含正确的默认值', () => {
    const { ui } = DEFAULT_CONFIG;
    
    expect(ui.colors.base.alpha1).toBe('rgba(209, 213, 219, 0.5)');
    expect(ui.colors.highlight).toHaveLength(6);
    expect(ui.animations.transitionDuration).toBe(200);
    expect(ui.notifications.defaultDuration).toBe(3000);
  });

  test('性能配置应该包含正确的默认值', () => {
    const { performance } = DEFAULT_CONFIG;
    
    expect(performance.cache.maxSize).toBe(100);
    expect(performance.cache.defaultTTL).toBe(300000);
    expect(performance.rendering.webgl.pointSize).toBe(3.0);
  });

  test('开发配置应该包含正确的默认值', () => {
    const { development } = DEFAULT_CONFIG;
    
    expect(development.testIds.pathInput).toBe('path-input');
    expect(development.debug.enabled).toBe(false);
    expect(development.features.hotReload).toBe(true);
    expect(development.language.defaultLanguage).toBe('en');
  });
});

describe('配置工具函数测试', () => {
  test('getConfigValue 应该正确获取配置值', () => {
    const value1 = getConfigValue(DEFAULT_CONFIG, 'app.points.min');
    expect(value1).toBe(10000);

    const value2 = getConfigValue(DEFAULT_CONFIG, 'ui.colors.base.alpha1');
    expect(value2).toBe('rgba(209, 213, 219, 0.5)');

    const value3 = getConfigValue(DEFAULT_CONFIG, 'development.testIds.pathInput');
    expect(value3).toBe('path-input');
  });

  test('setConfigValue 应该正确设置配置值', () => {
    const newConfig = setConfigValue(DEFAULT_CONFIG, 'app.points.min', 20000);
    
    expect(getConfigValue(newConfig, 'app.points.min')).toBe(20000);
    expect(getConfigValue(DEFAULT_CONFIG, 'app.points.min')).toBe(10000); // 原配置不变
  });

  test('deepClone 应该正确克隆对象', () => {
    const cloned = deepClone(DEFAULT_CONFIG);
    
    expect(cloned).toEqual(DEFAULT_CONFIG);
    expect(cloned).not.toBe(DEFAULT_CONFIG);
    expect(cloned.app).not.toBe(DEFAULT_CONFIG.app);
  });

  test('mergeConfig 应该正确合并配置', () => {
    const partial = {
      app: {
        points: {
          min: 5000
        }
      },
      ui: {
        colors: {
          axis: 'rgba(255, 0, 0, 0.5)'
        }
      }
    };

    const merged = mergeConfig(DEFAULT_CONFIG, partial);
    
    expect(getConfigValue(merged as AppConfiguration, 'app.points.min')).toBe(5000);
    expect(getConfigValue(merged as AppConfiguration, 'app.points.max')).toBe(2000000); // 保持原值
    expect(getConfigValue(merged as AppConfiguration, 'ui.colors.axis')).toBe('rgba(255, 0, 0, 0.5)');
  });
});

describe('类型转换器测试', () => {
  test('toNumber 应该正确转换数字', () => {
    expect(TypeConverters.toNumber(42)).toBe(42);
    expect(TypeConverters.toNumber('42')).toBe(42);
    expect(TypeConverters.toNumber('42.5')).toBe(42.5);
    expect(TypeConverters.toNumber('invalid', 100)).toBe(100);
    expect(TypeConverters.toNumber(null, 100)).toBe(100);
  });

  test('toString 应该正确转换字符串', () => {
    expect(TypeConverters.toString('hello')).toBe('hello');
    expect(TypeConverters.toString(42)).toBe('42');
    expect(TypeConverters.toString(true)).toBe('true');
    expect(TypeConverters.toString(null, 'default')).toBe('default');
  });

  test('toBoolean 应该正确转换布尔值', () => {
    expect(TypeConverters.toBoolean(true)).toBe(true);
    expect(TypeConverters.toBoolean(false)).toBe(false);
    expect(TypeConverters.toBoolean('true')).toBe(true);
    expect(TypeConverters.toBoolean('false')).toBe(false);
    expect(TypeConverters.toBoolean('1')).toBe(true);
    expect(TypeConverters.toBoolean('0')).toBe(false);
    expect(TypeConverters.toBoolean(1)).toBe(true);
    expect(TypeConverters.toBoolean(0)).toBe(false);
    expect(TypeConverters.toBoolean('invalid', true)).toBe(true);
  });

  test('toArray 应该正确转换数组', () => {
    expect(TypeConverters.toArray([1, 2, 3])).toEqual([1, 2, 3]);
    expect(TypeConverters.toArray('a,b,c')).toEqual(['a', 'b', 'c']);
    expect(TypeConverters.toArray('["a","b","c"]')).toEqual(['a', 'b', 'c']);
    expect(TypeConverters.toArray('invalid', ['default'])).toEqual(['default']);
  });
});