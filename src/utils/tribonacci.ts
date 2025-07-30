/**
 * Tribonacci数列生成器
 * 生成三阶斐波那契数列 F_n^(3)
 */

// 全局Tribonacci数列缓存
const tribonacciCache: { [key: string]: number } = {
  '-3': 0,
  '-2': -1,
  '-1': 1,
  '0': 0,
  '1': 0,
  '2': 1,
  '3': 1,
  '4': 2,
  '5': 4,
  '6': 7
};

/**
 * 获取Tribonacci数列的第n项
 * @param n 索引
 * @returns F_n^(3)
 */
export function getTribonacci(n: number): number {
  const key = n.toString();
  
  if (key in tribonacciCache) {
    return tribonacciCache[key];
  }
  
  // 防止负数索引
  if (n < -3) {
    return 0;
  }
  
  // 计算缺失的项 - 避免使用Math.max导致栈溢出
  const cachedKeys = Object.keys(tribonacciCache).map(Number);
  let maxCached = -3;
  for (const num of cachedKeys) {
    if (num > maxCached) {
      maxCached = num;
    }
  }
  
  for (let i = maxCached + 1; i <= n; i++) {
    const iKey = i.toString();
    const prev1 = tribonacciCache[(i-1).toString()] || 0;
    const prev2 = tribonacciCache[(i-2).toString()] || 0;
    const prev3 = tribonacciCache[(i-3).toString()] || 0;
    tribonacciCache[iKey] = prev1 + prev2 + prev3;
  }
  
  return tribonacciCache[key] || 0;
}

/**
 * 预计算Tribonacci数列到指定索引
 * @param maxIndex 最大索引
 */
export function precomputeTribonacci(maxIndex: number): void {
  for (let i = 7; i <= maxIndex; i++) {
    getTribonacci(i);
  }
}

/**
 * 获取整个Tribonacci数列缓存
 * @returns 缓存对象
 */
export function getTribonacciCache(): { [key: string]: number } {
  return { ...tribonacciCache };
}

/**
 * 清理Tribonacci缓存（用于测试或内存管理）
 */
export function clearTribonacciCache(): void {
  const keys = Object.keys(tribonacciCache);
  keys.forEach(key => {
    if (parseInt(key) > 6) {
      delete tribonacciCache[key];
    }
  });
}