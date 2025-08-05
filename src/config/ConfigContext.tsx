/**
 * React配置上下文和Hook
 * 提供类型安全的配置访问和React状态同步
 */

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { AppConfiguration, ConfigContextType, ConfigPath, ConfigValue, ConfigChangeListener } from './types';
import { HotReloadNotificationManager, DisplayNotification } from './hotReloadNotifications';
import { ConfigManager, ConfigLoadResult, createConfigManager } from './ConfigManager';
import { DEFAULT_CONFIG } from './defaultConfig';
import { setGlobalConfig } from './globalConfig';

// 创建配置上下文
const ConfigContext = createContext<ConfigContextType | null>(null);

// 配置提供者组件的属性接口
export interface ConfigProviderProps {
  children: React.ReactNode;
  configManager?: ConfigManager;
  enableHotReload?: boolean;
  enableValidation?: boolean;
  configPath?: string;
  onConfigChange?: (config: AppConfiguration, errors: string[]) => void;
  onValidationError?: (errors: string[], warnings: string[]) => void;
  onFileError?: (error: string, operation: 'load' | 'save') => void;
}

/**
 * 配置提供者组件
 * 管理配置状态和提供配置上下文
 */
export const ConfigProvider: React.FC<ConfigProviderProps> = ({
  children,
  configManager: externalConfigManager,
  enableHotReload = false,
  enableValidation = true,
  configPath = './config.json',
  onConfigChange,
  onValidationError,
  onFileError
}) => {
  // 配置管理器实例
  const configManagerRef = useRef<ConfigManager | null>(null);
  
  // React状态
  const [config, setConfig] = useState<AppConfiguration | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hotReloadNotifications, setHotReloadNotifications] = useState<DisplayNotification[]>([]);
  
  // 初始化配置管理器
  useEffect(() => {
    const initializeConfigManager = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // 使用外部提供的配置管理器或创建新的
        const manager = externalConfigManager || createConfigManager({
          enableHotReload,
          enableValidation,
          configPath,
          onConfigChange: (config, errors) => {
            setConfig(config);
            setGlobalConfig(config); // 更新全局配置
            if (errors.length > 0) {
              setError(errors.join('; '));
            } else {
              setError(null);
            }
            onConfigChange?.(config, errors);
          },
          onValidationError: (errors, warnings) => {
            if (errors.length > 0) {
              setError(errors.join('; '));
            }
            onValidationError?.(errors, warnings);
          },
          onFileError: (error, operation) => {
            setError(`File ${operation} error: ${error}`);
            onFileError?.(error, operation);
          }
        });

        configManagerRef.current = manager;

        // Subscribe to hot reload notifications
        const notificationManager = manager.getNotificationManager();
        notificationManager.subscribe((notification) => {
          setHotReloadNotifications(prev => [notification, ...prev.slice(0, 4)]); // Keep last 5 notifications
        });

        // 初始化配置管理器
        const result: ConfigLoadResult = await manager.initialize();
        
        setConfig(result.config);
        setGlobalConfig(result.config); // 更新全局配置
        
        if (!result.isValid || result.errors.length > 0) {
          setError(result.errors.join('; '));
        } else {
          setError(null);
        }

        setIsLoading(false);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown initialization error';
        setError(errorMessage);
        setIsLoading(false);
      }
    };

    initializeConfigManager();

    // 清理函数
    return () => {
      if (configManagerRef.current) {
        configManagerRef.current.clearListeners();
      }
    };
  }, [externalConfigManager, enableHotReload, enableValidation, configPath, onConfigChange, onValidationError, onFileError]);

  // 更新配置的回调函数
  const updateConfig = useCallback(<P extends ConfigPath<AppConfiguration>>(
    path: P,
    value: ConfigValue<AppConfiguration, P>
  ) => {
    if (!configManagerRef.current) {
      setError('Configuration manager not initialized');
      return;
    }

    try {
      const result = configManagerRef.current.set(path, value);
      
      setConfig(result.config);
      setGlobalConfig(result.config); // 更新全局配置
      
      if (!result.isValid || result.errors.length > 0) {
        setError(result.errors.join('; '));
      } else {
        setError(null);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown update error';
      setError(errorMessage);
    }
  }, []);

  // 重置配置的回调函数
  const resetConfig = useCallback(() => {
    if (!configManagerRef.current) {
      setError('Configuration manager not initialized');
      return;
    }

    try {
      const result = configManagerRef.current.reset();
      
      setConfig(result.config);
      setGlobalConfig(result.config); // 更新全局配置
      
      if (!result.isValid || result.errors.length > 0) {
        setError(result.errors.join('; '));
      } else {
        setError(null);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown reset error';
      setError(errorMessage);
    }
  }, []);

  // 热重载控制函数
  const enableHotReloadFunc = useCallback(async () => {
    if (!configManagerRef.current) {
      return { success: false, error: 'Configuration manager not initialized' };
    }
    return await configManagerRef.current.enableHotReload();
  }, []);

  const disableHotReloadFunc = useCallback(async () => {
    if (!configManagerRef.current) {
      return;
    }
    await configManagerRef.current.disableHotReload();
  }, []);

  const forceHotReloadFunc = useCallback(async () => {
    if (!configManagerRef.current) {
      throw new Error('Configuration manager not initialized');
    }
    await configManagerRef.current.forceHotReload();
  }, []);

  const dismissNotificationFunc = useCallback((id: string) => {
    if (!configManagerRef.current) {
      return false;
    }
    return configManagerRef.current.dismissNotification(id);
  }, []);

  const dismissAllNotificationsFunc = useCallback(() => {
    if (!configManagerRef.current) {
      return;
    }
    configManagerRef.current.dismissAllNotifications();
  }, []);

  // 如果配置还未加载，提供默认配置以避免运行时错误
  const safeConfig = config || DEFAULT_CONFIG;

  // 提供配置上下文
  const contextValue: ConfigContextType = {
    config: safeConfig,
    updateConfig,
    resetConfig,
    isLoading,
    error,
    hotReload: {
      isActive: configManagerRef.current?.isHotReloadActive() ?? false,
      enable: enableHotReloadFunc,
      disable: disableHotReloadFunc,
      forceReload: forceHotReloadFunc,
      notifications: hotReloadNotifications,
      dismissNotification: dismissNotificationFunc,
      dismissAllNotifications: dismissAllNotificationsFunc
    }
  };

  return (
    <ConfigContext.Provider value={contextValue}>
      {children}
    </ConfigContext.Provider>
  );
};

/**
 * 使用配置的Hook
 * 提供类型安全的配置访问
 */
export const useConfig = (): ConfigContextType => {
  const context = useContext(ConfigContext);
  
  if (!context) {
    throw new Error('useConfig must be used within a ConfigProvider');
  }
  
  return context;
};

/**
 * 使用特定配置值的Hook
 * 提供对特定配置路径的类型安全访问
 */
export function useConfigValue<P extends ConfigPath<AppConfiguration>>(
  path: P
): ConfigValue<AppConfiguration, P> {
  const { config } = useConfig();
  
  // 解析配置路径并获取值
  const pathParts = path.split('.');
  let value: any = config;
  
  for (const part of pathParts) {
    if (value && typeof value === 'object' && part in value) {
      value = value[part];
    } else {
      throw new Error(`Configuration path "${path}" not found`);
    }
  }
  
  return value as ConfigValue<AppConfiguration, P>;
}

/**
 * 使用配置更新的Hook
 * 提供配置更新功能的便捷访问
 */
export const useConfigUpdate = () => {
  const { updateConfig, resetConfig } = useConfig();
  
  return {
    updateConfig,
    resetConfig
  };
};

/**
 * 使用配置状态的Hook
 * 提供配置加载状态和错误信息的访问
 */
export const useConfigState = () => {
  const { isLoading, error } = useConfig();
  
  return {
    isLoading,
    error,
    hasError: error !== null
  };
};

/**
 * 使用配置监听的Hook
 * 允许组件监听特定配置路径的变化
 */
export const useConfigListener = (
  path: string,
  callback: (newValue: any, oldValue: any) => void,
  deps: React.DependencyList = []
) => {
  const configManagerRef = useRef<ConfigManager | null>(null);
  
  // 获取配置管理器的引用
  useEffect(() => {
    // 这里我们需要从ConfigProvider中获取配置管理器的引用
    // 由于React Context的限制，我们需要通过其他方式获取
    // 在实际实现中，可以考虑将配置管理器也放入Context中
  }, []);

  useEffect(() => {
    if (!configManagerRef.current) {
      return;
    }

    const listener: ConfigChangeListener = (changedPath, newValue, oldValue) => {
      if (changedPath === path || changedPath.startsWith(path + '.')) {
        callback(newValue, oldValue);
      }
    };

    const unsubscribe = configManagerRef.current.subscribe(listener);
    
    return unsubscribe;
  }, [path, callback, ...deps]);
};

/**
 * 使用应用配置的Hook
 * 提供对应用核心配置的便捷访问
 */
export const useAppConfig = () => {
  return useConfigValue('app');
};

/**
 * 使用UI配置的Hook
 * 提供对UI配置的便捷访问
 */
export const useUIConfig = () => {
  return useConfigValue('ui');
};

/**
 * 使用性能配置的Hook
 * 提供对性能配置的便捷访问
 */
export const usePerformanceConfig = () => {
  return useConfigValue('performance');
};

/**
 * 使用开发配置的Hook
 * 提供对开发配置的便捷访问
 */
export const useDevelopmentConfig = () => {
  return useConfigValue('development');
};

/**
 * 使用热重载功能的Hook
 * 提供热重载控制和状态访问
 */
export const useHotReload = () => {
  const { hotReload } = useConfig();
  return hotReload;
};

/**
 * 使用热重载通知的Hook
 * 提供热重载通知的访问和管理
 */
export const useHotReloadNotifications = () => {
  const { hotReload } = useConfig();
  
  return {
    notifications: hotReload.notifications,
    dismiss: hotReload.dismissNotification,
    dismissAll: hotReload.dismissAllNotifications
  };
};

/**
 * 使用热重载控制的Hook
 * 提供热重载的启用/禁用控制
 */
export const useHotReloadControl = () => {
  const { hotReload } = useConfig();
  
  return {
    isActive: hotReload.isActive,
    enable: hotReload.enable,
    disable: hotReload.disable,
    forceReload: hotReload.forceReload
  };
};

/**
 * 高阶组件：为组件提供配置
 * 用于类组件或需要配置注入的场景
 */
export function withConfig<P extends object>(
  Component: React.ComponentType<P & { config: AppConfiguration }>
): React.ComponentType<P> {
  return function ConfiguredComponent(props: P) {
    const { config } = useConfig();
    
    return <Component {...props} config={config} />;
  };
}

/**
 * 配置加载组件属性接口
 */
export interface ConfigLoadingProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  errorFallback?: (error: string) => React.ReactNode;
}

export const ConfigLoading: React.FC<ConfigLoadingProps> = ({
  children,
  fallback = <div>Loading configuration...</div>,
  errorFallback = (error) => <div>Configuration error: {error}</div>
}) => {
  const { isLoading, error } = useConfigState();
  
  if (isLoading) {
    return <>{fallback}</>;
  }
  
  if (error) {
    return <>{errorFallback(error)}</>;
  }
  
  return <>{children}</>;
};

// 导出配置上下文以供高级用法
export { ConfigContext };