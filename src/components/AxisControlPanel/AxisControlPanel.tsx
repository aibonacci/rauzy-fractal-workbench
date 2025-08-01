/**
 * 坐标轴控制面板组件
 * 提供坐标轴、标签和网格的开关控制
 */

import React from 'react';
import { AxisSettings } from '../../utils/webgl-axis-renderer';

interface AxisControlPanelProps {
  settings: AxisSettings;
  onSettingsChange: (settings: AxisSettings) => void;
  disabled?: boolean;
}

const AxisControlPanel: React.FC<AxisControlPanelProps> = ({ 
  settings, 
  onSettingsChange,
  disabled = false
}) => {
  const handleToggleAxes = (checked: boolean) => {
    onSettingsChange({
      ...settings,
      showAxes: checked
    });
  };

  const handleToggleLabels = (checked: boolean) => {
    onSettingsChange({
      ...settings,
      showLabels: checked
    });
  };

  const handleToggleGrid = (checked: boolean) => {
    onSettingsChange({
      ...settings,
      showGrid: checked
    });
  };

  return (
    <div 
      className="axis-control-panel bg-gray-800 rounded-lg p-4 mb-4" 
      data-testid="axis-control-panel"
    >
      <h3 className="text-white text-sm font-medium mb-3 flex items-center">
        <span className="mr-2">📐</span>
        坐标轴设置
      </h3>
      
      <div className="space-y-3">
        {/* 坐标轴开关 */}
        <div className="flex items-center">
          <label className="flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={settings.showAxes}
              onChange={(e) => handleToggleAxes(e.target.checked)}
              disabled={disabled}
              data-testid="show-axes-checkbox"
              className="sr-only"
            />
            <div className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
              settings.showAxes 
                ? 'bg-blue-600' 
                : 'bg-gray-600'
            } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}>
              <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                settings.showAxes ? 'translate-x-5' : 'translate-x-1'
              }`} />
            </div>
            <span className={`ml-3 text-sm ${
              settings.showAxes ? 'text-white' : 'text-gray-400'
            } ${disabled ? 'opacity-50' : ''}`}>
              显示坐标轴
            </span>
          </label>
        </div>

        {/* 数值标签开关 */}
        <div className="flex items-center">
          <label className="flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={settings.showLabels}
              onChange={(e) => handleToggleLabels(e.target.checked)}
              disabled={disabled || !settings.showAxes}
              data-testid="show-labels-checkbox"
              className="sr-only"
            />
            <div className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
              settings.showLabels && settings.showAxes
                ? 'bg-green-600' 
                : 'bg-gray-600'
            } ${disabled || !settings.showAxes ? 'opacity-50 cursor-not-allowed' : ''}`}>
              <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                settings.showLabels && settings.showAxes ? 'translate-x-5' : 'translate-x-1'
              }`} />
            </div>
            <span className={`ml-3 text-sm ${
              settings.showLabels && settings.showAxes ? 'text-white' : 'text-gray-400'
            } ${disabled || !settings.showAxes ? 'opacity-50' : ''}`}>
              显示数值标签
            </span>
          </label>
        </div>

        {/* 网格线开关 */}
        <div className="flex items-center">
          <label className="flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={settings.showGrid}
              onChange={(e) => handleToggleGrid(e.target.checked)}
              disabled={disabled || !settings.showAxes}
              data-testid="show-grid-checkbox"
              className="sr-only"
            />
            <div className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
              settings.showGrid && settings.showAxes
                ? 'bg-purple-600' 
                : 'bg-gray-600'
            } ${disabled || !settings.showAxes ? 'opacity-50 cursor-not-allowed' : ''}`}>
              <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                settings.showGrid && settings.showAxes ? 'translate-x-5' : 'translate-x-1'
              }`} />
            </div>
            <span className={`ml-3 text-sm ${
              settings.showGrid && settings.showAxes ? 'text-white' : 'text-gray-400'
            } ${disabled || !settings.showAxes ? 'opacity-50' : ''}`}>
              显示网格线
            </span>
          </label>
        </div>
      </div>

      {/* 状态指示 */}
      <div className="mt-4 pt-3 border-t border-gray-700">
        <div className="flex items-center text-xs text-gray-400">
          <span className="mr-2">ℹ️</span>
          <span>
            {settings.showAxes 
              ? `坐标轴已启用 ${settings.showLabels ? '• 标签' : ''} ${settings.showGrid ? '• 网格' : ''}`
              : '坐标轴已禁用'
            }
          </span>
        </div>
      </div>
    </div>
  );
};

export default AxisControlPanel;