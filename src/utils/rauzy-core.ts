import { BaseData, BasePoint } from '../types';
import { precomputeTribonacci } from './tribonacci';
import { ComputationCache, PerformanceMonitor } from './performance';

/**
 * Rauzy分形核心算法实现
 * 基于参考代码，生成分形的基础几何数据
 */

declare global {
  interface Window {
    math: any;
  }
}

/**
 * 执行Rauzy分形核心算法
 * @param targetPointCount 目标点数
 * @returns 基础数据或null（如果math.js未加载）
 */
export function executeRauzyCoreAlgorithm(
  targetPointCount: number, 
  onProgress?: (progress: number, message?: string) => void,
  shouldCancel?: () => boolean
): BaseData | null {
  // 检查缓存
  const cacheKey = `rauzy-core-${targetPointCount}`;
  const cachedResult = ComputationCache.get(cacheKey);
  if (cachedResult) {
    return cachedResult;
  }

  // 检查math.js是否已加载
  if (typeof window.math === 'undefined') {
    console.warn('Math.js library not loaded');
    return null;
  }

  const math = window.math;
  const endMeasurement = PerformanceMonitor.startMeasurement('rauzy-core-algorithm');
  
  try {
    // 预计算Tribonacci数列 - 限制最大值避免栈溢出
    const maxPrecompute = Math.min(Math.max(1000, targetPointCount), 50000);
    precomputeTribonacci(maxPrecompute);

    // 步骤 1-3: 矩阵与坐标变换
    const M = math.matrix([[1, 1, 1], [1, 0, 0], [0, 1, 0]]);
    const eigenInfo = math.eigs(M);
    const eigenvalues = eigenInfo.values.toArray();
    const eigenvectors = eigenInfo.vectors;

    // 找到扩张特征值（绝对值 > 1）
    const expandingIndex = eigenvalues.findIndex((val: any) => 
      typeof val === 'number' && Math.abs(val) > 1
    );
    
    if (expandingIndex === -1) {
      throw new Error('未找到扩张特征值');
    }

    // 找到复数特征值
    const complexIndex = eigenvalues.findIndex((val: any) => typeof val === 'object');
    
    if (complexIndex === -1) {
      throw new Error('未找到复数特征值');
    }

    // 获取特征向量
    let expandingVec = math.column(eigenvectors, expandingIndex);
    let complexVec = math.column(eigenvectors, complexIndex);

    // 归一化特征向量
    expandingVec = math.divide(expandingVec, expandingVec.get([0, 0]));
    complexVec = math.divide(complexVec, complexVec.get([0, 0]));

    // 分离复数特征向量的实部和虚部
    const contractingVecReal = math.re(complexVec);
    const contractingVecImag = math.im(complexVec);

    // 构建基变换矩阵
    const basisMatrix = math.transpose(math.matrix([
      expandingVec.toArray().flat(),
      contractingVecReal.toArray().flat(),
      contractingVecImag.toArray().flat()
    ]));

    const invBasisMatrix = math.inv(basisMatrix);

    // 步骤 4: 生成符号序列 - 优化版本
    onProgress?.(10, '生成符号序列...');
    let word = "1";
    
    // 使用更高效的字符串构建方法
    while (word.length < targetPointCount) {
      // 检查是否需要取消
      if (shouldCancel?.()) {
        throw new Error('计算已取消');
      }
      
      let nextWord = "";
      for (let i = 0; i < word.length && nextWord.length + word.length - i < targetPointCount * 2; i++) {
        const char = word[i];
        if (char === '1') {
          nextWord += '12';
        } else if (char === '2') {
          nextWord += '13';
        } else {
          nextWord += '1';
        }
      }
      word = nextWord;
      
      // 报告进度
      const progress = Math.min(30, 10 + (word.length / targetPointCount) * 20);
      onProgress?.(progress, `生成符号序列... ${word.length}/${targetPointCount}`);
      
      // 如果生成的序列已经足够长，截断并退出
      if (word.length >= targetPointCount) {
        word = word.substring(0, targetPointCount);
        break;
      }
    }

    // 构建索引映射
    onProgress?.(40, '构建索引映射...');
    const indexMaps: { [key: string]: number[] } = { '1': [], '2': [], '3': [] };
    for (let i = 0; i < word.length; i++) {
      indexMaps[word[i]].push(i + 1);
      
      // 每处理10000个字符报告一次进度
      if (i % 10000 === 0) {
        if (shouldCancel?.()) {
          throw new Error('计算已取消');
        }
        const progress = 40 + (i / word.length) * 10;
        onProgress?.(progress, `构建索引映射... ${i}/${word.length}`);
      }
    }

    // 步骤 5: 构建阶梯并投影到平面
    onProgress?.(50, '计算点坐标...');
    const pointsWithBaseType: BasePoint[] = [];
    const abelianVector = { '1': 0, '2': 0, '3': 0 };

    for (let N = 1; N < word.length; N++) {
      // 检查取消和报告进度（每5000个点）
      if (N % 5000 === 0) {
        if (shouldCancel?.()) {
          throw new Error('计算已取消');
        }
        const progress = 50 + (N / word.length) * 40;
        onProgress?.(progress, `计算点坐标... ${N}/${word.length}`);
      }
      
      const prevChar = word[N - 1] as '1' | '2' | '3';
      abelianVector[prevChar]++;
      
      const point3D = [abelianVector['1'], abelianVector['2'], abelianVector['3']];
      const pointInEigenBasis = math.multiply(invBasisMatrix, point3D);
      
      // 安全地提取坐标值
      let reValue = 0;
      let imValue = 0;
      
      try {
        const coord1 = pointInEigenBasis.get([1]);
        const coord2 = pointInEigenBasis.get([2]);
        
        // 处理复数或实数
        reValue = typeof coord1 === 'object' && coord1.re !== undefined ? coord1.re : Number(coord1) || 0;
        imValue = typeof coord2 === 'object' && coord2.re !== undefined ? coord2.re : Number(coord2) || 0;
        
        // 确保是有效数字
        if (!isFinite(reValue)) reValue = 0;
        if (!isFinite(imValue)) imValue = 0;
      } catch (error) {
        console.warn('坐标计算错误:', error);
        reValue = Math.random() * 2 - 1; // 临时使用随机值
        imValue = Math.random() * 2 - 1;
      }
      
      pointsWithBaseType.push({
        re: reValue,
        im: imValue,
        baseType: prevChar
      });
    }

    const result = {
      word,
      pointsWithBaseType,
      indexMaps
    };

    onProgress?.(95, '完成计算...');
    
    console.log(`Rauzy Core: Generated ${pointsWithBaseType.length} points from ${word.length} symbols`);
    console.log(`First few points:`, pointsWithBaseType.slice(0, 3));

    // 缓存结果
    ComputationCache.set(cacheKey, result, 10 * 60 * 1000); // 缓存10分钟
    
    onProgress?.(100, '计算完成');
    
    endMeasurement();
    return result;

  } catch (error) {
    console.error('Rauzy核心算法执行失败:', error);
    endMeasurement();
    return null;
  }
}

/**
 * 验证基础数据的完整性
 * @param baseData 基础数据
 * @returns 是否有效
 */
export function validateBaseData(baseData: BaseData | null): boolean {
  if (!baseData) return false;
  
  return (
    typeof baseData.word === 'string' &&
    Array.isArray(baseData.pointsWithBaseType) &&
    baseData.pointsWithBaseType.length > 0 &&
    typeof baseData.indexMaps === 'object' &&
    '1' in baseData.indexMaps &&
    '2' in baseData.indexMaps &&
    '3' in baseData.indexMaps
  );
}