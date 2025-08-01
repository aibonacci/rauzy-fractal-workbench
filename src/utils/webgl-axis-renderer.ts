/**
 * WebGL坐标轴渲染器
 * 专门用于渲染坐标轴、网格线和相关几何元素
 */

import { ViewTransform } from './simple-webgl-renderer';

interface DataBounds {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

interface AxisSettings {
  showAxes: boolean;
  showLabels: boolean;
  showGrid: boolean;
  axisColor: [number, number, number];
  gridColor: [number, number, number];
  labelColor: [number, number, number];
  axisWidth: number;
  gridWidth: number;
  autoScale: boolean;
  minGridSpacing: number;
  maxGridSpacing: number;
}

// 默认坐标轴设置
export const DEFAULT_AXIS_SETTINGS: AxisSettings = {
  showAxes: true,
  showLabels: true,
  showGrid: false,
  axisColor: [1.0, 1.0, 1.0],      // 白色
  gridColor: [0.3, 0.3, 0.3],      // 深灰色
  labelColor: [1.0, 1.0, 1.0],     // 白色
  axisWidth: 2.0,
  gridWidth: 1.0,
  autoScale: true,
  minGridSpacing: 20,  // 像素
  maxGridSpacing: 100  // 像素
};

export class WebGLAxisRenderer {
  private gl: WebGLRenderingContext;
  private axisProgram: WebGLProgram | null = null;
  private axisBuffer: WebGLBuffer | null = null;
  private gridBuffer: WebGLBuffer | null = null;
  private settings: AxisSettings;
  
  // 几何数据缓存
  private geometryCache = new Map<string, Float32Array>();
  private lastBounds: DataBounds | null = null;
  private lastScale: number = 0;

  // 坐标轴着色器源码
  private axisVertexShader = `
    attribute vec2 a_position;
    uniform vec2 u_resolution;
    uniform float u_scale;
    uniform vec2 u_offset;
    uniform vec4 u_bounds; // minX, maxX, minY, maxY
    
    void main() {
      // 将世界坐标标准化到[-1, 1]范围
      vec2 normalizedPos = vec2(
        (a_position.x - u_bounds.x) / (u_bounds.y - u_bounds.x) * 2.0 - 1.0,
        (a_position.y - u_bounds.z) / (u_bounds.w - u_bounds.z) * 2.0 - 1.0
      );
      
      // 应用缩放和偏移变换
      vec2 transformedPos = normalizedPos * u_scale + u_offset;
      
      gl_Position = vec4(transformedPos, 0, 1);
    }
  `;

  private axisFragmentShader = `
    precision mediump float;
    uniform vec3 u_color;
    uniform float u_alpha;
    
    void main() {
      gl_FragColor = vec4(u_color, u_alpha);
    }
  `;

  constructor(gl: WebGLRenderingContext, settings: AxisSettings = DEFAULT_AXIS_SETTINGS) {
    this.gl = gl;
    this.settings = { ...settings };
    this.initWebGL();
  }

  private initWebGL(): void {
    const { gl } = this;

    // 创建着色器
    const vertexShader = this.createShader(gl.VERTEX_SHADER, this.axisVertexShader);
    const fragmentShader = this.createShader(gl.FRAGMENT_SHADER, this.axisFragmentShader);

    if (!vertexShader || !fragmentShader) {
      throw new Error('Failed to create axis shaders');
    }

    // 创建程序
    this.axisProgram = this.createProgram(vertexShader, fragmentShader);
    if (!this.axisProgram) {
      throw new Error('Failed to create axis shader program');
    }

    // 清理着色器
    gl.deleteShader(vertexShader);
    gl.deleteShader(fragmentShader);

    // 创建缓冲区
    this.axisBuffer = gl.createBuffer();
    this.gridBuffer = gl.createBuffer();

    if (!this.axisBuffer || !this.gridBuffer) {
      throw new Error('Failed to create axis buffers');
    }

    console.log('🎯 WebGL坐标轴渲染器初始化完成');
  }

  private createShader(type: number, source: string): WebGLShader | null {
    const { gl } = this;
    const shader = gl.createShader(type);

    if (!shader) return null;

    gl.shaderSource(shader, source);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      console.error('Axis shader compilation error:', gl.getShaderInfoLog(shader));
      gl.deleteShader(shader);
      return null;
    }

    return shader;
  }

  private createProgram(vertexShader: WebGLShader, fragmentShader: WebGLShader): WebGLProgram | null {
    const { gl } = this;
    const program = gl.createProgram();

    if (!program) return null;

    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error('Axis program linking error:', gl.getProgramInfoLog(program));
      gl.deleteProgram(program);
      return null;
    }

