/**
 * 路径长度生成器
 * 根据指定长度生成所有可能的合法路径（使用1,2,3）
 */

/**
 * 验证路径长度输入
 * @param input 用户输入的字符串
 * @returns 验证结果
 */
export function validatePathLengthInput(input: string): {
  isValid: boolean;
  error: string;
  value?: number;
} {
  const trimmed = input.trim();
  
  if (!trimmed) {
    return { isValid: false, error: 'Please enter a path length' };
  }

  const num = parseInt(trimmed);
  
  if (isNaN(num)) {
    return { isValid: false, error: 'Please enter a valid integer' };
  }

  if (num <= 0) {
    return { isValid: false, error: 'Path length must be positive' };
  }

  if (num > 10) {
    return { isValid: false, error: 'Path length must be 10 or less (too many combinations)' };
  }

  return { isValid: true, error: '', value: num };
}

/**
 * 生成指定长度的所有可能路径
 * @param length 路径长度
 * @returns 所有可能的路径数组
 */
export function generatePathsByLength(length: number): number[][] {
  if (length <= 0) {
    return [];
  }

  const paths: number[][] = [];
  const alphabet = [1, 2, 3];

  // 递归生成所有可能的组合
  function generateCombinations(currentPath: number[], remainingLength: number) {
    if (remainingLength === 0) {
      paths.push([...currentPath]);
      return;
    }

    for (const digit of alphabet) {
      currentPath.push(digit);
      generateCombinations(currentPath, remainingLength - 1);
      currentPath.pop();
    }
  }

  generateCombinations([], length);
  
  // 按字典序排序
  paths.sort((a, b) => {
    for (let i = 0; i < Math.min(a.length, b.length); i++) {
      if (a[i] !== b[i]) {
        return a[i] - b[i];
      }
    }
    return a.length - b.length;
  });

  console.log(`🔢 生成长度为${length}的路径: ${paths.length}个组合`);
  return paths;
}

/**
 * 计算指定长度的路径总数（理论值）
 * @param length 路径长度
 * @returns 路径总数
 */
export function calculatePathCountByLength(length: number): number {
  if (length <= 0) return 0;
  return Math.pow(3, length); // 3^k 种可能
}

/**
 * 格式化路径数组为字符串（用于显示）
 * @param paths 路径数组
 * @returns 格式化的字符串
 */
export function formatPathsByLength(paths: number[][]): string {
  if (paths.length === 0) return 'No paths generated';
  
  const sample = paths.slice(0, 5).map(path => path.join(',')).join(', ');
  const remaining = paths.length > 5 ? ` ... and ${paths.length - 5} more` : '';
  
  return `${sample}${remaining}`;
}

/**
 * 获取路径长度生成的统计信息
 * @param paths 路径数组
 * @returns 统计信息
 */
export function getPathLengthStatistics(paths: number[][]) {
  if (paths.length === 0) {
    return {
      totalPaths: 0,
      pathLength: 0,
      totalWeight: 0,
      averageWeight: 0,
      minWeight: 0,
      maxWeight: 0
    };
  }

  const pathLength = paths[0].length;
  const weights = paths.map(path => path.reduce((sum, val) => sum + val, 0));
  const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);

  return {
    totalPaths: paths.length,
    pathLength,
    totalWeight,
    averageWeight: totalWeight / paths.length,
    minWeight: Math.min(...weights),
    maxWeight: Math.max(...weights)
  };
}