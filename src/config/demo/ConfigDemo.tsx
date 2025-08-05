/**
 * 配置系统演示组件
 * 展示如何使用React配置上下文和Hook
 */

import React from 'react';
import { 
  ConfigProvider, 
  ConfigLoading, 
  useConfig, 
  useAppConfig, 
  useUIConfig, 
  useConfigValue,
  useConfigUpdate,
  useConfigState
} from '../ConfigContext';
import { createConfigManager } from '../ConfigManager';
import { CompactHotReloadDemo } from './HotReloadDemo';

// 演示组件：显示配置信息
const ConfigDisplay: React.FC = () => {
  const appConfig = useAppConfig();
  const uiConfig = useUIConfig();
  const pointsMin = useConfigValue('app.points.min');
  
  return (
    <div className="p-4 border rounded-lg">
      <h3 className="text-lg font-semibold mb-4">当前配置信息</h3>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <h4 className="font-medium mb-2">应用配置</h4>
          <ul className="text-sm space-y-1">
            <li>点数最小值: {pointsMin}</li>
            <li>点数最大值: {appConfig.points.max}</li>
            <li>路径最大数量: {appConfig.paths.maxCount}</li>
            <li>画布宽高比: {appConfig.canvas.aspectRatio}</li>
          </ul>
        </div>
        
        <div>
          <h4 className="font-medium mb-2">UI配置</h4>
          <ul className="text-sm space-y-1">
            <li>过渡动画时长: {uiConfig.animations.transitionDuration}ms</li>
            <li>防抖延迟: {uiConfig.animations.debounceDelay}ms</li>
            <li>通知默认时长: {uiConfig.notifications.defaultDuration}ms</li>
            <li>坐标轴颜色: {uiConfig.colors.axis}</li>
          </ul>
        </div>
      </div>
      
      <div className="mt-4">
        <h4 className="font-medium mb-2">高亮颜色</h4>
        <div className="flex space-x-2">
          {uiConfig.colors.highlight.map((color: string, index: number) => (
            <div
              key={index}
              className="w-6 h-6 rounded border"
              style={{ backgroundColor: color }}
              title={color}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

// 演示组件：配置更新控制
const ConfigControls: React.FC = () => {
  const { updateConfig, resetConfig } = useConfigUpdate();
  const { isLoading, error, hasError } = useConfigState();
  
  const handleUpdatePointsMin = () => {
    updateConfig('app.points.min', 20000);
  };
  
  const handleUpdateAnimationDuration = () => {
    updateConfig('ui.animations.transitionDuration', 500);
  };
  
  const handleResetConfig = () => {
    resetConfig();
  };
  
  return (
    <div className="p-4 border rounded-lg">
      <h3 className="text-lg font-semibold mb-4">配置控制</h3>
      
      {hasError && (
        <div className="mb-4 p-2 bg-red-100 border border-red-300 rounded text-red-700">
          错误: {error}
        </div>
      )}
      
      <div className="space-y-2">
        <button
          onClick={handleUpdatePointsMin}
          disabled={isLoading}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
        >
          设置点数最小值为 20000
        </button>
        
        <button
          onClick={handleUpdateAnimationDuration}
          disabled={isLoading}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
        >
          设置动画时长为 500ms
        </button>
        
        <button
          onClick={handleResetConfig}
          disabled={isLoading}
          className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 disabled:opacity-50"
        >
          重置为默认配置
        </button>
      </div>
      
      {isLoading && (
        <div className="mt-2 text-sm text-gray-600">
          配置更新中...
        </div>
      )}
    </div>
  );
};

// 主演示组件
const ConfigDemoContent: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold mb-6">配置系统演示</h1>
      
      <ConfigDisplay />
      <ConfigControls />
      <CompactHotReloadDemo className="mt-6" />
      
      <div className="p-4 border rounded-lg bg-gray-50">
        <h3 className="text-lg font-semibold mb-2">使用说明</h3>
        <ul className="text-sm space-y-1">
          <li>• 使用 <code>useConfig()</code> 获取完整配置和更新函数</li>
          <li>• 使用 <code>useAppConfig()</code>, <code>useUIConfig()</code> 等获取特定配置部分</li>
          <li>• 使用 <code>useConfigValue('path')</code> 获取特定配置值</li>
          <li>• 使用 <code>useConfigUpdate()</code> 获取配置更新函数</li>
          <li>• 使用 <code>useConfigState()</code> 获取加载状态和错误信息</li>
        </ul>
      </div>
    </div>
  );
};

// 完整的演示组件，包含ConfigProvider
export const ConfigDemo: React.FC = () => {
  // 创建配置管理器实例
  const configManager = createConfigManager({
    enableValidation: true,
    enableHotReload: true, // Enable hot reload for demo
    configPath: './demo-config.json'
  });
  
  return (
    <ConfigProvider 
      configManager={configManager}
      onConfigChange={(config, errors) => {
        console.log('配置已更新:', config);
        if (errors.length > 0) {
          console.error('配置错误:', errors);
        }
      }}
      onValidationError={(errors, warnings) => {
        console.error('验证错误:', errors);
        console.warn('验证警告:', warnings);
      }}
      onFileError={(error, operation) => {
        console.error(`文件${operation}错误:`, error);
      }}
    >
      <ConfigLoading
        fallback={
          <div className="flex items-center justify-center h-64">
            <div className="text-lg">加载配置中...</div>
          </div>
        }
        errorFallback={(error) => (
          <div className="flex items-center justify-center h-64">
            <div className="text-red-600">配置加载失败: {error}</div>
          </div>
        )}
      >
        <ConfigDemoContent />
      </ConfigLoading>
    </ConfigProvider>
  );
};

export default ConfigDemo;