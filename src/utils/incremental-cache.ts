/**
 * 增量点集复用系统
 * 实现点数变化时的增量计算，避免全量重新计算
 */

import { BaseData, BasePoint } from '../types';
import { EigenCache } from './eigen-cache';

interface IncrementalCacheEntry {
  baseData: BaseData;
  targetCount: number;
  timestamp: number;
  eigenKey: string;
}

class IncrementalPointCache {
  private static cache = new Map<string, IncrementalCacheEntry>();
  private static readonly CACHE_TTL = 10 * 60 * 1000; // 10分钟缓存 - 将从配置系统获取

  /**
   * 获取缓存的点集数据，支持增量计算
   * @param cacheKey 缓存键
   * @param targetCount 目标点数
   * @returns 缓存的数据或null
   */
  static get(cacheKey: string, targetCount: number): BaseData | null {
    const config = this.getConfig();
    const cached = this.cache.get(cacheKey);
    if (!cached || Date.now() - cached.timestamp > config.cacheTTL) {
      return null;
    }

    const cachedCount = cached.baseData.pointsWithBaseType.length;
    
    // 如果目标点数小于等于缓存点数，且缓存为新格式，则直接截取
    if (targetCount <= cachedCount) {
      const cachedWordLen = cached.baseData.word.length;
      if (cachedWordLen !== cachedCount + 1) {
        console.warn(`ℹ️ 发现旧版缓存格式: cachedWordLen=${cachedWordLen}, cachedPoints=${cachedCount}. 忽略此缓存以避免序列/点数不一致`);
        return null;
      }
      console.log(`🚀 增量缓存命中 (截取): ${cachedCount} → ${targetCount} 点`);
      const word = cached.baseData.word.substring(0, targetCount + 1);
      return {
        word,
        pointsWithBaseType: cached.baseData.pointsWithBaseType.slice(0, targetCount),
        indexMaps: this.rebuildIndexMaps(word)
      };
    }

    // 如果目标点数大于缓存点数，返回缓存数据用于增量计算
    if (targetCount > cachedCount && targetCount <= cachedCount * 2) {
      const cachedWordLen = cached.baseData.word.length;
      if (cachedWordLen !== cachedCount + 1) {
        console.warn(`ℹ️ 发现旧版缓存格式(增量): cachedWordLen=${cachedWordLen}, cachedPoints=${cachedCount}. 忽略此缓存并全量/重新计算`);
        return null;
      }
      console.log(`🔄 增量缓存部分命中: ${cachedCount} → ${targetCount} 点，需增量计算`);
      return cached.baseData;
    }

    return null;
  }

  /**
   * 设置缓存数据
   * @param cacheKey 缓存键
   * @param data 基础数据
   * @param eigenKey 特征值分解键
   */
  static set(cacheKey: string, data: BaseData, eigenKey: string): void {
    this.cache.set(cacheKey, {
      baseData: data,
      targetCount: data.pointsWithBaseType.length,
      timestamp: Date.now(),
      eigenKey
    });
    
    console.log(`💾 增量缓存已保存: ${data.pointsWithBaseType.length} 点`);
  }

