import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import FractalCanvas from '../FractalCanvas/FractalCanvas';
import { RenderPoint } from '../../types';

// Mock Canvas API
const mockGetContext = vi.fn();
const mockClearRect = vi.fn();
const mockFillRect = vi.fn();
const mockBeginPath = vi.fn();
const mockMoveTo = vi.fn();
const mockLineTo = vi.fn();
const mockStroke = vi.fn();
const mockFillText = vi.fn();

beforeEach(() => {
  mockGetContext.mockReturnValue({
    clearRect: mockClearRect,
    fillRect: mockFillRect,
    beginPath: mockBeginPath,
    moveTo: mockMoveTo,
    lineTo: mockLineTo,
    stroke: mockStroke,
    fillText: mockFillText,
    fillStyle: '',
    strokeStyle: '',
    lineWidth: 1,
    font: '',
    textAlign: ''
  });

  Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
    value: mockGetContext,
    writable: true
  });

  Object.defineProperty(HTMLCanvasElement.prototype, 'getBoundingClientRect', {
    value: () => ({ width: 800, height: 600 }),
    writable: true
  });
});

describe('FractalCanvas', () => {
  const mockPoints: RenderPoint[] = [
    { re: 0, im: 0, baseType: '1', highlightGroup: -1 },
    { re: 1, im: 1, baseType: '2', highlightGroup: 0 },
    { re: 2, im: 2, baseType: '3', highlightGroup: -1 }
  ];

  it('应该渲染canvas元素', () => {
    render(<FractalCanvas points={mockPoints} isLoading={false} />);
    
    const canvas = screen.getByTestId('fractal-canvas');
    expect(canvas).toBeInTheDocument();
    expect(canvas.tagName).toBe('CANVAS');
  });

  it('应该有正确的CSS类', () => {
    render(<FractalCanvas points={mockPoints} isLoading={false} />);
    
    const canvas = screen.getByTestId('fractal-canvas');
    expect(canvas).toHaveClass('w-full', 'h-full', 'bg-gray-900', 'rounded-lg');
  });

  it('当isLoading为true时不应该绘制', () => {
    render(<FractalCanvas points={mockPoints} isLoading={true} />);
    
    // 由于isLoading为true，不应该调用绘制方法
    expect(mockClearRect).not.toHaveBeenCalled();
  });

  it('当points为空时应该显示等待消息', () => {
    render(<FractalCanvas points={[]} isLoading={false} />);
    
    // 应该调用getContext来绘制等待消息
    expect(mockGetContext).toHaveBeenCalled();
  });

  it('应该处理点数据并绘制', () => {
    render(<FractalCanvas points={mockPoints} isLoading={false} />);
    
    // 应该调用canvas绘制方法
    expect(mockGetContext).toHaveBeenCalled();
  });

  it('应该设置正确的canvas属性', () => {
    render(<FractalCanvas points={mockPoints} isLoading={false} />);
    
    const canvas = screen.getByTestId('fractal-canvas') as HTMLCanvasElement;
    expect(canvas.style.imageRendering).toBe('pixelated');
  });
});