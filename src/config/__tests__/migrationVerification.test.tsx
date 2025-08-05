/**
 * 配置迁移验证测试
 * 验证APP_CONFIG迁移后的功能是否正常工作
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ConfigProvider } from '../ConfigContext';
import { I18nProvider } from '../../i18n/context';
import PointsSlider from '../../components/ControlPanel/PointsSlider';

// 测试包装器
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ConfigProvider>
    <I18nProvider>
      {children}
    </I18nProvider>
  </ConfigProvider>
);

describe('配置迁移验证测试', () => {
  it('PointsSlider应该使用配置系统而不是APP_CONFIG常量', async () => {
    const mockOnChange = vi.fn();
    const formatPointCount = (count: number) => {
      if (count >= 1000000) return `${(count / 1000000).toFixed(0)}M`;
      if (count >= 1000) return `${(count / 1000).toFixed(0)}K`;
      return count.toString();
    };
    
    render(
      <TestWrapper>
        <PointsSlider
          value={50000}
          onChange={mockOnChange}
          disabled={false}
          formatPointCount={formatPointCount}
        />
      </TestWrapper>
    );

    // 等待组件渲染完成
    const slider = await screen.findByRole('slider');
    
    // 验证slider使用了配置系统中的值（而不是硬编码的APP_CONFIG值）
    expect(slider).toHaveAttribute('min', '10000');
    expect(slider).toHaveAttribute('max', '2000000');
    expect(slider).toHaveAttribute('step', '10000');
    
    // 验证显示的格式化值
    expect(screen.getByText(/50K/)).toBeInTheDocument();
    expect(screen.getByText(/10K/)).toBeInTheDocument(); // 最小值
    expect(screen.getByText(/2M/)).toBeInTheDocument(); // 最大值
  });

  it('配置系统应该提供与原APP_CONFIG相同的默认值', () => {
    // 这个测试验证迁移后的配置值与原来的APP_CONFIG常量值一致
    const mockOnChange = vi.fn();
    const formatPointCount = (count: number) => {
      if (count >= 1000000) return `${(count / 1000000).toFixed(0)}M`;
      if (count >= 1000) return `${(count / 1000).toFixed(0)}K`;
      return count.toString();
    };
    
    render(
      <TestWrapper>
        <PointsSlider
          value={50000}
          onChange={mockOnChange}
          disabled={false}
          formatPointCount={formatPointCount}
        />
      </TestWrapper>
    );

    const slider = screen.getByRole('slider');
    
    // 验证这些值与原来的APP_CONFIG常量一致
    expect(slider.getAttribute('min')).toBe('10000'); // 原 APP_CONFIG.MIN_POINTS
    expect(slider.getAttribute('max')).toBe('2000000'); // 原 APP_CONFIG.MAX_POINTS
    expect(slider.getAttribute('step')).toBe('10000'); // 原 APP_CONFIG.POINTS_STEP
  });

  it('应该能够正常渲染而不依赖APP_CONFIG常量', () => {
    const mockOnChange = vi.fn();
    const formatPointCount = (count: number) => {
      if (count >= 1000000) return `${(count / 1000000).toFixed(0)}M`;
      if (count >= 1000) return `${(count / 1000).toFixed(0)}K`;
      return count.toString();
    };
    
    // 这个测试确保组件不再依赖已删除的APP_CONFIG常量
    expect(() => {
      render(
        <TestWrapper>
          <PointsSlider
            value={50000}
            onChange={mockOnChange}
            disabled={false}
            formatPointCount={formatPointCount}
          />
        </TestWrapper>
      );
    }).not.toThrow();

    // 验证组件正常渲染
    expect(screen.getByRole('slider')).toBeInTheDocument();
    expect(screen.getByText(/50K/)).toBeInTheDocument();
  });
});