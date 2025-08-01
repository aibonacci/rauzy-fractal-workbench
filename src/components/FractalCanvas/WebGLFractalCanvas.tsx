/**
 * WebGL增强版FractalCanvas
 * 支持百万级点数渲染、无级缩放和拖拽交互
 */

import React, { useRef, useEffect, useCallback, useState } from 'react';
import { FractalCanvasProps } from '../../types';
import { EnhancedWebGLRenderer } from '../../utils/enhanced-webgl-renderer';
import { ViewTransform } from '../../utils/simple-webgl-renderer';
import { AxisSettings, DEFAULT_AXIS_SETTINGS } from '../../utils/webgl-axis-renderer';
import { TEST_IDS } from '../../utils/constants';
import '../../utils/webgl-debug'; // 导入WebGL调试工具

interface WebGLFractalCanvasProps extends FractalCanvasProps {
  enableWebGL?: boolean;
  onViewChange?: (transform: ViewTransform) => void;
  axisSettings?: AxisSettings;
}

const WebGLFractalCanvas: React.FC<WebGLFractalCanvasProps> = ({ 
  points, 
  isLoading, 
  enableWebGL = true,
  onViewChange,
  axisSettings = DEFAULT_AXIS_SETTINGS
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const webglRendererRef = useRef<EnhancedWebGLRenderer | null>(null);
  const [webglSupported, setWebglSupported] = useState(true);
  const [renderStats, setRenderStats] = useState({
    pointCount: 0,
    renderTime: 0,
    mode: 'WebGL'
  });

  // 初始化WebGL渲染器
  useEffect(() => {
    if (!canvasRef.current || !enableWebGL) return;

    try {
      const renderer = new EnhancedWebGLRenderer(canvasRef.current, axisSettings);
      webglRendererRef.current = renderer;
      setWebglSupported(true);
      
      console.log('🚀 增强型WebGL渲染器初始化成功');
    } catch (error) {
      console.warn('WebGL不支持，回退到Canvas 2D:', error);
      setWebglSupported(false);
      webglRendererRef.current = null;
    }

    return () => {
      if (webglRendererRef.current) {
        webglRendererRef.current.dispose();
        webglRendererRef.current = null;
      }
    };
  }, [enableWebGL]);

  // 更新坐标轴设置
  useEffect(() => {
    if (webglRendererRef.current && axisSettings) {
      webglRendererRef.current.updateAxisSettings(axisSettings);
      console.log('🎯 WebGL画布坐标轴设置已更新');
    }
  }, [axisSettings]);

  // 处理画布尺寸变化
  const handleResize = useCallback(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const container = canvas.parentElement;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    
    // 设置画布实际尺寸
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    
    // 设置CSS尺寸
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;

    // 通知WebGL渲染器尺寸变化
    if (webglRendererRef.current) {
      webglRendererRef.current.resize(canvas.width, canvas.height);
    }
  }, []);

  // 监听窗口尺寸变化
  useEffect(() => {
    handleResize();
    
    const resizeObserver = new ResizeObserver(handleResize);
    if (canvasRef.current?.parentElement) {
      resizeObserver.observe(canvasRef.current.parentElement);
    }

    return () => {
      resizeObserver.disconnect();
    };
  }, [handleResize]);

  // 更新点数据并渲染
  useEffect(() => {
    if (!points || points.length === 0 || isLoading) {
      console.log('WebGL渲染跳过: 无数据或正在加载');
      return;
    }

    const startTime = performance.now();

    if (webglRendererRef.current && webglSupported) {
      // WebGL渲染
      try {
        console.log(`🎨 开始简洁WebGL渲染: ${points.length} 点`);
        
        // 确保画布尺寸正确
        handleResize();
        
        // 更新数据并渲染
        webglRendererRef.current.updatePoints(points);
        webglRendererRef.current.render();
        
        const renderTime = performance.now() - startTime;
        setRenderStats({
          pointCount: points.length,
          renderTime: Math.round(renderTime * 100) / 100,
          mode: 'WebGL'
        });

        // 保存渲染统计到全局
        (window as any).lastRenderStats = {
          renderTime: renderTime.toFixed(2)
        };

        console.log(`🎨 简洁WebGL渲染完成: ${points.length} 点, ${renderTime.toFixed(2)}ms`);
      } catch (error) {
        console.error('WebGL渲染失败:', error);
        // 回退到Canvas 2D
        fallbackToCanvas2D();
      }
    } else {
      console.log('WebGL不可用，使用Canvas 2D渲染');
      // Canvas 2D回退渲染
      fallbackToCanvas2D();
    }
  }, [points, isLoading, webglSupported, handleResize]);

  // Canvas 2D回退渲染
  const fallbackToCanvas2D = useCallback(() => {
    if (!canvasRef.current || !points || points.length === 0) return;

    const startTime = performance.now();
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 清空画布
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 计算点的边界
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    points.forEach(p => {
      minX = Math.min(minX, p.re);
      maxX = Math.max(maxX, p.re);
      minY = Math.min(minY, p.im);
      maxY = Math.max(maxY, p.im);
    });

    const padding = 0.1;
    const rangeX = maxX - minX;
    const rangeY = maxY - minY;
    const adjustedMinX = minX - rangeX * padding;
    const adjustedMaxX = maxX + rangeX * padding;
    const adjustedMinY = minY - rangeY * padding;
    const adjustedMaxY = maxY + rangeY * padding;

    // 颜色映射
    const colorMap: { [key: string]: string } = {
      '1': 'rgba(255, 51, 51, 0.8)',   // 红色
      '2': 'rgba(51, 255, 51, 0.8)',   // 绿色
      '3': 'rgba(51, 51, 255, 0.8)',   // 蓝色
    };

    // 渲染点
    const maxRenderPoints = Math.min(points.length, 50000); // Canvas 2D限制
    for (let i = 0; i < maxRenderPoints; i++) {
      const point = points[i];
      
      const x = ((point.re - adjustedMinX) / (adjustedMaxX - adjustedMinX)) * canvas.width;
      const y = ((point.im - adjustedMinY) / (adjustedMaxY - adjustedMinY)) * canvas.height;
      
      if (isNaN(x) || isNaN(y)) continue;
      
      ctx.fillStyle = colorMap[point.baseType] || 'rgba(128, 128, 128, 0.8)';
      ctx.beginPath();
      ctx.arc(x, y, 2, 0, 2 * Math.PI);
      ctx.fill();
    }

    const renderTime = performance.now() - startTime;
    setRenderStats({
      pointCount: maxRenderPoints,
      renderTime: Math.round(renderTime * 100) / 100,
      mode: 'Canvas 2D'
    });

    // 保存渲染统计到全局
    (window as any).lastRenderStats = {
      renderTime: renderTime.toFixed(2)
    };

    console.log(`🎨 Canvas 2D渲染完成: ${maxRenderPoints}/${points.length} 点, ${renderTime.toFixed(2)}ms`);
  }, [points]);

  // 重置视图
  const resetView = useCallback(() => {
    if (webglRendererRef.current) {
      webglRendererRef.current.resetView();
      
      const transform = webglRendererRef.current.getTransform();
      onViewChange?.(transform);
    }
  }, [onViewChange]);

  // 获取当前视图变换
  const getViewTransform = useCallback((): ViewTransform | null => {
    return webglRendererRef.current?.getTransform() || null;
  }, []);

  // 设置视图变换
  const setViewTransform = useCallback((transform: Partial<ViewTransform>) => {
    if (webglRendererRef.current) {
      webglRendererRef.current.setTransform(transform);
      
      const newTransform = webglRendererRef.current.getTransform();
      onViewChange?.(newTransform);
    }
  }, [onViewChange]);

  return (
    <div className="relative w-full h-full bg-gray-900">
      <canvas
        ref={canvasRef}
        className="w-full h-full"
        data-testid={TEST_IDS.FRACTAL_CANVAS}
        style={{ 
          imageRendering: 'pixelated',
          cursor: webglSupported ? 'grab' : 'default'
        }}
      />
      
      {/* 加载指示器 */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900 bg-opacity-75">
          <div className="text-white text-lg">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
            计算中...
          </div>
        </div>
      )}

      {/* 缩放信息 - 简化显示 */}
      {webglSupported && webglRendererRef.current && (
        <div className="absolute top-4 left-4 bg-gray-800 bg-opacity-90 text-white text-xs px-3 py-2 rounded font-mono">
          <div>缩放: {(webglRendererRef.current.getTransform().scale * 100).toFixed(0)}%</div>
        </div>
      )}

      {/* 控制按钮 */}
      {webglSupported && webglRendererRef.current && (
        <div className="absolute top-4 right-4 flex flex-col gap-2">
          <button
            onClick={resetView}
            className="bg-gray-800 bg-opacity-90 text-white px-3 py-1 rounded text-xs hover:bg-gray-700 transition-colors"
            title="重置视图"
          >
            🔄 重置
          </button>
        </div>
      )}

      {/* WebGL不支持提示 */}
      {!webglSupported && enableWebGL && (
        <div className="absolute bottom-4 left-4 bg-yellow-600 bg-opacity-90 text-white text-xs px-3 py-2 rounded">
          ⚠️ WebGL不支持，使用Canvas 2D渲染
        </div>
      )}
    </div>
  );
};

export default WebGLFractalCanvas;
export { type WebGLFractalCanvasProps };