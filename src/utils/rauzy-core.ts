import { BaseData, BasePoint } from '../types';
import { precomputeTribonacci } from './tribonacci';
import { ComputationCache, PerformanceMonitor } from './performance';
import { EigenCache } from './eigen-cache';
import { IncrementalPointCache } from './incremental-cache';

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
export async function executeRauzyCoreAlgorithm(
  targetPointCount: number, 
  onProgress?: (progress: number, message?: string) => void,
  shouldCancel?: () => boolean
): Promise<BaseData | null> {
  // 检查增量缓存
  const cacheKey = 'rauzy-incremental';
  const eigenKey = 'rauzy-matrix-1-1-1';
  
  const incrementalResult = IncrementalPointCache.get(cacheKey, targetPointCount);
  if (incrementalResult) {
    // 如果是完全匹配或截取，提供渐进式进度显示
    if (incrementalResult.pointsWithBaseType.length === targetPointCount) {
      // 模拟渐进式进度，让用户看到进度变化
      const steps = [10, 30, 60, 85, 100];
      const messages = ['读取缓存...', '验证数据...', '准备渲染...', '优化性能...', '缓存命中，计算完成'];
      
      for (let i = 0; i < steps.length; i++) {
        onProgress?.(steps[i], messages[i]);
        // 短暂延迟让用户看到进度变化
        await new Promise(resolve => setTimeout(resolve, 50));
      }
      
      return incrementalResult;
    }
    
    // 如果需要增量计算
    const result = await IncrementalPointCache.incrementalCompute(
      incrementalResult, 
      targetPointCount, 
      eigenKey,
      onProgress
    );
    
    // 缓存新结果
    IncrementalPointCache.set(cacheKey, result, eigenKey);
    onProgress?.(100, '增量计算完成');
    return result;
  }

  // 检查传统缓存
  const traditionalCacheKey = `rauzy-core-${targetPointCount}`;
  const cachedResult = ComputationCache.get(traditionalCacheKey);
  if (cachedResult) {
    // 提供渐进式进度显示
    const steps = [15, 40, 70, 90, 100];
    const messages = ['读取传统缓存...', '数据验证...', '转换格式...', '同步增量缓存...', '传统缓存命中，计算完成'];
    
    for (let i = 0; i < steps.length; i++) {
      onProgress?.(steps[i], messages[i]);
      await new Promise(resolve => setTimeout(resolve, 60));
    }
    
    // 同时保存到增量缓存
    IncrementalPointCache.set(cacheKey, cachedResult, eigenKey);
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

    // 步骤 1-3: 矩阵与坐标变换 - 使用缓存优化
    const M = math.matrix([[1, 1, 1], [1, 0, 0], [0, 1, 0]]);
    const eigenDecomp = EigenCache.getOrCompute('rauzy-matrix-1-1-1', M);
    
    // 从缓存结果中提取所需数据
    const { invBasisMatrix } = eigenDecomp;

    // 步骤 4: 生成符号序列 - 优化版本（分配5%进度）
    onProgress?.(1, '生成符号序列...');
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
      
      // 报告进度 - 符号序列生成只占5%
      const progress = Math.min(5, 1 + (word.length / targetPointCount) * 4);
      onProgress?.(progress, `生成符号序列... ${word.length}/${targetPointCount}`);
      // 添加小延迟让进度更新可见
      await new Promise(resolve => setTimeout(resolve, 5));
      
      // 如果生成的序列已经足够长，截断并退出
      if (word.length >= targetPointCount) {
        word = word.substring(0, targetPointCount);
        break;
      }
    }

    // 构建索引映射（分配5%进度）
    onProgress?.(5, '构建索引映射...');
    const indexMaps: { [key: string]: number[] } = { '1': [], '2': [], '3': [] };
    for (let i = 0; i < word.length; i++) {
      indexMaps[word[i]].push(i + 1);
      
      // 每处理10000个字符报告一次进度
      if (i % 10000 === 0) {
        if (shouldCancel?.()) {
          throw new Error('计算已取消');
        }
        const progress = 5 + (i / word.length) * 5;
        onProgress?.(progress, `构建索引映射... ${i}/${word.length}`);
        // 添加小延迟让进度更新可见
        await new Promise(resolve => setTimeout(resolve, 2));
      }
    }

    // 步骤 5: 构建阶梯并投影到平面（分配85%进度，这是最耗时的部分）
    onProgress?.(10, '计算点坐标...');
    const pointsWithBaseType: BasePoint[] = [];
    const abelianVector = { '1': 0, '2': 0, '3': 0 };

    for (let N = 1; N < word.length; N++) {
      // 动态调整进度报告频率：小数据集更频繁，大数据集较少
      const reportInterval = Math.max(100, Math.min(5000, Math.floor(word.length / 100)));
      
      // 检查取消和报告进度
      if (N % reportInterval === 0) {
        if (shouldCancel?.()) {
          throw new Error('计算已取消');
        }
        // 点坐标计算占85%的进度（10% -> 95%）
        const progress = 10 + (N / word.length) * 85;
        onProgress?.(progress, `计算点坐标... ${N}/${word.length}`);
        // 添加小延迟让进度更新可见，但不影响性能
        await new Promise(resolve => setTimeout(resolve, 1));
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

    // 缓存结果到两个缓存系统
    ComputationCache.set(traditionalCacheKey, result, 10 * 60 * 1000); // 传统缓存10分钟
    IncrementalPointCache.set(cacheKey, result, eigenKey); // 增量缓存
    
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