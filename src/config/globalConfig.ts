/**
 * 全局配置集成
 * 将配置系统暴露给全局作用域，供工具类使用
 */

import { AppConfiguration } from './types';
import { DEFAULT_CONFIG } from './defaultConfig';

/**
 * 设置全局配置
 * @param config 配置对象
 */
export function setGlobalConfig(config: AppConfiguration): void {
  (window as any).__RAUZY_CONFIG__ = config;
}

/**
 * 获取全局配置
 * @returns 配置对象
 */
export function getGlobalConfig(): AppConfiguration {
  return (window as any).__RAUZY_CONFIG__ || DEFAULT_CONFIG;
}

/**
 * 获取配置值
 * @param path 配置路径，如 'performance.cache.maxSize'
 * @returns 配置值
 */
export function getConfigValue(path: string): any {
  const config = getGlobalConfig();
  const keys = path.split('.');
  
  let value: any = config;
  for (const key of keys) {
    if (value && typeof value === 'object' && key in value) {
      value = value[key];
    } else {
      return undefined;
    }
  }
  
  return value;
}

/**
 * 初始化全局配置
 * 在应用启动时调用
 */
export function initializeGlobalConfig(config?: AppConfiguration): void {
  setGlobalConfig(config || DEFAULT_CONFIG);
  console.log('🌐 全局配置已初始化');
}