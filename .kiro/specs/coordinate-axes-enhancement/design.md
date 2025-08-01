# 设计文档

## 概述

坐标轴增强功能将为Rauzy分形工作台添加专业级的坐标系统，包括坐标轴、数值标签、网格线和相关控制界面。设计采用WebGL渲染以保持高性能，并与现有的分形渲染系统无缝集成。

## 架构设计

### 坐标轴渲染架构

```typescript
// 坐标轴渲染器架构
interface AxisRenderer {
  // 主坐标轴渲染
  renderAxes(transform: ViewTransform, bounds: DataBounds): void;
  
  // 数值标签渲染
  renderLabels(transform: ViewTransform, bounds: DataBounds): void;
  
  // 网格线渲染
  renderGrid(transform: ViewTransform, bounds: DataBounds): void;
  
  // 更新设置
  updateSettings(settings: AxisSettings): void;
}

// 坐标轴设置
interface AxisSettings {
  showAxes: boolean;
  showLabels: boolean;
  showGrid: boolean;
  axisColor: [number, number, number];
  gridColor: [number, number, number];
  labelColor: [number, number, number];
  labelPrecision: number;
}
```

### WebGL集成设计

```typescript
// 扩展现有的WebGL渲染器
class EnhancedWebGLRenderer extends SimpleWebGLRenderer {
  private axisRenderer: AxisRenderer;
  private axisSettings: AxisSettings;
  
  // 重写渲染方法，添加坐标轴渲染
  render(): void {
    // 1. 渲染分形点（现有逻辑）
    super.render();
    
    // 2. 渲染坐标轴系统
    if (this.axisSettings.showAxes) {
      this.axisRenderer.renderAxes(this.transform, this.dataBounds);
    }
    
    if (this.axisSettings.showLabels) {
      this.axisRenderer.renderLabels(this.transform, this.dataBounds);
    }
    
    if (this.axisSettings.showGrid) {
      this.axisRenderer.renderGrid(this.transform, this.dataBounds);
    }
  }
}
```

## 组件和接口设计

### 坐标轴渲染组件

```typescript
// WebGL坐标轴渲染器
class WebGLAxisRenderer implements AxisRenderer {
  private gl: WebGLRenderingContext;
  private axisProgram: WebGLProgram;
  private labelProgram: WebGLProgram;
  private axisBuffer: WebGLBuffer;
  private gridBuffer: WebGLBuffer;
  
  // 坐标轴着色器
  private axisVertexShader = `
    attribute vec2 a_position;
    uniform vec2 u_resolution;
    uniform float u_scale;
    uniform vec2 u_offset;
    uniform vec4 u_bounds;
    
    void main() {
      // 将世界坐标转换为屏幕坐标
      vec2 normalizedPos = vec2(
        (a_position.x - u_bounds.x) / (u_bounds.y - u_bounds.x) * 2.0 - 1.0,
        (a_position.y - u_bounds.z) / (u_bounds.w - u_bounds.z) * 2.0 - 1.0
      );
      
      vec2 transformedPos = normalizedPos * u_scale + u_offset;
      gl_Position = vec4(transformedPos, 0, 1);
    }
  `;
  
  private axisFragmentShader = `
    precision mediump float;
    uniform vec3 u_color;
    
    void main() {
      gl_FragColor = vec4(u_color, 0.8);
    }
  `;
  
  // 生成坐标轴几何数据
  generateAxisGeometry(bounds: DataBounds): Float32Array {
    const vertices = [];
    
    // X轴 (y = 0)
    vertices.push(bounds.minX, 0, bounds.maxX, 0);
    
    // Y轴 (x = 0)
    vertices.push(0, bounds.minY, 0, bounds.maxY);
    
    return new Float32Array(vertices);
  }
  
  // 生成网格几何数据
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
  
  // 计算合适的网格步长
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
}
```

### 标签渲染系统

