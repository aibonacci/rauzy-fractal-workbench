/**
 * 配置系统入口文件
 * 导出所有配置相关的类型、默认值和工具函数
 */

// 类型定义
export type {
  AppConfig,
  UIConfig,
  PerformanceConfig,
  DevelopmentConfig,
  AppConfiguration,
  ConfigPath,
  ConfigValue,
  ConfigChangeListener,
  ValidationResult,
  ValidationError,
  ValidationRule,
  ConfigContextType,
  ConfigManagerOptions
} from './types';

// 默认配置
export {
  DEFAULT_CONFIG,
  DEFAULT_APP_CONFIG,
  DEFAULT_UI_CONFIG,
  DEFAULT_PERFORMANCE_CONFIG,
  DEFAULT_DEVELOPMENT_CONFIG
} from './defaultConfig';

// 配置管理器
export {
  ConfigManager,
  configManager,
  createConfigManager
} from './ConfigManager';

// React配置上下文和Hook
export {
  ConfigProvider,
  ConfigContext,
  ConfigLoading,
  useConfig,
  useConfigValue,
  useConfigUpdate,
  useConfigState,
  useConfigListener,
  useAppConfig,
  useUIConfig,
  usePerformanceConfig,
  useDevelopmentConfig,
  withConfig
} from './ConfigContext';

export type {
  ConfigProviderProps,
  ConfigLoadingProps
} from './ConfigContext';

// 工具函数
export {
  getConfigValue,
  setConfigValue,
  deepClone,
  mergeConfig,
  hasConfigPath,
  getConfigPaths,
  TypeConverters,
  compareConfigs,
  isInRange,
  clampValue
} from './utils';

// 全局配置
export {
  setGlobalConfig,
  getGlobalConfig,
  getConfigValue as getGlobalConfigValue,
  initializeGlobalConfig
} from './globalConfig';