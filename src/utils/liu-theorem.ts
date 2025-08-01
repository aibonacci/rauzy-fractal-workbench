import { PathData, BasePoint, Point2D } from '../types';
import { getTribonacci } from './tribonacci';

/**
 * 刘氏定理计算引擎
 * 实现复合路径的数学分析和位置数列计算
 */

/**
 * 计算路径数据，基于刘氏定理
 * @param path 复合路径 L
 * @param indexMaps 基础位置数列
 * @param pointsWithBaseType 几何坐标数据
 * @returns 包含路径所有计算数据的对象
 */
export function calculatePathData(
  path: number[],
  indexMaps: { [key: string]: number[] },
  pointsWithBaseType: BasePoint[]
): PathData {
  if (!path || path.length === 0) {
    throw new Error('路径不能为空');
  }

  // 验证路径只包含1, 2, 3
  if (path.some(n => ![1, 2, 3].includes(n))) {
    throw new Error('路径只能包含1, 2, 3');
  }

  // 计算总权重 r_p
  const rp = path.reduce((sum, value) => sum + value, 0);

  // 计算主项系数
  const coeffs = { 1: 0, 2: 0, 3: 0 };
  coeffs[1] = getTribonacci(rp - 2) || 0;
  coeffs[2] = (getTribonacci(rp - 2) || 0) + (getTribonacci(rp - 3) || 0);
  coeffs[3] = (getTribonacci(rp - 2) || 0) + (getTribonacci(rp - 3) || 0) + (getTribonacci(rp - 4) || 0);

  // 计算常数项 C_L^(3)
  let cl = 0;
  let rs = 0;

  for (let s = 0; s < path.length; s++) {
    const ls = path[s];
    rs += ls;

    let stepContribution = 0;
    for (let j = 1; j <= (3 - ls); j++) {
      stepContribution += getTribonacci(rs + j - 2) || 0;
    }
    cl += stepContribution;
  }

  // 计算复合位置数列 W_L^(3)(k)
  const sequence: number[] = [];
  
  // 计算总点数：所有字符出现次数的总和
  const totalPoints = (indexMaps['1']?.length || 0) + 
                     (indexMaps['2']?.length || 0) + 
                     (indexMaps['3']?.length || 0);
  
  // 获取最小的索引映射长度，用于循环填充
  const minBaseLength = Math.min(
    indexMaps['1']?.length || 0,
    indexMaps['2']?.length || 0,
    indexMaps['3']?.length || 0
  );

  if (totalPoints === 0 || minBaseLength === 0) {
    throw new Error('索引映射为空');
  }

  // 修复：Position sequence的长度应该等于总点数
  const effectiveRange = totalPoints;

  // 生成完整长度的序列，确保sequence长度等于总点数
  for (let k = 1; k <= effectiveRange; k++) {
    const W1k = indexMaps['1'][k - 1];
    const W2k = indexMaps['2'][k - 1];
    const W3k = indexMaps['3'][k - 1];

    if (W1k === undefined || W2k === undefined || W3k === undefined) {
      // 如果索引映射不足，使用循环模式填充
      const cycleIndex = (k - 1) % minBaseLength;
      const W1k_cycle = indexMaps['1'][cycleIndex];
      const W2k_cycle = indexMaps['2'][cycleIndex];
      const W3k_cycle = indexMaps['3'][cycleIndex];
      
      const pLk = coeffs[1] * W1k_cycle + coeffs[2] * W2k_cycle + coeffs[3] * W3k_cycle;
      const wLk = Math.round(pLk - cl);
      sequence.push(Math.max(1, Math.abs(wLk) % totalPoints + 1));
      continue;
    }

    // 应用刘氏定理公式
    const pLk = coeffs[1] * W1k + coeffs[2] * W2k + coeffs[3] * W3k;
    const wLk = Math.round(pLk - cl);

    // 确保值在有效范围内，如果不在范围内则调整
    if (wLk > 0 && wLk <= totalPoints) {
      sequence.push(wLk);
    } else {
      // 将无效值映射到有效范围内
      const adjustedValue = Math.max(1, Math.abs(wLk) % totalPoints + 1);
      sequence.push(adjustedValue);
    }
  }

  console.log(`📊 路径 [${path.join(',')}] 序列生成: 目标长度=${effectiveRange}, 实际长度=${sequence.length}`);

  // 获取首项坐标
  let firstPointCoords: Point2D | null = null;
  if (sequence.length > 0) {
    const firstPosIndex = sequence[0] - 1;
    if (firstPosIndex >= 0 && firstPosIndex < pointsWithBaseType.length) {
      const point = pointsWithBaseType[firstPosIndex];
      firstPointCoords = {
        re: point.re,
        im: point.im
      };
    }
  }

  return {
    path,
    rp,
    coeffs,
    cl,
    sequence,
    firstPointCoords
  };
}

/**
 * 验证路径数据的完整性
 * @param pathData 路径数据
 * @returns 是否有效
 */
export function validatePathData(pathData: PathData): boolean {
  return (
    Array.isArray(pathData.path) &&
    pathData.path.length > 0 &&
    typeof pathData.rp === 'number' &&
    typeof pathData.cl === 'number' &&
    Array.isArray(pathData.sequence) &&
    typeof pathData.coeffs === 'object' &&
    pathData.coeffs[1] !== undefined &&
    pathData.coeffs[2] !== undefined &&
    pathData.coeffs[3] !== undefined
  );
}

/**
 * 批量计算多条路径的数据
 * @param paths 路径数组
 * @param indexMaps 基础位置数列
 * @param pointsWithBaseType 几何坐标数据
 * @returns 路径数据数组
 */
export function calculateMultiplePathsData(
  paths: number[][],
  indexMaps: { [key: string]: number[] },
  pointsWithBaseType: BasePoint[]
): PathData[] {
  return paths.map(path => {
    try {
      return calculatePathData(path, indexMaps, pointsWithBaseType);
    } catch (error) {
      console.error(`计算路径 ${path.join(',')} 时出错:`, error);
      // 返回一个默认的错误状态
      return {
        path,
        rp: 0,
        coeffs: { 1: 0, 2: 0, 3: 0 },
        cl: 0,
        sequence: [],
        firstPointCoords: null
      };
    }
  });
}

/**
 * 计算路径的统计信息
 * @param pathData 路径数据
 * @returns 统计信息
 */
export function calculatePathStatistics(pathData: PathData) {
  return {
    pathLength: pathData.path.length,
    totalWeight: pathData.rp,
    sequenceLength: pathData.sequence.length,
    hasFirstPoint: pathData.firstPointCoords !== null,
    averageSequenceValue: pathData.sequence.length > 0
      ? pathData.sequence.reduce((sum, val) => sum + val, 0) / pathData.sequence.length
      : 0,
    maxSequenceValue: pathData.sequence.length > 0
      ? Math.max(...pathData.sequence)
      : 0,
    minSequenceValue: pathData.sequence.length > 0
      ? Math.min(...pathData.sequence)
      : 0
  };
}