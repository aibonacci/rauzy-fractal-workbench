/**
 * 增强型WebGL渲染器
 * 在原有分形渲染基础上添加坐标轴、网格和标签功能
 */

import { SimpleWebGLRenderer, ViewTransform } from './simple-webgl-renderer';
import { WebGLAxisRenderer, AxisSettings, DEFAULT_AXIS_SETTINGS, DataBounds } from './webgl-axis-renderer';
import { CanvasLabelRenderer } from './canvas-label-renderer';
import { RenderPoint } from '../types';

export class EnhancedWebGLRenderer extends SimpleWebGLRenderer {
  private axisRenderer: WebGLAxisRenderer | null = null;
  private labelRenderer: CanvasLabelRenderer | null = null;
  private axisSettings: AxisSettings;
  
  // 数据边界缓存
  private currentBounds: DataBounds = { minX: -1, maxX: 1, minY: -1, maxY: 1 };

  constructor(canvas: HTMLCanvasElement, axisSettings: AxisSettings = DEFAULT_AXIS_SETTINGS) {
    super(canvas);
    this.axisSettings = { ...axisSettings };
    this.initAxisRenderers();
  }

  /**
   * 初始化坐标轴渲染器
   */
  private initAxisRenderers(): void {
    try {
      // 获取WebGL上下文（从父类）
      const gl = (this as any).gl as WebGLRenderingContext;
      
      if (!gl) {
        console.warn('⚠️ WebGL上下文不可用，跳过坐标轴初始化');
        return;
      }

      // 创建坐标轴渲染器
      this.axisRenderer = new WebGLAxisRenderer(gl, this.axisSettings);

      // 创建标签渲染器
      this.labelRenderer = new CanvasLabelRenderer((this as any).canvas, this.axisSettings);

      console.log('🎯 增强型WebGL渲染器初始化完成');
    } catch (error) {
      console.error('坐标轴渲染器初始化失败:', error);
      // 继续使用基础渲染器，不影响分形渲染
    }
  }

  /**
   * 重写updatePoints方法，缓存数据边界
   */
  updatePoints(points: RenderPoint[]): void {
    // 调用父类方法
    super.updatePoints(points);

    // 计算并缓存数据边界
    if (points.length > 0) {
      let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
      
      for (const point of points) {
        minX = Math.min(minX, point.re);
        maxX = Math.max(maxX, point.re);
        minY = Math.min(minY, point.im);
        maxY = Math.max(maxY, point.im);
      }

      // 添加边距
      const rangeX = maxX - minX;
      const rangeY = maxY - minY;
      const padding = 0.1;
      minX -= rangeX * padding;
      maxX += rangeX * padding;
      minY -= rangeY * padding;
      maxY += rangeY * padding;

      this.currentBounds = { minX, maxX, minY, maxY };
      
      console.log(`🎯 数据边界已更新: [${minX.toFixed(3)}, ${maxX.toFixed(3)}] x [${minY.toFixed(3)}, ${maxY.toFixed(3)}]`);
    }
  }

  /**
   * 重写render方法，添加坐标轴渲染
   */
  render(): void {
    // 首先渲染分形点（调用父类方法）
    super.render();

    // 然后渲染坐标轴系统
    this.renderAxisSystem();
  }

  /**
   * 渲染坐标轴系统
   */
  private renderAxisSystem(): void {
    if (!this.axisRenderer || !this.labelRenderer) {
      return;
    }

    try {
      const transform = this.getTransform();
      
      // 渲染网格线（在坐标轴之前，作为背景）
      if (this.axisSettings.showGrid) {
        this.axisRenderer.renderGrid(transform, this.currentBounds);
      }

      // 渲染坐标轴
      if (this.axisSettings.showAxes) {
        this.axisRenderer.renderAxes(transform, this.currentBounds);
      }

      // 渲染标签
      if (this.axisSettings.showLabels) {
        const gridStep = this.axisRenderer.getGridStep(this.currentBounds, transform.scale);
        this.labelRenderer.renderLabels(transform, this.currentBounds, gridStep);
      }

    } catch (error) {
      console.error('坐标轴渲染失败:', error);
      // 不影响主要的分形渲染
    }
  }

  /**
   * 更新坐标轴设置
   */
  updateAxisSettings(settings: Partial<AxisSettings>): void {
    this.axisSettings = { ...this.axisSettings, ...settings };

    // 更新渲染器设置
    if (this.axisRenderer) {
      this.axisRenderer.updateSettings(settings);
    }

    if (this.labelRenderer) {
      this.labelRenderer.updateSettings(settings);
    }

    // 触发重新渲染
    this.render();

    console.log('🎯 坐标轴设置已更新:', this.axisSettings);
  }

  /**
   * 获取当前坐标轴设置
   */
  getAxisSettings(): AxisSettings {
    return { ...this.axisSettings };
  }

  /**
   * 切换坐标轴显示
   */
  toggleAxes(show?: boolean): void {
    const newShow = show !== undefined ? show : !this.axisSettings.showAxes;
    this.updateAxisSettings({ showAxes: newShow });
  }

  /**
   * 切换标签显示
   */
  toggleLabels(show?: boolean): void {
    const newShow = show !== undefined ? show : !this.axisSettings.showLabels;
    this.updateAxisSettings({ showLabels: newShow });
  }

  /**
   * 切换网格显示
   */
  toggleGrid(show?: boolean): void {
    const newShow = show !== undefined ? show : !this.axisSettings.showGrid;
    this.updateAxisSettings({ showGrid: newShow });
  }

  /**
   * 重写resize方法，同时调整标签画布
   */
  resize(width: number, height: number): void {
    // 调用父类方法
    super.resize(width, height);

    // 调整标签画布尺寸
    if (this.labelRenderer) {
      this.labelRenderer.resize(width, height);
    }
  }

  /**
   * 重写resetView方法，确保坐标轴同步重置
   */
  resetView(): void {
    super.resetView();
    
    // 坐标轴会在下次render时自动更新
    this.render();
  }

  /**
   * 重写setTransform方法，确保坐标轴同步更新
   */
  setTransform(transform: Partial<ViewTransform>): void {
    super.setTransform(transform);
    
    // 坐标轴会在render时自动更新
  }

  /**
   * 获取当前数据边界（用于外部查询）
   */
  getCurrentBounds(): DataBounds {
    return { ...this.currentBounds };
  }

  /**
   * 清除标签（用于特殊情况）
   */
  clearLabels(): void {
    if (this.labelRenderer) {
      this.labelRenderer.clear();
    }
  }

  /**
   * 重写dispose方法，清理坐标轴资源
   */
  dispose(): void {
    // 清理坐标轴渲染器
    if (this.axisRenderer) {
      this.axisRenderer.dispose();
      this.axisRenderer = null;
    }

    // 清理标签渲染器
    if (this.labelRenderer) {
      this.labelRenderer.dispose();
      this.labelRenderer = null;
    }

    // 调用父类清理方法
    super.dispose();

    console.log('🧹 增强型WebGL渲染器已清理');
  }
}

// 导出相关类型
export { type AxisSettings, DEFAULT_AXIS_SETTINGS };