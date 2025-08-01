/**
 * 简洁WebGL渲染器 - 从第一性原理重新构建
 * 核心原则：简单、可靠、无状态竞争
 */

import { RenderPoint } from '../types';

interface ViewTransform {
  scale: number;
  offsetX: number;
  offsetY: number;
}

export class SimpleWebGLRenderer {
  private canvas: HTMLCanvasElement;
  private gl: WebGLRenderingContext;
  private program: WebGLProgram | null = null;
  private positionBuffer: WebGLBuffer | null = null;
  private colorBuffer: WebGLBuffer | null = null;

  // 数据状态 - 简单明确
  private pointCount = 0;
  private dataBounds = { minX: -1, maxX: 1, minY: -1, maxY: 1 };

  // 数据缓存 - 防止交互时数据丢失
  private lastValidPointCount = 0;

  // 视图变换
  private transform: ViewTransform = {
    scale: 1.0,
    offsetX: 0.0,
    offsetY: 0.0
  };

  // 着色器源码
  private vertexShaderSource = `
    attribute vec2 a_position;
    attribute vec3 a_color;
    
    uniform vec2 u_resolution;
    uniform float u_scale;
    uniform vec2 u_offset;
    uniform vec4 u_bounds;
    
    varying vec3 v_color;
    
    void main() {
      // 标准化坐标到[-1, 1]
      vec2 normalizedPos = vec2(
        (a_position.x - u_bounds.x) / (u_bounds.y - u_bounds.x) * 2.0 - 1.0,
        (a_position.y - u_bounds.z) / (u_bounds.w - u_bounds.z) * 2.0 - 1.0
      );
      
      // 应用变换
      vec2 transformedPos = normalizedPos * u_scale + u_offset;
      
      gl_Position = vec4(transformedPos, 0, 1);
      gl_PointSize = 3.0; // 固定点大小，不随缩放变化
      
      v_color = a_color;
    }
  `;

  private fragmentShaderSource = `
    precision mediump float;
    
    varying vec3 v_color;
    
    void main() {
      // 圆形点
      vec2 coord = gl_PointCoord - vec2(0.5);
      float dist = length(coord);
      
      if (dist > 0.5) {
        discard;
      }
      
      float alpha = 1.0 - smoothstep(0.4, 0.5, dist);
      gl_FragColor = vec4(v_color, alpha);
    }
  `;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;

    const gl = canvas.getContext('webgl', {
      antialias: true,
      alpha: true,
      premultipliedAlpha: false
    });

    if (!gl) {
      throw new Error('WebGL not supported');
    }

