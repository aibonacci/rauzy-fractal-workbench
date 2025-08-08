/**
 * 配置系统最终集成测试
 * 验证整个配置系统在真实场景下的完整功能
 */
import React from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { createConfigManager } from '../ConfigManager';
import { ConfigProvider, useConfig } from '../ConfigContext';
import { ConfigLoader } from '../../components/ConfigLoader/ConfigLoader';
import { ConfigErrorBoundary } from '../../components/ErrorBoundary/ConfigErrorBoundary';
import { DEFAULT_CONFIG } from '../defaultConfig';
import { ConfigError, ConfigErrorType } from '../errorHandling';

// Mock file system operations
const mockFs = {
  readFile: vi.fn(),
  writeFile: vi.fn(),
  access: vi.fn(),
  stat: vi.fn(),
  mkdir: vi.fn(),
  readdir: vi.fn(),
  unlink: vi.fn(),
  watch: vi.fn()
};

vi.mock('fs/promises', () => mockFs);
vi.mock('fs', () => ({ watch: mockFs.watch }));

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn()
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

// 主要测试组件
const MainComponent: React.FC = () => {
  const { config } = useConfig();
  const [localState, setLocalState] = React.useState({
    theme: config.ui.theme,
    pointsMin: config.app.points.min,
    cacheEnabled: config.performance.cache.enabled
  });

  React.useEffect(() => {
    setLocalState({
      theme: config.ui.theme,
      pointsMin: config.app.points.min,
      cacheEnabled: config.performance.cache.enabled
    });
  }, [config]);

  return (
    <div data-testid="main-component">
      <div data-testid="theme-display">{localState.theme}</div>
      <div data-testid="points-min-display">{localState.pointsMin}</div>
      <div data-testid="cache-status">{localState.cacheEnabled ? 'enabled' : 'disabled'}</div>

      <div data-testid="config-metadata">
        版本: {config.version}
      </div>
    </div>
  );
};

// 配置管理组件
const ConfigManagerComponent: React.FC<{ configManager: any }> = ({ configManager }) => {
  const [metadata, setMetadata] = React.useState<any>(null);
  const [errorReports, setErrorReports] = React.useState<any>(null);

  React.useEffect(() => {
    const updateMetadata = () => {
      setMetadata(configManager.getMetadata());
      setErrorReports(configManager.getErrorReports());
    };

    updateMetadata();
    const unsubscribe = configManager.subscribe(updateMetadata);

    return unsubscribe;
  }, [configManager]);

  const handleThemeToggle = () => {
    const currentTheme = configManager.get('ui.theme');
    configManager.set('ui.theme', currentTheme === 'light' ? 'dark' : 'light');
  };

  const handlePointsUpdate = () => {
    configManager.set('app.points.min', 500);
  };

  const handleBatchUpdate = () => {
    configManager.update({
      ui: { theme: 'light' },
      app: { points: { min: 300, max: 300000 } },
      performance: { cache: { enabled: false } }
    });
  };

  const handleReset = () => {
    configManager.reset();
  };

  const handleSave = async () => {
    try {
      await configManager.save();
    } catch (error) {
      console.error('保存失败:', error);
    }
  };

  return (
    <div data-testid="config-manager">
      <button data-testid="toggle-theme" onClick={handleThemeToggle}>
        切换主题
      </button>
      <button data-testid="update-points" onClick={handlePointsUpdate}>
        更新点数
      </button>
      <button data-testid="batch-update" onClick={handleBatchUpdate}>
        批量更新
      </button>
      <button data-testid="reset-config" onClick={handleReset}>
        重置配置
      </button>
      <button data-testid="save-config" onClick={handleSave}>
        保存配置
      </button>

      {metadata && (
        <div data-testid="metadata-display">
          <div data-testid="config-version">{metadata.version}</div>
          <div data-testid="config-valid">{metadata.isValid ? 'valid' : 'invalid'}</div>
          <div data-testid="error-count">{metadata.errorCount}</div>
        </div>
      )}

      {errorReports && (
        <div data-testid="error-reports">
          <div data-testid="total-errors">{errorReports.total}</div>
        </div>
      )}
    </div>
  );
};

// 测试应用组件
const TestApp: React.FC<{ configManager: any }> = ({ configManager }) => {
  return (
    <ConfigErrorBoundary>
      <ConfigLoader configManager={configManager}>
        <ConfigProvider configManager={configManager}>
          <MainComponent />
          <ConfigManagerComponent configManager={configManager} />
        </ConfigProvider>
      </ConfigLoader>
    </ConfigErrorBoundary>
  );
};