```typescript
// Canvas 2D标签渲染器（用于文字）
class CanvasLabelRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private overlayCanvas: HTMLCanvasElement;
  
  constructor(webglCanvas: HTMLCanvasElement) {
    // 创建覆盖在WebGL画布上的2D画布用于文字渲染
    this.overlayCanvas = document.createElement('canvas');
    this.overlayCanvas.style.position = 'absolute';
    this.overlayCanvas.style.pointerEvents = 'none';
    this.overlayCanvas.style.zIndex = '10';
    
    // 插入到WebGL画布的父容器中
    webglCanvas.parentElement?.appendChild(this.overlayCanvas);
    
    this.ctx = this.overlayCanvas.getContext('2d')!;
  }
  
  renderLabels(transform: ViewTransform, bounds: DataBounds): void {
    this.ctx.clearRect(0, 0, this.overlayCanvas.width, this.overlayCanvas.height);
    
    const step = this.calculateLabelStep(bounds, transform.scale);
    
    // 设置文字样式
    this.ctx.font = '12px Arial';
    this.ctx.fillStyle = '#ffffff';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'top';
    
    // X轴标签
    for (let x = Math.ceil(bounds.minX / step) * step; x <= bounds.maxX; x += step) {
      if (Math.abs(x) > 0.001) {
        const screenX = this.worldToScreenX(x, transform, bounds);
        const screenY = this.worldToScreenY(0, transform, bounds);
        
        if (screenX >= 0 && screenX <= this.overlayCanvas.width) {
          this.ctx.fillText(
            x.toFixed(this.getPrecision(step)), 
            screenX, 
            Math.min(screenY + 5, this.overlayCanvas.height - 15)
          );
        }
      }
    }
    
    // Y轴标签
    this.ctx.textAlign = 'right';
    this.ctx.textBaseline = 'middle';
    
    for (let y = Math.ceil(bounds.minY / step) * step; y <= bounds.maxY; y += step) {
      if (Math.abs(y) > 0.001) {
        const screenX = this.worldToScreenX(0, transform, bounds);
        const screenY = this.worldToScreenY(y, transform, bounds);
        
        if (screenY >= 0 && screenY <= this.overlayCanvas.height) {
          this.ctx.fillText(
            y.toFixed(this.getPrecision(step)), 
            Math.max(screenX - 5, 50), 
            screenY
          );
        }
      }
    }
  }
  
  private worldToScreenX(worldX: number, transform: ViewTransform, bounds: DataBounds): number {
    const normalizedX = (worldX - bounds.minX) / (bounds.maxX - bounds.minX) * 2 - 1;
    const transformedX = normalizedX * transform.scale + transform.offsetX;
    return (transformedX + 1) * this.overlayCanvas.width / 2;
  }
  
  private worldToScreenY(worldY: number, transform: ViewTransform, bounds: DataBounds): number {
    const normalizedY = (worldY - bounds.minY) / (bounds.maxY - bounds.minY) * 2 - 1;
    const transformedY = normalizedY * transform.scale + transform.offsetY;
    return (1 - transformedY) * this.overlayCanvas.height / 2;
  }
  
  private calculateLabelStep(bounds: DataBounds, scale: number): number {
    // 与网格步长相同的计算逻辑
    const rangeX = bounds.maxX - bounds.minX;
    const rangeY = bounds.maxY - bounds.minY;
    const maxRange = Math.max(rangeX, rangeY);
    
    const baseStep = maxRange / (8 * scale); // 标签比网格稍微稀疏一些
    
    const magnitude = Math.pow(10, Math.floor(Math.log10(baseStep)));
    const normalized = baseStep / magnitude;
    
    if (normalized <= 1) return magnitude;
    if (normalized <= 2) return 2 * magnitude;
    if (normalized <= 5) return 5 * magnitude;
    return 10 * magnitude;
  }
  
  private getPrecision(step: number): number {
    if (step >= 1) return 0;
    if (step >= 0.1) return 1;
    if (step >= 0.01) return 2;
    if (step >= 0.001) return 3;
    return 4;
  }
  
  resize(width: number, height: number): void {
    this.overlayCanvas.width = width;
    this.overlayCanvas.height = height;
    this.overlayCanvas.style.width = width + 'px';
    this.overlayCanvas.style.height = height + 'px';
  }
  
  dispose(): void {
    this.overlayCanvas.remove();
  }
}
```

