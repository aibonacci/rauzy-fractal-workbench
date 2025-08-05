/**
 * 数字划分生成器
 * 实现将正整数基于{1,2,3}进行所有可能划分的算法
 */

/**
 * 划分结果接口
 */
export interface PartitionResult {
  target: number;
  partitions: number[][];
  count: number;
  generatedAt: number;
}

/**
 * 输入验证结果接口
 */
export interface ValidationResult {
  isValid: boolean;
  error?: string;
  value?: number;
}

/**
 * 缓存管理类
 */
class PartitionCache {
  private cache = new Map<number, PartitionResult>();
  private readonly maxCacheSize = 20;

  get(target: number): PartitionResult | null {
    return this.cache.get(target) || null;
  }

  set(target: number, result: PartitionResult): void {
    // 如果缓存已满，删除最旧的条目
    if (this.cache.size >= this.maxCacheSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey !== undefined) {
        this.cache.delete(firstKey);
      }
    }
    this.cache.set(target, result);
  }

  clear(): void {
    this.cache.clear();
  }

  getStats(): { size: number; keys: number[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }
}

// 全局缓存实例
const partitionCache = new PartitionCache();

/**
 * 验证输入的数字
 * @param input 用户输入的字符串
 * @returns 验证结果
 */
export function validatePartitionInput(input: string): ValidationResult {
  // 检查空输入
  if (!input || input.trim() === '') {
    return {
      isValid: false,
      error: '请输入一个数字'
    };
  }

  // 检查是否为数字
  const num = Number(input.trim());
  if (isNaN(num)) {
    return {
      isValid: false,
      error: '输入必须是一个有效的数字'
    };
  }

  // 检查是否为整数
  if (!Number.isInteger(num)) {
    return {
      isValid: false,
      error: '输入必须是一个整数'
    };
  }

  // 检查范围
  if (num < 1) {
    return {
      isValid: false,
      error: '数字必须大于0'
    };
  }

  if (num > 20) {
    return {
      isValid: false,
      error: '数字不能超过20（避免组合爆炸）'
    };
  }

  return {
    isValid: true,
    value: num
  };
}

/**
 * 生成数字的所有{1,2,3}划分
 * @param target 目标数字
 * @returns 所有可能的划分组合
 */
export function generatePartitions(target: number): number[][] {
  // 检查缓存
  const cached = partitionCache.get(target);
  if (cached) {
    console.log(`🚀 划分缓存命中: ${target} -> ${cached.count}个组合`);
    return cached.partitions;
  }

  const result: number[][] = [];
  
  /**
   * 回溯算法生成所有划分
   * @param remaining 剩余需要划分的数字
   * @param currentPath 当前路径
   */
  function backtrack(remaining: number, currentPath: number[]) {
    // 基础情况：剩余为0，找到一个有效划分
    if (remaining === 0) {
      result.push([...currentPath]);
      return;
    }

    // 递归情况：尝试添加1, 2, 3
    for (let i = 1; i <= Math.min(3, remaining); i++) {
      currentPath.push(i);
      backtrack(remaining - i, currentPath);
      currentPath.pop();
    }
  }

  const startTime = performance.now();
  backtrack(target, []);
  const endTime = performance.now();

  // 按字典序排序
  result.sort((a, b) => {
    for (let i = 0; i < Math.min(a.length, b.length); i++) {
      if (a[i] !== b[i]) {
        return a[i] - b[i];
      }
    }
    return a.length - b.length;
  });

  // 缓存结果
  const partitionResult: PartitionResult = {
    target,
    partitions: result,
    count: result.length,
    generatedAt: Date.now()
  };
  partitionCache.set(target, partitionResult);

  console.log(`🔢 生成划分: ${target} -> ${result.length}个组合, 耗时: ${(endTime - startTime).toFixed(2)}ms`);
  
  return result;
}

