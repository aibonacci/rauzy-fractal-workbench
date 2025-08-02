/**
 * WebGL高性能渲染器
 * 支持百万级点数渲染、无级缩放和拖拽交互
 */

import { RenderPoint } from '../types';

interface ViewTransform {
  scale: number;
  offsetX: number;
  offsetY: number;
}

interface InteractionState {
  isDragging: boolean;
  lastMouseX: number;
  lastMouseY: number;
  dragStartX: number;
  dragStartY: number;
}

class WebGLRenderer {
  private canvas: HTMLCanvasElement;
  private gl: WebGLRenderingContext;
  private program: WebGLProgram | null = null;
  private positionBuffer: WebGLBuffer | null = null;
  private colorBuffer: WebGLBuffer | null = null;
  private pointCount = 0;
  private dataBounds = { minX: -1, maxX: 1, minY: -1, maxY: 1 };
  private isInitialized = false;
  private isRendering = false;
  private isInteracting = false;
  private pendingRender = false;

  // 缓存点数据，用于重新初始化时恢复
  private cachedPoints: RenderPoint[] = [];
  private hasValidData = false;

  // 视图变换
  private transform: ViewTransform = {
    scale: 1.0,
    offsetX: 0.0,
    offsetY: 0.0
  };

  // 交互状态
  private interaction: InteractionState = {
    isDragging: false,
    lastMouseX: 0,
    lastMouseY: 0,
    dragStartX: 0,
    dragStartY: 0
  };

  // 着色器源码
  private vertexShaderSource = `
    attribute vec2 a_position;
    attribute vec3 a_color;
    
    uniform vec2 u_resolution;
    uniform float u_scale;
    uniform vec2 u_offset;
    uniform vec4 u_bounds; // minX, maxX, minY, maxY
    
    varying vec3 v_color;
    
    void main() {
      // 将数据坐标标准化到[-1, 1]范围
      vec2 normalizedPos = vec2(
        (a_position.x - u_bounds.x) / (u_bounds.y - u_bounds.x) * 2.0 - 1.0,
        (a_position.y - u_bounds.z) / (u_bounds.w - u_bounds.z) * 2.0 - 1.0
      );
      
      // 应用缩放和偏移变换
      vec2 transformedPos = normalizedPos * u_scale + u_offset;
      
      gl_Position = vec4(transformedPos, 0, 1);
      gl_PointSize = max(2.0, u_scale * 3.0); // 根据缩放调整点大小
      
      v_color = a_color;
    }
  `;

  private fragmentShaderSource = `
    precision mediump float;
    
    varying vec3 v_color;
    
    void main() {
      // 创建圆形点
      vec2 coord = gl_PointCoord - vec2(0.5);
      float dist = length(coord);
      
      if (dist > 0.5) {
        discard; // 丢弃圆形外的像素
      }
      
      // 添加抗锯齿边缘
      float alpha = 1.0 - smoothstep(0.4, 0.5, dist);
      
      gl_FragColor = vec4(v_color, alpha);
    }
  `;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;

