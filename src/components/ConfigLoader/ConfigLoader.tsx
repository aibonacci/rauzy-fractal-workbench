/**
 * 配置加载组件
 * 处理配置系统的初始化和加载状态
 */
import React, { useEffect, useState } from 'react';
import { ConfigManager } from '../../config/ConfigManager';
import { SkeletonLoader } from '../SkeletonLoader';

interface ConfigLoaderProps {
  configManager: ConfigManager;
  children: React.ReactNode;
}

interface LoadingState {
  isLoading: boolean;
  progress: number;
  message: string;
  error: string | null;
}

export const ConfigLoader: React.FC<ConfigLoaderProps> = ({ 
  configManager, 
  children 
}) => {
  const [loadingState, setLoadingState] = useState<LoadingState>({
    isLoading: true,
    progress: 0,
    message: '正在初始化配置系统...',
    error: null
  });

  useEffect(() => {
    const initializeConfig = async () => {
      try {
        setLoadingState(prev => ({
          ...prev,
          progress: 20,
          message: '正在加载配置文件...'
        }));

        // 初始化配置管理器
        const result = await configManager.initialize();

        setLoadingState(prev => ({
          ...prev,
          progress: 60,
          message: '正在验证配置...'
        }));

        // 检查配置是否有效
        if (!result.isValid && result.errors.length > 0) {
          console.warn('配置验证失败，使用默认配置:', result.errors);
          setLoadingState(prev => ({
            ...prev,
            progress: 80,
            message: '配置验证失败，使用默认配置...'
          }));
        } else {
          setLoadingState(prev => ({
            ...prev,
            progress: 80,
            message: '配置加载成功...'
          }));
        }

        // 如果创建了默认配置文件，显示提示
        if (result.isDefaultCreated) {
          console.info('已创建默认配置文件');
        }

        // 如果从备份恢复，显示提示
        if (result.backupRestored) {
          console.info('已从备份恢复配置');
        }

        setLoadingState(prev => ({
          ...prev,
          progress: 100,
          message: '配置系统初始化完成'
        }));

        // 短暂延迟后完成加载
        setTimeout(() => {
          setLoadingState(prev => ({
            ...prev,
            isLoading: false
          }));
        }, 500);

      } catch (error) {
        console.error('配置系统初始化失败:', error);
        
        setLoadingState({
          isLoading: false,
          progress: 0,
          message: '',
          error: error instanceof Error ? error.message : '配置系统初始化失败'
        });
      }
    };

    initializeConfig();
  }, [configManager]);

  // 显示加载界面
  if (loadingState.isLoading) {
    return (
      <SkeletonLoader
        show={true}
        progress={loadingState.progress}
        message={loadingState.message}
      />
    );
  }

  // 显示错误界面
  if (loadingState.error) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="bg-red-900 border border-red-700 rounded-lg p-6 max-w-md mx-4">
          <div className="flex items-center mb-4">
            <div className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center mr-3">
              <span className="text-white font-bold">!</span>
            </div>
            <h2 className="text-red-100 text-lg font-semibold">配置系统错误</h2>
          </div>
          <p className="text-red-200 mb-4">{loadingState.error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded transition-colors"
          >
            重新加载
          </button>
        </div>
      </div>
    );
  }

  // 配置加载成功，渲染子组件
  return <>{children}</>;
};

export default ConfigLoader;