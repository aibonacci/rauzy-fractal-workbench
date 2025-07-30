import { describe, it, expect, beforeEach } from 'vitest';
import { 
  getTribonacci, 
  precomputeTribonacci, 
  getTribonacciCache, 
  clearTribonacciCache 
} from '../tribonacci';

describe('Tribonacci数列', () => {
  beforeEach(() => {
    clearTribonacciCache();
  });

  it('应该正确计算基础Tribonacci数列', () => {
    // 测试已知的Tribonacci数列值
    expect(getTribonacci(-3)).toBe(0);
    expect(getTribonacci(-2)).toBe(-1);
    expect(getTribonacci(-1)).toBe(1);
    expect(getTribonacci(0)).toBe(0);
    expect(getTribonacci(1)).toBe(0);
    expect(getTribonacci(2)).toBe(1);
    expect(getTribonacci(3)).toBe(1);
    expect(getTribonacci(4)).toBe(2);
    expect(getTribonacci(5)).toBe(4);
    expect(getTribonacci(6)).toBe(7);
  });

  it('应该正确计算更大的Tribonacci数', () => {
    // F_7 = F_6 + F_5 + F_4 = 7 + 4 + 2 = 13
    expect(getTribonacci(7)).toBe(13);
    
    // F_8 = F_7 + F_6 + F_5 = 13 + 7 + 4 = 24
    expect(getTribonacci(8)).toBe(24);
    
    // F_9 = F_8 + F_7 + F_6 = 24 + 13 + 7 = 44
    expect(getTribonacci(9)).toBe(44);
  });

  it('应该缓存计算结果', () => {
    getTribonacci(10);
    const cache = getTribonacciCache();
    expect(cache['10']).toBeDefined();
    expect(typeof cache['10']).toBe('number');
  });

  it('应该支持预计算', () => {
    precomputeTribonacci(15);
    const cache = getTribonacciCache();
    
    for (let i = 7; i <= 15; i++) {
      expect(cache[i.toString()]).toBeDefined();
    }
  });

  it('应该正确验证Tribonacci递推关系', () => {
    for (let n = 7; n <= 20; n++) {
      const fn = getTribonacci(n);
      const fn1 = getTribonacci(n - 1);
      const fn2 = getTribonacci(n - 2);
      const fn3 = getTribonacci(n - 3);
      
      expect(fn).toBe(fn1 + fn2 + fn3);
    }
  });

  it('应该能够清理缓存', () => {
    getTribonacci(20);
    clearTribonacciCache();
    const cache = getTribonacciCache();
    
    // 基础值应该保留
    expect(cache['6']).toBe(7);
    // 计算值应该被清理
    expect(cache['20']).toBeUndefined();
  });
});