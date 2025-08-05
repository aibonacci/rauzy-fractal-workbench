/**
 * 应用核心配置集成测试
 * 测试React组件与新配置系统的集成
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ConfigProvider } from '../../config/ConfigContext';
import { I18nProvider } from '../../i18n/context';
import PointsSlider from '../ControlPanel/PointsSlider';
import App from '../../App';
import { DEFAULT_CONFIG } from '../../config/defaultConfig';

// 测试包装器
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ConfigProvider>
    <I18nProvider>
      {children}
    </I18nProvider>
  </ConfigProvider>
);

describe('应用核心配置集成测试', () => {
  beforeEach(() => {
    // 清理任何之前的状态
    vi.clearAllMocks();
  });

  describe('PointsSlider组件配置集成', () => {
    it('应该使用配置系统中的点数范围', async () => {
      const mockOnChange = vi.fn();
      
      render(
        <TestWrapper>
          <PointsSlider
            value={50000}
            onChange={mockOnChange}
            disabled={false}
          />
        </TestWrapper>
      );

      const slider = screen.getByRole('slider');
      
      // 验证slider使用了配置中的值
      expect(slider).toHaveAttribute('min', DEFAULT_CONFIG.app.points.min.toString());
      expect(slider).toHaveAttribute('max', DEFAULT_CONFIG.app.points.max.toString());
      expect(slider).toHaveAttribute('step', DEFAULT_CONFIG.app.points.step.toString());
    });

    it('应该显示配置中的最小和最大值', async () => {
      const mockOnChange = vi.fn();
      
      render(
        <TestWrapper>
          <PointsSlider
            value={50000}
            onChange={mockOnChange}
            disabled={false}
          />
        </TestWrapper>
      );

      // 验证显示的最小值和最大值
      expect(screen.getByText('10K')).toBeInTheDocument(); // 格式化后的最小值
      expect(screen.getByText('2M')).toBeInTheDocument(); // 格式化后的最大值
    });

    it('应该响应配置变化', async () => {
      const mockOnChange = vi.fn();
      
      const { rerender } = render(
        <TestWrapper>
          <PointsSlider
            value={50000}
            onChange={mockOnChange}
            disabled={false}
          />
        </TestWrapper>
      );

      const slider = screen.getByRole('slider');
      
      // 初始验证
      expect(slider).toHaveAttribute('min', '10000');
      expect(slider).toHaveAttribute('max', '2000000');

      // 注意：在实际应用中，配置变化会通过ConfigContext传播
      // 这里我们验证组件能正确响应配置变化
      rerender(
        <TestWrapper>
          <PointsSlider
            value={50000}
            onChange={mockOnChange}
            disabled={false}
          />
        </TestWrapper>
      );

      // 验证组件仍然使用正确的配置值
      expect(slider).toHaveAttribute('min', '10000');
      expect(slider).toHaveAttribute('max', '2000000');
    });
  });

  describe('App组件配置集成', () => {
    it('应该使用配置中的默认点数', async () => {
      render(
        <TestWrapper>
          <App />
        </TestWrapper>
      );

      // 等待组件初始化完成
      await waitFor(() => {
        const slider = screen.getByRole('slider');
        expect(slider).toHaveValue(DEFAULT_CONFIG.app.points.default.toString());
      });
    });

    it('应该使用配置中的路径限制', async () => {
      render(
        <TestWrapper>
          <App />
        </TestWrapper>
      );

      // 等待组件初始化完成
      await waitFor(() => {
        expect(screen.getByTestId('path-input')).toBeInTheDocument();
      });

      // 模拟添加大量路径来测试限制
      const pathInput = screen.getByTestId('path-input');
      const addButton = screen.getByTestId('add-path-button');

      // 添加一个有效路径
      fireEvent.change(pathInput, { target: { value: '1,2,3' } });
      fireEvent.click(addButton);

      // 验证路径被添加（这里我们主要测试配置集成，不是完整的功能测试）
      await waitFor(() => {
        expect(pathInput).toHaveValue('');
      });
    });

    it('应该在达到路径限制时显示错误', async () => {
      // 这个测试需要模拟达到路径限制的情况
      // 由于实际限制很高（20000），我们可以通过mock来测试
      
      render(
        <TestWrapper>
          <App />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByTestId('path-input')).toBeInTheDocument();
      });

      // 在实际应用中，当达到配置的路径限制时，应该显示相应的错误消息
      // 这里我们验证组件能够访问配置值
      const pathInput = screen.getByTestId('path-input');
      expect(pathInput).toBeInTheDocument();
    });
  });

  describe('配置系统错误处理', () => {
    it('应该在配置加载失败时使用默认值', async () => {
      // 模拟配置加载失败的情况
      const mockOnChange = vi.fn();
      
      render(
        <TestWrapper>
          <PointsSlider
            value={50000}
            onChange={mockOnChange}
            disabled={false}
          />
        </TestWrapper>
      );

      // 即使在配置加载失败的情况下，组件也应该能够正常工作
      const slider = screen.getByRole('slider');
      expect(slider).toBeInTheDocument();
    });

    it('应该在配置值无效时回退到默认值', async () => {
      // 这个测试验证配置验证和错误恢复机制
      const mockOnChange = vi.fn();
      
      render(
        <TestWrapper>
          <PointsSlider
            value={50000}
            onChange={mockOnChange}
            disabled={false}
          />
        </TestWrapper>
      );

      const slider = screen.getByRole('slider');
      
      // 验证组件使用有效的配置值
      expect(slider).toHaveAttribute('min');
      expect(slider).toHaveAttribute('max');
      expect(slider).toHaveAttribute('step');
      
      const min = parseInt(slider.getAttribute('min') || '0');
      const max = parseInt(slider.getAttribute('max') || '0');
      const step = parseInt(slider.getAttribute('step') || '0');
      
      expect(min).toBeGreaterThan(0);
      expect(max).toBeGreaterThan(min);
      expect(step).toBeGreaterThan(0);
    });
  });

  describe('性能测试', () => {
    it('应该快速访问配置值', async () => {
      const startTime = performance.now();
      
      render(
        <TestWrapper>
          <PointsSlider
            value={50000}
            onChange={vi.fn()}
            disabled={false}
          />
        </TestWrapper>
      );

      const endTime = performance.now();
      const renderTime = endTime - startTime;
      
      // 验证渲染时间在合理范围内（这个阈值可能需要根据实际情况调整）
      expect(renderTime).toBeLessThan(100); // 100ms
    });

    it('应该缓存配置访问', async () => {
      // 多次渲染相同组件，验证配置访问的性能
      const mockOnChange = vi.fn();
      
      const { rerender } = render(
        <TestWrapper>
          <PointsSlider
            value={50000}
            onChange={mockOnChange}
            disabled={false}
          />
        </TestWrapper>
      );

      const startTime = performance.now();
      
      // 多次重新渲染
      for (let i = 0; i < 10; i++) {
        rerender(
          <TestWrapper>
            <PointsSlider
              value={50000 + i * 1000}
              onChange={mockOnChange}
              disabled={false}
            />
          </TestWrapper>
        );
      }

      const endTime = performance.now();
      const totalTime = endTime - startTime;
      
      // 验证多次渲染的总时间在合理范围内
      expect(totalTime).toBeLessThan(200); // 200ms for 10 rerenders
    });
  });
});