describe('配置系统最终集成测试', () => {
  let configManager: ReturnType<typeof createConfigManager>;

  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks();

    // Setup default mock responses
    mockFs.readFile.mockResolvedValue(JSON.stringify(DEFAULT_CONFIG));
    mockFs.writeFile.mockResolvedValue(undefined);
    mockFs.access.mockResolvedValue(undefined);
    mockFs.stat.mockResolvedValue({
      size: 1024,
      mtime: new Date(),
      isFile: () => true,
      isDirectory: () => false
    });
    mockFs.mkdir.mockResolvedValue(undefined);
    mockFs.readdir.mockResolvedValue([]);
    mockFs.unlink.mockResolvedValue(undefined);
    mockFs.watch.mockReturnValue({
      close: vi.fn(),
      on: vi.fn()
    });

    localStorageMock.getItem.mockReturnValue(null);
    localStorageMock.setItem.mockReturnValue(undefined);
    localStorageMock.removeItem.mockReturnValue(undefined);
    localStorageMock.clear.mockReturnValue(undefined);

    configManager = createConfigManager({
      enableValidation: true,
      enableHotReload: false,
      configPath: './test-config.json'
    });
  });

  afterEach(async () => {
    if (configManager) {
      await configManager.dispose();
    }
  });

  describe('完整应用集成', () => {
    it('应该成功渲染完整的配置系统应用', async () => {
      await act(async () => {
        render(<TestApp configManager={configManager} />);
      });

      await waitFor(() => {
        expect(screen.getByTestId('main-component')).toBeInTheDocument();
      });

      // 验证配置值正确显示
      expect(screen.getByTestId('theme-display')).toHaveTextContent('dark');
      expect(screen.getByTestId('points-min-display')).toHaveTextContent('100');
      expect(screen.getByTestId('cache-status')).toHaveTextContent('enabled');
      expect(screen.getByTestId('config-metadata')).toHaveTextContent('版本: 1.0.0');
    });

    it('应该支持配置的实时更新', async () => {
      await act(async () => {
        render(<TestApp configManager={configManager} />);
      });

      await waitFor(() => {
        expect(screen.getByTestId('main-component')).toBeInTheDocument();
      });

      // 切换主题
      await act(async () => {
        fireEvent.click(screen.getByTestId('toggle-theme'));
      });

      await waitFor(() => {
        expect(screen.getByTestId('theme-display')).toHaveTextContent('light');
      });

      // 更新点数
      await act(async () => {
        fireEvent.click(screen.getByTestId('update-points'));
      });

      await waitFor(() => {
        expect(screen.getByTestId('points-min-display')).toHaveTextContent('500');
      });
    });

    it('应该支持批量配置更新', async () => {
      await act(async () => {
        render(<TestApp configManager={configManager} />);
      });

      await waitFor(() => {
        expect(screen.getByTestId('main-component')).toBeInTheDocument();
      });

      // 执行批量更新
      await act(async () => {
        fireEvent.click(screen.getByTestId('batch-update'));
      });

      await waitFor(() => {
        expect(screen.getByTestId('theme-display')).toHaveTextContent('light');
        expect(screen.getByTestId('points-min-display')).toHaveTextContent('300');
        expect(screen.getByTestId('cache-status')).toHaveTextContent('disabled');
      });
    });

    it('应该支持配置重置', async () => {
      await act(async () => {
        render(<TestApp configManager={configManager} />);
      });

      await waitFor(() => {
        expect(screen.getByTestId('main-component')).toBeInTheDocument();
      });

      // 先修改配置
      await act(async () => {
        fireEvent.click(screen.getByTestId('toggle-theme'));
      });

      await waitFor(() => {
        expect(screen.getByTestId('theme-display')).toHaveTextContent('light');
      });

      // 重置配置
      await act(async () => {
        fireEvent.click(screen.getByTestId('reset-config'));
      });

      await waitFor(() => {
        expect(screen.getByTestId('theme-display')).toHaveTextContent('dark');
        expect(screen.getByTestId('points-min-display')).toHaveTextContent('100');
        expect(screen.getByTestId('cache-status')).toHaveTextContent('enabled');
      });
    });

    it('应该支持配置保存', async () => {
      await act(async () => {
        render(<TestApp configManager={configManager} />);
      });

      await waitFor(() => {
        expect(screen.getByTestId('main-component')).toBeInTheDocument();
      });

      // 修改配置
      await act(async () => {
        fireEvent.click(screen.getByTestId('toggle-theme'));
      });

      // 保存配置
      await act(async () => {
        fireEvent.click(screen.getByTestId('save-config'));
      });

      await waitFor(() => {
        expect(mockFs.writeFile).toHaveBeenCalled();
      });
    });
  });

  describe('错误处理集成', () => {
    it('应该处理配置加载错误', async () => {
      mockFs.readFile.mockRejectedValue(new Error('文件读取失败'));

      const errorConfigManager = createConfigManager({
        enableValidation: true,
        enableHotReload: false,
        configPath: './error-config.json'
      });

      await act(async () => {
        render(<TestApp configManager={errorConfigManager} />);
      });

      // 应该使用默认配置
      await waitFor(() => {
        expect(screen.getByTestId('main-component')).toBeInTheDocument();
        expect(screen.getByTestId('theme-display')).toHaveTextContent('dark');
      });

      await errorConfigManager.dispose();
    });

    it('应该处理配置保存错误', async () => {
      mockFs.writeFile.mockRejectedValue(new Error('文件写入失败'));

      await act(async () => {
        render(<TestApp configManager={configManager} />);
      });

      await waitFor(() => {
        expect(screen.getByTestId('main-component')).toBeInTheDocument();
      });

      // 尝试保存配置（应该失败但不崩溃）
      await act(async () => {
        fireEvent.click(screen.getByTestId('save-config'));
      });

      // 应用应该继续正常工作
      expect(screen.getByTestId('main-component')).toBeInTheDocument();
    });

    it('应该处理配置验证错误', async () => {
      await act(async () => {
        render(<TestApp configManager={configManager} />);
      });

      await waitFor(() => {
        expect(screen.getByTestId('main-component')).toBeInTheDocument();
      });

      // 尝试设置无效的配置值
      await act(async () => {
        configManager.set('app.points.min', -100); // 无效值
      });

      // 应该显示错误状态
      await waitFor(() => {
        const errorCount = screen.getByTestId('error-count');
        expect(parseInt(errorCount.textContent || '0')).toBeGreaterThan(0);
      });
    });
  });

  describe('性能和稳定性', () => {
    it('应该处理大量配置更新', async () => {
      await act(async () => {
        render(<TestApp configManager={configManager} />);
      });

      await waitFor(() => {
        expect(screen.getByTestId('main-component')).toBeInTheDocument();
      });

      // 执行大量配置更新
      const startTime = performance.now();

      await act(async () => {
        for (let i = 0; i < 100; i++) {
          configManager.set('app.points.min', 100 + i);
        }
      });

      const endTime = performance.now();
      const duration = endTime - startTime;

      // 验证性能（应该在合理时间内完成）
      expect(duration).toBeLessThan(1000); // 1秒内完成

      // 验证最终状态
      await waitFor(() => {
        expect(screen.getByTestId('points-min-display')).toHaveTextContent('199');
      });
    });

    it('应该正确处理并发配置访问', async () => {
      await act(async () => {
        render(<TestApp configManager={configManager} />);
      });

      await waitFor(() => {
        expect(screen.getByTestId('main-component')).toBeInTheDocument();
      });

      // 并发执行多个配置操作
      const promises = [
        configManager.set('ui.theme', 'light'),
        configManager.set('app.points.min', 200),
        configManager.set('performance.cache.enabled', false),
        configManager.get('ui.colors.primary'),
        configManager.get('app.points.max')
      ];

      await act(async () => {
        await Promise.all(promises);
      });

      // 验证最终状态一致
      await waitFor(() => {
        expect(screen.getByTestId('theme-display')).toHaveTextContent('light');
        expect(screen.getByTestId('points-min-display')).toHaveTextContent('200');
        expect(screen.getByTestId('cache-status')).toHaveTextContent('disabled');
      });
    });

    it('应该正确清理资源', async () => {
      const { unmount } = render(<TestApp configManager={configManager} />);

      await waitFor(() => {
        expect(screen.getByTestId('main-component')).toBeInTheDocument();
      });

      // 添加监听器
      const unsubscribe = configManager.subscribe(() => { });
      expect(configManager.getListenerCount()).toBe(2); // 组件 + 手动添加的

      // 卸载组件
      unmount();

      // 清理手动添加的监听器
      unsubscribe();

      // 验证监听器被正确清理
      expect(configManager.getListenerCount()).toBe(0);
    });
  });

  describe('元数据和监控', () => {
    it('应该正确显示配置元数据', async () => {
      await act(async () => {
        render(<TestApp configManager={configManager} />);
      });

      await waitFor(() => {
        expect(screen.getByTestId('metadata-display')).toBeInTheDocument();
      });

      // 验证元数据显示
      expect(screen.getByTestId('config-version')).toHaveTextContent('1.0.0');
      expect(screen.getByTestId('config-valid')).toHaveTextContent('valid');
      expect(screen.getByTestId('error-count')).toHaveTextContent('0');
    });

    it('应该正确跟踪错误报告', async () => {
      await act(async () => {
        render(<TestApp configManager={configManager} />);
      });

      await waitFor(() => {
        expect(screen.getByTestId('error-reports')).toBeInTheDocument();
      });

      // 初始状态应该没有错误
      expect(screen.getByTestId('total-errors')).toHaveTextContent('0');

      // 触发一个错误
      await act(async () => {
        configManager.set('app.points.min', 'invalid'); // 类型错误
      });

      // 验证错误被记录
      await waitFor(() => {
        const totalErrors = screen.getByTestId('total-errors');
        expect(parseInt(totalErrors.textContent || '0')).toBeGreaterThan(0);
      });
    });
  });

  describe('真实场景模拟', () => {
    it('应该模拟用户完整的配置使用流程', async () => {
      await act(async () => {
        render(<TestApp configManager={configManager} />);
      });

      await waitFor(() => {
        expect(screen.getByTestId('main-component')).toBeInTheDocument();
      });

      // 1. 用户查看当前配置
      expect(screen.getByTestId('theme-display')).toHaveTextContent('dark');
      expect(screen.getByTestId('points-min-display')).toHaveTextContent('100');

      // 2. 用户修改主题
      await act(async () => {
        fireEvent.click(screen.getByTestId('toggle-theme'));
      });

      await waitFor(() => {
        expect(screen.getByTestId('theme-display')).toHaveTextContent('light');
      });

      // 3. 用户调整点数设置
      await act(async () => {
        fireEvent.click(screen.getByTestId('update-points'));
      });

      await waitFor(() => {
        expect(screen.getByTestId('points-min-display')).toHaveTextContent('500');
      });

      // 4. 用户进行批量配置更新
      await act(async () => {
        fireEvent.click(screen.getByTestId('batch-update'));
      });

      await waitFor(() => {
        expect(screen.getByTestId('theme-display')).toHaveTextContent('light');
        expect(screen.getByTestId('points-min-display')).toHaveTextContent('300');
        expect(screen.getByTestId('cache-status')).toHaveTextContent('disabled');
      });

      // 5. 用户保存配置
      await act(async () => {
        fireEvent.click(screen.getByTestId('save-config'));
      });

      await waitFor(() => {
        expect(mockFs.writeFile).toHaveBeenCalled();
      });

      // 6. 用户重置配置
      await act(async () => {
        fireEvent.click(screen.getByTestId('reset-config'));
      });

      await waitFor(() => {
        expect(screen.getByTestId('theme-display')).toHaveTextContent('dark');
        expect(screen.getByTestId('points-min-display')).toHaveTextContent('100');
        expect(screen.getByTestId('cache-status')).toHaveTextContent('enabled');
      });

      // 验证整个流程中应用保持稳定
      expect(screen.getByTestId('main-component')).toBeInTheDocument();
      expect(screen.getByTestId('config-manager')).toBeInTheDocument();
    });
  });
});

/**
 * 最终集成测试总结
 * 
 * 这个测试套件验证了配置系统在真实应用场景下的完整功能：
 * 
 * 1. 完整应用集成 - 验证配置系统与React应用的完整集成
 * 2. 实时配置更新 - 验证配置变化的实时响应
 * 3. 批量操作支持 - 验证批量配置更新的正确性
 * 4. 错误处理机制 - 验证各种错误场景的处理
 * 5. 性能和稳定性 - 验证大量操作和并发访问的稳定性
 * 6. 资源管理 - 验证监听器和资源的正确清理
 * 7. 元数据监控 - 验证配置状态和错误的监控
 * 8. 真实场景模拟 - 模拟用户的完整使用流程
 * 
 * 通过这些测试，确保配置系统在生产环境中能够稳定可靠地工作。
 */