/**
 * 配置热重载功能集成测试
 * 验证文件监听、配置重新加载和错误恢复的完整流程
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createConfigManager } from '../ConfigManager';
import { DEFAULT_CONFIG } from '../defaultConfig';
import { AppConfiguration } from '../types';

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
vi.mock('fs', () => ({
  watch: mockFs.watch
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

describe('配置热重载功能集成测试', () => {
  let configManager: ReturnType<typeof createConfigManager>;
  let mockWatcher: any;
  let watcherCallbacks: { [event: string]: Function[] } = {};

  beforeEach(() => {
    // Reset watcher callbacks
    watcherCallbacks = {};
    
    // Mock file watcher
    mockWatcher = {
      on: vi.fn((event: string, callback: Function) => {
        if (!watcherCallbacks[event]) {
          watcherCallbacks[event] = [];
        }
        watcherCallbacks[event].push(callback);
      }),
      close: vi.fn()
    };
    
    mockFs.watch.mockReturnValue(mockWatcher);

    configManager = createConfigManager({
      enableValidation: true,
      enableHotReload: true,
      configPath: './test-config.json'
    });

    // Clear localStorage mocks
    localStorageMock.getItem.mockClear();
    localStorageMock.setItem.mockClear();
    localStorageMock.removeItem.mockClear();
    localStorageMock.clear.mockClear();

    // Clear fs mocks
    vi.clearAllMocks();
  });

  afterEach(async () => {
    await configManager.dispose();
    vi.clearAllMocks();
  });

  describe('热重载初始化', () => {
    it('应该在启用热重载时正确设置文件监听', async () => {
      // Mock successful file read
      mockFs.readFile.mockResolvedValue(JSON.stringify(DEFAULT_CONFIG));

      await configManager.initialize();

      expect(configManager.isHotReloadActive()).toBe(true);
      expect(mockFs.watch).toHaveBeenCalledWith('./test-config.json');
      expect(mockWatcher.on).toHaveBeenCalledWith('change', expect.any(Function));
    });

    it('应该在浏览器环境中禁用热重载', async () => {
      // Mock browser environment
      const originalWindow = global.window;
      global.window = {} as any;

      mockFs.readFile.mockResolvedValue(JSON.stringify(DEFAULT_CONFIG));

      await configManager.initialize();

      expect(configManager.isHotReloadActive()).toBe(false);
      expect(mockFs.watch).not.toHaveBeenCalled();

      // Restore
      global.window = originalWindow;
    });

    it('应该处理文件监听设置失败', async () => {
      mockFs.readFile.mockResolvedValue(JSON.stringify(DEFAULT_CONFIG));
      mockFs.watch.mockImplementation(() => {
        throw new Error('Watch failed');
      });

      const mockOnFileError = vi.fn();
      const manager = createConfigManager({
        enableHotReload: true,
        onFileError: mockOnFileError
      });

      await manager.initialize();

      expect(manager.isHotReloadActive()).toBe(false);
      expect(mockOnFileError).toHaveBeenCalledWith(
        expect.stringContaining('Watch failed'),
        'load'
      );

      await manager.dispose();
    });
  });

  describe('配置文件变化检测', () => {
    beforeEach(async () => {
      mockFs.readFile.mockResolvedValue(JSON.stringify(DEFAULT_CONFIG));
      await configManager.initialize();
    });

    it('应该在文件变化时重新加载配置', async () => {
      const updatedConfig = {
        ...DEFAULT_CONFIG,
        app: { ...DEFAULT_CONFIG.app, points: { min: 500, max: 5000 } }
      };

      const mockOnConfigChange = vi.fn();
      const manager = createConfigManager({
        enableHotReload: true,
        onConfigChange: mockOnConfigChange
      });

      mockFs.readFile.mockResolvedValue(JSON.stringify(DEFAULT_CONFIG));
      await manager.initialize();

      // Simulate file change
      mockFs.readFile.mockResolvedValue(JSON.stringify(updatedConfig));
      
      // Trigger change event
      if (watcherCallbacks.change) {
        watcherCallbacks.change.forEach(callback => callback());
      }

      // Wait for debounced reload
      await new Promise(resolve => setTimeout(resolve, 350));

      expect(manager.get('app.points.min')).toBe(500);
      expect(mockOnConfigChange).toHaveBeenCalled();

      await manager.dispose();
    });

    it('应该防抖多次快速的文件变化', async () => {
      const mockOnConfigChange = vi.fn();
      const manager = createConfigManager({
        enableHotReload: true,
        onConfigChange: mockOnConfigChange
      });

      mockFs.readFile.mockResolvedValue(JSON.stringify(DEFAULT_CONFIG));
      await manager.initialize();

      // Simulate multiple rapid changes
      for (let i = 0; i < 5; i++) {
        if (watcherCallbacks.change) {
          watcherCallbacks.change.forEach(callback => callback());
        }
      }

      // Wait for debounced reload
      await new Promise(resolve => setTimeout(resolve, 350));

      // Should only reload once due to debouncing
      expect(mockFs.readFile).toHaveBeenCalledTimes(2); // Initial load + one reload

      await manager.dispose();
    });

    it('应该在配置验证失败时保持原配置', async () => {
      const invalidConfig = {
        ...DEFAULT_CONFIG,
        app: { ...DEFAULT_CONFIG.app, points: { min: -100, max: 1000 } } // Invalid min
      };

      const mockOnValidationError = vi.fn();
      const manager = createConfigManager({
        enableHotReload: true,
        onValidationError: mockOnValidationError
      });

      mockFs.readFile.mockResolvedValue(JSON.stringify(DEFAULT_CONFIG));
      await manager.initialize();

      const originalMin = manager.get('app.points.min');

      // Simulate file change with invalid config
      mockFs.readFile.mockResolvedValue(JSON.stringify(invalidConfig));
      
      if (watcherCallbacks.change) {
        watcherCallbacks.change.forEach(callback => callback());
      }

      await new Promise(resolve => setTimeout(resolve, 350));

      // Configuration should remain unchanged
      expect(manager.get('app.points.min')).toBe(originalMin);
      expect(mockOnValidationError).toHaveBeenCalled();

      await manager.dispose();
    });
  });

  describe('热重载错误处理', () => {
    beforeEach(async () => {
      mockFs.readFile.mockResolvedValue(JSON.stringify(DEFAULT_CONFIG));
      await configManager.initialize();
    });

    it('应该处理文件读取错误', async () => {
      const mockOnFileError = vi.fn();
      const manager = createConfigManager({
        enableHotReload: true,
        onFileError: mockOnFileError
      });

      mockFs.readFile.mockResolvedValue(JSON.stringify(DEFAULT_CONFIG));
      await manager.initialize();

      // Simulate file read error
      mockFs.readFile.mockRejectedValue(new Error('File read failed'));
      
      if (watcherCallbacks.change) {
        watcherCallbacks.change.forEach(callback => callback());
      }

      await new Promise(resolve => setTimeout(resolve, 350));

      expect(mockOnFileError).toHaveBeenCalledWith(
        expect.stringContaining('File read failed'),
        'load'
      );

      await manager.dispose();
    });

    it('应该处理JSON解析错误', async () => {
      const mockOnFileError = vi.fn();
      const manager = createConfigManager({
        enableHotReload: true,
        onFileError: mockOnFileError
      });

      mockFs.readFile.mockResolvedValue(JSON.stringify(DEFAULT_CONFIG));
      await manager.initialize();

      // Simulate invalid JSON
      mockFs.readFile.mockResolvedValue('{ invalid json }');
      
      if (watcherCallbacks.change) {
        watcherCallbacks.change.forEach(callback => callback());
      }

      await new Promise(resolve => setTimeout(resolve, 350));

      expect(mockOnFileError).toHaveBeenCalled();

      await manager.dispose();
    });

    it('应该在文件监听器错误时继续工作', async () => {
      const mockOnFileError = vi.fn();
      const manager = createConfigManager({
        enableHotReload: true,
        onFileError: mockOnFileError
      });

      mockFs.readFile.mockResolvedValue(JSON.stringify(DEFAULT_CONFIG));
      await manager.initialize();

      // Simulate watcher error
      if (watcherCallbacks.error) {
        watcherCallbacks.error.forEach(callback => 
          callback(new Error('Watcher error'))
        );
      }

      // Manager should still be functional
      expect(manager.isReady()).toBe(true);
      expect(manager.get('app.points.min')).toBe(DEFAULT_CONFIG.app.points.min);

      await manager.dispose();
    });
  });

  describe('热重载通知系统', () => {
    beforeEach(async () => {
      mockFs.readFile.mockResolvedValue(JSON.stringify(DEFAULT_CONFIG));
      await configManager.initialize();
    });

    it('应该在成功重新加载时显示通知', async () => {
      const updatedConfig = {
        ...DEFAULT_CONFIG,
        app: { ...DEFAULT_CONFIG.app, points: { min: 300, max: 3000 } }
      };

      // Simulate successful reload
      mockFs.readFile.mockResolvedValue(JSON.stringify(updatedConfig));
      
      if (watcherCallbacks.change) {
        watcherCallbacks.change.forEach(callback => callback());
      }

      await new Promise(resolve => setTimeout(resolve, 350));

      const stats = configManager.getNotificationStats();
      expect(stats.total).toBeGreaterThan(0);
    });

    it('应该在重新加载失败时显示错误通知', async () => {
      // Simulate reload failure
      mockFs.readFile.mockRejectedValue(new Error('Reload failed'));
      
      if (watcherCallbacks.change) {
        watcherCallbacks.change.forEach(callback => callback());
      }

      await new Promise(resolve => setTimeout(resolve, 350));

      const stats = configManager.getNotificationStats();
      expect(stats.byType.error).toBeGreaterThan(0);
    });

    it('应该支持手动触发通知', () => {
      const notificationId = configManager.showNotification('info', '手动测试通知');
      
      expect(typeof notificationId).toBe('string');
      expect(notificationId.length).toBeGreaterThan(0);

      const stats = configManager.getNotificationStats();
      expect(stats.active).toBeGreaterThan(0);
    });

    it('应该支持清除通知', () => {
      const id1 = configManager.showNotification('info', '通知1');
      const id2 = configManager.showNotification('error', '通知2');

      let stats = configManager.getNotificationStats();
      expect(stats.active).toBe(2);

      configManager.dismissNotification(id1);
      stats = configManager.getNotificationStats();
      expect(stats.active).toBe(1);

      configManager.dismissAllNotifications();
      stats = configManager.getNotificationStats();
      expect(stats.active).toBe(0);
    });
  });

  describe('热重载控制', () => {
    it('应该支持动态启用热重载', async () => {
      const manager = createConfigManager({
        enableHotReload: false
      });

      mockFs.readFile.mockResolvedValue(JSON.stringify(DEFAULT_CONFIG));
      await manager.initialize();

      expect(manager.isHotReloadActive()).toBe(false);

      const result = await manager.enableHotReload();
      expect(result.success).toBe(true);
      expect(manager.isHotReloadActive()).toBe(true);

      await manager.dispose();
    });

    it('应该支持动态禁用热重载', async () => {
      mockFs.readFile.mockResolvedValue(JSON.stringify(DEFAULT_CONFIG));
      await configManager.initialize();

      expect(configManager.isHotReloadActive()).toBe(true);

      await configManager.disableHotReload();
      expect(configManager.isHotReloadActive()).toBe(false);
      expect(mockWatcher.close).toHaveBeenCalled();
    });

    it('应该支持强制重新加载', async () => {
      const updatedConfig = {
        ...DEFAULT_CONFIG,
        app: { ...DEFAULT_CONFIG.app, points: { min: 400, max: 4000 } }
      };

      mockFs.readFile.mockResolvedValue(JSON.stringify(DEFAULT_CONFIG));
      await configManager.initialize();

      // Change file content
      mockFs.readFile.mockResolvedValue(JSON.stringify(updatedConfig));

      // Force reload
      await configManager.forceHotReload();

      expect(configManager.get('app.points.min')).toBe(400);
    });

    it('应该在热重载未激活时拒绝强制重新加载', async () => {
      const manager = createConfigManager({
        enableHotReload: false
      });

      mockFs.readFile.mockResolvedValue(JSON.stringify(DEFAULT_CONFIG));
      await manager.initialize();

      await expect(manager.forceHotReload()).rejects.toThrow(
        'Hot reload is not active'
      );

      await manager.dispose();
    });
  });

  describe('热重载状态信息', () => {
    beforeEach(async () => {
      mockFs.readFile.mockResolvedValue(JSON.stringify(DEFAULT_CONFIG));
      await configManager.initialize();
    });

    it('应该正确报告热重载状态', () => {
      const status = configManager.getHotReloadStatus();

      expect(status.isActive).toBe(true);
      expect(status.configPath).toBe('./test-config.json');
      expect(typeof status.listenerCount).toBe('number');
    });

    it('应该在禁用热重载后更新状态', async () => {
      await configManager.disableHotReload();

      const status = configManager.getHotReloadStatus();
      expect(status.isActive).toBe(false);
    });
  });

  describe('资源清理', () => {
    it('应该在dispose时正确清理热重载资源', async () => {
      mockFs.readFile.mockResolvedValue(JSON.stringify(DEFAULT_CONFIG));
      await configManager.initialize();

      expect(configManager.isHotReloadActive()).toBe(true);

      await configManager.dispose();

      expect(configManager.isHotReloadActive()).toBe(false);
      expect(mockWatcher.close).toHaveBeenCalled();
    });

    it('应该在多次dispose调用时保持稳定', async () => {
      mockFs.readFile.mockResolvedValue(JSON.stringify(DEFAULT_CONFIG));
      await configManager.initialize();

      await configManager.dispose();
      await configManager.dispose(); // 第二次调用不应该出错

      expect(configManager.isHotReloadActive()).toBe(false);
    });
  });
});