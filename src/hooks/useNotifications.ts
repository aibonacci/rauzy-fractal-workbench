import { useState, useCallback } from 'react';
import { Notification } from '../components/Notification/NotificationSystem';
import { useConfig } from '../config/ConfigContext';

export const useNotifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const { config } = useConfig();

  const addNotification = useCallback((notification: Omit<Notification, 'id'>) => {
    const id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
    const newNotification: Notification = {
      id,
      duration: config.ui.notifications.defaultDuration,
      ...notification
    };

    setNotifications(prev => {
      // 限制最多显示5个通知
      const newNotifications = [...prev, newNotification];
      return newNotifications.slice(-5);
    });
    return id;
  }, []);

  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const clearAllNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  // 便捷方法
  const showSuccess = useCallback((title: string, message?: string, duration?: number) => {
    return addNotification({ type: 'success', title, message, duration: duration ?? config.ui.notifications.successDuration });
  }, [addNotification, config.ui.notifications.successDuration]);

  const showError = useCallback((title: string, message?: string, duration?: number) => {
    return addNotification({ type: 'error', title, message, duration: duration ?? config.ui.notifications.errorDuration });
  }, [addNotification, config.ui.notifications.errorDuration]);

  const showWarning = useCallback((title: string, message?: string, duration?: number) => {
    return addNotification({ type: 'warning', title, message, duration: duration ?? config.ui.notifications.warningDuration });
  }, [addNotification, config.ui.notifications.warningDuration]);

  const showInfo = useCallback((title: string, message?: string, duration?: number) => {
    return addNotification({ type: 'info', title, message, duration: duration ?? config.ui.notifications.infoDuration });
  }, [addNotification, config.ui.notifications.infoDuration]);

  return {
    notifications,
    addNotification,
    removeNotification,
    clearAllNotifications,
    showSuccess,
    showError,
    showWarning,
    showInfo
  };
};