    // 获取WebGL上下文
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
    this.setupContextLossHandling();
  }

  private initWebGL(): void {
    const { gl } = this;

    // 如果正在交互，延迟初始化
    if (this.isInteracting) {
      console.warn('⚠️ 交互进行中，延迟WebGL初始化');
      setTimeout(() => this.initWebGL(), 50);
      return;
    }

    // 重置状态
    this.isInitialized = false;
    this.isRendering = false;

    // 清理旧的资源
    if (this.program) {
      gl.deleteProgram(this.program);
      this.program = null;
    }
    if (this.positionBuffer) {
      gl.deleteBuffer(this.positionBuffer);
      this.positionBuffer = null;
    }
    if (this.colorBuffer) {
      gl.deleteBuffer(this.colorBuffer);
      this.colorBuffer = null;
    }

    // 创建着色器程序
    const vertexShader = this.createShader(gl.VERTEX_SHADER, this.vertexShaderSource);
    const fragmentShader = this.createShader(gl.FRAGMENT_SHADER, this.fragmentShaderSource);

    if (!vertexShader || !fragmentShader) {
      throw new Error('Failed to create shaders');
    }

    this.program = this.createProgram(vertexShader, fragmentShader);
    if (!this.program) {
      throw new Error('Failed to create shader program');
    }

    // 清理着色器（程序已经链接，不再需要）
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

    this.isInitialized = true;
    console.log('🚀 WebGL渲染器初始化完成', {
      program: !!this.program,
      positionBuffer: !!this.positionBuffer,
      colorBuffer: !!this.colorBuffer
    });

    // 如果有缓存的数据，重新上传
    if (this.hasValidData && this.cachedPoints.length > 0) {
      console.log('🔄 重新上传缓存的点数据:', this.cachedPoints.length);
      this.uploadPointData(this.cachedPoints);
    }
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

  private setupInteraction(): void {
    // 鼠标滚轮缩放
    this.canvas.addEventListener('wheel', (e) => {
      e.preventDefault();

      // 设置交互状态，防止并发操作
      this.isInteracting = true;

      try {
        // 检查WebGL状态
        if (!this.isInitialized || !this.program || !this.positionBuffer || !this.colorBuffer) {
          console.warn('⚠️ 交互时WebGL状态无效，跳过缩放');
          return;
        }

        const rect = this.canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        // 计算缩放中心点
        const centerX = (mouseX - this.canvas.width / 2) / this.transform.scale - this.transform.offsetX;
        const centerY = (mouseY - this.canvas.height / 2) / this.transform.scale - this.transform.offsetY;

        // 缩放因子
        const scaleFactor = e.deltaY > 0 ? 0.9 : 1.1;
        const newScale = Math.max(0.1, Math.min(100, this.transform.scale * scaleFactor));

        // 调整偏移以保持鼠标位置不变
        this.transform.offsetX = centerX - (mouseX - this.canvas.width / 2) / newScale;
        this.transform.offsetY = centerY - (mouseY - this.canvas.height / 2) / newScale;
        this.transform.scale = newScale;

        console.log(`🔍 缩放交互: scale=${newScale.toFixed(2)}, 状态检查通过`);

        // 延迟渲染，避免在交互过程中触发状态重置
        this.scheduleRender();

      } finally {
        // 确保交互状态被重置
        setTimeout(() => {
          this.isInteracting = false;
        }, 16); // 一帧的时间
      }
    });

    // 鼠标拖拽
    this.canvas.addEventListener('mousedown', (e) => {
      this.interaction.isDragging = true;
      this.interaction.dragStartX = e.clientX;
      this.interaction.dragStartY = e.clientY;
      this.interaction.lastMouseX = e.clientX;
      this.interaction.lastMouseY = e.clientY;

      this.canvas.style.cursor = 'grabbing';
    });

    this.canvas.addEventListener('mousemove', (e) => {
      if (!this.interaction.isDragging) return;

      // 设置交互状态
      this.isInteracting = true;

      try {
        // 检查WebGL状态
        if (!this.isInitialized || !this.program || !this.positionBuffer || !this.colorBuffer) {
          console.warn('⚠️ 拖拽时WebGL状态无效，跳过移动');
          return;
        }

        const deltaX = e.clientX - this.interaction.lastMouseX;
        const deltaY = e.clientY - this.interaction.lastMouseY;

        // 根据当前缩放调整拖拽速度
        this.transform.offsetX += deltaX / this.transform.scale;
        this.transform.offsetY += deltaY / this.transform.scale;

        this.interaction.lastMouseX = e.clientX;
        this.interaction.lastMouseY = e.clientY;

        console.log(`🔍 拖拽交互: offset=(${this.transform.offsetX.toFixed(2)}, ${this.transform.offsetY.toFixed(2)})`);

        // 延迟渲染
        this.scheduleRender();

      } finally {
        // 重置交互状态
        setTimeout(() => {
          this.isInteracting = false;
        }, 16);
      }
    });

    this.canvas.addEventListener('mouseup', () => {
      this.interaction.isDragging = false;
      this.canvas.style.cursor = 'grab';
    });

    this.canvas.addEventListener('mouseleave', () => {
      this.interaction.isDragging = false;
      this.canvas.style.cursor = 'default';
    });

    // 触摸支持
    this.setupTouchInteraction();

    // 设置默认光标
    this.canvas.style.cursor = 'grab';
  }

  private setupContextLossHandling(): void {
    this.canvas.addEventListener('webglcontextlost', (e) => {
      console.warn('WebGL上下文丢失');
      this.isInitialized = false;
      this.isRendering = false;
      e.preventDefault();
    });

    this.canvas.addEventListener('webglcontextrestored', () => {
      console.log('WebGL上下文恢复，重新初始化...');
      try {
        this.initWebGL();
        console.log('WebGL重新初始化成功');
      } catch (error) {
        console.error('WebGL重新初始化失败:', error);
        this.isInitialized = false;
      }
    });
  }

  private setupTouchInteraction(): void {
    let lastTouchDistance = 0;
    let lastTouchCenter = { x: 0, y: 0 };

    this.canvas.addEventListener('touchstart', (e) => {
      e.preventDefault();

      if (e.touches.length === 1) {
        // 单指拖拽
        const touch = e.touches[0];
        this.interaction.isDragging = true;
        this.interaction.lastMouseX = touch.clientX;
        this.interaction.lastMouseY = touch.clientY;
      } else if (e.touches.length === 2) {
        // 双指缩放
        const touch1 = e.touches[0];
        const touch2 = e.touches[1];

        lastTouchDistance = Math.sqrt(
          Math.pow(touch2.clientX - touch1.clientX, 2) +
          Math.pow(touch2.clientY - touch1.clientY, 2)
        );

        lastTouchCenter = {
          x: (touch1.clientX + touch2.clientX) / 2,
          y: (touch1.clientY + touch2.clientY) / 2
        };
      }
    });

    this.canvas.addEventListener('touchmove', (e) => {
      e.preventDefault();

      if (e.touches.length === 1 && this.interaction.isDragging) {
        // 单指拖拽
        const touch = e.touches[0];
        const deltaX = touch.clientX - this.interaction.lastMouseX;
        const deltaY = touch.clientY - this.interaction.lastMouseY;

        this.transform.offsetX += deltaX / this.transform.scale;
        this.transform.offsetY += deltaY / this.transform.scale;

        this.interaction.lastMouseX = touch.clientX;
        this.interaction.lastMouseY = touch.clientY;

        this.render();
      } else if (e.touches.length === 2) {
        // 双指缩放
        const touch1 = e.touches[0];
        const touch2 = e.touches[1];

        const currentDistance = Math.sqrt(
          Math.pow(touch2.clientX - touch1.clientX, 2) +
          Math.pow(touch2.clientY - touch1.clientY, 2)
        );

        const currentCenter = {
          x: (touch1.clientX + touch2.clientX) / 2,
          y: (touch1.clientY + touch2.clientY) / 2
        };

        if (lastTouchDistance > 0) {
          const scaleFactor = currentDistance / lastTouchDistance;
          const newScale = Math.max(0.1, Math.min(100, this.transform.scale * scaleFactor));

          // 调整偏移以保持缩放中心
          const rect = this.canvas.getBoundingClientRect();
          const centerX = (currentCenter.x - rect.left - this.canvas.width / 2) / this.transform.scale - this.transform.offsetX;
          const centerY = (currentCenter.y - rect.top - this.canvas.height / 2) / this.transform.scale - this.transform.offsetY;

          this.transform.offsetX = centerX - (currentCenter.x - rect.left - this.canvas.width / 2) / newScale;
          this.transform.offsetY = centerY - (currentCenter.y - rect.top - this.canvas.height / 2) / newScale;
          this.transform.scale = newScale;

          this.render();
        }

        lastTouchDistance = currentDistance;
        lastTouchCenter = currentCenter;
      }
    });

    this.canvas.addEventListener('touchend', () => {
      this.interaction.isDragging = false;
      lastTouchDistance = 0;
    });
  }

  updatePoints(points: RenderPoint[]): void {
    // 缓存点数据
    this.cachedPoints = [...points];
    this.hasValidData = points.length > 0;
    this.pointCount = points.length;

    console.log(`📦 缓存点数据: ${points.length} 点`);

    if (!this.program || !this.positionBuffer || !this.colorBuffer) {
      console.warn('⚠️ updatePoints: WebGL未初始化，尝试重新初始化...');
      try {
        this.initWebGL();
        // 重新初始化后，递归调用上传数据
        if (this.isInitialized) {
          this.uploadPointData(points);
        }
      } catch (error) {
        console.error('重新初始化失败:', error);
        return;
      }
    } else {
      this.uploadPointData(points);
    }
  }

  private uploadPointData(points: RenderPoint[]): void {
    if (points.length === 0) return;

    const { gl } = this;

    // 计算数据边界
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

    // 保存边界信息
    this.dataBounds = { minX, maxX, minY, maxY };

    // 准备位置数据 (x, y)
    const positions = new Float32Array(points.length * 2);
    const colors = new Float32Array(points.length * 3);

    // 基础瓦片颜色 (统一色调，不同透明度) - 转换为RGB
    const BASE_COLORS: { [key: string]: [number, number, number] } = {
      '1': [0.82, 0.84, 0.86], // rgba(209, 213, 219, 0.5) -> RGB
      '2': [0.82, 0.84, 0.86], // rgba(209, 213, 219, 0.35) -> RGB  
      '3': [0.82, 0.84, 0.86], // rgba(209, 213, 219, 0.2) -> RGB
    };

    // 多路径高亮的颜色调色板 - 转换为RGB
    const HIGHLIGHT_PALETTE: [number, number, number][] = [
      [0.98, 0.75, 0.14], // #FBBF24 -> RGB
      [0.97, 0.44, 0.44], // #F87171 -> RGB
      [0.20, 0.83, 0.60], // #34D399 -> RGB
      [0.51, 0.55, 0.97], // #818CF8 -> RGB
      [0.96, 0.45, 0.71], // #F472B6 -> RGB
      [0.38, 0.65, 0.98], // #60A5FA -> RGB
    ];

    // 统计颜色分布用于调试
    const colorStats: { [key: string]: number } = {};

    for (let i = 0; i < points.length; i++) {
      const point = points[i];

      // 位置数据
      positions[i * 2] = point.re;
      positions[i * 2 + 1] = point.im;

      // 颜色数据 - 正确处理highlightGroup
      let color: [number, number, number];

      if (point.highlightGroup !== undefined && point.highlightGroup !== -1) {
        // 高亮点：使用路径颜色
        color = HIGHLIGHT_PALETTE[point.highlightGroup % HIGHLIGHT_PALETTE.length];
        const groupKey = `highlight-${point.highlightGroup}`;
        colorStats[groupKey] = (colorStats[groupKey] || 0) + 1;
      } else {
        // 背景点：使用基础颜色
        const baseType = point.baseType || '1';
        color = BASE_COLORS[baseType] || [0.7, 0.7, 0.7];
        const bgKey = `background-${baseType}`;
        colorStats[bgKey] = (colorStats[bgKey] || 0) + 1;
      }

      colors[i * 3] = color[0];
      colors[i * 3 + 1] = color[1];
      colors[i * 3 + 2] = color[2];
    }

    console.log('🎨 颜色分布统计:', colorStats);

    // 上传位置数据
    gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);

    // 检查位置缓冲区上传是否成功
    const posError = gl.getError();
    if (posError !== gl.NO_ERROR) {
      console.error('位置缓冲区上传失败:', posError);
      return;
    }

    // 上传颜色数据
    gl.bindBuffer(gl.ARRAY_BUFFER, this.colorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, colors, gl.STATIC_DRAW);

    // 检查颜色缓冲区上传是否成功
    const colorError = gl.getError();
    if (colorError !== gl.NO_ERROR) {
      console.error('颜色缓冲区上传失败:', colorError);
      return;
    }

    // 验证程序状态
    if (!gl.isProgram(this.program)) {
      console.error('⚠️ 数据上传后程序状态无效');
      return;
    }

    console.log(`🎨 WebGL: 已上传 ${points.length} 个点的数据，边界: [${minX.toFixed(2)}, ${maxX.toFixed(2)}] x [${minY.toFixed(2)}, ${maxY.toFixed(2)}]`);
  }

  private scheduleRender(): void {
    if (this.pendingRender) return;

    this.pendingRender = true;
    requestAnimationFrame(() => {
      this.pendingRender = false;
      this.render();
    });
  }

  render(): void {
    // 防止重入渲染
    if (this.isRendering) {
      console.warn('⚠️ 渲染正在进行中，跳过重复调用');
      return;
    }

    // 如果正在交互，延迟渲染
    if (this.isInteracting) {
      console.log('🔄 交互进行中，延迟渲染');
      this.scheduleRender();
      return;
    }

    if (!this.isInitialized || !this.program || !this.positionBuffer || !this.colorBuffer || !this.hasValidData || this.pointCount === 0) {
      console.warn('WebGL渲染跳过: 程序未初始化或无数据', {
        isInitialized: this.isInitialized,
        program: !!this.program,
        positionBuffer: !!this.positionBuffer,
        colorBuffer: !!this.colorBuffer,
        hasValidData: this.hasValidData,
        pointCount: this.pointCount,
        cachedPointsLength: this.cachedPoints.length
      });

      // 如果有缓存数据但WebGL状态无效，尝试恢复
      if (this.hasValidData && this.cachedPoints.length > 0 && (!this.program || !this.positionBuffer || !this.colorBuffer)) {
        console.log('🔄 检测到缓存数据，尝试恢复WebGL状态');
        try {
          this.initWebGL();
          return;
        } catch (error) {
          console.error('WebGL状态恢复失败:', error);
        }
      }

      return;
    }

    const { gl } = this;

    // 验证WebGL程序是否仍然有效
    if (!gl.isProgram(this.program)) {
      console.error('WebGL程序无效，重新初始化...');
      this.isInitialized = false;
      try {
        this.initWebGL();
        // 重新初始化成功后，递归调用render
        this.render();
      } catch (error) {
        console.error('WebGL重新初始化失败:', error);
        this.isInitialized = false;
      }
      return;
    }

    this.isRendering = true;

    // 设置视口
    gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    gl.clear(gl.COLOR_BUFFER_BIT);

    // 使用着色器程序
    gl.useProgram(this.program);

    // 设置uniform变量
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
      console.log('🎨 颜色属性绑定成功, location:', colorLocation);
    } else {
      console.error('⚠️ 无法找到颜色属性 a_color');
    }

    // 绘制点
    gl.drawArrays(gl.POINTS, 0, this.pointCount);

    // 检查WebGL错误
    const error = gl.getError();
    if (error !== gl.NO_ERROR) {
      console.error('WebGL渲染错误:', error);
      this.isRendering = false;
      this.isInitialized = false;
      // 尝试重新初始化
      this.initWebGL();
      return;
    }

    // 检查WebGL上下文是否丢失
    if (gl.isContextLost()) {
      console.warn('WebGL上下文丢失，等待恢复...');
      this.isRendering = false;
      this.isInitialized = false;
      return;
    }

    console.log(`🎨 WebGL渲染: ${this.pointCount} 点, 画布: ${this.canvas.width}x${this.canvas.height}, 缩放: ${this.transform.scale.toFixed(2)}`);

    this.isRendering = false;
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

    // 清理缓存数据
    this.cachedPoints = [];
    this.hasValidData = false;
    this.pointCount = 0;

    console.log('🧹 WebGL渲染器已清理');
  }
}

export { WebGLRenderer, type ViewTransform };