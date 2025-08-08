/**
 * 配置工具函数完整测试
 * 验证所有配置工具函数的正确性和边界情况处理
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  mergeConfig,
  deepClone,
  getConfigValue,
  setConfigValue,
  compareConfigs,
  getConfigPaths,
  isDebugEnabled,
  isFeatureEnabled,
  getLogLevel,
  getTestId,
  getAllTestIds,
  parseConfigPath,
  buildConfigPath,
  isValidConfigPath,
  configValueToString,
  configValueToNumber,
  configValueToBoolean,
  exportConfigToJson,
  importConfigFromJson,
  validateConfigValueType,
  validateConfigValueRange,
  cacheConfigValue,
  getCachedConfigValue,
  clearConfigCache,
  hasConfigCache
} from '../utils';
import { DEFAULT_CONFIG } from '../defaultConfig';
import { AppConfiguration } from '../types';

describe('配置工具函数', () => {
  describe('配置合并和克隆', () => {
    it('应该正确合并配置对象', () => {
      const base = {
        app: { points: { min: 100, max: 1000 } },
        ui: { theme: 'light' }
      };
      
      const override = {
        app: { points: { min: 200 } },
        performance: { cache: true }
      };
      
      const result = mergeConfig(base, override);
      
      expect(result.app.points.min).toBe(200);
      expect(result.app.points.max).toBe(1000);
      expect(result.ui.theme).toBe('light');
      expect(result.performance.cache).toBe(true);
    });

    it('应该正确深拷贝对象', () => {
      const original = {
        nested: { array: [1, 2, 3], object: { key: 'value' } }
      };
      
      const cloned = deepClone(original);
      
      expect(cloned).toEqual(original);
      expect(cloned).not.toBe(original);
      expect(cloned.nested).not.toBe(original.nested);
      expect(cloned.nested.array).not.toBe(original.nested.array);
    });

    it('应该处理null和undefined值', () => {
      expect(deepClone(null)).toBeNull();
      expect(deepClone(undefined)).toBeUndefined();
      
      const result = mergeConfig({ a: 1 }, { a: null });
      expect(result.a).toBeNull();
    });
  });

  describe('配置值访问', () => {
    const testConfig = {
      app: {
        points: { min: 100, max: 1000 },
        paths: { limit: 10 }
      },
      ui: {
        colors: { primary: '#000000' }
      }
    } as any;

    it('应该正确获取配置值', () => {
      expect(getConfigValue(testConfig, 'app.points.min')).toBe(100);
      expect(getConfigValue(testConfig, 'ui.colors.primary')).toBe('#000000');
      expect(getConfigValue(testConfig, 'app')).toEqual(testConfig.app);
    });

    it('应该在路径不存在时返回undefined', () => {
      expect(getConfigValue(testConfig, 'nonexistent.path')).toBeUndefined();
      expect(getConfigValue(testConfig, 'app.nonexistent')).toBeUndefined();
    });

    it('应该正确设置配置值', () => {
      const result = setConfigValue(testConfig, 'app.points.min', 200);
      
      expect(result.app.points.min).toBe(200);
      expect(result.app.points.max).toBe(1000); // 其他值不变
      expect(result).not.toBe(testConfig); // 返回新对象
    });

    it('应该正确创建嵌套路径', () => {
      const result = setConfigValue({}, 'new.nested.path', 'value');
      
      expect(result.new.nested.path).toBe('value');
    });
  });

  describe('配置比较', () => {
    it('应该正确比较配置差异', () => {
      const config1 = {
        app: { points: { min: 100, max: 1000 } },
        ui: { theme: 'light' }
      };
      
      const config2 = {
        app: { points: { min: 200, max: 1000 } },
        performance: { cache: true }
      };
      
      const diff = compareConfigs(config1 as any, config2 as any);
      
      expect(diff.added).toContain('performance.cache');
      expect(diff.removed).toContain('ui.theme');
      expect(diff.changed).toContain('app.points.min');
    });

    it('应该正确获取配置路径', () => {
      const config = {
        app: { points: { min: 100 } },
        ui: { theme: 'light' }
      };
      
      const paths = getConfigPaths(config);
      
      expect(paths).toContain('app.points.min');
      expect(paths).toContain('ui.theme');
    });
  });

  describe('调试和功能开关', () => {
    it('应该正确检查调试状态', () => {
      const debugConfig = {
        development: { debug: { enabled: true } }
      } as any;
      
      const nonDebugConfig = {
        development: { debug: { enabled: false } }
      } as any;
      
      expect(isDebugEnabled(debugConfig)).toBe(true);
      expect(isDebugEnabled(nonDebugConfig)).toBe(false);
    });

    it('应该正确检查功能开关', () => {
      const config = {
        development: {
          features: {
            hotReload: true,
            typeChecking: false
          }
        }
      } as any;
      
      expect(isFeatureEnabled(config, 'hotReload')).toBe(true);
      expect(isFeatureEnabled(config, 'typeChecking')).toBe(false);
      expect(isFeatureEnabled(config, 'nonexistent')).toBe(false);
    });

    it('应该正确获取日志级别', () => {
      const config = {
        development: { debug: { logLevel: 'info' } }
      } as any;
      
      expect(getLogLevel(config)).toBe('info');
    });
  });

  describe('测试ID工具', () => {
    it('应该正确获取测试ID', () => {
      expect(getTestId(DEFAULT_CONFIG, 'PATH_INPUT')).toBe('path-input');
      expect(getTestId(DEFAULT_CONFIG, 'ADD_PATH_BUTTON')).toBe('add-path-button');
    });

    it('应该为未知测试ID返回默认值', () => {
      expect(getTestId(DEFAULT_CONFIG, 'UNKNOWN_TEST_ID')).toBe('unknown-test-id');
    });

    it('应该正确获取所有测试ID', () => {
      const testIds = getAllTestIds(DEFAULT_CONFIG);
      
      expect(testIds).toHaveProperty('PATH_INPUT');
      expect(testIds).toHaveProperty('ADD_PATH_BUTTON');
      expect(typeof testIds.PATH_INPUT).toBe('string');
    });
  });

  describe('配置路径解析', () => {
    it('应该正确解析配置路径', () => {
      expect(parseConfigPath('app.points.min')).toEqual(['app', 'points', 'min']);
      expect(parseConfigPath('single')).toEqual(['single']);
      expect(parseConfigPath('')).toEqual([]);
    });

    it('应该正确构建配置路径', () => {
      expect(buildConfigPath(['app', 'points', 'min'])).toBe('app.points.min');
      expect(buildConfigPath(['single'])).toBe('single');
      expect(buildConfigPath([])).toBe('');
    });

    it('应该验证配置路径格式', () => {
      expect(isValidConfigPath('app.points.min')).toBe(true);
      expect(isValidConfigPath('validPath')).toBe(true);
      expect(isValidConfigPath('valid_path')).toBe(true);
      
      expect(isValidConfigPath('')).toBe(false);
      expect(isValidConfigPath('123invalid')).toBe(false);
      expect(isValidConfigPath('app..points')).toBe(false);
      expect(isValidConfigPath('app.123invalid')).toBe(false);
    });
  });

  describe('配置值类型转换', () => {
    it('应该正确转换为字符串', () => {
      expect(configValueToString('test')).toBe('test');
      expect(configValueToString(123)).toBe('123');
      expect(configValueToString(true)).toBe('true');
      expect(configValueToString(false)).toBe('false');
      expect(configValueToString(null)).toBe('');
      expect(configValueToString(undefined)).toBe('');
      expect(configValueToString({ key: 'value' })).toBe('{"key":"value"}');
      expect(configValueToString([1, 2, 3])).toBe('[1,2,3]');
    });

    it('应该正确转换为数字', () => {
      expect(configValueToNumber(123)).toBe(123);
      expect(configValueToNumber('456')).toBe(456);
      expect(configValueToNumber('123.45')).toBe(123.45);
      expect(configValueToNumber('invalid')).toBe(0);
      expect(configValueToNumber('invalid', 100)).toBe(100);
      expect(configValueToNumber(null)).toBe(0);
      expect(configValueToNumber(undefined)).toBe(0);
      expect(configValueToNumber(true)).toBe(0);
    });

    it('应该正确转换为布尔值', () => {
      expect(configValueToBoolean(true)).toBe(true);
      expect(configValueToBoolean(false)).toBe(false);
      
      expect(configValueToBoolean('true')).toBe(true);
      expect(configValueToBoolean('TRUE')).toBe(true);
      expect(configValueToBoolean('1')).toBe(true);
      expect(configValueToBoolean('yes')).toBe(true);
      expect(configValueToBoolean('YES')).toBe(true);
      expect(configValueToBoolean('on')).toBe(true);
      expect(configValueToBoolean('ON')).toBe(true);
      
      expect(configValueToBoolean('false')).toBe(false);
      expect(configValueToBoolean('0')).toBe(false);
      expect(configValueToBoolean('no')).toBe(false);
      expect(configValueToBoolean('off')).toBe(false);
      
      expect(configValueToBoolean(1)).toBe(true);
      expect(configValueToBoolean(0)).toBe(false);
      expect(configValueToBoolean(-1)).toBe(true);
      
      expect(configValueToBoolean(null)).toBe(false);
      expect(configValueToBoolean(undefined)).toBe(false);
      expect(configValueToBoolean('random')).toBe(false);
    });
  });

  describe('配置导入导出', () => {
    const testConfig = {
      app: { points: { min: 100, max: 1000 } },
      ui: { theme: 'light' }
    };

    it('应该正确导出配置为JSON', () => {
      const json = exportConfigToJson(testConfig as any);
      const parsed = JSON.parse(json);
      
      expect(parsed).toEqual(testConfig);
    });

    it('应该正确导出格式化的JSON', () => {
      const json = exportConfigToJson(testConfig as any, true);
      
      expect(json).toContain('\n');
      expect(json).toContain('  ');
    });

    it('应该正确导出压缩的JSON', () => {
      const json = exportConfigToJson(testConfig as any, false);
      
      expect(json).not.toContain('\n');
      expect(json).not.toContain('  ');
    });

    it('应该正确从JSON导入配置', () => {
      const json = JSON.stringify(testConfig);
      const imported = importConfigFromJson(json);
      
      expect(imported).toEqual(testConfig);
    });

    it('应该处理无效的JSON导入', () => {
      expect(() => importConfigFromJson('invalid json')).toThrow('配置导入失败');
      expect(() => importConfigFromJson('null')).toThrow('配置导入失败');
      expect(() => importConfigFromJson('"string"')).toThrow('配置导入失败');
      expect(() => importConfigFromJson('123')).toThrow('配置导入失败');
    });
  });

  describe('配置验证', () => {
    it('应该正确验证配置值类型', () => {
      expect(validateConfigValueType('test', 'string')).toBe(true);
      expect(validateConfigValueType(123, 'number')).toBe(true);
      expect(validateConfigValueType(true, 'boolean')).toBe(true);
      expect(validateConfigValueType({}, 'object')).toBe(true);
      expect(validateConfigValueType([], 'array')).toBe(true);
      
      expect(validateConfigValueType('test', 'number')).toBe(false);
      expect(validateConfigValueType(123, 'string')).toBe(false);
      expect(validateConfigValueType(null, 'object')).toBe(false);
      expect(validateConfigValueType({}, 'array')).toBe(false);
      expect(validateConfigValueType([], 'object')).toBe(false);
    });

    it('应该正确验证配置值范围', () => {
      expect(validateConfigValueRange(50, 0, 100)).toBe(true);
      expect(validateConfigValueRange(0, 0, 100)).toBe(true);
      expect(validateConfigValueRange(100, 0, 100)).toBe(true);
      
      expect(validateConfigValueRange(-1, 0, 100)).toBe(false);
      expect(validateConfigValueRange(101, 0, 100)).toBe(false);
      
      expect(validateConfigValueRange(50, 0)).toBe(true);
      expect(validateConfigValueRange(50, undefined, 100)).toBe(true);
      expect(validateConfigValueRange(50)).toBe(true);
      
      expect(validateConfigValueRange(NaN, 0, 100)).toBe(false);
      expect(validateConfigValueRange('invalid' as any, 0, 100)).toBe(false);
    });
  });

  describe('配置缓存', () => {
    beforeEach(() => {
      clearConfigCache();
    });

    it('应该正确缓存和获取配置值', () => {
      const testValue = { test: 'value', nested: { key: 123 } };
      
      expect(hasConfigCache('test-key')).toBe(false);
      
      cacheConfigValue('test-key', testValue);
      
      expect(hasConfigCache('test-key')).toBe(true);
      expect(getCachedConfigValue('test-key')).toEqual(testValue);
    });

    it('应该正确处理不存在的缓存键', () => {
      expect(getCachedConfigValue('nonexistent')).toBeUndefined();
      expect(hasConfigCache('nonexistent')).toBe(false);
    });

    it('应该正确清除特定缓存', () => {
      cacheConfigValue('key1', 'value1');
      cacheConfigValue('key2', 'value2');
      
      expect(hasConfigCache('key1')).toBe(true);
      expect(hasConfigCache('key2')).toBe(true);
      
      clearConfigCache('key1');
      
      expect(hasConfigCache('key1')).toBe(false);
      expect(hasConfigCache('key2')).toBe(true);
    });

    it('应该正确清除所有缓存', () => {
      cacheConfigValue('key1', 'value1');
      cacheConfigValue('key2', 'value2');
      cacheConfigValue('key3', 'value3');
      
      clearConfigCache();
      
      expect(hasConfigCache('key1')).toBe(false);
      expect(hasConfigCache('key2')).toBe(false);
      expect(hasConfigCache('key3')).toBe(false);
    });

    it('应该正确缓存不同类型的值', () => {
      cacheConfigValue('string', 'test');
      cacheConfigValue('number', 123);
      cacheConfigValue('boolean', true);
      cacheConfigValue('object', { key: 'value' });
      cacheConfigValue('array', [1, 2, 3]);
      cacheConfigValue('null', null);
      cacheConfigValue('undefined', undefined);
      
      expect(getCachedConfigValue('string')).toBe('test');
      expect(getCachedConfigValue('number')).toBe(123);
      expect(getCachedConfigValue('boolean')).toBe(true);
      expect(getCachedConfigValue('object')).toEqual({ key: 'value' });
      expect(getCachedConfigValue('array')).toEqual([1, 2, 3]);
      expect(getCachedConfigValue('null')).toBeNull();
      expect(getCachedConfigValue('undefined')).toBeUndefined();
    });
  });

  describe('边界情况和错误处理', () => {
    it('应该处理循环引用', () => {
      const obj: any = { a: 1 };
      obj.self = obj;
      
      expect(() => deepClone(obj)).toThrow();
      expect(() => exportConfigToJson(obj as any)).toThrow();
    });

    it('应该处理空值和边界值', () => {
      expect(mergeConfig({}, {})).toEqual({});
      expect(mergeConfig(null as any, {})).toEqual({});
      expect(mergeConfig({}, null as any)).toEqual({});
      
      expect(getConfigValue({}, 'any.path')).toBeUndefined();
      expect(getConfigValue(null as any, 'any.path')).toBeUndefined();
      
      expect(parseConfigPath('.')).toEqual(['', '']);
      expect(parseConfigPath('...')).toEqual(['', '', '', '']);
    });

    it('应该处理特殊字符和Unicode', () => {
      const config = { '中文': { '键名': '值' }, 'special-chars': { '$key': '@value' } };
      
      expect(getConfigValue(config, '中文.键名')).toBe('值');
      expect(getConfigValue(config, 'special-chars.$key')).toBe('@value');
      
      const cloned = deepClone(config);
      expect(cloned).toEqual(config);
    });

    it('应该处理大型配置对象', () => {
      const largeConfig: any = {};
      for (let i = 0; i < 1000; i++) {
        largeConfig[`key${i}`] = {
          nested: {
            value: i,
            array: new Array(100).fill(i)
          }
        };
      }
      
      const cloned = deepClone(largeConfig);
      expect(cloned).toEqual(largeConfig);
      expect(cloned).not.toBe(largeConfig);
      
      const paths = getConfigPaths(largeConfig);
      expect(paths.length).toBeGreaterThan(2000); // 每个key有多个路径
    });
  });
});