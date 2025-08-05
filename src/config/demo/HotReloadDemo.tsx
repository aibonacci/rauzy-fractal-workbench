/**
 * Hot Reload Demo Component
 * Demonstrates the configuration hot reload functionality
 */

import React, { useState, useEffect } from 'react';
import { useHotReload, useHotReloadNotifications, useConfig } from '../ConfigContext';
import { HotReloadControl, HotReloadStatusIndicator, HotReloadNotificationToast } from '../components/HotReloadControl';

export const HotReloadDemo: React.FC = () => {
  const { config } = useConfig();
  const hotReload = useHotReload();
  const { notifications } = useHotReloadNotifications();
  const [lastConfigUpdate, setLastConfigUpdate] = useState<string>('');

  useEffect(() => {
    setLastConfigUpdate(config.lastModified);
  }, [config.lastModified]);

  const handleForceReload = async () => {
    try {
      await hotReload.forceReload();
    } catch (error) {
      console.error('Force reload failed:', error);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          Configuration Hot Reload Demo
        </h1>
        <p className="text-gray-600 mb-6">
          This demo shows the configuration hot reload functionality. When enabled, 
          the system will automatically detect changes to the configuration file and 
          reload the configuration without requiring a page refresh.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Hot Reload Control */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-800">Hot Reload Control</h2>
            <HotReloadControl showNotifications={true} />
            
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
              <HotReloadStatusIndicator />
              <button
                onClick={handleForceReload}
                disabled={!hotReload.isActive}
                className="
                  px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600
                  disabled:opacity-50 disabled:cursor-not-allowed
                "
              >
                Force Reload
              </button>
            </div>
          </div>

          {/* Configuration Status */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-800">Configuration Status</h2>
            <div className="bg-gray-50 rounded p-4 space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Version:</span>
                <span className="text-sm font-mono">{config.version}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Last Modified:</span>
                <span className="text-sm font-mono">
                  {new Date(config.lastModified).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Hot Reload:</span>
                <span className={`text-sm font-medium ${
                  hotReload.isActive ? 'text-green-600' : 'text-red-600'
                }`}>
                  {hotReload.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Configuration Preview */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">
          Current Configuration Preview
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* App Configuration */}
          <div className="bg-blue-50 rounded p-4">
            <h3 className="font-medium text-blue-800 mb-2">App Settings</h3>
            <div className="space-y-1 text-sm">
              <div>Points: {config.app.points.min}-{config.app.points.max}</div>
              <div>Default: {config.app.points.default}</div>
              <div>Max Paths: {config.app.paths.maxCount}</div>
            </div>
          </div>

          {/* UI Configuration */}
          <div className="bg-green-50 rounded p-4">
            <h3 className="font-medium text-green-800 mb-2">UI Settings</h3>
            <div className="space-y-1 text-sm">
              <div>Transition: {config.ui.animations.transitionDuration}ms</div>
              <div>Debounce: {config.ui.animations.debounceDelay}ms</div>
              <div>Max Notifications: {config.ui.notifications.maxCount}</div>
            </div>
          </div>

          {/* Performance Configuration */}
          <div className="bg-purple-50 rounded p-4">
            <h3 className="font-medium text-purple-800 mb-2">Performance</h3>
            <div className="space-y-1 text-sm">
              <div>Cache Size: {config.performance.cache.maxSize}</div>
              <div>Cache TTL: {config.performance.cache.defaultTTL}s</div>
              <div>Point Size: {config.performance.rendering.webgl.pointSize}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Notifications */}
      {notifications.length > 0 && (
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            Recent Hot Reload Events
          </h2>
          <div className="space-y-2">
            {notifications.slice(0, 5).map((notification) => (
              <div
                key={notification.id}
                className={`
                  flex items-start justify-between p-3 rounded text-sm
                  ${notification.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : ''}
                  ${notification.type === 'error' ? 'bg-red-50 text-red-800 border border-red-200' : ''}
                  ${notification.type === 'info' ? 'bg-blue-50 text-blue-800 border border-blue-200' : ''}
                `}
              >
                <div className="flex-1">
                  <div className="font-medium">{notification.message}</div>
                  <div className="text-xs opacity-75 mt-1">
                    {notification.timestamp.toLocaleString()}
                  </div>
                </div>
                <div className={`
                  px-2 py-1 rounded text-xs font-medium
                  ${notification.type === 'success' ? 'bg-green-100 text-green-700' : ''}
                  ${notification.type === 'error' ? 'bg-red-100 text-red-700' : ''}
                  ${notification.type === 'info' ? 'bg-blue-100 text-blue-700' : ''}
                `}>
                  {notification.type}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-yellow-800 mb-2">
          How to Test Hot Reload
        </h2>
        <div className="text-sm text-yellow-700 space-y-2">
          <p>1. Enable hot reload using the toggle above</p>
          <p>2. Open the configuration file (config.json) in your editor</p>
          <p>3. Make changes to any configuration values</p>
          <p>4. Save the file and watch the configuration update automatically</p>
          <p>5. Check the notifications panel for reload status</p>
        </div>
        
        <div className="mt-4 p-3 bg-yellow-100 rounded">
          <p className="text-xs text-yellow-600">
            <strong>Note:</strong> Hot reload only works in Node.js environments. 
            In browser environments, the feature will be disabled automatically.
          </p>
        </div>
      </div>

      {/* Toast Notifications */}
      <HotReloadNotificationToast position="top-right" />
    </div>
  );
};

/**
 * Compact Hot Reload Demo for integration into other components
 */
export const CompactHotReloadDemo: React.FC<{
  className?: string;
}> = ({ className = '' }) => {
  const hotReload = useHotReload();

  return (
    <div className={`bg-gray-50 rounded-lg p-4 ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-gray-700">Hot Reload</h3>
        <HotReloadStatusIndicator />
      </div>
      
      <HotReloadControl compact={true} showNotifications={false} />
      
      {hotReload.isActive && (
        <div className="mt-2 text-xs text-gray-500">
          Configuration file is being monitored for changes
        </div>
      )}
    </div>
  );
};

export default HotReloadDemo;