/**
 * 获取划分的理论数量（用于验证）
 * 使用动态规划计算基于{1,2,3}的所有可能划分数量
 * 注意：这里计算的是组合数，不是排列数
 * @param n 目标数字
 * @returns 理论划分数量
 */
export function getTheoreticalPartitionCount(n: number): number {
  if (n <= 0) return 0;
  if (n === 1) return 1;
  if (n === 2) return 2;
  if (n === 3) return 4;

  // 使用递归关系计算排列数（考虑顺序）
  // T(n) = T(n-1) + T(n-2) + T(n-3)，其中T(0)=1, T(1)=1, T(2)=2
  const dp = new Array(n + 1).fill(0);
  dp[0] = 1; // 基础情况：空序列有1种方式
  
  for (let i = 1; i <= n; i++) {
    // 可以在序列末尾添加1
    if (i >= 1) dp[i] += dp[i - 1];
    // 可以在序列末尾添加2
    if (i >= 2) dp[i] += dp[i - 2];
    // 可以在序列末尾添加3
    if (i >= 3) dp[i] += dp[i - 3];
  }

  return dp[n];
}

/**
 * 验证生成的划分是否正确
 * @param target 目标数字
 * @param partitions 生成的划分
 * @returns 验证结果
 */
export function validatePartitions(target: number, partitions: number[][]): boolean {
  for (const partition of partitions) {
    // 检查每个划分的和是否等于目标
    const sum = partition.reduce((acc, val) => acc + val, 0);
    if (sum !== target) {
      console.error(`划分验证失败: [${partition.join(',')}] 的和为 ${sum}，应该为 ${target}`);
      return false;
    }

    // 检查每个元素是否在{1,2,3}中
    for (const element of partition) {
      if (![1, 2, 3].includes(element)) {
        console.error(`划分验证失败: 元素 ${element} 不在 {1,2,3} 中`);
        return false;
      }
    }
  }

  // 检查数量是否符合理论值
  const theoreticalCount = getTheoreticalPartitionCount(target);
  if (partitions.length !== theoreticalCount) {
    console.warn(`划分数量警告: 生成了 ${partitions.length} 个，理论值为 ${theoreticalCount}`);
  }

  return true;
}

/**
 * 格式化划分为字符串（用于显示）
 * @param partition 划分数组
 * @returns 格式化的字符串
 */
export function formatPartition(partition: number[]): string {
  return `[${partition.join(',')}]`;
}

/**
 * 计算划分的统计信息
 * @param partitions 划分数组
 * @returns 统计信息
 */
export function getPartitionStats(partitions: number[][]) {
  if (partitions.length === 0) {
    return {
      count: 0,
      minLength: 0,
      maxLength: 0,
      avgLength: 0,
      lengthDistribution: {}
    };
  }

  const lengths = partitions.map(p => p.length);
  const lengthDistribution: { [key: number]: number } = {};

  lengths.forEach(length => {
    lengthDistribution[length] = (lengthDistribution[length] || 0) + 1;
  });

  return {
    count: partitions.length,
    minLength: Math.min(...lengths),
    maxLength: Math.max(...lengths),
    avgLength: Math.round((lengths.reduce((sum, len) => sum + len, 0) / lengths.length) * 100) / 100,
    lengthDistribution
  };
}

/**
 * 清空缓存（用于测试或内存管理）
 */
export function clearPartitionCache(): void {
  partitionCache.clear();
  console.log('🧹 划分缓存已清空');
}

/**
 * 获取缓存统计信息
 */
export function getPartitionCacheStats() {
  return partitionCache.getStats();
}

/**
 * 预计算常用数字的划分（优化首次使用体验）
 */
export function precomputeCommonPartitions(): void {
  console.log('🔄 预计算常用划分...');
  const commonNumbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  
  commonNumbers.forEach(num => {
    generatePartitions(num);
  });
  
  console.log('✅ 预计算完成');
}