/**
 * 配置系统类型定义
 * 定义完整的配置接口类型，包括应用配置、UI配置、性能配置和开发配置
 */

// 应用核心配置
export interface AppConfig {
  points: {
    min: number;
    max: number;
    step: number;
    default: number;
  };
  paths: {
    maxCount: number;
  };
  canvas: {
    aspectRatio: number;
    defaultWidth: number;
    defaultHeight: number;
  };
}

// UI和视觉配置
export interface UIConfig {
  colors: {
    base: {
      alpha1: string;
      alpha2: string;
      alpha3: string;
    };
    highlight: string[];
    axis: string;
  };
  animations: {
    transitionDuration: number;
    debounceDelay: number;
    animationEasing: string;
  };
  notifications: {
    defaultDuration: number;
    successDuration: number;
    errorDuration: number;
    warningDuration: number;
    infoDuration: number;
    maxCount: number;
  };
  layout: {
    breakpoints: {
      mobile: number;
      tablet: number;
      desktop: number;
    };
    panelWidths: {
      control: number;
      data: number;
      minCanvas: number;
    };
  };
  external: {
    links: {
      liuTheorem: {
        url: string;
        icon: string;
        target: string;
        rel: string;
      };
      github: {
        url: string;
        icon: string;
        target: string;
        rel: string;
      };
    };
    iconSizes: {
      sm: string;
      md: string;
      lg: string;
    };
  };
}

// 性能和缓存配置
export interface PerformanceConfig {
  cache: {
    maxSize: number;
    defaultTTL: number;
    partitionCacheSize: number;
  };
  rendering: {
    webgl: {
      pointSize: number;
      maxPointSize: number;
      lineWidth: number;
    };
    canvas2d: {
      lineWidth: number;
      pointRadius: number;
    };
  };
  performance: {
    benchmarkThresholds: {
      fast: number;
      medium: number;
      slow: number;
    };
    batchSizes: {
      pathGeneration: number;
      rendering: number;
    };
  };
}

// 开发和测试配置
export interface DevelopmentConfig {
  testIds: Record<string, string>;
  debug: {
    enabled: boolean;
    logLevel: 'error' | 'warn' | 'info' | 'debug';
    showPerformanceMetrics: boolean;
  };
  features: {
    hotReload: boolean;
    configValidation: boolean;
    typeChecking: boolean;
  };
  language: {
    defaultLanguage: 'en' | 'zh';
    storageKey: string;
    supportedLanguages: readonly ('en' | 'zh')[];
  };
}

// 完整配置接口
export interface AppConfiguration {
  app: AppConfig;
  ui: UIConfig;
  performance: PerformanceConfig;
  development: DevelopmentConfig;
  version: string;
  lastModified: string;
}

// 配置路径类型安全的工具类型
export type ConfigPath<T, K extends keyof T = keyof T> = K extends string
  ? T[K] extends Record<string, any>
    ? `${K}.${ConfigPath<T[K]>}`
    : K
  : never;

// 根据路径获取配置值类型
export type ConfigValue<T, P extends string> = P extends `${infer K}.${infer Rest}`
  ? K extends keyof T
    ? ConfigValue<T[K], Rest>
    : never
  : P extends keyof T
  ? T[P]
  : never;

// 配置变化监听器类型
export interface ConfigChangeListener {
  (path: string, newValue: any, oldValue: any): void;
}

// 配置验证结果类型
export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

export interface ValidationError {
  path: string;
  message: string;
  value: any;
}

// 配置验证规则类型
export interface ValidationRule {
  path: string;
  type: 'number' | 'string' | 'boolean' | 'array' | 'object';
  required?: boolean;
  min?: number;
  max?: number;
  pattern?: RegExp;
  validator?: (value: any) => boolean;
  message?: string;
}

// 配置上下文类型
export interface ConfigContextType {
  config: AppConfiguration;
  updateConfig: <P extends ConfigPath<AppConfiguration>>(
    path: P,
    value: ConfigValue<AppConfiguration, P>
  ) => void;
  resetConfig: () => void;
  isLoading: boolean;
  error: string | null;
  hotReload: {
    isActive: boolean;
    enable: () => Promise<{ success: boolean; error?: string }>;
    disable: () => Promise<void>;
    forceReload: () => Promise<void>;
    notifications: any[]; // DisplayNotification[] - avoiding circular import
    dismissNotification: (id: string) => boolean;
    dismissAllNotifications: () => void;
  };
}

// 配置管理器选项类型
export interface ConfigManagerOptions {
  configPath?: string;
  enableHotReload?: boolean;
  enableValidation?: boolean;
  autoSave?: boolean;
}