import React, { useRef, useEffect, useCallback, useMemo } from 'react';
import { FractalCanvasProps } from '../../types';
import { BASE_COLORS_ALPHA, HIGHLIGHT_PALETTE, AXIS_COLOR, TEST_IDS } from '../../utils/constants';
import { CanvasOptimizer, PerformanceMonitor, MemoryManager } from '../../utils/performance';

// 根据点数量动态调整最大渲染点数
// 移除渲染限制，信任Canvas优化器和视口裁剪处理性能
const getMaxRenderPoints = (totalPoints: number): number => {
  return totalPoints; // 全量渲染，让优化器处理
};

const FractalCanvas: React.FC<FractalCanvasProps> = ({ points, isLoading }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const optimizerRef = useRef<CanvasOptimizer>(new CanvasOptimizer());

  // 简化的点数据处理
  const transformedPoints = useMemo(() => {
    if (!points || points.length === 0) {
      console.log('FractalCanvas: No points data');
      return { points: [], bounds: { minX: 0, maxX: 1, minY: 0, maxY: 1 } };
    }

    console.log(`FractalCanvas: Processing ${points.length} points`);
    
    // 计算点的边界
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    points.forEach(p => {
      minX = Math.min(minX, p.re);
      maxX = Math.max(maxX, p.re);
      minY = Math.min(minY, p.im);
      maxY = Math.max(maxY, p.im);
    });

    // 检查并修复无效边界
    if (!isFinite(minX) || !isFinite(maxX) || !isFinite(minY) || !isFinite(maxY)) {
      console.warn('FractalCanvas: Invalid bounds detected, using default');
      minX = -2; maxX = 2; minY = -2; maxY = 2;
    }
    
    // 防止除零错误
    if (minX === maxX) {
      minX -= 0.5;
      maxX += 0.5;
    }
    if (minY === maxY) {
      minY -= 0.5;
      maxY += 0.5;
    }

    console.log(`FractalCanvas: Bounds - X: [${minX.toFixed(3)}, ${maxX.toFixed(3)}], Y: [${minY.toFixed(3)}, ${maxY.toFixed(3)}]`);
    
    return { points, bounds: { minX, maxX, minY, maxY } };
  }, [points]);

  const drawFractal = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const endMeasurement = PerformanceMonitor.startMeasurement('canvas-render');

    const { width, height } = canvas.getBoundingClientRect();
    
    // 设置canvas实际尺寸
    canvas.width = width;
    canvas.height = height;

    // 清空画布
    ctx.clearRect(0, 0, width, height);

    if (!transformedPoints.points || transformedPoints.points.length === 0) {
      // 显示无数据状态
      ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.font = '18px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('等待数据加载...', width / 2, height / 2);
      
      // 绘制一个简单的加载动画
      const time = Date.now() / 1000;
      const radius = 20;
      const centerX = width / 2;
      const centerY = height / 2 + 40;
      
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2 * (time % 1));
      ctx.stroke();
      
      endMeasurement();
      return;
    }

    const { points: renderPoints, bounds } = transformedPoints;
    const { minX, maxX, minY, maxY } = bounds;

    // 计算缩放和偏移
    const padding = 40;
    const scaleX = (width - padding * 2) / (maxX - minX || 1);
    const scaleY = (height - padding * 2) / (maxY - minY || 1);
    const scale = Math.min(scaleX, scaleY) * 0.95;

    const offsetX = (width - (maxX - minX) * scale) / 2 - minX * scale;
    const offsetY = (height - (maxY - minY) * scale) / 2 - minY * scale;

    // 绘制坐标轴
    ctx.strokeStyle = AXIS_COLOR;
    ctx.lineWidth = 1;
    ctx.beginPath();
    
    // 水平轴
    const yAxisPos = 0 * scale + offsetY;
    if (yAxisPos >= 0 && yAxisPos <= height) {
      ctx.moveTo(0, yAxisPos);
      ctx.lineTo(width, yAxisPos);
    }
    
    // 垂直轴
    const xAxisPos = 0 * scale + offsetX;
    if (xAxisPos >= 0 && xAxisPos <= width) {
      ctx.moveTo(xAxisPos, 0);
      ctx.lineTo(xAxisPos, height);
    }
    
    ctx.stroke();

    // 简化的点绘制逻辑
    console.log(`FractalCanvas: Drawing ${renderPoints.length} points`);
    const renderStartTime = performance.now();
    
    let validPointCount = 0;
    const maxRenderPoints = getMaxRenderPoints(renderPoints.length);
    
    // 优化渲染：使用更高效的绘制方法
    const pointsToRender = renderPoints.slice(0, maxRenderPoints);
    
    // 按颜色分组以减少fillStyle切换
    const pointsByColor: { [color: string]: { px: number; py: number; size: number }[] } = {};
    
    pointsToRender.forEach((p) => {
      // 跳过无效坐标
      if (!isFinite(p.re) || !isFinite(p.im)) {
        return;
      }
      
      // 计算屏幕坐标
      const px = p.re * scale + offsetX;
      const py = p.im * scale + offsetY;
      
      // 视口裁剪 - 只渲染可见区域的点
      if (px < -10 || px > canvas.width + 10 || py < -10 || py > canvas.height + 10) {
        return;
      }
      
      // 确保屏幕坐标有效
      if (!isFinite(px) || !isFinite(py)) {
        return;
      }
      
      const isHighlighted = p.highlightGroup !== -1;
      const color = isHighlighted 
        ? HIGHLIGHT_PALETTE[p.highlightGroup % HIGHLIGHT_PALETTE.length]
        : BASE_COLORS_ALPHA[p.baseType];
      const size = isHighlighted ? 3 : 1;
      
      if (!pointsByColor[color]) {
        pointsByColor[color] = [];
      }
      
      pointsByColor[color].push({ px, py, size });
      validPointCount++;
    });
    
    // 按颜色批量绘制点
    Object.entries(pointsByColor).forEach(([color, points]) => {
      ctx.fillStyle = color;
      points.forEach(({ px, py, size }) => {
        ctx.fillRect(px - size/2, py - size/2, size, size);
      });
    });
    
    const renderEndTime = performance.now();
    const renderTime = renderEndTime - renderStartTime;
    
    console.log(`FractalCanvas: Drew ${validPointCount} valid points out of ${renderPoints.length} (max: ${maxRenderPoints})`);
    console.log(`FractalCanvas: Render time: ${renderTime.toFixed(2)}ms`);

    // 存储渲染统计信息供外部使用
    (window as any).lastRenderStats = {
      totalPoints: renderPoints.length,
      renderedPoints: validPointCount,
      renderTime: renderTime.toFixed(1)
    };

    endMeasurement();
  }, [transformedPoints]);

  // 监听窗口大小变化
  useEffect(() => {
    const handleResize = () => {
      optimizerRef.current.queueRender(drawFractal);
    };

    window.addEventListener('resize', handleResize);
    
    // 初始绘制
    optimizerRef.current.queueRender(drawFractal);

    return () => {
      window.removeEventListener('resize', handleResize);
      optimizerRef.current.cancelRender();
    };
  }, [drawFractal]);

  // 当points变化时重新绘制
  useEffect(() => {
    if (!isLoading) {
      optimizerRef.current.queueRender(drawFractal);
    }
  }, [transformedPoints, isLoading, drawFractal]);

  // 组件卸载时清理内存
  useEffect(() => {
    return () => {
      const canvas = canvasRef.current;
      if (canvas) {
        MemoryManager.optimizeCanvasMemory(canvas);
      }
      optimizerRef.current.cancelRender();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      data-testid={TEST_IDS.FRACTAL_CANVAS}
      className="w-full h-full bg-gray-900 rounded-lg shadow-inner cursor-crosshair"
      style={{ 
        imageRendering: 'pixelated',
        maxWidth: '100%',
        maxHeight: '100%'
      }}
    />
  );
};

export default FractalCanvas;