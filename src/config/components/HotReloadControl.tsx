/**
 * Hot Reload Control Component
 * Provides UI controls for managing configuration hot reload
 */

import React, { useState } from 'react';
import { useHotReloadControl, useHotReloadNotifications } from '../ConfigContext';

export interface HotReloadControlProps {
  className?: string;
  showNotifications?: boolean;
  compact?: boolean;
}

/**
 * Hot Reload Control Component
 * Provides toggle switch and status display for hot reload functionality
 */
export const HotReloadControl: React.FC<HotReloadControlProps> = ({
  className = '',
  showNotifications = true,
  compact = false
}) => {
  const { isActive, enable, disable, forceReload } = useHotReloadControl();
  const { notifications, dismiss, dismissAll } = useHotReloadNotifications();
  const [isToggling, setIsToggling] = useState(false);
  const [isReloading, setIsReloading] = useState(false);

  const handleToggle = async () => {
    if (isToggling) return;
    
    setIsToggling(true);
    try {
      if (isActive) {
        await disable();
      } else {
        const result = await enable();
        if (!result.success) {
          console.error('Failed to enable hot reload:', result.error);
        }
      }
    } catch (error) {
      console.error('Error toggling hot reload:', error);
    } finally {
      setIsToggling(false);
    }
  };

  const handleForceReload = async () => {
    if (isReloading || !isActive) return;
    
    setIsReloading(true);
    try {
      await forceReload();
    } catch (error) {
      console.error('Error forcing reload:', error);
    } finally {
      setIsReloading(false);
    }
  };

  const getStatusColor = () => {
    if (isActive) return 'text-green-600';
    return 'text-gray-500';
  };

  const getStatusText = () => {
    if (isToggling) return 'Toggling...';
    if (isActive) return 'Active';
    return 'Inactive';
  };

  if (compact) {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        <button
          onClick={handleToggle}
          disabled={isToggling}
          className={`
            w-8 h-4 rounded-full transition-colors duration-200 ease-in-out
            ${isActive ? 'bg-green-500' : 'bg-gray-300'}
            ${isToggling ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          `}
          title={`Hot reload is ${isActive ? 'active' : 'inactive'}`}
        >
          <div
            className={`
              w-3 h-3 bg-white rounded-full shadow-md transform transition-transform duration-200 ease-in-out
              ${isActive ? 'translate-x-4' : 'translate-x-0.5'}
            `}
          />
        </button>
        {isActive && (
          <button
            onClick={handleForceReload}
            disabled={isReloading}
            className="text-xs text-blue-600 hover:text-blue-800 disabled:opacity-50"
            title="Force reload configuration"
          >
            {isReloading ? '⟳' : '↻'}
          </button>
        )}
      </div>
    );
  }

  return (
    <div className={`bg-white border border-gray-200 rounded-lg p-4 ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-gray-900">Hot Reload</h3>
        <div className="flex items-center space-x-2">
          <span className={`text-xs font-medium ${getStatusColor()}`}>
            {getStatusText()}
          </span>
          <button
            onClick={handleToggle}
            disabled={isToggling}
            className={`
              relative inline-flex h-5 w-9 items-center rounded-full transition-colors duration-200 ease-in-out
              ${isActive ? 'bg-green-500' : 'bg-gray-300'}
              ${isToggling ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
            `}
          >
            <span
              className={`
                inline-block h-3 w-3 transform rounded-full bg-white shadow-lg transition-transform duration-200 ease-in-out
                ${isActive ? 'translate-x-5' : 'translate-x-1'}
              `}
            />
          </button>
        </div>
      </div>

      {isActive && (
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-600">
            Configuration file is being monitored
          </span>
          <button
            onClick={handleForceReload}
            disabled={isReloading}
            className="
              px-2 py-1 text-xs bg-blue-50 text-blue-600 rounded hover:bg-blue-100
              disabled:opacity-50 disabled:cursor-not-allowed
            "
          >
            {isReloading ? 'Reloading...' : 'Force Reload'}
          </button>
        </div>
      )}

      {showNotifications && notifications.length > 0 && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-gray-700">
              Recent Notifications ({notifications.length})
            </span>
            {notifications.length > 0 && (
              <button
                onClick={dismissAll}
                className="text-xs text-gray-500 hover:text-gray-700"
              >
                Clear All
              </button>
            )}
          </div>
          <div className="space-y-1 max-h-32 overflow-y-auto">
            {notifications.slice(0, 3).map((notification) => (
              <div
                key={notification.id}
                className={`
                  flex items-start justify-between p-2 rounded text-xs
                  ${notification.type === 'success' ? 'bg-green-50 text-green-800' : ''}
                  ${notification.type === 'error' ? 'bg-red-50 text-red-800' : ''}
                  ${notification.type === 'info' ? 'bg-blue-50 text-blue-800' : ''}
                `}
              >
                <div className="flex-1 pr-2">
                  <div className="font-medium">{notification.message}</div>
                  <div className="text-xs opacity-75 mt-1">
                    {notification.timestamp.toLocaleTimeString()}
                  </div>
                </div>
                <button
                  onClick={() => dismiss(notification.id)}
                  className="text-xs opacity-50 hover:opacity-100"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * Hot Reload Status Indicator
 * Simple status indicator for hot reload state
 */
export const HotReloadStatusIndicator: React.FC<{
  className?: string;
}> = ({ className = '' }) => {
  const { isActive } = useHotReloadControl();

  return (
    <div className={`flex items-center space-x-1 ${className}`}>
      <div
        className={`
          w-2 h-2 rounded-full
          ${isActive ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}
        `}
      />
      <span className="text-xs text-gray-600">
        Hot Reload {isActive ? 'On' : 'Off'}
      </span>
    </div>
  );
};

/**
 * Hot Reload Notification Toast
 * Displays hot reload notifications as toast messages
 */
export const HotReloadNotificationToast: React.FC<{
  className?: string;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
}> = ({ 
  className = '',
  position = 'top-right'
}) => {
  const { notifications, dismiss } = useHotReloadNotifications();

  const getPositionClasses = () => {
    switch (position) {
      case 'top-left':
        return 'top-4 left-4';
      case 'bottom-right':
        return 'bottom-4 right-4';
      case 'bottom-left':
        return 'bottom-4 left-4';
      default:
        return 'top-4 right-4';
    }
  };

  if (notifications.length === 0) {
    return null;
  }

  return (
    <div className={`fixed ${getPositionClasses()} z-50 space-y-2 ${className}`}>
      {notifications.slice(0, 3).map((notification) => (
        <div
          key={notification.id}
          className={`
            max-w-sm p-3 rounded-lg shadow-lg border transition-all duration-300 ease-in-out
            ${notification.type === 'success' ? 'bg-green-50 border-green-200 text-green-800' : ''}
            ${notification.type === 'error' ? 'bg-red-50 border-red-200 text-red-800' : ''}
            ${notification.type === 'info' ? 'bg-blue-50 border-blue-200 text-blue-800' : ''}
          `}
        >
          <div className="flex items-start justify-between">
            <div className="flex-1 pr-2">
              <div className="text-sm font-medium">{notification.message}</div>
              <div className="text-xs opacity-75 mt-1">
                {notification.timestamp.toLocaleTimeString()}
              </div>
            </div>
            <button
              onClick={() => dismiss(notification.id)}
              className="text-sm opacity-50 hover:opacity-100 ml-2"
            >
              ×
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};