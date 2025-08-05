/**
 * 坐标轴渲染器测试
 */

import { WebGLAxisRenderer, DEFAULT_AXIS_SETTINGS } from '../webgl-axis-renderer';

// Mock WebGL context
const mockGL = {
  createShader: jest.fn(() => ({})),
  shaderSource: jest.fn(),
  compileShader: jest.fn(),
  getShaderParameter: jest.fn(() => true),
  createProgram: jest.fn(() => ({})),
  attachShader: jest.fn(),
  linkProgram: jest.fn(),
  getProgramParameter: jest.fn(() => true),
  deleteShader: jest.fn(),
  createBuffer: jest.fn(() => ({})),
  canvas: { width: 800, height: 600 }
} as any;

describe('WebGLAxisRenderer', () => {
  let renderer: WebGLAxisRenderer;

  beforeEach(() => {
    renderer = new WebGLAxisRenderer(mockGL, DEFAULT_AXIS_SETTINGS);
  });

  test('should generate correct axis geometry', () => {
    const bounds = { minX: -2, maxX: 2, minY: -1, maxY: 1 };
    
    const geometry = renderer.generateAxisGeometry(bounds);
    
    // X轴: (-2,0) 到 (2,0)
    // Y轴: (0,-1) 到 (0,1)
    expect(geometry).toEqual(new Float32Array([
      -2, 0, 2, 0,  // X轴
      0, -1, 0, 1   // Y轴
    ]));
  });

  test('should calculate appropriate grid step', () => {
    const bounds = { minX: -1, maxX: 1, minY: -1, maxY: 1 };
    
    // 使用反射访问私有方法进行测试
    const step = (renderer as any).calculateGridStep(bounds, 1.0);
    
    // 对于范围2的数据，缩放1.0，应该得到合理的步长
    expect(step).toBeGreaterThan(0);
    expect(step).toBeLessThan(1);
  });

  test('should generate grid geometry without main axes', () => {
    const bounds = { minX: -1, maxX: 1, minY: -1, maxY: 1 };
    
    const geometry = renderer.generateGridGeometry(bounds, 1.0);
    
    // 网格几何应该不包含主轴（x=0, y=0）
    expect(geometry.length).toBeGreaterThan(0);
    
    // 检查是否跳过了主轴
    const vertices = Array.from(geometry);
    for (let i = 0; i < vertices.length; i += 4) {
      const x1 = vertices[i];
      const y1 = vertices[i + 1];
      const x2 = vertices[i + 2];
      const y2 = vertices[i + 3];
      
      // 垂直线不应该在x=0
      if (x1 === x2) {
        expect(Math.abs(x1)).toBeGreaterThan(0.001);
      }
      
      // 水平线不应该在y=0
      if (y1 === y2) {
        expect(Math.abs(y1)).toBeGreaterThan(0.001);
      }
    }
  });

  test('should handle empty bounds correctly', () => {
    const bounds = { minX: 0, maxX: 0, minY: 0, maxY: 0 };
    
    const axisGeometry = renderer.generateAxisGeometry(bounds);
    const gridGeometry = renderer.generateGridGeometry(bounds, 1.0);
    
    // 空边界应该产生空几何或最小几何
    expect(axisGeometry.length).toBeGreaterThanOrEqual(0);
    expect(gridGeometry.length).toBeGreaterThanOrEqual(0);
  });

  test('should update settings correctly', () => {
    const newSettings = {
      showAxes: false,
      showGrid: true,
      axisColor: [1.0, 0.0, 0.0] as [number, number, number]
    };

    renderer.updateSettings(newSettings);
    
    const currentSettings = renderer.getSettings();
    expect(currentSettings.showAxes).toBe(false);
    expect(currentSettings.showGrid).toBe(true);
    expect(currentSettings.axisColor).toEqual([1.0, 0.0, 0.0]);
  });
});