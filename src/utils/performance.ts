/**
 * 性能优化和内存管理工具
 */

/**
 * 内存管理器
 */
export class MemoryManager {
  private static cleanupCallbacks: (() => void)[] = [];

  /**
   * 注册清理回调
   * @param callback 清理函数
   */
  static registerCleanup(callback: () => void): void {
    this.cleanupCallbacks.push(callback);
  }

  /**
   * 执行所有清理操作
   */
  static cleanup(): void {
    this.cleanupCallbacks.forEach(callback => {
      try {
        callback();
      } catch (error) {
        console.error('Error during cleanup:', error);
      }
    });
  }

  /**
   * 清理大型数组
   * @param arrays 要清理的数组
   */
  static cleanupLargeArrays(...arrays: any[][]): void {
    arrays.forEach(array => {
      if (Array.isArray(array)) {
        array.length = 0;
      }
    });
  }

  /**
   * 优化Canvas内存
   * @param canvas Canvas元素
   */
  static optimizeCanvasMemory(canvas: HTMLCanvasElement): void {
    const ctx = canvas.getContext('2d');
    if (ctx) {
      // 清除Canvas内容
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // 重置变换矩阵
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      
      // 重置样式
      ctx.fillStyle = '#000000';
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 1;
    }
  }

  /**
   * 监控内存使用情况
   * @returns 内存信息
   */
  static monitorMemoryUsage(): any {
    if ('memory' in performance) {
      return (performance as any).memory;
    }
    return null;
  }

  /**
   * 强制垃圾回收（仅在支持的浏览器中）
   */
  static forceGarbageCollection(): void {
    if ('gc' in window && typeof (window as any).gc === 'function') {
      (window as any).gc();
    }
  }
}

/**
 * Canvas渲染优化器
 */
export class CanvasOptimizer {
  private animationId: number | null = null;
  private renderQueue: (() => void)[] = [];
  private isRendering = false;

  /**
   * 添加渲染任务到队列
   * @param renderFn 渲染函数
   */
  queueRender(renderFn: () => void): void {
    this.renderQueue.push(renderFn);
    this.scheduleRender();
  }

  /**
   * 调度渲染
   */
  private scheduleRender(): void {
    if (this.isRendering || this.animationId !== null) {
      return;
    }

    this.animationId = requestAnimationFrame(() => {
      this.isRendering = true;
      
      // 执行所有排队的渲染任务
      while (this.renderQueue.length > 0) {
        const renderFn = this.renderQueue.shift();
        if (renderFn) {
          try {
            renderFn();
          } catch (error) {
            console.error('Error during rendering:', error);
          }
        }
      }

      this.isRendering = false;
      this.animationId = null;
    });
  }

  /**
   * 取消渲染
   */
  cancelRender(): void {
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
    this.renderQueue.length = 0;
    this.isRendering = false;
  }

  /**
   * 批量绘制点
   * @param ctx Canvas上下文
   * @param points 点数组
   * @param getStyle 获取样式函数
   * @param getSize 获取大小函数
   */
  static batchDrawPoints(
    ctx: CanvasRenderingContext2D,
    points: Array<{ x: number; y: number; [key: string]: any }>,
    getStyle: (point: any) => string,
    getSize: (point: any) => number
  ): void {
    // 按样式分组
    const styleGroups = new Map<string, Array<{ x: number; y: number; size: number }>>();

    points.forEach(point => {
      const style = getStyle(point);
      const size = getSize(point);
      
      if (!styleGroups.has(style)) {
        styleGroups.set(style, []);
      }
      
      styleGroups.get(style)!.push({ x: point.x, y: point.y, size });
    });

    // 批量绘制每个样式组
    styleGroups.forEach((groupPoints, style) => {
      ctx.fillStyle = style;
      
      groupPoints.forEach(({ x, y, size }) => {
        ctx.fillRect(x - size/2, y - size/2, size, size);
      });
    });
  }

  /**
   * 视口裁剪
   * @param points 所有点
   * @param viewport 视口范围
   * @returns 可见的点
   */
  static viewportCulling<T extends { x: number; y: number }>(
    points: T[],
    viewport: { x: number; y: number; width: number; height: number }
  ): T[] {
    return points.filter(point => 
      point.x >= viewport.x &&
      point.x <= viewport.x + viewport.width &&
      point.y >= viewport.y &&
      point.y <= viewport.y + viewport.height
    );
  }
}

/**
 * 计算缓存管理器
 */
export class ComputationCache {
  private static cache = new Map<string, { data: any; timestamp: number; ttl: number }>();
  private static maxSize = 100; // 最大缓存条目数
  private static defaultTTL = 5 * 60 * 1000; // 5分钟默认TTL

  /**
   * 设置缓存
   * @param key 键
   * @param data 数据
   * @param ttl 生存时间（毫秒）
   */
  static set(key: string, data: any, ttl: number = this.defaultTTL): void {
    // 如果缓存已满，删除最旧的条目
    if (this.cache.size >= this.maxSize) {
      const oldestKey = Array.from(this.cache.keys())[0];
      this.cache.delete(oldestKey);
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }

  /**
   * 获取缓存
   * @param key 键
   * @returns 缓存的数据或null
   */
  static get(key: string): any | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }

    // 检查是否过期
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  /**
   * 删除缓存
   * @param key 键
   */
  static delete(key: string): void {
    this.cache.delete(key);
  }

  /**
   * 清空所有缓存
   */
  static clear(): void {
    this.cache.clear();
  }

  /**
   * 清理过期缓存
   */
  static cleanupExpired(): void {
    const now = Date.now();
    
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * 获取缓存统计信息
   */
  static getStats(): { size: number; maxSize: number; hitRate?: number } {
    return {
      size: this.cache.size,
      maxSize: this.maxSize
    };
  }
}

/**
 * 性能监控器
 */
export class PerformanceMonitor {
  private static measurements = new Map<string, number[]>();

  /**
   * 开始测量
   * @param name 测量名称
   * @returns 结束函数
   */
  static startMeasurement(name: string): () => void {
    const startTime = performance.now();
    
    return () => {
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      if (!this.measurements.has(name)) {
        this.measurements.set(name, []);
      }
      
      const measurements = this.measurements.get(name)!;
      measurements.push(duration);
      
      // 只保留最近100次测量
      if (measurements.length > 100) {
        measurements.shift();
      }
    };
  }

  /**
   * 获取性能统计
   * @param name 测量名称
   * @returns 统计信息
   */
  static getStats(name: string): {
    count: number;
    average: number;
    min: number;
    max: number;
    latest: number;
  } | null {
    const measurements = this.measurements.get(name);
    
    if (!measurements || measurements.length === 0) {
      return null;
    }

    const count = measurements.length;
    const sum = measurements.reduce((a, b) => a + b, 0);
    const average = sum / count;
    const min = Math.min(...measurements);
    const max = Math.max(...measurements);
    const latest = measurements[measurements.length - 1];

    return { count, average, min, max, latest };
  }

  /**
   * 获取所有测量的统计信息
   */
  static getAllStats(): Record<string, any> {
    const stats: Record<string, any> = {};
    
    for (const name of this.measurements.keys()) {
      stats[name] = this.getStats(name);
    }
    
    return stats;
  }

  /**
   * 清除测量数据
   * @param name 测量名称，如果不提供则清除所有
   */
  static clearMeasurements(name?: string): void {
    if (name) {
      this.measurements.delete(name);
    } else {
      this.measurements.clear();
    }
  }
}

// 定期清理过期缓存
setInterval(() => {
  ComputationCache.cleanupExpired();
}, 60000); // 每分钟清理一次