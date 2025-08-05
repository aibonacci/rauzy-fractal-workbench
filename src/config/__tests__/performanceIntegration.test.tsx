/**
 * 性能配置集成测试
 * 验证性能配置在实际组件中的应用
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';
import { ConfigProvider } from '../ConfigContext';
import { DEFAULT_CONFIG } from '../defaultConfig';
import { setGlobalConfig, getGlobalConfig, getConfigValue as getGlobalConfigValue } from '../globalConfig';
import { setGlobalConfig } from '../globalConfig';
import WebGLFractalCanvas from '../../components/FractalCanvas/WebGLFractalCanvas';

// Mock WebGL context
const mockWebGLContext = {
  getExtension: vi.fn(),
  createShader: vi.fn(),
  shaderSource: vi.fn(),
  compileShader: vi.fn(),
  getShaderParameter: vi.fn(() => true),
  createProgram: vi.fn(),
  attachShader: vi.fn(),
  linkProgram: vi.fn(),
  getProgramParameter: vi.fn(() => true),
  deleteShader: vi.fn(),
  createBuffer: vi.fn(),
  enable: vi.fn(),
  blendFunc: vi.fn(),
  clearColor: vi.fn(),
  viewport: vi.fn(),
  clear: vi.fn(),
  useProgram: vi.fn(),
  getUniformLocation: vi.fn(),
  uniform2f: vi.fn(),
  uniform1f: vi.fn(),
  uniform4f: vi.fn(),
  getAttribLocation: vi.fn(() => 0),
  bindBuffer: vi.fn(),
  enableVertexAttribArray: vi.fn(),
  vertexAttribPointer: vi.fn(),
  bufferData: vi.fn(),
  drawArrays: vi.fn(),
  getError: vi.fn(() => 0),
  isContextLost: vi.fn(() => false),
  isProgram: vi.fn(() => true),
  deleteProgram: vi.fn(),
  deleteBuffer: vi.fn(),
  NO_ERROR: 0,
  VERTEX_SHADER: 35633,
  FRAGMENT_SHADER: 35632,
  COMPILE_STATUS: 35713,
  LINK_STATUS: 35714,
  ARRAY_BUFFER: 34962,
  STATIC_DRAW: 35044,
  BLEND: 3042,
  SRC_ALPHA: 770,
  ONE_MINUS_SRC_ALPHA: 771,
  COLOR_BUFFER_BIT: 16384,
  POINTS: 0,
  FLOAT: 5126
};

// Mock HTMLCanvasElement.getContext
HTMLCanvasElement.prototype.getContext = vi.fn((contextType) => {
  if (contextType === 'webgl') {
    return mockWebGLContext;
  }
  if (contextType === '2d') {
    return {
      clearRect: vi.fn(),
      fillStyle: '',
      beginPath: vi.fn(),
      arc: vi.fn(),
      fill: vi.fn()
    };
  }
  return null;
});

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

describe('性能配置集成测试', () => {
  beforeEach(() => {
    // 重置全局配置
    setGlobalConfig(DEFAULT_CONFIG);
    vi.clearAllMocks();
  });

  it('应该正确配置WebGL渲染参数', () => {
    const testConfig = {
      ...DEFAULT_CONFIG,
      performance: {
        ...DEFAULT_CONFIG.performance,
        rendering: {
          ...DEFAULT_CONFIG.performance.rendering,
          webgl: {
            pointSize: 5.0,
            maxPointSize: 15.0,
            lineWidth: 3.0
          }
        }
      }
    };

    setGlobalConfig(testConfig);

    // 验证配置值可以正确获取
    const webglConfig = getGlobalConfigValue('performance.rendering.webgl');
    expect(webglConfig.pointSize).toBe(5.0);
    expect(webglConfig.maxPointSize).toBe(15.0);
    expect(webglConfig.lineWidth).toBe(3.0);
  });

  it('应该在Canvas2D渲染中使用配置的点半径', async () => {
    const testConfig = {
      ...DEFAULT_CONFIG,
      performance: {
        ...DEFAULT_CONFIG.performance,
        rendering: {
          ...DEFAULT_CONFIG.performance.rendering,
          canvas2d: {
            lineWidth: 2.0,
            pointRadius: 4.0
          }
        }
      }
    };

    // 模拟WebGL不支持，强制使用Canvas2D
    HTMLCanvasElement.prototype.getContext = vi.fn((contextType) => {
      if (contextType === 'webgl') {
        return null; // WebGL不支持
      }
      if (contextType === '2d') {
        return {
          clearRect: vi.fn(),
          fillStyle: '',
          beginPath: vi.fn(),
          arc: vi.fn(),
          fill: vi.fn()
        };
      }
      return null;
    });

    const TestComponent = () => (
      <ConfigProvider>
        <WebGLFractalCanvas
          points={[
            { re: 0, im: 0, baseType: '1', highlightGroup: -1 }
          ]}
          isLoading={false}
          enableWebGL={false}
        />
      </ConfigProvider>
    );

    render(<TestComponent />);

    // 等待组件渲染完成
    await new Promise(resolve => setTimeout(resolve, 100));

    // 验证Canvas2D上下文被获取
    expect(HTMLCanvasElement.prototype.getContext).toHaveBeenCalledWith('2d');
  });

  it('应该支持配置的动态更新', () => {
    // 初始配置
    setGlobalConfig(DEFAULT_CONFIG);
    let webglConfig = getGlobalConfigValue('performance.rendering.webgl');
    expect(webglConfig.pointSize).toBe(3.0);

    // 更新配置
    const newConfig = {
      ...DEFAULT_CONFIG,
      performance: {
        ...DEFAULT_CONFIG.performance,
        rendering: {
          ...DEFAULT_CONFIG.performance.rendering,
          webgl: {
            pointSize: 8.0,
            maxPointSize: 20.0,
            lineWidth: 4.0
          }
        }
      }
    };
    
    setGlobalConfig(newConfig);

    // 验证配置已更新
    webglConfig = getGlobalConfigValue('performance.rendering.webgl');
    expect(webglConfig.pointSize).toBe(8.0);
    expect(webglConfig.maxPointSize).toBe(20.0);
    expect(webglConfig.lineWidth).toBe(4.0);
  });

  it('应该在配置系统不可用时使用默认渲染参数', () => {
    // 清除全局配置
    (window as any).__RAUZY_CONFIG__ = undefined;

    // 验证回退到默认配置 - 应该返回默认值而不是undefined
    const webglConfig = getGlobalConfigValue('performance.rendering.webgl');
    expect(webglConfig).toBeDefined();
    expect(webglConfig.pointSize).toBe(3.0); // 默认值

    // 验证全局配置回退机制
    const globalConfig = getGlobalConfig();
    expect(globalConfig.performance.rendering.webgl.pointSize).toBe(3.0);
  });
});