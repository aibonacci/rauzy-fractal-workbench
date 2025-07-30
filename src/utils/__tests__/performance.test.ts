import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { 
  MemoryManager, 
  CanvasOptimizer, 
  ComputationCache, 
  PerformanceMonitor 
} from '../performance';

describe('MemoryManager', () => {
  it('应该能够清理大型数组', () => {
    const array1 = [1, 2, 3, 4, 5];
    const array2 = ['a', 'b', 'c'];
    
    MemoryManager.cleanupLargeArrays(array1, array2);
    
    expect(array1.length).toBe(0);
    expect(array2.length).toBe(0);
  });

  it('应该能够优化Canvas内存', () => {
    const mockCanvas = document.createElement('canvas');
    const mockContext = {
      clearRect: vi.fn(),
      setTransform: vi.fn(),
      fillStyle: '#000000',
      strokeStyle: '#000000',
      lineWidth: 1
    };

    vi.spyOn(mockCanvas, 'getContext').mockReturnValue(mockContext as any);

    MemoryManager.optimizeCanvasMemory(mockCanvas);

    expect(mockContext.clearRect).toHaveBeenCalled();
    expect(mockContext.setTransform).toHaveBeenCalledWith(1, 0, 0, 1, 0, 0);
  });

  it('应该能够注册和执行清理回调', () => {
    const cleanup1 = vi.fn();
    const cleanup2 = vi.fn();

    MemoryManager.registerCleanup(cleanup1);
    MemoryManager.registerCleanup(cleanup2);

    MemoryManager.cleanup();

    expect(cleanup1).toHaveBeenCalled();
    expect(cleanup2).toHaveBeenCalled();
  });
});

describe('CanvasOptimizer', () => {
  let optimizer: CanvasOptimizer;

  beforeEach(() => {
    optimizer = new CanvasOptimizer();
  });

  afterEach(() => {
    optimizer.cancelRender();
  });

  it('应该能够排队渲染任务', () => {
    const renderFn = vi.fn();
    
    optimizer.queueRender(renderFn);
    
    // 等待下一个动画帧
    return new Promise(resolve => {
      requestAnimationFrame(() => {
        expect(renderFn).toHaveBeenCalled();
        resolve(undefined);
      });
    });
  });

  it('应该能够取消渲染', () => {
    const renderFn = vi.fn();
    
    optimizer.queueRender(renderFn);
    optimizer.cancelRender();
    
    // 等待确保渲染被取消
    return new Promise(resolve => {
      setTimeout(() => {
        expect(renderFn).not.toHaveBeenCalled();
        resolve(undefined);
      }, 100);
    });
  });

  it('应该能够批量绘制点', () => {
    const mockContext = {
      fillStyle: '',
      fillRect: vi.fn()
    };

    const points = [
      { x: 10, y: 20, color: 'red', size: 2 },
      { x: 30, y: 40, color: 'red', size: 2 },
      { x: 50, y: 60, color: 'blue', size: 3 }
    ];

    CanvasOptimizer.batchDrawPoints(
      mockContext as any,
      points,
      (point) => point.color,
      (point) => point.size
    );

    expect(mockContext.fillRect).toHaveBeenCalledTimes(3);
  });

  it('应该能够进行视口裁剪', () => {
    const points = [
      { x: 10, y: 10 },
      { x: 50, y: 50 },
      { x: 150, y: 150 }
    ];

    const viewport = { x: 0, y: 0, width: 100, height: 100 };
    const visiblePoints = CanvasOptimizer.viewportCulling(points, viewport);

    expect(visiblePoints).toHaveLength(2);
    expect(visiblePoints).toContain(points[0]);
    expect(visiblePoints).toContain(points[1]);
    expect(visiblePoints).not.toContain(points[2]);
  });
});

describe('ComputationCache', () => {
  beforeEach(() => {
    ComputationCache.clear();
  });

  it('应该能够设置和获取缓存', () => {
    const data = { value: 42 };
    
    ComputationCache.set('test-key', data);
    const retrieved = ComputationCache.get('test-key');
    
    expect(retrieved).toEqual(data);
  });

  it('应该在TTL过期后返回null', async () => {
    const data = { value: 42 };
    
    ComputationCache.set('test-key', data, 50); // 50ms TTL
    
    // 等待TTL过期
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const retrieved = ComputationCache.get('test-key');
    expect(retrieved).toBeNull();
  });

  it('应该能够删除缓存', () => {
    ComputationCache.set('test-key', { value: 42 });
    ComputationCache.delete('test-key');
    
    const retrieved = ComputationCache.get('test-key');
    expect(retrieved).toBeNull();
  });

  it('应该能够清理过期缓存', async () => {
    ComputationCache.set('key1', { value: 1 }, 50);
    ComputationCache.set('key2', { value: 2 }, 1000);
    
    // 等待第一个缓存过期
    await new Promise(resolve => setTimeout(resolve, 100));
    
    ComputationCache.cleanupExpired();
    
    expect(ComputationCache.get('key1')).toBeNull();
    expect(ComputationCache.get('key2')).toEqual({ value: 2 });
  });

  it('应该返回缓存统计信息', () => {
    ComputationCache.set('key1', { value: 1 });
    ComputationCache.set('key2', { value: 2 });
    
    const stats = ComputationCache.getStats();
    
    expect(stats.size).toBe(2);
    expect(stats.maxSize).toBeGreaterThan(0);
  });
});

describe('PerformanceMonitor', () => {
  beforeEach(() => {
    PerformanceMonitor.clearMeasurements();
  });

  it('应该能够测量性能', () => {
    const endMeasurement = PerformanceMonitor.startMeasurement('test-operation');
    
    // 模拟一些工作
    const start = Date.now();
    while (Date.now() - start < 10) {
      // 忙等待10ms
    }
    
    endMeasurement();
    
    const stats = PerformanceMonitor.getStats('test-operation');
    expect(stats).not.toBeNull();
    expect(stats!.count).toBe(1);
    expect(stats!.latest).toBeGreaterThan(5); // 至少5ms
  });

  it('应该能够计算统计信息', () => {
    // 添加多个测量
    for (let i = 0; i < 5; i++) {
      const endMeasurement = PerformanceMonitor.startMeasurement('test-operation');
      setTimeout(endMeasurement, 10 * (i + 1)); // 不同的延迟
    }
    
    // 等待测量完成
    return new Promise(resolve => {
      setTimeout(() => {
        const stats = PerformanceMonitor.getStats('test-operation');
        expect(stats).not.toBeNull();
        expect(stats!.count).toBe(5);
        expect(stats!.average).toBeGreaterThan(0);
        expect(stats!.min).toBeLessThanOrEqual(stats!.max);
        resolve(undefined);
      }, 100);
    });
  });

  it('应该能够获取所有统计信息', () => {
    const endMeasurement1 = PerformanceMonitor.startMeasurement('operation1');
    const endMeasurement2 = PerformanceMonitor.startMeasurement('operation2');
    
    endMeasurement1();
    endMeasurement2();
    
    const allStats = PerformanceMonitor.getAllStats();
    
    expect(allStats).toHaveProperty('operation1');
    expect(allStats).toHaveProperty('operation2');
  });

  it('应该能够清除测量数据', () => {
    const endMeasurement = PerformanceMonitor.startMeasurement('test-operation');
    endMeasurement();
    
    PerformanceMonitor.clearMeasurements('test-operation');
    
    const stats = PerformanceMonitor.getStats('test-operation');
    expect(stats).toBeNull();
  });
});