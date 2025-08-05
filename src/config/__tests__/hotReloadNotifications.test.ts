/**
 * Hot Reload Notifications Tests
 * Tests for hot reload notification system
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { 
  HotReloadNotificationManager, 
  createHotReloadNotificationManager,
  HotReloadMessageFormatter,
  HOT_RELOAD_MESSAGES
} from '../hotReloadNotifications';
import { HotReloadNotification } from '../hotReload';

describe('HotReloadNotificationManager', () => {
  let manager: HotReloadNotificationManager;
  let displayHandler: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    manager = createHotReloadNotificationManager({
      duration: 1000,
      maxNotifications: 3
    });
    displayHandler = vi.fn();
  });

  afterEach(() => {
    manager.clearHandlers();
    manager.dismissAll();
  });

  describe('notification display', () => {
    it('should show notification and call display handlers', () => {
      manager.subscribe(displayHandler);

      const notification: HotReloadNotification = {
        type: 'success',
        message: 'Test message',
        timestamp: new Date()
      };

      const id = manager.show(notification);

      expect(id).toMatch(/^hot-reload-\d+$/);
      expect(displayHandler).toHaveBeenCalledWith(
        expect.objectContaining({
          ...notification,
          id,
          dismissed: false,
          duration: 2000 // Success messages have shorter duration
        })
      );
    });

    it('should auto-dismiss notifications after duration', async () => {
      const notification: HotReloadNotification = {
        type: 'info',
        message: 'Test message',
        timestamp: new Date()
      };

      const id = manager.show(notification);
      expect(manager.getActiveNotifications()).toHaveLength(1);

      // Wait for auto-dismiss
      await new Promise(resolve => setTimeout(resolve, 1100));

      expect(manager.getActiveNotifications()).toHaveLength(0);
    });

    it('should not auto-dismiss error notifications', async () => {
      const notification: HotReloadNotification = {
        type: 'error',
        message: 'Error message',
        timestamp: new Date()
      };

      const id = manager.show(notification);
      expect(manager.getActiveNotifications()).toHaveLength(1);

      // Wait longer than normal duration
      await new Promise(resolve => setTimeout(resolve, 1100));

      // Error notifications should still be active
      expect(manager.getActiveNotifications()).toHaveLength(1);
    });
  });

  describe('notification management', () => {
    it('should dismiss notification by ID', () => {
      const notification: HotReloadNotification = {
        type: 'info',
        message: 'Test message',
        timestamp: new Date()
      };

      const id = manager.show(notification);
      expect(manager.getActiveNotifications()).toHaveLength(1);

      const dismissed = manager.dismiss(id);
      expect(dismissed).toBe(true);
      expect(manager.getActiveNotifications()).toHaveLength(0);
    });

    it('should return false when dismissing non-existent notification', () => {
      const dismissed = manager.dismiss('non-existent-id');
      expect(dismissed).toBe(false);
    });

    it('should dismiss all notifications', () => {
      // Add multiple notifications
      for (let i = 0; i < 3; i++) {
        manager.show({
          type: 'info',
          message: `Message ${i}`,
          timestamp: new Date()
        });
      }

      expect(manager.getActiveNotifications()).toHaveLength(3);

      manager.dismissAll();
      expect(manager.getActiveNotifications()).toHaveLength(0);
    });

    it('should enforce maximum notification limit', () => {
      // Add more notifications than the limit
      for (let i = 0; i < 5; i++) {
        manager.show({
          type: 'info',
          message: `Message ${i}`,
          timestamp: new Date()
        });
      }

      // Should only keep the maximum number
      expect(manager.getActiveNotifications()).toHaveLength(3);
    });
  });

  describe('subscription management', () => {
    it('should subscribe and unsubscribe handlers', () => {
      const unsubscribe = manager.subscribe(displayHandler);

      manager.show({
        type: 'info',
        message: 'Test message',
        timestamp: new Date()
      });

      expect(displayHandler).toHaveBeenCalledTimes(1);

      unsubscribe();

      manager.show({
        type: 'info',
        message: 'Another message',
        timestamp: new Date()
      });

      expect(displayHandler).toHaveBeenCalledTimes(1); // Should not be called again
    });

    it('should handle errors in display handlers gracefully', () => {
      const errorHandler = vi.fn(() => {
        throw new Error('Handler error');
      });
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      manager.subscribe(errorHandler);
      manager.subscribe(displayHandler);

      manager.show({
        type: 'info',
        message: 'Test message',
        timestamp: new Date()
      });

      expect(errorHandler).toHaveBeenCalled();
      expect(displayHandler).toHaveBeenCalled(); // Should still be called despite error
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error in notification display handler:',
        expect.any(Error)
      );

      consoleErrorSpy.mockRestore();
    });

    it('should clear all handlers', () => {
      manager.subscribe(displayHandler);
      manager.clearHandlers();

      manager.show({
        type: 'info',
        message: 'Test message',
        timestamp: new Date()
      });

      expect(displayHandler).not.toHaveBeenCalled();
    });
  });

  describe('statistics and metadata', () => {
    it('should provide notification statistics', () => {
      // Add notifications of different types
      manager.show({ type: 'success', message: 'Success 1', timestamp: new Date() });
      manager.show({ type: 'success', message: 'Success 2', timestamp: new Date() });
      manager.show({ type: 'error', message: 'Error 1', timestamp: new Date() });
      
      // Dismiss one
      const notifications = manager.getActiveNotifications();
      manager.dismiss(notifications[0].id);

      const stats = manager.getStats();

      expect(stats.total).toBe(3);
      expect(stats.active).toBe(2);
      expect(stats.dismissed).toBe(1);
      expect(stats.byType).toEqual({
        success: 2,
        error: 1
      });
    });

    it('should get and update options', () => {
      const initialOptions = manager.getOptions();
      expect(initialOptions.duration).toBe(1000);
      expect(initialOptions.maxNotifications).toBe(3);

      manager.updateOptions({ duration: 2000 });

      const updatedOptions = manager.getOptions();
      expect(updatedOptions.duration).toBe(2000);
      expect(updatedOptions.maxNotifications).toBe(3); // Should remain unchanged
    });
  });

  describe('notification ordering', () => {
    it('should return notifications in reverse chronological order', () => {
      const time1 = new Date('2024-01-01T10:00:00Z');
      const time2 = new Date('2024-01-01T11:00:00Z');
      const time3 = new Date('2024-01-01T12:00:00Z');

      manager.show({ type: 'info', message: 'First', timestamp: time1 });
      manager.show({ type: 'info', message: 'Second', timestamp: time2 });
      manager.show({ type: 'info', message: 'Third', timestamp: time3 });

      const notifications = manager.getActiveNotifications();

      expect(notifications[0].message).toBe('Third');
      expect(notifications[1].message).toBe('Second');
      expect(notifications[2].message).toBe('First');
    });
  });
});

describe('HotReloadMessageFormatter', () => {
  describe('success messages', () => {
    it('should format success messages without details', () => {
      const message = HotReloadMessageFormatter.success('reloaded');
      expect(message).toBe(HOT_RELOAD_MESSAGES.success.reloaded);
    });

    it('should format success messages with details', () => {
      const message = HotReloadMessageFormatter.success('reloaded', 'config.json');
      expect(message).toBe(`${HOT_RELOAD_MESSAGES.success.reloaded}: config.json`);
    });
  });

  describe('error messages', () => {
    it('should format error messages without details', () => {
      const message = HotReloadMessageFormatter.error('failed');
      expect(message).toBe(HOT_RELOAD_MESSAGES.error.failed);
    });

    it('should format error messages with details', () => {
      const message = HotReloadMessageFormatter.error('failed', 'File not found');
      expect(message).toBe(`${HOT_RELOAD_MESSAGES.error.failed}: File not found`);
    });
  });

  describe('info messages', () => {
    it('should format info messages without details', () => {
      const message = HotReloadMessageFormatter.info('watching');
      expect(message).toBe(HOT_RELOAD_MESSAGES.info.watching);
    });

    it('should format info messages with details', () => {
      const message = HotReloadMessageFormatter.info('watching', 'config.json');
      expect(message).toBe(`${HOT_RELOAD_MESSAGES.info.watching}: config.json`);
    });
  });

  describe('validation error messages', () => {
    it('should format single validation error', () => {
      const message = HotReloadMessageFormatter.validationError(['Invalid value']);
      expect(message).toBe('Validation error: Invalid value');
    });

    it('should format multiple validation errors', () => {
      const message = HotReloadMessageFormatter.validationError([
        'Invalid value 1',
        'Invalid value 2'
      ]);
      expect(message).toBe('Validation errors: Invalid value 1, Invalid value 2');
    });
  });

  describe('file error messages', () => {
    it('should format load error messages', () => {
      const message = HotReloadMessageFormatter.fileError('load', 'File not found');
      expect(message).toBe('Failed to load configuration file: File not found');
    });

    it('should format save error messages', () => {
      const message = HotReloadMessageFormatter.fileError('save', 'Permission denied');
      expect(message).toBe('Failed to save configuration file: Permission denied');
    });
  });
});

describe('createHotReloadNotificationManager', () => {
  it('should create manager with default options', () => {
    const manager = createHotReloadNotificationManager();
    const options = manager.getOptions();

    expect(options.duration).toBe(3000);
    expect(options.position).toBe('top-right');
    expect(options.showIcon).toBe(true);
    expect(options.allowDismiss).toBe(true);
    expect(options.maxNotifications).toBe(5);
  });

  it('should create manager with custom options', () => {
    const manager = createHotReloadNotificationManager({
      duration: 5000,
      position: 'bottom-left',
      maxNotifications: 10
    });
    
    const options = manager.getOptions();

    expect(options.duration).toBe(5000);
    expect(options.position).toBe('bottom-left');
    expect(options.maxNotifications).toBe(10);
    expect(options.showIcon).toBe(true); // Should use default
  });
});