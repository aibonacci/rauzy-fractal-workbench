/**
 * 配置工具函数
 * 提供配置路径解析、类型安全访问和工具函数
 */

import { AppConfiguration, ConfigPath, ConfigValue } from './types';

/**
 * 根据路径获取配置值
 * @param config 配置对象
 * @param path 配置路径
 * @returns 配置值
 */
export function getConfigValue<P extends ConfigPath<AppConfiguration>>(
  config: AppConfiguration,
  path: P
): ConfigValue<AppConfiguration, P> | undefined {
  const keys = path.split('.');
  let current: any = config;
  
  for (const key of keys) {
    if (current && typeof current === 'object' && key in current) {
      current = current[key];
    } else {
      return undefined;
    }
  }
  
  return current;
}

/**
 * 根据路径设置配置值
 * @param config 配置对象
 * @param path 配置路径
 * @param value 新值
 * @returns 更新后的配置对象
 */
export function setConfigValue<P extends ConfigPath<AppConfiguration>>(
  config: AppConfiguration,
  path: P,
  value: ConfigValue<AppConfiguration, P>
): AppConfiguration {
  const keys = path.split('.');
  const newConfig = deepClone(config);
  let current: any = newConfig;
  
  // 导航到父对象
  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i];
    if (!(key in current) || typeof current[key] !== 'object') {
      current[key] = {};
    }
    current = current[key];
  }
  
  // 设置最终值
  const lastKey = keys[keys.length - 1];
  current[lastKey] = value;
  
  return newConfig;
}

/**
 * 深度克隆对象
 * @param obj 要克隆的对象
 * @returns 克隆后的对象
 */
export function deepClone<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }
  
  if (obj instanceof Date) {
    return new Date(obj.getTime()) as unknown as T;
  }
  
  if (obj instanceof Array) {
    return obj.map(item => deepClone(item)) as unknown as T;
  }
  
  if (typeof obj === 'object') {
    const cloned = {} as T;
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        cloned[key] = deepClone(obj[key]);
      }
    }
    return cloned;
  }
  
  return obj;
}

/**
 * 深度合并配置对象
 * @param target 目标配置
 * @param source 源配置
 * @returns 合并后的配置
 */
export function mergeConfig(
  target: Partial<AppConfiguration>,
  source: Partial<AppConfiguration>
): Partial<AppConfiguration> {
  const result = deepClone(target);
  
  function merge(targetObj: any, sourceObj: any): any {
    for (const key in sourceObj) {
      if (sourceObj.hasOwnProperty(key)) {
        if (
          sourceObj[key] &&
          typeof sourceObj[key] === 'object' &&
          !Array.isArray(sourceObj[key]) &&
          targetObj[key] &&
          typeof targetObj[key] === 'object' &&
          !Array.isArray(targetObj[key])
        ) {
          targetObj[key] = merge(targetObj[key], sourceObj[key]);
        } else {
          targetObj[key] = deepClone(sourceObj[key]);
        }
      }
    }
    return targetObj;
  }
  
  return merge(result, source);
}

/**
 * 检查配置路径是否存在
 * @param config 配置对象
 * @param path 配置路径
 * @returns 是否存在
 */
export function hasConfigPath(
  config: AppConfiguration,
  path: string
): boolean {
  return getConfigValue(config, path as ConfigPath<AppConfiguration>) !== undefined;
}

/**
 * 获取配置路径的所有可能值（用于类型提示）
 * @param config 配置对象
 * @param prefix 路径前缀
 * @returns 路径数组
 */
export function getConfigPaths(
  config: any,
  prefix: string = ''
): string[] {
  const paths: string[] = [];
  
  function traverse(obj: any, currentPath: string) {
    if (obj && typeof obj === 'object' && !Array.isArray(obj)) {
      for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
          const newPath = currentPath ? `${currentPath}.${key}` : key;
          
          if (obj[key] && typeof obj[key] === 'object' && !Array.isArray(obj[key])) {
            traverse(obj[key], newPath);
          } else {
            paths.push(newPath);
          }
        }
      }
    }
  }
  
  traverse(config, prefix);
  return paths;
}

/**
 * 类型转换工具
 */
