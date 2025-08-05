/**
 * React配置上下文和Hook测试
 */

import React from 'react';
import { render, screen, act, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { ConfigProvider, useConfig, useConfigValue, useAppConfig, useUIConfig, ConfigLoading } from '../ConfigContext';
import { createConfigManager } from '../ConfigManager';
import { DEFAULT_CONFIG } from '../defaultConfig';

// 测试组件：使用配置的组件
const TestConfigComponent: React.FC = () => {
  const { config, isLoading, error } = useConfig();
  
  if (isLoading) {
    return <div data-testid="loading">Loading...</div>;
  }
  
  if (error) {
    return <div data-testid="error">Error: {error}</div>;
  }
  
  return (
    <div data-testid="config-data">
      <div data-testid="app-points-min">{config.app.points.min}</div>
      <div data-testid="ui-colors-axis">{config.ui.colors.axis}</div>
    </div>
  );
};

// 测试组件：使用特定配置值
const TestConfigValueComponent: React.FC = () => {
  const appConfig = useAppConfig();
  const uiConfig = useUIConfig();
  const pointsMin = useConfigValue('app.points.min');
  
  return (
    <div data-testid="config-values">
      <div data-testid="points-min">{pointsMin}</div>
      <div data-testid="app-points-max">{appConfig.points.max}</div>
      <div data-testid="ui-axis-color">{uiConfig.colors.axis}</div>
    </div>
  );
};

// 测试组件：配置更新
const TestConfigUpdateComponent: React.FC = () => {
  const { config, updateConfig } = useConfig();
  
  const handleUpdatePoints = () => {
    updateConfig('app.points.min', 20000);
  };
  
  return (
    <div>
      <div data-testid="current-points-min">{config.app.points.min}</div>
      <button data-testid="update-button" onClick={handleUpdatePoints}>
        Update Points Min
      </button>
    </div>
  );
};

// 创建一个模拟的配置管理器，避免文件系统操作
const createMockConfigManager = () => {
  const mockManager = {
    initialize: vi.fn().mockResolvedValue({
      config: DEFAULT_CONFIG,
      isValid: true,
      errors: [],
      warnings: []
    }),
    getConfig: vi.fn().mockReturnValue(DEFAULT_CONFIG),
    get: vi.fn((path: string) => {
      const pathParts = path.split('.');
      let value: any = DEFAULT_CONFIG;
      for (const part of pathParts) {
        value = value?.[part];
      }
      return value;
    }),
    set: vi.fn((path: string, value: any) => ({
      config: DEFAULT_CONFIG,
      isValid: true,
      errors: [],
      warnings: []
    })),
    reset: vi.fn().mockReturnValue({
      config: DEFAULT_CONFIG,
      isValid: true,
      errors: [],
      warnings: []
    }),
    subscribe: vi.fn().mockReturnValue(() => {}),
    clearListeners: vi.fn(),
    isReady: vi.fn().mockReturnValue(true)
  };
  return mockManager as any;
};

describe('ConfigContext', () => {
  describe('ConfigProvider', () => {
    it('should provide configuration to child components', async () => {
      const mockConfigManager = createMockConfigManager();
      
      render(
        <ConfigProvider configManager={mockConfigManager}>
          <TestConfigComponent />
        </ConfigProvider>
      );
      
      // 等待配置加载完成
      await waitFor(() => {
        expect(screen.queryByTestId('loading')).not.toBeInTheDocument();
      });
      
      // 验证配置数据被正确提供
      expect(screen.getByTestId('config-data')).toBeInTheDocument();
      expect(screen.getByTestId('app-points-min')).toHaveTextContent(DEFAULT_CONFIG.app.points.min.toString());
      expect(screen.getByTestId('ui-colors-axis')).toHaveTextContent(DEFAULT_CONFIG.ui.colors.axis);
    });

    it('should show loading state during initialization', () => {
      const mockConfigManager = createMockConfigManager();
      // 让初始化挂起以测试加载状态
      mockConfigManager.initialize.mockReturnValue(new Promise(() => {}));
      
      render(
        <ConfigProvider configManager={mockConfigManager}>
          <TestConfigComponent />
        </ConfigProvider>
      );
      
      // 应该显示加载状态
      expect(screen.getByTestId('loading')).toBeInTheDocument();
    });

    it('should handle configuration errors', async () => {
      const mockConfigManager = createMockConfigManager();
      // 模拟初始化错误
      mockConfigManager.initialize.mockResolvedValue({
        config: DEFAULT_CONFIG,
        isValid: false,
        errors: ['Test error'],
        warnings: []
      });
      
      render(
        <ConfigProvider configManager={mockConfigManager}>
          <TestConfigComponent />
        </ConfigProvider>
      );
      
      // 等待错误状态
      await waitFor(() => {
        expect(screen.queryByTestId('loading')).not.toBeInTheDocument();
      });
      
      // 应该显示错误信息
      expect(screen.getByTestId('error')).toBeInTheDocument();
      expect(screen.getByTestId('error')).toHaveTextContent('Test error');
    });
  });

  describe('useConfig hook', () => {
    it('should throw error when used outside ConfigProvider', () => {
      // 使用console.error的mock来避免测试输出中的错误信息
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      expect(() => {
        render(<TestConfigComponent />);
      }).toThrow('useConfig must be used within a ConfigProvider');
      
      consoleSpy.mockRestore();
    });

    it('should provide configuration update functionality', async () => {
      const mockConfigManager = createMockConfigManager();
      let currentConfig = { ...DEFAULT_CONFIG };
      
      // 模拟配置更新
      mockConfigManager.set.mockImplementation((path: string, value: any) => {
        if (path === 'app.points.min') {
          currentConfig = {
            ...currentConfig,
            app: {
              ...currentConfig.app,
              points: {
                ...currentConfig.app.points,
                min: value
              }
            }
          };
        }
        return {
          config: currentConfig,
          isValid: true,
          errors: [],
          warnings: []
        };
      });
      
      mockConfigManager.getConfig.mockImplementation(() => currentConfig);
      
      render(
        <ConfigProvider configManager={mockConfigManager}>
          <TestConfigUpdateComponent />
        </ConfigProvider>
      );
      
      // 等待配置加载完成
      await waitFor(() => {
        expect(screen.getByTestId('current-points-min')).toHaveTextContent(DEFAULT_CONFIG.app.points.min.toString());
      });
      
      // 点击更新按钮
      const updateButton = screen.getByTestId('update-button');
      act(() => {
        updateButton.click();
      });
      
      // 验证set方法被调用
      expect(mockConfigManager.set).toHaveBeenCalledWith('app.points.min', 20000);
    });
  });

  describe('useConfigValue hook', () => {
    it('should provide type-safe access to specific configuration values', async () => {
      const mockConfigManager = createMockConfigManager();
      
      render(
        <ConfigProvider configManager={mockConfigManager}>
          <TestConfigValueComponent />
        </ConfigProvider>
      );
      
      // 等待配置加载完成
      await waitFor(() => {
        expect(screen.getByTestId('config-values')).toBeInTheDocument();
      });
      
      // 验证特定配置值
      expect(screen.getByTestId('points-min')).toHaveTextContent(DEFAULT_CONFIG.app.points.min.toString());
      expect(screen.getByTestId('app-points-max')).toHaveTextContent(DEFAULT_CONFIG.app.points.max.toString());
      expect(screen.getByTestId('ui-axis-color')).toHaveTextContent(DEFAULT_CONFIG.ui.colors.axis);
    });

    it('should throw error for invalid configuration path', async () => {
      const TestInvalidPathComponent: React.FC = () => {
        try {
          useConfigValue('invalid.path' as any);
          return <div data-testid="no-error">No error</div>;
        } catch (error) {
          return <div data-testid="path-error">{(error as Error).message}</div>;
        }
      };

      const mockConfigManager = createMockConfigManager();
      
      render(
        <ConfigProvider configManager={mockConfigManager}>
          <TestInvalidPathComponent />
        </ConfigProvider>
      );
      
      // 等待配置加载完成
      await waitFor(() => {
        expect(screen.getByTestId('path-error')).toBeInTheDocument();
      });
      
      expect(screen.getByTestId('path-error')).toHaveTextContent('Configuration path "invalid.path" not found');
    });
  });

  describe('ConfigLoading component', () => {
    it('should show loading fallback during configuration loading', () => {
      const mockConfigManager = createMockConfigManager();
      // 让初始化挂起以测试加载状态
      mockConfigManager.initialize.mockReturnValue(new Promise(() => {}));
      
      render(
        <ConfigProvider configManager={mockConfigManager}>
          <ConfigLoading fallback={<div data-testid="custom-loading">Custom Loading...</div>}>
            <div data-testid="content">Content</div>
          </ConfigLoading>
        </ConfigProvider>
      );
      
      // 应该显示自定义加载状态
      expect(screen.getByTestId('custom-loading')).toBeInTheDocument();
      expect(screen.queryByTestId('content')).not.toBeInTheDocument();
    });

    it('should show content after configuration loads', async () => {
      const mockConfigManager = createMockConfigManager();
      
      render(
        <ConfigProvider configManager={mockConfigManager}>
          <ConfigLoading>
            <div data-testid="content">Content</div>
          </ConfigLoading>
        </ConfigProvider>
      );
      
      // 等待配置加载完成
      await waitFor(() => {
        expect(screen.getByTestId('content')).toBeInTheDocument();
      });
      
      expect(screen.queryByText('Loading configuration...')).not.toBeInTheDocument();
    });

    it('should show error fallback on configuration error', async () => {
      const mockConfigManager = createMockConfigManager();
      // 模拟初始化错误
      mockConfigManager.initialize.mockResolvedValue({
        config: DEFAULT_CONFIG,
        isValid: false,
        errors: ['Test configuration error'],
        warnings: []
      });
      
      render(
        <ConfigProvider configManager={mockConfigManager}>
          <ConfigLoading
            errorFallback={(error) => <div data-testid="custom-error">Custom Error: {error}</div>}
          >
            <div data-testid="content">Content</div>
          </ConfigLoading>
        </ConfigProvider>
      );
      
      // 等待错误状态
      await waitFor(() => {
        expect(screen.getByTestId('custom-error')).toBeInTheDocument();
      });
      
      expect(screen.getByTestId('custom-error')).toHaveTextContent('Custom Error: Test configuration error');
      expect(screen.queryByTestId('content')).not.toBeInTheDocument();
    });
  });

  describe('specialized config hooks', () => {
    it('should provide access to specific configuration sections', async () => {
      const TestSpecializedHooksComponent: React.FC = () => {
        const appConfig = useAppConfig();
        const uiConfig = useUIConfig();
        
        return (
          <div data-testid="specialized-hooks">
            <div data-testid="app-canvas-width">{appConfig.canvas.defaultWidth}</div>
            <div data-testid="ui-transition-duration">{uiConfig.animations.transitionDuration}</div>
          </div>
        );
      };

      const mockConfigManager = createMockConfigManager();
      
      render(
        <ConfigProvider configManager={mockConfigManager}>
          <TestSpecializedHooksComponent />
        </ConfigProvider>
      );
      
      // 等待配置加载完成
      await waitFor(() => {
        expect(screen.getByTestId('specialized-hooks')).toBeInTheDocument();
      });
      
      expect(screen.getByTestId('app-canvas-width')).toHaveTextContent(DEFAULT_CONFIG.app.canvas.defaultWidth.toString());
      expect(screen.getByTestId('ui-transition-duration')).toHaveTextContent(DEFAULT_CONFIG.ui.animations.transitionDuration.toString());
    });
  });
});