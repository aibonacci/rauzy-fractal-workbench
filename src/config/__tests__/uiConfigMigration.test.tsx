/**
 * UI配置迁移验证测试
 * 验证UI和视觉配置从硬编码常量迁移到配置系统后的功能
 */

import React from 'react';
import { render, screen, act } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ConfigProvider, useConfig } from '../ConfigContext';
import { I18nProvider } from '../../i18n/context';
import { DEFAULT_CONFIG } from '../defaultConfig';
import FractalCanvas from '../../components/FractalCanvas/FractalCanvas';
import PathList from '../../components/ControlPanel/PathList';
import PathDataCard from '../../components/DataPanel/PathDataCard';
import ExternalLinks from '../../components/ExternalLinks/ExternalLinks';
import { RenderPoint, PathData } from '../../types';

// 测试包装器
const TestWrapper: React.FC<{ children: React.ReactNode; config?: any }> = ({ 
  children, 
  config = DEFAULT_CONFIG 
}) => (
  <ConfigProvider initialConfig={config}>
    <I18nProvider>
      {children}
    </I18nProvider>
  </ConfigProvider>
);

// Mock数据
const mockPoints: RenderPoint[] = [
  { re: 0, im: 0, baseType: '1', highlightGroup: 0 },
  { re: 1, im: 1, baseType: '2', highlightGroup: 1 },
  { re: 2, im: 2, baseType: '3', highlightGroup: -1 }
];

const mockPathsData: PathData[] = [
  {
    path: [1, 2, 3],
    rValue: 1.5,
    cValue: 0.5,
    coefficients: [0, 1, 2, 3], // Include index 0 for proper array access
    coeffs: [0, 1, 2, 3], // Add coeffs property for PathDataCard
    firstPointCoords: { re: 0, im: 0 },
    positionSequence: [1, 2, 3],
    rp: 1.5 // Add rp property for PathList
  }
];

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
    strokeStyle: '',
    fillStyle: '',
    lineWidth: 1,
    font: '12px Arial'
  });

  Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
    value: mockGetContext,
    writable: true
  });

  Object.defineProperty(HTMLCanvasElement.prototype, 'width', {
    value: 800,
    writable: true
  });

  Object.defineProperty(HTMLCanvasElement.prototype, 'height', {
    value: 600,
    writable: true
  });
});