### UI控制组件

```typescript
// 坐标轴控制面板组件
interface AxisControlPanelProps {
  settings: AxisSettings;
  onSettingsChange: (settings: AxisSettings) => void;
}

const AxisControlPanel: React.FC<AxisControlPanelProps> = ({ 
  settings, 
  onSettingsChange 
}) => {
  return (
    <div className="axis-control-panel" data-testid="axis-control-panel">
      <h3>坐标轴设置</h3>
      
      <div className="control-group">
        <label>
          <input
            type="checkbox"
            checked={settings.showAxes}
            onChange={(e) => onSettingsChange({
              ...settings,
              showAxes: e.target.checked
            })}
            data-testid="show-axes-checkbox"
          />
          显示坐标轴
        </label>
      </div>
      
      <div className="control-group">
        <label>
          <input
            type="checkbox"
            checked={settings.showLabels}
            onChange={(e) => onSettingsChange({
              ...settings,
              showLabels: e.target.checked
            })}
            data-testid="show-labels-checkbox"
          />
          显示数值标签
        </label>
      </div>
      
      <div className="control-group">
        <label>
          <input
            type="checkbox"
            checked={settings.showGrid}
            onChange={(e) => onSettingsChange({
              ...settings,
              showGrid: e.target.checked
            })}
            data-testid="show-grid-checkbox"
          />
          显示网格线
        </label>
      </div>
    </div>
  );
};
```

## 数据模型

### 坐标轴配置模型

```typescript
// 坐标轴设置接口
interface AxisSettings {
  showAxes: boolean;
  showLabels: boolean;
  showGrid: boolean;
  axisColor: [number, number, number];
  gridColor: [number, number, number];
  labelColor: [number, number, number];
  axisWidth: number;
  gridWidth: number;
  labelFont: string;
  labelSize: number;
  autoScale: boolean;
  minGridSpacing: number;
  maxGridSpacing: number;
}

// 默认设置
const DEFAULT_AXIS_SETTINGS: AxisSettings = {
  showAxes: true,
  showLabels: true,
  showGrid: false,
  axisColor: [1.0, 1.0, 1.0],      // 白色
  gridColor: [0.3, 0.3, 0.3],      // 深灰色
  labelColor: [1.0, 1.0, 1.0],     // 白色
  axisWidth: 2.0,
  gridWidth: 1.0,
  labelFont: 'Arial',
  labelSize: 12,
  autoScale: true,
  minGridSpacing: 20,  // 像素
  maxGridSpacing: 100  // 像素
};
```

### 坐标变换模型

```typescript
// 坐标变换工具类
class CoordinateTransform {
  static worldToScreen(
    worldPos: [number, number],
    transform: ViewTransform,
    bounds: DataBounds,
    canvasSize: [number, number]
  ): [number, number] {
    const [worldX, worldY] = worldPos;
    const [canvasWidth, canvasHeight] = canvasSize;
    
    // 标准化到[-1, 1]
    const normalizedX = (worldX - bounds.minX) / (bounds.maxX - bounds.minX) * 2 - 1;
    const normalizedY = (worldY - bounds.minY) / (bounds.maxY - bounds.minY) * 2 - 1;
    
    // 应用变换
    const transformedX = normalizedX * transform.scale + transform.offsetX;
    const transformedY = normalizedY * transform.scale + transform.offsetY;
    
    // 转换为屏幕坐标
    const screenX = (transformedX + 1) * canvasWidth / 2;
    const screenY = (1 - transformedY) * canvasHeight / 2;
    
    return [screenX, screenY];
  }
  
  static screenToWorld(
    screenPos: [number, number],
    transform: ViewTransform,
    bounds: DataBounds,
    canvasSize: [number, number]
  ): [number, number] {
    const [screenX, screenY] = screenPos;
    const [canvasWidth, canvasHeight] = canvasSize;
    
    // 屏幕坐标转换为标准化坐标
    const normalizedX = screenX / canvasWidth * 2 - 1;
    const normalizedY = 1 - screenY / canvasHeight * 2;
    
    // 逆变换
    const transformedX = (normalizedX - transform.offsetX) / transform.scale;
    const transformedY = (normalizedY - transform.offsetY) / transform.scale;
    
    // 转换为世界坐标
    const worldX = (transformedX + 1) / 2 * (bounds.maxX - bounds.minX) + bounds.minX;
    const worldY = (transformedY + 1) / 2 * (bounds.maxY - bounds.minY) + bounds.minY;
    
    return [worldX, worldY];
  }
}
```

