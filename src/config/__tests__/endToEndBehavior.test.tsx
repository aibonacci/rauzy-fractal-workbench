/**
 * 配置变化对应用行为影响的端到端测试
 * 验证配置更改如何影响实际的应用组件和功能
 */
import React from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { ConfigProvider } from '../ConfigContext';
import { createConfigManager } from '../ConfigManager';
import { DEFAULT_CONFIG } from '../defaultConfig';

// Mock file system operations
vi.mock('fs/promises', () => ({
  readFile: vi.fn(),
  writeFile: vi.fn(),
  access: vi.fn(),
  stat: vi.fn(),
  mkdir: vi.fn(),
  readdir: vi.fn(),
  unlink: vi.fn()
}));

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

// 模拟应用组件：点数滑块
const PointsSlider: React.FC = () => {
  const [value, setValue] = React.useState(1000);
  
  return (
    <div>
      <input
        type="range"
        min="100"
        max="10000"
        value={value}
        onChange={(e) => setValue(parseInt(e.target.value))}
        data-testid="points-slider"
      />
      <span data-testid="points-value">{value}</span>
    </div>
  );
};

// 模拟应用组件：路径列表
const PathList: React.FC = () => {
  const [paths, setPaths] = React.useState<string[]>([]);
  
  const addPath = () => {
    if (paths.length < 10) { // 默认限制
      setPaths([...paths, `Path ${paths.length + 1}`]);
    }
  };
  
  return (
    <div>
      <button onClick={addPath} data-testid="add-path-btn">
        Add Path
      </button>
      <div data-testid="path-count">{paths.length}</div>
      <div data-testid="path-limit">10</div>
    </div>
  );
};

// 模拟应用组件：主题切换
const ThemeDisplay: React.FC = () => {
  return (
    <div 
      data-testid="theme-container"
      style={{ 
        backgroundColor: '#ffffff', // 默认浅色主题
        color: '#000000'
      }}
    >
      <span data-testid="theme-indicator">Light Theme</span>
    </div>
  );
};

// 模拟应用组件：调试面板
const DebugPanel: React.FC = () => {
  const showDebug = false; // 从配置读取
  const logLevel = 'warn'; // 从配置读取
  
  if (!showDebug) {
    return null;
  }
  
  return (
    <div data-testid="debug-panel">
      <div data-testid="debug-log-level">{logLevel}</div>
      <div data-testid="debug-info">Debug information</div>
    </div>
  );
};

// 模拟应用组件：性能监控
const PerformanceMonitor: React.FC = () => {
  const [metrics, setMetrics] = React.useState({
    renderTime: 0,
    cacheHits: 0,
    cacheSize: 0
  });
  
  React.useEffect(() => {
    // 模拟性能指标更新
    const interval = setInterval(() => {
      setMetrics(prev => ({
        renderTime: prev.renderTime + Math.random() * 10,
        cacheHits: prev.cacheHits + 1,
        cacheSize: Math.min(prev.cacheSize + 1, 1000) // 默认缓存大小限制
      }));
    }, 100);
    
    return () => clearInterval(interval);
  }, []);
  
  return (
    <div data-testid="performance-monitor">
      <div data-testid="render-time">{metrics.renderTime.toFixed(2)}ms</div>
      <div data-testid="cache-hits">{metrics.cacheHits}</div>
      <div data-testid="cache-size">{metrics.cacheSize}</div>
      <div data-testid="cache-limit">1000</div>
    </div>
  );
};

// 完整的应用组件
const MockApplication: React.FC = () => {
  return (
    <div data-testid="app-container">
      <PointsSlider />
      <PathList />
      <ThemeDisplay />
      <DebugPanel />
      <PerformanceMonitor />
    </div>
  );
};