  /**
   * 增量计算新的点集
   * @param cached 缓存的基础数据
   * @param targetCount 目标点数
   * @param eigenKey 特征值分解键
   * @returns 扩展后的基础数据
   */
  static async incrementalCompute(
    cached: BaseData, 
    targetCount: number, 
    eigenKey: string,
    onProgress?: (progress: number, message?: string) => void
  ): Promise<BaseData> {
    const math = (window as any).math;
    const eigenDecomp = EigenCache.getOrCompute(eigenKey, math.matrix([[1, 1, 1], [1, 0, 0], [0, 1, 0]]));
    const { invBasisMatrix } = eigenDecomp;

    const startCount = cached.pointsWithBaseType.length;
    console.log(`🔄 开始增量计算: ${startCount} → ${targetCount} 点`);

    // 生成完整目标序列（长度 = targetCount + 1，分配5%进度）
    const word = this.generateSequence(targetCount + 1);
    if (onProgress) {
      onProgress(5, `扩展符号序列完成: ${targetCount + 1}`);
    }

    // 从缓存的最后状态继续计算
    const pointsWithBaseType = [...cached.pointsWithBaseType];
    const abelianVector = { '1': 0, '2': 0, '3': 0 };

    // 从已缓存点集重建阿贝尔向量状态，避免与新序列前缀不一致
    for (let i = 0; i < startCount; i++) {
      const bt = pointsWithBaseType[i].baseType as '1' | '2' | '3';
      abelianVector[bt]++;
    }

    // 增量计算新点
    for (let N = startCount + 1; N <= targetCount; N++) {
      // 动态调整进度报告频率
      const totalNewPoints = targetCount - startCount;
      const reportInterval = Math.max(100, Math.min(5000, Math.floor(totalNewPoints / 50)));
      
      if ((N - startCount) % reportInterval === 0) {
        if (onProgress) {
          // 增量计算的点坐标计算占90%的进度（5% -> 95%）
          const progress = 5 + ((N - startCount) / totalNewPoints) * 90;
          onProgress(progress, `增量计算点坐标... ${N}/${targetCount}`);
          // 添加小延迟让进度更新可见
          await new Promise(resolve => setTimeout(resolve, 5));
        }
      }

      const prevChar = word[N - 1] as '1' | '2' | '3';
      abelianVector[prevChar]++;
      
      const point3D = [abelianVector['1'], abelianVector['2'], abelianVector['3']];
      const pointInEigenBasis = math.multiply(invBasisMatrix, point3D);
      
      let reValue = 0;
      let imValue = 0;
      
      try {
        const coord1 = pointInEigenBasis.get([1]);
        const coord2 = pointInEigenBasis.get([2]);
        
        reValue = typeof coord1 === 'object' && coord1.re !== undefined ? coord1.re : Number(coord1) || 0;
        imValue = typeof coord2 === 'object' && coord2.re !== undefined ? coord2.re : Number(coord2) || 0;
        
        if (!isFinite(reValue)) reValue = 0;
        if (!isFinite(imValue)) imValue = 0;
      } catch (error) {
        console.warn('坐标计算错误:', error);
        reValue = Math.random() * 2 - 1;
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
      indexMaps: this.rebuildIndexMaps(word)
    };

    if (word.length !== pointsWithBaseType.length + 1) {
      console.warn(`⚠️ 不变式失败: word.length=${word.length}, points=${pointsWithBaseType.length}`);
    }

    console.log(`✅ 增量计算完成: 新增 ${targetCount - startCount} 点`);
    return result;
  }

  /**
   * 生成标准符号序列（1→12, 2→13, 3→1）到指定长度
   */
  private static generateSequence(targetLength: number): string {
    let word = '1';
    while (word.length < targetLength) {
      let nextWord = '';
      for (let i = 0; i < word.length; i++) {
        const c = word[i];
        if (c === '1') nextWord += '12';
        else if (c === '2') nextWord += '13';
        else nextWord += '1';
      }
      word = nextWord;
    }
    return word.substring(0, targetLength);
  }

  /**
   * 重建索引映射
   * @param word 符号序列
   * @returns 索引映射
   */
  private static rebuildIndexMaps(word: string): { [key: string]: number[] } {
    const indexMaps: { [key: string]: number[] } = { '1': [], '2': [], '3': [] };
    for (let i = 0; i < word.length; i++) {
      indexMaps[word[i]].push(i + 1);
    }
    return indexMaps;
  }

  /**
   * 清理过期缓存
   */
  static cleanup(): void {
    const config = this.getConfig();
    const now = Date.now();
    for (const [key, value] of this.cache.entries()) {
      if (now - value.timestamp > config.cacheTTL) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * 从配置系统获取缓存配置
   */
  private static getConfig() {
    try {
      // 尝试从全局配置获取
      const globalConfig = (window as any).__RAUZY_CONFIG__;
      if (globalConfig?.performance?.cache) {
        return {
          cacheTTL: globalConfig.performance.cache.defaultTTL,
          maxSize: globalConfig.performance.cache.maxSize
        };
      }
    } catch (error) {
      // 配置系统不可用时使用默认值
    }

    // 回退到默认值
    return {
      cacheTTL: this.CACHE_TTL,
      maxSize: 100
    };
  }

  /**
   * 清空所有缓存
   */
  static clear(): void {
    this.cache.clear();
    console.log('🧹 增量点集缓存已清空');
  }

  /**
   * 获取缓存统计信息
   */
  static getStats(): { size: number; totalPoints: number; keys: string[] } {
    let totalPoints = 0;
    for (const entry of this.cache.values()) {
      totalPoints += entry.targetCount;
    }
    
    return {
      size: this.cache.size,
      totalPoints,
      keys: Array.from(this.cache.keys())
    };
  }
}

// 定期清理过期缓存
setInterval(() => {
  IncrementalPointCache.cleanup();
}, 5 * 60 * 1000); // 每5分钟清理一次

export { IncrementalPointCache };