## 错误处理

### 渲染错误处理

```typescript
// 坐标轴渲染错误处理
class AxisRenderingErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }
  
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }
  
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('坐标轴渲染错误:', error, errorInfo);
    
    // 尝试恢复默认设置
    if (error.message.includes('WebGL')) {
      console.log('检测到WebGL错误，尝试降级到Canvas渲染');
      // 触发降级渲染模式
    }
  }
  
  render() {
    if (this.state.hasError) {
      return (
        <div className="axis-error-fallback">
          <p>坐标轴渲染出现问题</p>
          <button onClick={() => this.setState({ hasError: false })}>
            重试
          </button>
        </div>
      );
    }
    
    return this.props.children;
  }
}
```

## 测试策略

### 单元测试

```typescript
// 坐标轴渲染器测试
describe('WebGLAxisRenderer', () => {
  test('should generate correct axis geometry', () => {
    const renderer = new WebGLAxisRenderer(mockGL);
    const bounds = { minX: -2, maxX: 2, minY: -1, maxY: 1 };
    
    const geometry = renderer.generateAxisGeometry(bounds);
    
    expect(geometry).toEqual(new Float32Array([
      -2, 0, 2, 0,  // X轴
      0, -1, 0, 1   // Y轴
    ]));
  });
  
  test('should calculate appropriate grid step', () => {
    const renderer = new WebGLAxisRenderer(mockGL);
    const bounds = { minX: -1, maxX: 1, minY: -1, maxY: 1 };
    
    const step = renderer.calculateGridStep(bounds, 1.0);
    
    expect(step).toBeCloseTo(0.2, 1);
  });
});

// 坐标变换测试
describe('CoordinateTransform', () => {
  test('should correctly transform world to screen coordinates', () => {
    const worldPos: [number, number] = [0, 0];
    const transform = { scale: 1, offsetX: 0, offsetY: 0 };
    const bounds = { minX: -1, maxX: 1, minY: -1, maxY: 1 };
    const canvasSize: [number, number] = [400, 300];
    
    const screenPos = CoordinateTransform.worldToScreen(
      worldPos, transform, bounds, canvasSize
    );
    
    expect(screenPos).toEqual([200, 150]); // 画布中心
  });
});
```

### 集成测试

```typescript
// 坐标轴与分形渲染集成测试
describe('Axis Integration', () => {
  test('should render axes without affecting fractal performance', async () => {
    const canvas = document.createElement('canvas');
    const renderer = new EnhancedWebGLRenderer(canvas);
    
    const startTime = performance.now();
    
    // 渲染分形点
    renderer.updatePoints(mockFractalPoints);
    renderer.render();
    
    const fractalTime = performance.now() - startTime;
    
    // 启用坐标轴
    renderer.updateAxisSettings({ ...DEFAULT_AXIS_SETTINGS, showAxes: true });
    
    const axisStartTime = performance.now();
    renderer.render();
    const totalTime = performance.now() - axisStartTime;
    
    // 坐标轴不应显著影响性能（增加不超过50%）
    expect(totalTime).toBeLessThan(fractalTime * 1.5);
  });
});
```

## 性能优化

### 渲染优化策略

