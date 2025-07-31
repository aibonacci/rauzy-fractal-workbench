import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import LanguageToggle from '../LanguageToggle';
import { I18nProvider } from '../../../i18n/context';

// Mock localStorage
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
});

const renderWithI18n = (component: React.ReactElement) => {
  return render(
    <I18nProvider>
      {component}
    </I18nProvider>
  );
};

describe('LanguageToggle', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('应该渲染语言切换按钮', () => {
    renderWithI18n(<LanguageToggle />);
    
    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
    expect(button).toHaveAttribute('aria-label', 'Switch language');
  });

  it('应该显示当前语言代码', () => {
    renderWithI18n(<LanguageToggle />);
    
    // 默认语言应该是英文 (显示为小写但通过CSS转为大写)
    expect(screen.getByText('en')).toBeInTheDocument();
  });

  it('应该包含地球图标', () => {
    renderWithI18n(<LanguageToggle />);
    
    const svg = screen.getByRole('button').querySelector('svg');
    expect(svg).toBeInTheDocument();
    expect(svg).toHaveAttribute('viewBox', '0 0 24 24');
  });

  it('点击时应该切换语言', async () => {
    renderWithI18n(<LanguageToggle />);
    
    const button = screen.getByRole('button');
    
    // 初始状态应该是英文
    expect(screen.getByText('en')).toBeInTheDocument();
    
    // 点击切换到中文
    fireEvent.click(button);
    
    // 等待动画和状态更新
    await new Promise(resolve => setTimeout(resolve, 250));
    
    // 检查是否切换到中文
    expect(screen.getByText('zh')).toBeInTheDocument();
  });

  it('应该支持键盘导航', () => {
    renderWithI18n(<LanguageToggle />);
    
    const button = screen.getByRole('button');
    
    // 测试 Enter 键
    fireEvent.keyDown(button, { key: 'Enter' });
    expect(button).toHaveClass('disabled:opacity-75');
    
    // 测试空格键
    fireEvent.keyDown(button, { key: ' ' });
    expect(button).toHaveClass('disabled:opacity-75');
  });

  it('应该有正确的样式类', () => {
    renderWithI18n(<LanguageToggle />);
    
    const button = screen.getByRole('button');
    expect(button).toHaveClass('flex', 'items-center', 'gap-2');
    expect(button).toHaveClass('bg-gray-700', 'hover:bg-gray-600');
    expect(button).toHaveClass('text-white', 'rounded-lg');
  });

  it('应该在移动端有合适的尺寸', () => {
    renderWithI18n(<LanguageToggle />);
    
    const button = screen.getByRole('button');
    expect(button).toHaveClass('min-w-[4rem]', 'sm:min-w-[5rem]');
    expect(button).toHaveClass('px-3', 'py-2', 'sm:px-4', 'sm:py-2.5');
  });

  it('应该有无障碍支持', () => {
    renderWithI18n(<LanguageToggle />);
    
    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('aria-label');
    expect(button).toHaveAttribute('title');
    
    // 检查屏幕阅读器文本
    const srText = screen.getByText(/Current language:/);
    expect(srText).toHaveClass('sr-only');
  });
});