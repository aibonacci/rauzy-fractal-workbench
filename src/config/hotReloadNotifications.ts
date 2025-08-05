/**
 * Hot Reload Notification System
 * Provides user-friendly notifications for hot reload events
 */

import { HotReloadNotification } from './hotReload';

export interface NotificationOptions {
  duration?: number;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  showIcon?: boolean;
  allowDismiss?: boolean;
  maxNotifications?: number;
}

export interface DisplayNotification extends HotReloadNotification {
  id: string;
  duration: number;
  dismissed: boolean;
}

export type NotificationDisplayHandler = (notification: DisplayNotification) => void;

/**
 * Hot Reload Notification Manager
 * Manages the display and lifecycle of hot reload notifications
 */
export class HotReloadNotificationManager {
  private notifications: Map<string, DisplayNotification> = new Map();
  private displayHandlers: Set<NotificationDisplayHandler> = new Set();
  private options: Required<NotificationOptions>;
  private notificationCounter: number = 0;

  constructor(options: NotificationOptions = {}) {
    this.options = {
      duration: 3000,
      position: 'top-right',
      showIcon: true,
      allowDismiss: true,
      maxNotifications: 5,
      ...options
    };
  }

  /**
   * Show a hot reload notification
   */
  show(notification: HotReloadNotification): string {
    const id = `hot-reload-${++this.notificationCounter}`;
    
    const displayNotification: DisplayNotification = {
      ...notification,
      id,
      duration: this.getDurationForType(notification.type),
      dismissed: false
    };

    // Remove oldest notifications if we exceed the maximum
    this.enforceMaxNotifications();

    // Add the new notification
    this.notifications.set(id, displayNotification);

    // Notify display handlers
    this.displayHandlers.forEach(handler => {
      try {
        handler(displayNotification);
      } catch (error) {
        console.error('Error in notification display handler:', error);
      }
    });

    // Auto-dismiss after duration (if duration > 0)
    if (displayNotification.duration > 0) {
      setTimeout(() => {
        this.dismiss(id);
      }, displayNotification.duration);
    }

    return id;
  }

  /**
   * Dismiss a notification by ID
   */
  dismiss(id: string): boolean {
    const notification = this.notifications.get(id);
    
    if (!notification || notification.dismissed) {
      return false;
    }

    notification.dismissed = true;
    // Keep the notification in the map for statistics, but mark as dismissed

    return true;
  }

  /**
   * Dismiss all notifications
   */
  dismissAll(): void {
    this.notifications.forEach((notification) => {
      notification.dismissed = true;
    });
    // Keep notifications for statistics, just mark them as dismissed
  }