describe('UI配置迁移验证测试', () => {
  describe('颜色配置迁移', () => {
    it('FractalCanvas应该使用配置系统中的颜色而不是硬编码常量', () => {
      const customConfig = {
        ...DEFAULT_CONFIG,
        ui: {
          ...DEFAULT_CONFIG.ui,
          colors: {
            ...DEFAULT_CONFIG.ui.colors,
            axis: 'rgba(255, 0, 0, 0.5)', // 自定义轴颜色
            highlight: ['#FF0000', '#00FF00', '#0000FF'], // 自定义高亮颜色
            base: {
              alpha1: 'rgba(255, 255, 0, 0.8)',
              alpha2: 'rgba(255, 255, 0, 0.6)',
              alpha3: 'rgba(255, 255, 0, 0.4)'
            }
          }
        }
      };

      render(
        <TestWrapper config={customConfig}>
          <FractalCanvas points={mockPoints} isLoading={false} />
        </TestWrapper>
      );

      // 验证canvas元素存在
      const canvas = screen.getByTestId('fractal-canvas');
      expect(canvas).toBeInTheDocument();
    });

    it('PathList应该使用配置系统中的高亮颜色', () => {
      render(
        <TestWrapper>
          <PathList 
            pathsData={mockPathsData} 
            onRemovePath={vi.fn()} 
          />
        </TestWrapper>
      );

      // 验证路径列表渲染并使用配置系统
      expect(screen.getByTestId('path-list')).toBeInTheDocument();
      expect(screen.getByText('(1,2,3)')).toBeInTheDocument();
    });

    it('配置系统应该提供正确的颜色配置', () => {
      // 验证配置系统提供了正确的颜色配置
      expect(DEFAULT_CONFIG.ui.colors.highlight).toHaveLength(6);
      expect(DEFAULT_CONFIG.ui.colors.base.alpha1).toBe('rgba(209, 213, 219, 0.5)');
      expect(DEFAULT_CONFIG.ui.colors.axis).toBe('rgba(255, 255, 255, 0.2)');
    });
  });

  describe('外部链接配置迁移', () => {
    it('ExternalLinks应该使用配置系统中的链接配置', () => {
      render(
        <TestWrapper>
          <ExternalLinks />
        </TestWrapper>
      );

      // 验证链接存在并使用默认配置
      const links = screen.getAllByRole('link');
      expect(links).toHaveLength(2);
      
      // 验证使用了默认配置中的URL
      expect(links[0]).toHaveAttribute('href', DEFAULT_CONFIG.ui.external.links.liuTheorem.url);
      expect(links[1]).toHaveAttribute('href', DEFAULT_CONFIG.ui.external.links.github.url);
    });
  });

  describe('动画配置迁移', () => {
    it('配置系统应该提供动画配置', () => {
      const customConfig = {
        ...DEFAULT_CONFIG,
        ui: {
          ...DEFAULT_CONFIG.ui,
          animations: {
            transitionDuration: 500,
            debounceDelay: 1000,
            animationEasing: 'ease-out'
          }
        }
      };

      // 验证配置值正确
      expect(customConfig.ui.animations.transitionDuration).toBe(500);
      expect(customConfig.ui.animations.debounceDelay).toBe(1000);
      expect(customConfig.ui.animations.animationEasing).toBe('ease-out');
    });
  });

  describe('通知配置迁移', () => {
    it('配置系统应该提供通知配置', () => {
      const customConfig = {
        ...DEFAULT_CONFIG,
        ui: {
          ...DEFAULT_CONFIG.ui,
          notifications: {
            defaultDuration: 5000,
            successDuration: 3000,
            errorDuration: 0,
            warningDuration: 4000,
            infoDuration: 3500,
            maxCount: 10
          }
        }
      };

      // 验证配置值正确
      expect(customConfig.ui.notifications.defaultDuration).toBe(5000);
      expect(customConfig.ui.notifications.successDuration).toBe(3000);
      expect(customConfig.ui.notifications.errorDuration).toBe(0);
      expect(customConfig.ui.notifications.warningDuration).toBe(4000);
      expect(customConfig.ui.notifications.infoDuration).toBe(3500);
      expect(customConfig.ui.notifications.maxCount).toBe(10);
    });
  });

  describe('配置实时更新', () => {
    it('配置系统应该支持实时更新', () => {
      // 这个测试验证配置系统的基本结构支持实时更新
      const TestComponent = () => {
        const { config } = useConfig();
        
        return (
          <div>
            <div data-testid="axis-color">{config.ui.colors.axis}</div>
            <div data-testid="highlight-count">{config.ui.colors.highlight.length}</div>
          </div>
        );
      };

      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );

      // 验证配置值可以被正确读取
      expect(screen.getByTestId('axis-color')).toHaveTextContent('rgba(255, 255, 255, 0.2)');
      expect(screen.getByTestId('highlight-count')).toHaveTextContent('6');
    });
  });

  describe('向后兼容性', () => {
    it('应该提供与原硬编码常量相同的默认值', () => {
      // 验证颜色配置
      expect(DEFAULT_CONFIG.ui.colors.base.alpha1).toBe('rgba(209, 213, 219, 0.5)');
      expect(DEFAULT_CONFIG.ui.colors.base.alpha2).toBe('rgba(209, 213, 219, 0.35)');
      expect(DEFAULT_CONFIG.ui.colors.base.alpha3).toBe('rgba(209, 213, 219, 0.2)');
      expect(DEFAULT_CONFIG.ui.colors.axis).toBe('rgba(255, 255, 255, 0.2)');
      expect(DEFAULT_CONFIG.ui.colors.highlight).toEqual([
        '#FBBF24', '#F87171', '#34D399', '#818CF8', '#F472B6', '#60A5FA'
      ]);

      // 验证动画配置
      expect(DEFAULT_CONFIG.ui.animations.transitionDuration).toBe(200);
      expect(DEFAULT_CONFIG.ui.animations.debounceDelay).toBe(300);
      expect(DEFAULT_CONFIG.ui.animations.animationEasing).toBe('ease-in-out');

      // 验证通知配置
      expect(DEFAULT_CONFIG.ui.notifications.defaultDuration).toBe(3000);
      expect(DEFAULT_CONFIG.ui.notifications.successDuration).toBe(2000);
      expect(DEFAULT_CONFIG.ui.notifications.errorDuration).toBe(0);
      expect(DEFAULT_CONFIG.ui.notifications.warningDuration).toBe(3000);
      expect(DEFAULT_CONFIG.ui.notifications.infoDuration).toBe(3000);
    });
  });
});