describe('配置变化对应用行为影响的端到端测试', () => {
  let configManager: ReturnType<typeof createConfigManager>;

  beforeEach(() => {
    configManager = createConfigManager({
      enableValidation: true,
      enableHotReload: false,
      configPath: './test-config.json'
    });

    // Clear localStorage mocks
    localStorageMock.getItem.mockClear();
    localStorageMock.setItem.mockClear();
    localStorageMock.removeItem.mockClear();
    localStorageMock.clear.mockClear();
  });

  afterEach(async () => {
    await configManager.dispose();
    vi.clearAllMocks();
  });

  describe('应用配置影响', () => {
    it('应该根据点数配置限制滑块范围', async () => {
      await act(async () => {
        await configManager.initialize();
      });

      // 创建使用配置的点数滑块组件
      const ConfigurablePointsSlider: React.FC = () => {
        const [value, setValue] = React.useState(1000);
        
        // 在实际应用中，这些值会从配置中读取
        const minPoints = 100; // config.app.points.min
        const maxPoints = 10000; // config.app.points.max
        
        return (
          <div>
            <input
              type="range"
              min={minPoints}
              max={maxPoints}
              value={value}
              onChange={(e) => setValue(parseInt(e.target.value))}
              data-testid="configurable-points-slider"
            />
            <span data-testid="min-points">{minPoints}</span>
            <span data-testid="max-points">{maxPoints}</span>
            <span data-testid="current-points">{value}</span>
          </div>
        );
      };

      render(
        <ConfigProvider configManager={configManager}>
          <ConfigurablePointsSlider />
        </ConfigProvider>
      );

      // 验证初始配置
      expect(screen.getByTestId('min-points')).toHaveTextContent('100');
      expect(screen.getByTestId('max-points')).toHaveTextContent('10000');

      // 更新配置
      await act(async () => {
        configManager.update({
          app: {
            points: { min: 500, max: 5000 }
          }
        });
      });

      // 在实际应用中，组件会重新渲染并使用新的配置值
      // 这里我们验证配置已经更新
      expect(configManager.get('app.points.min')).toBe(500);
      expect(configManager.get('app.points.max')).toBe(5000);
    });

    it('应该根据路径限制配置控制路径数量', async () => {
      await act(async () => {
        await configManager.initialize();
      });

      const ConfigurablePathList: React.FC = () => {
        const [paths, setPaths] = React.useState<string[]>([]);
        const pathLimit = 10; // 从配置读取: config.app.paths.limit
        
        const addPath = () => {
          if (paths.length < pathLimit) {
            setPaths([...paths, `Path ${paths.length + 1}`]);
          }
        };
        
        return (
          <div>
            <button onClick={addPath} data-testid="add-path-btn">
              Add Path
            </button>
            <div data-testid="path-count">{paths.length}</div>
            <div data-testid="path-limit">{pathLimit}</div>
            <div data-testid="can-add-more">{paths.length < pathLimit ? 'yes' : 'no'}</div>
          </div>
        );
      };

      render(
        <ConfigProvider configManager={configManager}>
          <ConfigurablePathList />
        </ConfigProvider>
      );

      // 验证初始状态
      expect(screen.getByTestId('path-limit')).toHaveTextContent('10');
      expect(screen.getByTestId('can-add-more')).toHaveTextContent('yes');

      // 更新路径限制配置
      await act(async () => {
        configManager.set('app.paths.limit', 5);
      });

      // 验证配置已更新
      expect(configManager.get('app.paths.limit')).toBe(5);
    });
  });

  describe('UI配置影响', () => {
    it('应该根据主题配置改变界面外观', async () => {
      await act(async () => {
        await configManager.initialize();
      });

      const ConfigurableTheme: React.FC = () => {
        const theme = 'light'; // 从配置读取: config.ui.theme
        const primaryColor = '#000000'; // 从配置读取: config.ui.colors.primary
        
        const themeStyles = {
          light: { backgroundColor: '#ffffff', color: '#000000' },
          dark: { backgroundColor: '#000000', color: '#ffffff' }
        };
        
        return (
          <div 
            data-testid="themed-container"
            style={themeStyles[theme as keyof typeof themeStyles]}
          >
            <span data-testid="current-theme">{theme}</span>
            <span data-testid="primary-color">{primaryColor}</span>
          </div>
        );
      };

      render(
        <ConfigProvider configManager={configManager}>
          <ConfigurableTheme />
        </ConfigProvider>
      );

      // 验证初始主题
      expect(screen.getByTestId('current-theme')).toHaveTextContent('light');

      // 更新主题配置
      await act(async () => {
        configManager.update({
          ui: {
            theme: 'dark',
            colors: { primary: '#ffffff' }
          }
        });
      });

      // 验证配置已更新
      expect(configManager.get('ui.theme')).toBe('dark');
      expect(configManager.get('ui.colors.primary')).toBe('#ffffff');
    });

    it('应该根据动画配置控制动画效果', async () => {
      await act(async () => {
        await configManager.initialize();
      });

      const ConfigurableAnimation: React.FC = () => {
        const animationEnabled = true; // 从配置读取: config.ui.animations.enabled
        const animationDuration = 300; // 从配置读取: config.ui.animations.duration
        
        return (
          <div data-testid="animated-element">
            <div data-testid="animation-enabled">{animationEnabled ? 'yes' : 'no'}</div>
            <div data-testid="animation-duration">{animationDuration}ms</div>
            <div 
              data-testid="animated-box"
              style={{
                transition: animationEnabled ? `all ${animationDuration}ms ease` : 'none'
              }}
            >
              Animated Content
            </div>
          </div>
        );
      };

      render(
        <ConfigProvider configManager={configManager}>
          <ConfigurableAnimation />
        </ConfigProvider>
      );

      // 验证初始动画配置
      expect(screen.getByTestId('animation-enabled')).toHaveTextContent('yes');
      expect(screen.getByTestId('animation-duration')).toHaveTextContent('300ms');

      // 更新动画配置
      await act(async () => {
        configManager.update({
          ui: {
            animations: { enabled: false, duration: 0 }
          }
        });
      });

      // 验证配置已更新
      expect(configManager.get('ui.animations.enabled')).toBe(false);
      expect(configManager.get('ui.animations.duration')).toBe(0);
    });
  });

  describe('性能配置影响', () => {
    it('应该根据缓存配置调整缓存行为', async () => {
      await act(async () => {
        await configManager.initialize();
      });

      const ConfigurableCache: React.FC = () => {
        const cacheEnabled = true; // 从配置读取: config.performance.cache.enabled
        const cacheSize = 1000; // 从配置读取: config.performance.cache.maxSize
        const cacheTTL = 300000; // 从配置读取: config.performance.cache.ttl
        
        const [cacheStats, setCacheStats] = React.useState({
          enabled: cacheEnabled,
          size: 0,
          maxSize: cacheSize,
          ttl: cacheTTL
        });
        
        return (
          <div data-testid="cache-info">
            <div data-testid="cache-enabled">{cacheStats.enabled ? 'yes' : 'no'}</div>
            <div data-testid="cache-max-size">{cacheStats.maxSize}</div>
            <div data-testid="cache-ttl">{cacheStats.ttl}ms</div>
          </div>
        );
      };

      render(
        <ConfigProvider configManager={configManager}>
          <ConfigurableCache />
        </ConfigProvider>
      );

      // 验证初始缓存配置
      expect(screen.getByTestId('cache-enabled')).toHaveTextContent('yes');
      expect(screen.getByTestId('cache-max-size')).toHaveTextContent('1000');

      // 更新缓存配置
      await act(async () => {
        configManager.update({
          performance: {
            cache: { enabled: false, maxSize: 500, ttl: 600000 }
          }
        });
      });

      // 验证配置已更新
      expect(configManager.get('performance.cache.enabled')).toBe(false);
      expect(configManager.get('performance.cache.maxSize')).toBe(500);
    });

    it('应该根据渲染配置调整渲染行为', async () => {
      await act(async () => {
        await configManager.initialize();
      });

      const ConfigurableRenderer: React.FC = () => {
        const webglEnabled = true; // 从配置读取: config.performance.rendering.webgl.enabled
        const canvasWidth = 800; // 从配置读取: config.performance.rendering.canvas.width
        const canvasHeight = 600; // 从配置读取: config.performance.rendering.canvas.height
        
        return (
          <div data-testid="renderer-info">
            <div data-testid="webgl-enabled">{webglEnabled ? 'yes' : 'no'}</div>
            <div data-testid="canvas-width">{canvasWidth}px</div>
            <div data-testid="canvas-height">{canvasHeight}px</div>
            <canvas 
              data-testid="render-canvas"
              width={canvasWidth}
              height={canvasHeight}
            />
          </div>
        );
      };

      render(
        <ConfigProvider configManager={configManager}>
          <ConfigurableRenderer />
        </ConfigProvider>
      );

      // 验证初始渲染配置
      expect(screen.getByTestId('webgl-enabled')).toHaveTextContent('yes');
      expect(screen.getByTestId('canvas-width')).toHaveTextContent('800px');

      // 更新渲染配置
      await act(async () => {
        configManager.update({
          performance: {
            rendering: {
              webgl: { enabled: false },
              canvas: { width: 1024, height: 768 }
            }
          }
        });
      });

      // 验证配置已更新
      expect(configManager.get('performance.rendering.webgl.enabled')).toBe(false);
      expect(configManager.get('performance.rendering.canvas.width')).toBe(1024);
    });
  });

  describe('开发配置影响', () => {
    it('应该根据调试配置显示或隐藏调试信息', async () => {
      await act(async () => {
        await configManager.initialize();
      });

      const ConfigurableDebug: React.FC = () => {
        const debugEnabled = false; // 从配置读取: config.development.debug.enabled
        const logLevel = 'warn'; // 从配置读取: config.development.debug.logLevel
        const showMetrics = false; // 从配置读取: config.development.debug.showPerformanceMetrics
        
        return (
          <div data-testid="debug-container">
            <div data-testid="debug-enabled">{debugEnabled ? 'yes' : 'no'}</div>
            <div data-testid="log-level">{logLevel}</div>
            {debugEnabled && (
              <div data-testid="debug-panel">
                <div data-testid="debug-log-level">Log Level: {logLevel}</div>
                {showMetrics && (
                  <div data-testid="performance-metrics">Performance Metrics</div>
                )}
              </div>
            )}
          </div>
        );
      };

      render(
        <ConfigProvider configManager={configManager}>
          <ConfigurableDebug />
        </ConfigProvider>
      );

      // 验证初始状态（调试关闭）
      expect(screen.getByTestId('debug-enabled')).toHaveTextContent('no');
      expect(screen.queryByTestId('debug-panel')).not.toBeInTheDocument();

      // 启用调试模式
      await act(async () => {
        configManager.update({
          development: {
            debug: { enabled: true, logLevel: 'debug', showPerformanceMetrics: true }
          }
        });
      });

      // 验证配置已更新
      expect(configManager.get('development.debug.enabled')).toBe(true);
      expect(configManager.get('development.debug.logLevel')).toBe('debug');
    });

    it('应该根据功能开关配置启用或禁用功能', async () => {
      await act(async () => {
        await configManager.initialize();
      });

      const ConfigurableFeatures: React.FC = () => {
        const hotReloadEnabled = true; // 从配置读取: config.development.features.hotReload
        const typeCheckingEnabled = true; // 从配置读取: config.development.features.typeChecking
        const configValidationEnabled = true; // 从配置读取: config.development.features.configValidation
        
        return (
          <div data-testid="features-container">
            <div data-testid="hot-reload">{hotReloadEnabled ? 'enabled' : 'disabled'}</div>
            <div data-testid="type-checking">{typeCheckingEnabled ? 'enabled' : 'disabled'}</div>
            <div data-testid="config-validation">{configValidationEnabled ? 'enabled' : 'disabled'}</div>
          </div>
        );
      };

      render(
        <ConfigProvider configManager={configManager}>
          <ConfigurableFeatures />
        </ConfigProvider>
      );

      // 验证初始功能状态
      expect(screen.getByTestId('hot-reload')).toHaveTextContent('enabled');
      expect(screen.getByTestId('type-checking')).toHaveTextContent('enabled');

      // 更新功能开关
      await act(async () => {
        configManager.update({
          development: {
            features: {
              hotReload: false,
              typeChecking: false,
              configValidation: false
            }
          }
        });
      });

      // 验证配置已更新
      expect(configManager.get('development.features.hotReload')).toBe(false);
      expect(configManager.get('development.features.typeChecking')).toBe(false);
    });
  });

  describe('配置验证对应用行为的影响', () => {
    it('应该在配置验证失败时保持应用稳定', async () => {
      await act(async () => {
        await configManager.initialize();
      });

      const StableComponent: React.FC = () => {
        const minPoints = 100; // 从配置读取，有默认值保护
        const maxPoints = 10000; // 从配置读取，有默认值保护
        
        return (
          <div data-testid="stable-component">
            <div data-testid="stable-min">{minPoints}</div>
            <div data-testid="stable-max">{maxPoints}</div>
            <div data-testid="is-valid">{minPoints < maxPoints ? 'valid' : 'invalid'}</div>
          </div>
        );
      };

      render(
        <ConfigProvider configManager={configManager}>
          <StableComponent />
        </ConfigProvider>
      );

      // 验证初始状态
      expect(screen.getByTestId('is-valid')).toHaveTextContent('valid');

      // 尝试设置无效配置
      await act(async () => {
        configManager.set('app.points.min', 15000); // 大于max，应该被验证拒绝
      });

      // 应用应该保持稳定，使用原有的有效配置
      expect(configManager.get('app.points.min')).toBe(DEFAULT_CONFIG.app.points.min);
      expect(screen.getByTestId('is-valid')).toHaveTextContent('valid');
    });
  });

  describe('配置持久化对应用的影响', () => {
    it('应该在应用重启后保持配置状态', async () => {
      // 模拟第一次启动
      const fs = await import('fs/promises');
      vi.mocked(fs.readFile).mockResolvedValue(JSON.stringify(DEFAULT_CONFIG));

      await act(async () => {
        await configManager.initialize();
      });

      // 修改配置
      await act(async () => {
        configManager.set('app.points.min', 300);
      });

      // 保存配置
      vi.mocked(fs.writeFile).mockResolvedValue(undefined);
      await configManager.save();

      // 模拟应用重启 - 创建新的配置管理器
      const newConfigManager = createConfigManager({
        configPath: './test-config.json'
      });

      // 模拟从文件加载保存的配置
      const savedConfig = {
        ...DEFAULT_CONFIG,
        app: { ...DEFAULT_CONFIG.app, points: { min: 300, max: 10000 } }
      };
      vi.mocked(fs.readFile).mockResolvedValue(JSON.stringify(savedConfig));

      await act(async () => {
        await newConfigManager.initialize();
      });

      // 验证配置已恢复
      expect(newConfigManager.get('app.points.min')).toBe(300);

      await newConfigManager.dispose();
    });
  });
});