  /**
   * Get all active notifications
   */
  getActiveNotifications(): DisplayNotification[] {
    return Array.from(this.notifications.values())
      .filter(notification => !notification.dismissed)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  /**
   * Subscribe to notification display events
   */
  subscribe(handler: NotificationDisplayHandler): () => void {
    this.displayHandlers.add(handler);
    
    return () => {
      this.displayHandlers.delete(handler);
    };
  }

  /**
   * Unsubscribe from notification display events
   */
  unsubscribe(handler: NotificationDisplayHandler): void {
    this.displayHandlers.delete(handler);
  }

  /**
   * Clear all display handlers
   */
  clearHandlers(): void {
    this.displayHandlers.clear();
  }

  /**
   * Update notification options
   */
  updateOptions(newOptions: Partial<NotificationOptions>): void {
    this.options = { ...this.options, ...newOptions };
  }

  /**
   * Get current notification options
   */
  getOptions(): Required<NotificationOptions> {
    return { ...this.options };
  }

  /**
   * Get notification statistics
   */
  getStats(): {
    total: number;
    active: number;
    dismissed: number;
    byType: Record<string, number>;
  } {
    const notifications = Array.from(this.notifications.values());
    const byType: Record<string, number> = {};

    notifications.forEach(notification => {
      byType[notification.type] = (byType[notification.type] || 0) + 1;
    });

    return {
      total: notifications.length,
      active: notifications.filter(n => !n.dismissed).length,
      dismissed: notifications.filter(n => n.dismissed).length,
      byType
    };
  }

  /**
   * Get duration for notification type
   */
  private getDurationForType(type: HotReloadNotification['type']): number {
    switch (type) {
      case 'success':
        return 2000; // Success messages disappear quickly
      case 'error':
        return 0; // Error messages stay until dismissed
      case 'info':
        return this.options.duration;
      default:
        return this.options.duration;
    }
  }

  /**
   * Enforce maximum number of notifications
   */
  private enforceMaxNotifications(): void {
    const activeNotifications = this.getActiveNotifications();
    
    if (activeNotifications.length >= this.options.maxNotifications) {
      // Remove the oldest notifications
      const toRemove = activeNotifications
        .slice(this.options.maxNotifications - 1)
        .map(n => n.id);
      
      toRemove.forEach(id => this.dismiss(id));
    }
  }
}

/**
 * Default hot reload notification messages
 */
export const HOT_RELOAD_MESSAGES = {
  success: {
    reloaded: 'Configuration reloaded successfully',
    recovered: 'Hot reload recovered successfully',
    enabled: 'Hot reload enabled'
  },
  error: {
    failed: 'Failed to reload configuration',
    validation: 'Configuration validation failed',
    fileError: 'Configuration file error',
    recoveryFailed: 'Hot reload recovery failed'
  },
  info: {
    watching: 'Watching configuration file for changes',
    disabled: 'Hot reload disabled',
    fileChanged: 'Configuration file changed'
  }
} as const;

/**
 * Create formatted notification messages
 */
export class HotReloadMessageFormatter {
  /**
   * Format a success message
   */
  static success(key: keyof typeof HOT_RELOAD_MESSAGES.success, details?: string): string {
    const baseMessage = HOT_RELOAD_MESSAGES.success[key];
    return details ? `${baseMessage}: ${details}` : baseMessage;
  }

  /**
   * Format an error message
   */
  static error(key: keyof typeof HOT_RELOAD_MESSAGES.error, details?: string): string {
    const baseMessage = HOT_RELOAD_MESSAGES.error[key];
    return details ? `${baseMessage}: ${details}` : baseMessage;
  }

  /**
   * Format an info message
   */
  static info(key: keyof typeof HOT_RELOAD_MESSAGES.info, details?: string): string {
    const baseMessage = HOT_RELOAD_MESSAGES.info[key];
    return details ? `${baseMessage}: ${details}` : baseMessage;
  }

  /**
   * Format a validation error message
   */
  static validationError(errors: string[]): string {
    if (errors.length === 1) {
      return `Validation error: ${errors[0]}`;
    }
    return `Validation errors: ${errors.join(', ')}`;
  }

  /**
   * Format a file error message
   */
  static fileError(operation: 'load' | 'save', error: string): string {
    return `Failed to ${operation} configuration file: ${error}`;
  }
}

/**
 * Create a default hot reload notification manager
 */
export function createHotReloadNotificationManager(options?: NotificationOptions): HotReloadNotificationManager {
  return new HotReloadNotificationManager(options);
}

/**
 * Integration helper for React applications
 */
export class ReactHotReloadNotifications {
  private manager: HotReloadNotificationManager;
  private notificationSystem: any = null;

  constructor(manager: HotReloadNotificationManager) {
    this.manager = manager;
  }

  /**
   * Connect to a React notification system
   */
  connectToNotificationSystem(notificationSystem: any): void {
    this.notificationSystem = notificationSystem;

    // Subscribe to notification manager
    this.manager.subscribe((notification) => {
      this.displayInReact(notification);
    });
  }

  /**
   * Display notification in React notification system
   */
  private displayInReact(notification: DisplayNotification): void {
    if (!this.notificationSystem) {
      console.warn('No React notification system connected');
      return;
    }

    // This would integrate with your existing notification system
    // For example, if using a notification context or library
    try {
      this.notificationSystem.show({
        id: notification.id,
        type: notification.type,
        message: notification.message,
        duration: notification.duration,
        timestamp: notification.timestamp
      });
    } catch (error) {
      console.error('Error displaying React notification:', error);
    }
  }

  /**
   * Disconnect from React notification system
   */
  disconnect(): void {
    this.notificationSystem = null;
    this.manager.clearHandlers();
  }
}