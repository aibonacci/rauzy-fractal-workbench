/**
 * 特征值分解缓存系统
 * 解决rauzy-core.ts中重复计算math.eigs(M)的性能瓶颈
 */

interface EigenDecomposition {
  eigenvalues: any[];
  eigenvectors: any;
  expandingIndex: number;
  complexIndex: number;
  expandingVec: any;
  complexVec: any;
  contractingVecReal: any;
  contractingVecImag: any;
  basisMatrix: any;
  invBasisMatrix: any;
  timestamp: number;
}

class EigenCache {
  private static cache = new Map<string, EigenDecomposition>();
  private static readonly CACHE_TTL = 30 * 60 * 1000; // 30分钟缓存

  /**
   * 获取或计算特征值分解
   * @param matrixKey 矩阵的唯一标识
   * @param matrix 矩阵对象
   * @returns 特征值分解结果
   */
  static getOrCompute(matrixKey: string, matrix: any): EigenDecomposition {
    const math = (window as any).math;
    
    // 检查缓存
    const cached = this.cache.get(matrixKey);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      console.log('🚀 特征值分解缓存命中，耗时: 0ms');
      return cached;
    }

    console.log('🔄 计算特征值分解...');
    const startTime = performance.now();

    // 计算特征值分解
    const eigenInfo = math.eigs(matrix);
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

    const result: EigenDecomposition = {
      eigenvalues,
      eigenvectors,
      expandingIndex,
      complexIndex,
      expandingVec,
      complexVec,
      contractingVecReal,
      contractingVecImag,
      basisMatrix,
      invBasisMatrix,
      timestamp: Date.now()
    };

    // 缓存结果
    this.cache.set(matrixKey, result);
    
    const endTime = performance.now();
    console.log(`✅ 特征值分解计算完成，耗时: ${(endTime - startTime).toFixed(2)}ms`);

    return result;
  }

  /**
   * 清理过期缓存
   */
  static cleanup(): void {
    const now = Date.now();
    for (const [key, value] of this.cache.entries()) {
      if (now - value.timestamp > this.CACHE_TTL) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * 清空所有缓存
   */
  static clear(): void {
    this.cache.clear();
    console.log('🧹 特征值分解缓存已清空');
  }

  /**
   * 获取缓存统计信息
   */
  static getStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }
}

// 定期清理过期缓存
setInterval(() => {
  EigenCache.cleanup();
}, 5 * 60 * 1000); // 每5分钟清理一次

export { EigenCache, type EigenDecomposition };