export const TypeConverters = {
  /**
   * 转换为数字
   */
  toNumber(value: any, defaultValue: number = 0): number {
    if (typeof value === 'number' && !isNaN(value)) {
      return value;
    }
    
    if (typeof value === 'string') {
      const parsed = parseFloat(value);
      if (!isNaN(parsed)) {
        return parsed;
      }
    }
    
    return defaultValue;
  },

  /**
   * 转换为字符串
   */
  toString(value: any, defaultValue: string = ''): string {
    if (typeof value === 'string') {
      return value;
    }
    
    if (value !== null && value !== undefined) {
      return String(value);
    }
    
    return defaultValue;
  },

  /**
   * 转换为布尔值
   */
  toBoolean(value: any, defaultValue: boolean = false): boolean {
    if (typeof value === 'boolean') {
      return value;
    }
    
    if (typeof value === 'string') {
      const lower = value.toLowerCase();
      if (lower === 'true' || lower === '1' || lower === 'yes') {
        return true;
      }
      if (lower === 'false' || lower === '0' || lower === 'no') {
        return false;
      }
    }
    
    if (typeof value === 'number') {
      return value !== 0;
    }
    
    return defaultValue;
  },

  /**
   * 转换为数组
   */
  toArray<T>(value: any, defaultValue: T[] = []): T[] {
    if (Array.isArray(value)) {
      return value;
    }
    
    if (typeof value === 'string') {
      try {
        const parsed = JSON.parse(value);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      } catch {
        // 尝试按逗号分割
        if (value.includes(',')) {
          return value.split(',').map(item => item.trim()) as T[];
        }
      }
    }
    
    return defaultValue;
  }
};

/**
 * 配置差异比较
 * @param config1 配置1
 * @param config2 配置2
 * @returns 差异对象
 */
export function compareConfigs(
  config1: AppConfiguration,
  config2: AppConfiguration
): Record<string, { old: any; new: any }> {
  const differences: Record<string, { old: any; new: any }> = {};
  
  function compare(obj1: any, obj2: any, path: string = '') {
    const allKeys = new Set([...Object.keys(obj1 || {}), ...Object.keys(obj2 || {})]);
    
    for (const key of allKeys) {
      const currentPath = path ? `${path}.${key}` : key;
      const val1 = obj1?.[key];
      const val2 = obj2?.[key];
      
      if (val1 !== val2) {
        if (
          val1 &&
          val2 &&
          typeof val1 === 'object' &&
          typeof val2 === 'object' &&
          !Array.isArray(val1) &&
          !Array.isArray(val2)
        ) {
          compare(val1, val2, currentPath);
        } else {
          differences[currentPath] = { old: val1, new: val2 };
        }
      }
    }
  }
  
  compare(config1, config2);
  return differences;
}

/**
 * 验证配置值的范围
 * @param value 值
 * @param min 最小值
 * @param max 最大值
 * @returns 是否在范围内
 */
export function isInRange(value: number, min?: number, max?: number): boolean {
  if (min !== undefined && value < min) {
    return false;
  }
  if (max !== undefined && value > max) {
    return false;
  }
  return true;
}

/**
 * 限制值在指定范围内
 * @param value 值
 * @param min 最小值
 * @param max 最大值
 * @returns 限制后的值
 */
export function clampValue(value: number, min?: number, max?: number): number {
  let result = value;
  if (min !== undefined && result < min) {
    result = min;
  }
  if (max !== undefined && result > max) {
    result = max;
  }
  return result;
}

/**
 * 获取测试ID
 * @param config 配置对象
 * @param testIdKey 测试ID键名
 * @returns 测试ID值
 */
export function getTestId(config: AppConfiguration, testIdKey: string): string {
  // 安全检查：确保配置和testIds存在
  if (!config || !config.development || !config.development.testIds) {
    return testIdKey.toLowerCase().replace(/_/g, '-');
  }
  return config.development.testIds[testIdKey] || testIdKey.toLowerCase().replace(/_/g, '-');
}

/**
 * 获取所有测试ID
 * @param config 配置对象
 * @returns 测试ID对象
 */
export function getAllTestIds(config: AppConfiguration): Record<string, string> {
  return config.development.testIds;
}

/**
 * 检查调试模式是否启用
 * @param config 配置对象
 * @returns 是否启用调试模式
 */
export function isDebugEnabled(config: AppConfiguration): boolean {
  return config.development.debug.enabled;
}

/**
 * 检查功能开关是否启用
 * @param config 配置对象
 * @param featureKey 功能键名
 * @returns 是否启用该功能
 */
export function isFeatureEnabled(
  config: AppConfiguration, 
  featureKey: keyof AppConfiguration['development']['features']
): boolean {
  return config.development.features[featureKey];
}

/**
 * 获取日志级别
 * @param config 配置对象
 * @returns 日志级别
 */
export function getLogLevel(config: AppConfiguration): string {
  return config.development.debug.logLevel;
}

/**
 * 检查是否显示性能指标
 * @param config 配置对象
 * @returns 是否显示性能指标
 */
export function shouldShowPerformanceMetrics(config: AppConfiguration): boolean {
  return config.development.debug.showPerformanceMetrics;
}