```typescript
// 坐标轴渲染优化
class OptimizedAxisRenderer {
  private geometryCache = new Map<string, Float32Array>();
  private lastBounds: DataBounds | null = null;
  private lastScale: number = 0;
  
  // 缓存几何数据，避免重复计算
  getCachedGeometry(bounds: DataBounds, scale: number, type: 'axis' | 'grid'): Float32Array {
    const key = `${type}-${bounds.minX}-${bounds.maxX}-${bounds.minY}-${bounds.maxY}-${scale}`;
    
    if (!this.geometryCache.has(key)) {
      const geometry = type === 'axis' 
        ? this.generateAxisGeometry(bounds)
        : this.generateGridGeometry(bounds, scale);
      
      this.geometryCache.set(key, geometry);
      
      // 限制缓存大小
      if (this.geometryCache.size > 10) {
        const firstKey = this.geometryCache.keys().next().value;
        this.geometryCache.delete(firstKey);
      }
    }
    
    return this.geometryCache.get(key)!;
  }
  
  // 智能更新：只在必要时重新生成几何数据
  shouldUpdateGeometry(bounds: DataBounds, scale: number): boolean {
    if (!this.lastBounds) return true;
    
    const boundsChanged = 
      Math.abs(bounds.minX - this.lastBounds.minX) > 0.001 ||
      Math.abs(bounds.maxX - this.lastBounds.maxX) > 0.001 ||
      Math.abs(bounds.minY - this.lastBounds.minY) > 0.001 ||
      Math.abs(bounds.maxY - this.lastBounds.maxY) > 0.001;
    
    const scaleChanged = Math.abs(scale - this.lastScale) > 0.1;
    
    return boundsChanged || scaleChanged;
  }
}
```

## AI Agent友好性

### 程序化控制接口

```typescript
// 扩展AgentOperationHelper以支持坐标轴控制
class EnhancedAgentOperationHelper extends AgentOperationHelper {
  // 控制坐标轴显示
  static async toggleAxes(show: boolean): Promise<boolean> {
    const checkbox = document.querySelector('[data-testid="show-axes-checkbox"]') as HTMLInputElement;
    if (!checkbox) return false;
    
    checkbox.checked = show;
    checkbox.dispatchEvent(new Event('change', { bubbles: true }));
    
    return true;
  }
  
  // 控制标签显示
  static async toggleLabels(show: boolean): Promise<boolean> {
    const checkbox = document.querySelector('[data-testid="show-labels-checkbox"]') as HTMLInputElement;
    if (!checkbox) return false;
    
    checkbox.checked = show;
    checkbox.dispatchEvent(new Event('change', { bubbles: true }));
    
    return true;
  }
  
  // 控制网格显示
  static async toggleGrid(show: boolean): Promise<boolean> {
    const checkbox = document.querySelector('[data-testid="show-grid-checkbox"]') as HTMLInputElement;
    if (!checkbox) return false;
    
    checkbox.checked = show;
    checkbox.dispatchEvent(new Event('change', { bubbles: true }));
    
    return true;
  }
  
  // 获取当前坐标轴设置
  static getCurrentAxisSettings(): AxisSettings | null {
    const axesCheckbox = document.querySelector('[data-testid="show-axes-checkbox"]') as HTMLInputElement;
    const labelsCheckbox = document.querySelector('[data-testid="show-labels-checkbox"]') as HTMLInputElement;
    const gridCheckbox = document.querySelector('[data-testid="show-grid-checkbox"]') as HTMLInputElement;
    
    if (!axesCheckbox || !labelsCheckbox || !gridCheckbox) return null;
    
    return {
      ...DEFAULT_AXIS_SETTINGS,
      showAxes: axesCheckbox.checked,
      showLabels: labelsCheckbox.checked,
      showGrid: gridCheckbox.checked
    };
  }
}
```

### 状态事件系统

```typescript
// 坐标轴状态变化事件
interface AxisStateChangeEvent extends CustomEvent {
  detail: {
    type: 'AXIS_SETTINGS_CHANGED';
    settings: AxisSettings;
    timestamp: number;
  };
}

// 事件分发器
class AxisEventDispatcher {
  static dispatchSettingsChange(settings: AxisSettings): void {
    const event = new CustomEvent('rauzy-axis-state-change', {
      detail: {
        type: 'AXIS_SETTINGS_CHANGED',
        settings,
        timestamp: Date.now()
      }
    }) as AxisStateChangeEvent;
    
    window.dispatchEvent(event);
  }
}

// AI Agent可以监听这些事件
window.addEventListener('rauzy-axis-state-change', (event: AxisStateChangeEvent) => {
  console.log('坐标轴设置已更改:', event.detail.settings);
});
```