/**
 * 测试ID Hook
 * 提供从配置系统获取测试ID的便捷方法
 */

import { useConfig } from '../config/ConfigContext';
import { getTestId, getAllTestIds } from '../config/utils';

/**
 * 获取单个测试ID的Hook
 * @param testIdKey 测试ID键名
 * @returns 测试ID值
 */
export function useTestId(testIdKey: string): string {
  const { config } = useConfig();
  return getTestId(config, testIdKey);
}

/**
 * 获取所有测试ID的Hook
 * @returns 测试ID对象
 */
export function useTestIds(): Record<string, string> {
  const { config } = useConfig();
  return getAllTestIds(config);
}

/**
 * 获取多个测试ID的Hook
 * @param testIdKeys 测试ID键名数组
 * @returns 测试ID对象
 */
export function useMultipleTestIds(testIdKeys: string[]): Record<string, string> {
  const { config } = useConfig();
  const result: Record<string, string> = {};
  
  testIdKeys.forEach(key => {
    result[key] = getTestId(config, key);
  });
  
  return result;
}