    this.gl = gl;
    this.initWebGL();
    this.setupInteraction();
  }

  private initWebGL(): void {
    const { gl } = this;

    // 创建着色器
    const vertexShader = this.createShader(gl.VERTEX_SHADER, this.vertexShaderSource);
    const fragmentShader = this.createShader(gl.FRAGMENT_SHADER, this.fragmentShaderSource);

    if (!vertexShader || !fragmentShader) {
      throw new Error('Failed to create shaders');
    }

    // 创建程序
    this.program = this.createProgram(vertexShader, fragmentShader);
    if (!this.program) {
      throw new Error('Failed to create shader program');
    }

    // 清理着色器
    gl.deleteShader(vertexShader);
    gl.deleteShader(fragmentShader);

    // 创建缓冲区
    this.positionBuffer = gl.createBuffer();
    this.colorBuffer = gl.createBuffer();

    if (!this.positionBuffer || !this.colorBuffer) {
      throw new Error('Failed to create buffers');
    }

    // 设置WebGL状态
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.clearColor(0.0, 0.0, 0.0, 1.0);

    console.log('🚀 简洁WebGL渲染器初始化完成');
  }

  private createShader(type: number, source: string): WebGLShader | null {
    const { gl } = this;
    const shader = gl.createShader(type);

    if (!shader) return null;

    gl.shaderSource(shader, source);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      console.error('Shader compilation error:', gl.getShaderInfoLog(shader));
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
      console.error('Program linking error:', gl.getProgramInfoLog(program));
      gl.deleteProgram(program);
      return null;
    }

    return program;
  }

  updatePoints(points: RenderPoint[]): void {
    console.log(`🔄 updatePoints 被调用: ${points.length} 点`);

    if (!this.program || !this.positionBuffer || !this.colorBuffer) {
      console.error('WebGL未初始化');
      return;
    }

    this.pointCount = points.length;

    if (points.length === 0) {
      console.log('⚠️ 接收到空点数据，pointCount重置为0');
      return;
    }

    // 缓存有效的点数
    this.lastValidPointCount = points.length;

    const { gl } = this;

    // 计算边界
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

    this.dataBounds = { minX, maxX, minY, maxY };

    // 准备数据
    const positions = new Float32Array(points.length * 2);
    const colors = new Float32Array(points.length * 3);

    // 颜色映射
    const colorMap: { [key: string]: [number, number, number] } = {
      '1': [1.0, 0.3, 0.3], // 红色
      '2': [0.3, 1.0, 0.3], // 绿色
      '3': [0.3, 0.3, 1.0], // 蓝色
    };

    // 统计颜色分布
    const colorStats: { [key: string]: number } = {};

    for (let i = 0; i < points.length; i++) {
      const point = points[i];

      // 位置
      positions[i * 2] = point.re;
      positions[i * 2 + 1] = point.im;

      // 颜色
      const baseType = point.baseType || 'unknown';
      const color = colorMap[baseType] || [0.7, 0.7, 0.7];
      colors[i * 3] = color[0];
      colors[i * 3 + 1] = color[1];
      colors[i * 3 + 2] = color[2];

      // 统计
      colorStats[baseType] = (colorStats[baseType] || 0) + 1;
    }

    console.log('🎨 颜色分布:', colorStats);

    // 上传位置数据
    gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);

    // 上传颜色数据
    gl.bindBuffer(gl.ARRAY_BUFFER, this.colorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, colors, gl.STATIC_DRAW);

    console.log(`📦 已上传 ${points.length} 个点的数据`);
  }

  render(): void {
    // 如果当前pointCount为0但之前有有效数据，使用缓存的点数
    const effectivePointCount = this.pointCount === 0 && this.lastValidPointCount > 0 ? this.lastValidPointCount : this.pointCount;

    if (!this.program || !this.positionBuffer || !this.colorBuffer || effectivePointCount === 0) {
      console.log('跳过渲染: 无数据或未初始化', {
        program: !!this.program,
        positionBuffer: !!this.positionBuffer,
        colorBuffer: !!this.colorBuffer,
        pointCount: this.pointCount,
        lastValidPointCount: this.lastValidPointCount,
        effectivePointCount
      });
      return;
    }

    const { gl } = this;

    // 设置视口
    gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    gl.clear(gl.COLOR_BUFFER_BIT);

    // 使用程序
    gl.useProgram(this.program);

    // 设置uniform
    const resolutionLocation = gl.getUniformLocation(this.program, 'u_resolution');
    const scaleLocation = gl.getUniformLocation(this.program, 'u_scale');
    const offsetLocation = gl.getUniformLocation(this.program, 'u_offset');
    const boundsLocation = gl.getUniformLocation(this.program, 'u_bounds');

    if (resolutionLocation) gl.uniform2f(resolutionLocation, this.canvas.width, this.canvas.height);
    if (scaleLocation) gl.uniform1f(scaleLocation, this.transform.scale);
    if (offsetLocation) gl.uniform2f(offsetLocation, this.transform.offsetX, this.transform.offsetY);
    if (boundsLocation) gl.uniform4f(boundsLocation, this.dataBounds.minX, this.dataBounds.maxX, this.dataBounds.minY, this.dataBounds.maxY);

    // 设置位置属性
    const positionLocation = gl.getAttribLocation(this.program, 'a_position');
    if (positionLocation >= 0) {
      gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
      gl.enableVertexAttribArray(positionLocation);
      gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);
    }

    // 设置颜色属性
    const colorLocation = gl.getAttribLocation(this.program, 'a_color');
    if (colorLocation >= 0) {
      gl.bindBuffer(gl.ARRAY_BUFFER, this.colorBuffer);
      gl.enableVertexAttribArray(colorLocation);
      gl.vertexAttribPointer(colorLocation, 3, gl.FLOAT, false, 0, 0);
    }

    // 绘制
    gl.drawArrays(gl.POINTS, 0, effectivePointCount);

    console.log(`✅ 渲染完成: ${effectivePointCount} 点, 缩放: ${this.transform.scale.toFixed(2)}`);
  }

  private setupInteraction(): void {
    // 鼠标滚轮缩放
    this.canvas.addEventListener('wheel', (e) => {
      e.preventDefault();

      const rect = this.canvas.getBoundingClientRect();
      // 使用CSS尺寸而不是canvas内部尺寸
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      // 转换为标准化坐标 [-1, 1]
      const normalizedX = (mouseX / rect.width) * 2 - 1;
      const normalizedY = -((mouseY / rect.height) * 2 - 1); // Y轴翻转

      // 计算缩放前的世界坐标
      const worldX = (normalizedX - this.transform.offsetX) / this.transform.scale;
      const worldY = (normalizedY - this.transform.offsetY) / this.transform.scale;

      // 缩放
      const scaleFactor = e.deltaY > 0 ? 0.9 : 1.1;
      const newScale = Math.max(0.1, Math.min(100, this.transform.scale * scaleFactor));

      // 调整偏移，保持鼠标位置不变
      this.transform.offsetX = normalizedX - worldX * newScale;
      this.transform.offsetY = normalizedY - worldY * newScale;
      this.transform.scale = newScale;

      console.log(`🔍 缩放: ${newScale.toFixed(2)}, 鼠标: (${normalizedX.toFixed(2)}, ${normalizedY.toFixed(2)})`);
      this.render();
    });

    // 拖拽
    let isDragging = false;
    let lastX = 0, lastY = 0;

    this.canvas.addEventListener('mousedown', (e) => {
      isDragging = true;
      lastX = e.clientX;
      lastY = e.clientY;
      this.canvas.style.cursor = 'grabbing';
    });

    this.canvas.addEventListener('mousemove', (e) => {
      if (!isDragging) return;

      const rect = this.canvas.getBoundingClientRect();

      // 计算鼠标移动的标准化距离
      const deltaX = (e.clientX - lastX) / rect.width * 2; // 转换为标准化坐标
      const deltaY = -(e.clientY - lastY) / rect.height * 2; // Y轴翻转

      // 直接应用移动，不除以scale，保持拖拽距离与鼠标移动一致
      this.transform.offsetX += deltaX;
      this.transform.offsetY += deltaY;

      lastX = e.clientX;
      lastY = e.clientY;

      console.log(`🔍 拖拽: offset=(${this.transform.offsetX.toFixed(2)}, ${this.transform.offsetY.toFixed(2)}), delta=(${deltaX.toFixed(3)}, ${deltaY.toFixed(3)})`);
      this.render();
    });

    this.canvas.addEventListener('mouseup', () => {
      isDragging = false;
      this.canvas.style.cursor = 'grab';
    });

    this.canvas.addEventListener('mouseleave', () => {
      isDragging = false;
      this.canvas.style.cursor = 'default';
    });

    this.canvas.style.cursor = 'grab';
  }

  resize(width: number, height: number): void {
    this.canvas.width = width;
    this.canvas.height = height;
    this.render();
  }

  resetView(): void {
    this.transform = {
      scale: 1.0,
      offsetX: 0.0,
      offsetY: 0.0
    };
    this.render();
  }

  getTransform(): ViewTransform {
    return { ...this.transform };
  }

  setTransform(transform: Partial<ViewTransform>): void {
    this.transform = { ...this.transform, ...transform };
    this.render();
  }

  dispose(): void {
    const { gl } = this;

    if (this.program) {
      gl.deleteProgram(this.program);
    }

    if (this.positionBuffer) {
      gl.deleteBuffer(this.positionBuffer);
    }

    if (this.colorBuffer) {
      gl.deleteBuffer(this.colorBuffer);
    }

    console.log('🧹 简洁WebGL渲染器已清理');
  }
}

export { type ViewTransform };