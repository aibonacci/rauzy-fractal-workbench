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

  // 计算复合位置数列 W_L^(3)(k) - 自然长度版本
  const sequence: number[] = [];

  // 计算Tribonacci词的总长度（用于边界检查）
  const totalWordLength = (indexMaps['1']?.length || 0) +
    (indexMaps['2']?.length || 0) +
    (indexMaps['3']?.length || 0);

  if (totalWordLength === 0) {
    throw new Error('索引映射为空');
  }

  // 自然生成序列，直到遇到边界或无效值
  let k = 1;
  const maxIterations = Math.max(
    indexMaps['1']?.length || 0,
    indexMaps['2']?.length || 0,
    indexMaps['3']?.length || 0
  ) * 3; // 增加上限，给大r值更多生成空间

  while (k <= maxIterations) {
    // 安全访问索引映射，使用循环索引避免越界
    let W1k: number, W2k: number, W3k: number;

    if (k <= indexMaps['1'].length) {
      W1k = indexMaps['1'][k - 1];
    } else {
      W1k = indexMaps['1'][(k - 1) % indexMaps['1'].length];
    }

    if (k <= indexMaps['2'].length) {
      W2k = indexMaps['2'][k - 1];
    } else {
      W2k = indexMaps['2'][(k - 1) % indexMaps['2'].length];
    }

    if (k <= indexMaps['3'].length) {
      W3k = indexMaps['3'][k - 1];
    } else {
      W3k = indexMaps['3'][(k - 1) % indexMaps['3'].length];
    }

    const pLk = coeffs[1] * W1k + coeffs[2] * W2k + coeffs[3] * W3k;
    const wLk = Math.round(pLk - cl);

    // 有效性检查：如果序列项为非正数，根据情况处理
    if (wLk <= 0) {
      if (sequence.length > 0) {
        console.log(`📊 路径 [${path.join(',')}] 序列在第${k}项变为非正数 (${wLk})，停止生成`);
        break;
      }
      // 如果还没有有效项，继续尝试
    } else if (wLk <= totalWordLength) {
      // 只有当序列项在有效范围内时才添加
      sequence.push(wLk);
    } else {
      // 如果序列项超出边界，但我们已经有了一些有效项，就停止
      if (sequence.length > 0) {
        console.log(`📊 路径 [${path.join(',')}] 序列在第${k}项超出边界 (${wLk} > ${totalWordLength})，停止生成`);
        break;
      }
      // 如果还没有有效项，继续尝试（可能后面的项会回到有效范围）
    }

    k++;
  }

  const totalPoints = (indexMaps['1']?.length || 0) +
    (indexMaps['2']?.length || 0) +
    (indexMaps['3']?.length || 0);

  console.log(`📊 路径 [${path.join(',')}] 序列生成: 实际长度=${sequence.length}, 覆盖率=${(sequence.length / totalPoints * 100).toFixed(1)}%`);

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