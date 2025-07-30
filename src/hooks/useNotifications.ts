import { useState, useCallback } from 'react';
import { Notification } from '../components/Notification/NotificationSystem';

export const useNotifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const addNotification = useCallback((notification: Omit<Notification, 'id'>) => {
    const id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
    const newNotification: Notification = {
      id,
      duration: 3000, // 默认3秒
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
    return addNotification({ type: 'success', title, message, duration: duration ?? 2000 }); // 成功通知默认2秒消失
  }, [addNotification]);

  const showError = useCallback((title: string, message?: string, duration?: number) => {
    return addNotification({ type: 'error', title, message, duration: duration || 0 }); // 错误默认不自动消失
  }, [addNotification]);

  const showWarning = useCallback((title: string, message?: string, duration?: number) => {
    return addNotification({ type: 'warning', title, message, duration });
  }, [addNotification]);

  const showInfo = useCallback((title: string, message?: string, duration?: number) => {
    return addNotification({ type: 'info', title, message, duration });
  }, [addNotification]);

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