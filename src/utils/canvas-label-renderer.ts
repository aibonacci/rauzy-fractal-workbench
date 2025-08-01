/**
 * Canvas 2D标签渲染器
 * 用于在WebGL画布上覆盖渲染坐标轴的数值标签
 */

import { ViewTransform } from './simple-webgl-renderer';
import { DataBounds, AxisSettings } from './webgl-axis-renderer';

export class CanvasLabelRenderer {
  private overlayCanvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private webglCanvas: HTMLCanvasElement;
  private settings: AxisSettings;

  constructor(webglCanvas: HTMLCanvasElement, settings: AxisSettings) {
    this.webglCanvas = webglCanvas;
    this.settings = { ...settings };

    // 创建覆盖在WebGL画布上的2D画布用于文字渲染
    this.overlayCanvas = document.createElement('canvas');
    this.overlayCanvas.style.position = 'absolute';
    this.overlayCanvas.style.pointerEvents = 'none';
    this.overlayCanvas.style.zIndex = '10';
    this.overlayCanvas.style.left = '0';
    this.overlayCanvas.style.top = '0';

    // 获取2D渲染上下文
    const ctx = this.overlayCanvas.getContext('2d');
    if (!ctx) {
      throw new Error('Failed to get 2D rendering context for labels');
    }
    this.ctx = ctx;

    // 插入到WebGL画布的父容器中
    const parent = webglCanvas.parentElement;
    if (parent) {
      // 确保父容器有相对定位
      if (getComputedStyle(parent).position === 'static') {
        parent.style.position = 'relative';
      }
      parent.appendChild(this.overlayCanvas);
    } else {
      console.warn('WebGL画布没有父容器，无法添加标签覆盖层');
    }

    // 初始化画布尺寸
    this.resize(webglCanvas.width, webglCanvas.height);

    console.log('📝 Canvas标签渲染器初始化完成');
  }

  /**
   * 渲染坐标轴标签
   */
  renderLabels(transform: ViewTransform, bounds: DataBounds, gridStep: number): void {
    if (!this.settings.showLabels) {
      return;
    }

    // 清除之前的标签
    this.ctx.clearRect(0, 0, this.overlayCanvas.width, this.overlayCanvas.height);

    // 设置文字样式
    this.ctx.font = '12px Arial, sans-serif';
    this.ctx.fillStyle = `rgb(${this.settings.labelColor[0] * 255}, ${this.settings.labelColor[1] * 255}, ${this.settings.labelColor[2] * 255})`;
    this.ctx.strokeStyle = 'rgba(0, 0, 0, 0.8)'; // 文字描边，提高可读性
    this.ctx.lineWidth = 2;

    const precision = this.getPrecision(gridStep);

    // 渲染X轴标签
    this.renderXAxisLabels(transform, bounds, gridStep, precision);

    // 渲染Y轴标签
    this.renderYAxisLabels(transform, bounds, gridStep, precision);

    console.log(`📝 标签渲染完成: 步长=${gridStep.toFixed(4)}, 精度=${precision}`);
  }

  /**
   * 渲染X轴标签
   */
  private renderXAxisLabels(transform: ViewTransform, bounds: DataBounds, step: number, precision: number): void {
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'top';

    // 计算Y轴在屏幕上的位置
    const yAxisScreenY = this.worldToScreenY(0, transform, bounds);
    const labelY = Math.min(yAxisScreenY + 8, this.overlayCanvas.height - 20);

    for (let x = Math.ceil(bounds.minX / step) * step; x <= bounds.maxX; x += step) {
      if (Math.abs(x) > 0.001) { // 跳过原点
        const screenX = this.worldToScreenX(x, transform, bounds);
        
        // 检查标签是否在可见区域内
        if (screenX >= 20 && screenX <= this.overlayCanvas.width - 20) {
          const labelText = x.toFixed(precision);
          
          // 绘制文字描边（提高可读性）
          this.ctx.strokeText(labelText, screenX, labelY);
          
          // 绘制文字
          this.ctx.fillText(labelText, screenX, labelY);
        }
      }
    }
  }

  /**
   * 渲染Y轴标签
   */
  private renderYAxisLabels(transform: ViewTransform, bounds: DataBounds, step: number, precision: number): void {
    this.ctx.textAlign = 'right';
    this.ctx.textBaseline = 'middle';

    // 计算X轴在屏幕上的位置
    const xAxisScreenX = this.worldToScreenX(0, transform, bounds);
    const labelX = Math.max(xAxisScreenX - 8, 60);

    for (let y = Math.ceil(bounds.minY / step) * step; y <= bounds.maxY; y += step) {
      if (Math.abs(y) > 0.001) { // 跳过原点
        const screenY = this.worldToScreenY(y, transform, bounds);
        
        // 检查标签是否在可见区域内
        if (screenY >= 20 && screenY <= this.overlayCanvas.height - 20) {
          const labelText = y.toFixed(precision);
          
          // 绘制文字描边（提高可读性）
          this.ctx.strokeText(labelText, labelX, screenY);
          
          // 绘制文字
          this.ctx.fillText(labelText, labelX, screenY);
        }
      }
    }
  }

  /**
   * 世界坐标转屏幕X坐标
   */
  private worldToScreenX(worldX: number, transform: ViewTransform, bounds: DataBounds): number {
    const normalizedX = (worldX - bounds.minX) / (bounds.maxX - bounds.minX) * 2 - 1;
    const transformedX = normalizedX * transform.scale + transform.offsetX;
    return (transformedX + 1) * this.overlayCanvas.width / 2;
  }

  /**
   * 世界坐标转屏幕Y坐标
   */
  private worldToScreenY(worldY: number, transform: ViewTransform, bounds: DataBounds): number {
    const normalizedY = (worldY - bounds.minY) / (bounds.maxY - bounds.minY) * 2 - 1;
    const transformedY = normalizedY * transform.scale + transform.offsetY;
    return (1 - transformedY) * this.overlayCanvas.height / 2;
  }

  /**
   * 根据步长计算合适的数值精度
   */
  private getPrecision(step: number): number {
    if (step >= 1) return 0;
    if (step >= 0.1) return 1;
    if (step >= 0.01) return 2;
    if (step >= 0.001) return 3;
    if (step >= 0.0001) return 4;
    return 5;
  }

  /**
   * 更新设置
   */
  updateSettings(settings: Partial<AxisSettings>): void {
    this.settings = { ...this.settings, ...settings };
    console.log('📝 标签渲染器设置已更新');
  }

  /**
   * 调整画布尺寸
   */
  resize(width: number, height: number): void {
    // 设置画布的实际尺寸
    this.overlayCanvas.width = width;
    this.overlayCanvas.height = height;
    
    // 设置画布的CSS尺寸
    this.overlayCanvas.style.width = width + 'px';
    this.overlayCanvas.style.height = height + 'px';

    console.log(`📝 标签画布尺寸调整: ${width}x${height}`);
  }

  /**
   * 清除所有标签
   */
  clear(): void {
    this.ctx.clearRect(0, 0, this.overlayCanvas.width, this.overlayCanvas.height);
  }

  /**
   * 获取覆盖画布元素（用于调试或高级操作）
   */
  getOverlayCanvas(): HTMLCanvasElement {
    return this.overlayCanvas;
  }

  /**
   * 清理资源
   */
  dispose(): void {
    // 从DOM中移除覆盖画布
    if (this.overlayCanvas.parentElement) {
      this.overlayCanvas.parentElement.removeChild(this.overlayCanvas);
    }

    console.log('🧹 Canvas标签渲染器已清理');
  }
}