    return program;
  }

  /**
   * 生成坐标轴几何数据
   */
  generateAxisGeometry(bounds: DataBounds): Float32Array {
    const vertices = [];

    // X轴 (y = 0) - 只在Y轴范围内绘制
    if (bounds.minY <= 0 && bounds.maxY >= 0) {
      vertices.push(bounds.minX, 0, bounds.maxX, 0);
    }

    // Y轴 (x = 0) - 只在X轴范围内绘制
    if (bounds.minX <= 0 && bounds.maxX >= 0) {
      vertices.push(0, bounds.minY, 0, bounds.maxY);
    }

    return new Float32Array(vertices);
  }

  /**
   * 生成网格线几何数据
   */
  generateGridGeometry(bounds: DataBounds, scale: number): Float32Array {
    const vertices = [];
    const step = this.calculateGridStep(bounds, scale);

    // 垂直网格线
    for (let x = Math.ceil(bounds.minX / step) * step; x <= bounds.maxX; x += step) {
      if (Math.abs(x) > 0.001) { // 跳过主轴
        vertices.push(x, bounds.minY, x, bounds.maxY);
      }
    }

    // 水平网格线
    for (let y = Math.ceil(bounds.minY / step) * step; y <= bounds.maxY; y += step) {
      if (Math.abs(y) > 0.001) { // 跳过主轴
        vertices.push(bounds.minX, y, bounds.maxX, y);
      }
    }

    return new Float32Array(vertices);
  }

  /**
   * 计算合适的网格步长
   */
  private calculateGridStep(bounds: DataBounds, scale: number): number {
    const rangeX = bounds.maxX - bounds.minX;
    const rangeY = bounds.maxY - bounds.minY;
    const maxRange = Math.max(rangeX, rangeY);

    // 根据缩放级别调整步长
    const baseStep = maxRange / (10 * scale);

    // 使用标准的步长值 (1, 2, 5) * 10^n
    const magnitude = Math.pow(10, Math.floor(Math.log10(baseStep)));
    const normalized = baseStep / magnitude;

    if (normalized <= 1) return magnitude;
    if (normalized <= 2) return 2 * magnitude;
    if (normalized <= 5) return 5 * magnitude;
    return 10 * magnitude;
  }

  /**
   * 获取缓存的几何数据
   */
  private getCachedGeometry(bounds: DataBounds, scale: number, type: 'axis' | 'grid'): Float32Array {
    const key = `${type}-${bounds.minX.toFixed(3)}-${bounds.maxX.toFixed(3)}-${bounds.minY.toFixed(3)}-${bounds.maxY.toFixed(3)}-${scale.toFixed(2)}`;

    if (!this.geometryCache.has(key)) {
      const geometry = type === 'axis' 
        ? this.generateAxisGeometry(bounds)
        : this.generateGridGeometry(bounds, scale);

      this.geometryCache.set(key, geometry);

      // 限制缓存大小
      if (this.geometryCache.size > 20) {
        const firstKey = this.geometryCache.keys().next().value;
        this.geometryCache.delete(firstKey);
      }
    }

    return this.geometryCache.get(key)!;
  }

  /**
   * 检查是否需要更新几何数据
   */
  private shouldUpdateGeometry(bounds: DataBounds, scale: number): boolean {
    if (!this.lastBounds) return true;

    const boundsChanged = 
      Math.abs(bounds.minX - this.lastBounds.minX) > 0.001 ||
      Math.abs(bounds.maxX - this.lastBounds.maxX) > 0.001 ||
      Math.abs(bounds.minY - this.lastBounds.minY) > 0.001 ||
      Math.abs(bounds.maxY - this.lastBounds.maxY) > 0.001;

    const scaleChanged = Math.abs(scale - this.lastScale) > 0.1;

    return boundsChanged || scaleChanged;
  }

  /**
   * 渲染坐标轴
   */
  renderAxes(transform: ViewTransform, bounds: DataBounds): void {
    if (!this.settings.showAxes || !this.axisProgram || !this.axisBuffer) {
      return;
    }

    const { gl } = this;

    // 获取坐标轴几何数据
    const axisGeometry = this.getCachedGeometry(bounds, transform.scale, 'axis');
    
    if (axisGeometry.length === 0) {
      return; // 没有坐标轴在视口内
    }

    // 上传几何数据
    gl.bindBuffer(gl.ARRAY_BUFFER, this.axisBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, axisGeometry, gl.STATIC_DRAW);

    // 使用坐标轴着色器程序
    gl.useProgram(this.axisProgram);

    // 设置uniform变量
    const resolutionLocation = gl.getUniformLocation(this.axisProgram, 'u_resolution');
    const scaleLocation = gl.getUniformLocation(this.axisProgram, 'u_scale');
    const offsetLocation = gl.getUniformLocation(this.axisProgram, 'u_offset');
    const boundsLocation = gl.getUniformLocation(this.axisProgram, 'u_bounds');
    const colorLocation = gl.getUniformLocation(this.axisProgram, 'u_color');
    const alphaLocation = gl.getUniformLocation(this.axisProgram, 'u_alpha');

    if (resolutionLocation) gl.uniform2f(resolutionLocation, gl.canvas.width, gl.canvas.height);
    if (scaleLocation) gl.uniform1f(scaleLocation, transform.scale);
    if (offsetLocation) gl.uniform2f(offsetLocation, transform.offsetX, transform.offsetY);
    if (boundsLocation) gl.uniform4f(boundsLocation, bounds.minX, bounds.maxX, bounds.minY, bounds.maxY);
    if (colorLocation) gl.uniform3f(colorLocation, ...this.settings.axisColor);
    if (alphaLocation) gl.uniform1f(alphaLocation, 0.8);

    // 设置位置属性
    const positionLocation = gl.getAttribLocation(this.axisProgram, 'a_position');
    if (positionLocation >= 0) {
      gl.enableVertexAttribArray(positionLocation);
      gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);
    }

    // 设置线宽（注意：WebGL中线宽支持有限）
    gl.lineWidth(this.settings.axisWidth);

    // 绘制坐标轴
    gl.drawArrays(gl.LINES, 0, axisGeometry.length / 2);

    console.log(`🎯 坐标轴渲染完成: ${axisGeometry.length / 4} 条轴线`);
  }

  /**
   * 渲染网格线
   */
  renderGrid(transform: ViewTransform, bounds: DataBounds): void {
    if (!this.settings.showGrid || !this.axisProgram || !this.gridBuffer) {
      return;
    }

    const { gl } = this;

    // 获取网格几何数据
    const gridGeometry = this.getCachedGeometry(bounds, transform.scale, 'grid');
    
    if (gridGeometry.length === 0) {
      return; // 没有网格线需要绘制
    }

    // 上传几何数据
    gl.bindBuffer(gl.ARRAY_BUFFER, this.gridBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, gridGeometry, gl.STATIC_DRAW);

    // 使用坐标轴着色器程序
    gl.useProgram(this.axisProgram);

    // 设置uniform变量
    const resolutionLocation = gl.getUniformLocation(this.axisProgram, 'u_resolution');
    const scaleLocation = gl.getUniformLocation(this.axisProgram, 'u_scale');
    const offsetLocation = gl.getUniformLocation(this.axisProgram, 'u_offset');
    const boundsLocation = gl.getUniformLocation(this.axisProgram, 'u_bounds');
    const colorLocation = gl.getUniformLocation(this.axisProgram, 'u_color');
    const alphaLocation = gl.getUniformLocation(this.axisProgram, 'u_alpha');

    if (resolutionLocation) gl.uniform2f(resolutionLocation, gl.canvas.width, gl.canvas.height);
    if (scaleLocation) gl.uniform1f(scaleLocation, transform.scale);
    if (offsetLocation) gl.uniform2f(offsetLocation, transform.offsetX, transform.offsetY);
    if (boundsLocation) gl.uniform4f(boundsLocation, bounds.minX, bounds.maxX, bounds.minY, bounds.maxY);
    if (colorLocation) gl.uniform3f(colorLocation, ...this.settings.gridColor);
    if (alphaLocation) gl.uniform1f(alphaLocation, 0.3); // 网格线更透明

    // 设置位置属性
    const positionLocation = gl.getAttribLocation(this.axisProgram, 'a_position');
    if (positionLocation >= 0) {
      gl.enableVertexAttribArray(positionLocation);
      gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);
    }

    // 设置线宽
    gl.lineWidth(this.settings.gridWidth);

    // 绘制网格线
    gl.drawArrays(gl.LINES, 0, gridGeometry.length / 2);

    console.log(`🎯 网格渲染完成: ${gridGeometry.length / 4} 条网格线`);
  }

  /**
   * 更新坐标轴设置
   */
  updateSettings(settings: Partial<AxisSettings>): void {
    this.settings = { ...this.settings, ...settings };
    
    // 清除几何缓存，强制重新生成
    this.geometryCache.clear();
    this.lastBounds = null;
    this.lastScale = 0;
    
    console.log('🎯 坐标轴设置已更新:', this.settings);
  }

  /**
   * 获取当前设置
   */
  getSettings(): AxisSettings {
    return { ...this.settings };
  }

  /**
   * 获取网格步长（用于标签渲染）
   */
  getGridStep(bounds: DataBounds, scale: number): number {
    return this.calculateGridStep(bounds, scale);
  }

  /**
   * 清理资源
   */
  dispose(): void {
    const { gl } = this;

    if (this.axisProgram) {
      gl.deleteProgram(this.axisProgram);
      this.axisProgram = null;
    }

    if (this.axisBuffer) {
      gl.deleteBuffer(this.axisBuffer);
      this.axisBuffer = null;
    }

    if (this.gridBuffer) {
      gl.deleteBuffer(this.gridBuffer);
      this.gridBuffer = null;
    }

    // 清理缓存
    this.geometryCache.clear();
    this.lastBounds = null;

    console.log('🧹 WebGL坐标轴渲染器已清理');
  }
}

export { type AxisSettings, type DataBounds };