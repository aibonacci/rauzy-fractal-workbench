# 配置系统 API 参考

## 目录

- [ConfigManager](#configmanager)
- [ConfigProvider & useConfig](#configprovider--useconfig)
- [配置工具函数](#配置工具函数)
- [错误处理](#错误处理)
- [验证系统](#验证系统)
- [热重载](#热重载)
- [测试工具](#测试工具)

## ConfigManager

配置管理器是配置系统的核心类，负责配置的加载、保存、验证和管理。

### 构造函数

```typescript
interface ConfigManagerOptions {
  enableValidation?: boolean;
  enableHotReload?: boolean;
  configPath?: string;
  createBackup?: boolean;
  backupExtension?: string;
  formatJson?: boolean;
  jsonIndent?: number;
  onConfigChange?: (config: AppConfiguration, errors: string[]) => void;
  onValidationError?: (errors: string[], warnings: string[]) => void;
  onFileError?: (error: string, operation: 'load' | 'save') => void;
}

const configManager = new ConfigManager(options?: ConfigManagerOptions);
```

#### 参数说明

- `enableValidation`: 是否启用配置验证 (默认: true)
- `enableHotReload`: 是否启用热重载 (默认: false)
- `configPath`: 配置文件路径 (默认: './config.json')
- `createBackup`: 是否创建备份文件 (默认: true)
- `backupExtension`: 备份文件扩展名 (默认: '.backup')
- `formatJson`: 是否格式化JSON输出 (默认: true)
- `jsonIndent`: JSON缩进空格数 (默认: 2)
- `onConfigChange`: 配置变化回调函数
- `onValidationError`: 验证错误回调函数
- `onFileError`: 文件操作错误回调函数

### 工厂函数

```typescript
function createConfigManager(options?: ConfigManagerOptions): ConfigManager;
```

推荐使用工厂函数创建配置管理器实例。

### 核心方法

#### initialize()

初始化配置管理器，加载配置文件。

```typescript
async initialize(): Promise<ConfigLoadResult>

interface ConfigLoadResult {
  config: AppConfiguration;
  isValid: boolean;
  errors: string[];
  warnings: string[];
  isDefaultCreated?: boolean;
  backupRestored?: boolean;
}
```

**示例:**
```typescript
const result = await configManager.initialize();
if (result.isValid) {
  console.log('配置加载成功');
} else {
  console.error('配置加载失败:', result.errors);
}
```

#### getConfig()

获取当前完整配置对象。

```typescript
getConfig(): AppConfiguration
```

**示例:**
```typescript
const config = configManager.getConfig();
console.log('当前配置:', config);
```

#### get()

获取指定路径的配置值。

```typescript
get<T = any>(path: string): T | undefined
```

**示例:**
```typescript
const minPoints = configManager.get<number>('app.points.min');
const primaryColor = configManager.get<string>('ui.colors.primary');
```

#### set()

设置指定路径的配置值。

```typescript
set<T = any>(path: string, value: T): ConfigLoadResult
```

**示例:**
```typescript
const result = configManager.set('app.points.min', 200);
if (result.isValid) {
  console.log('配置更新成功');
}
```

#### update()

批量更新配置。

```typescript
update(updates: Partial<AppConfiguration>): ConfigLoadResult
```

**示例:**
```typescript
const result = configManager.update({
  app: {
    points: { min: 200, max: 2000 }
  },
  ui: {
    theme: 'light'
  }
});
```

#### save()

保存配置到文件。

```typescript
async save(filePath?: string): Promise<{
  success: boolean;
  error?: string;
  backupCreated?: boolean;
  backupPath?: string;
}>
```

**示例:**
```typescript
const result = await configManager.save();
if (result.success) {
  console.log('配置保存成功');
  if (result.backupCreated) {
    console.log('备份文件:', result.backupPath);
  }
}
```

#### validate()

验证当前配置。

```typescript
validate(): ValidationResult

interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
}
```

#### reset()

重置配置到默认值。

```typescript
reset(): ConfigLoadResult
```

#### subscribe()

订阅配置变化。

```typescript
subscribe(listener: ConfigChangeListener): () => void

type ConfigChangeListener = (path: string, newValue: any, oldValue: any) => void;
```

**示例:**
```typescript
const unsubscribe = configManager.subscribe((path, newValue, oldValue) => {
  console.log(`配置 ${path} 从 ${oldValue} 变更为 ${newValue}`);
});

// 取消订阅
unsubscribe();
```

### 热重载方法

#### enableHotReload()

启用热重载功能。

```typescript
async enableHotReload(): Promise<{ success: boolean; error?: string }>
```

#### disableHotReload()

禁用热重载功能。

```typescript
async disableHotReload(): Promise<void>
```

#### isHotReloadActive()

检查热重载是否激活。

```typescript
isHotReloadActive(): boolean
```

#### forceHotReload()

强制触发热重载。

```typescript
async forceHotReload(): Promise<void>
```

### 通知方法

#### showNotification()

显示通知。

```typescript
showNotification(type: 'success' | 'error' | 'info', message: string): string
```

#### dismissNotification()

关闭指定通知。

```typescript
dismissNotification(id: string): boolean
```

#### dismissAllNotifications()

关闭所有通知。

```typescript
dismissAllNotifications(): void
```

### 错误处理方法

#### getErrorReports()

获取错误报告。

```typescript
getErrorReports(): {
  total: number;
  recent: any[];
  all: any[];
}
```

#### clearErrorReports()

清除错误报告。

```typescript
clearErrorReports(): void
```

#### exportErrorReports()

导出错误报告。

```typescript
exportErrorReports(): string
```

### 元数据方法

#### getMetadata()

获取配置元数据。

```typescript
getMetadata(): {
  version: string;
  lastModified: string;
  isValid: boolean;
  hasErrors: boolean;
  hasWarnings: boolean;
}
```

#### isReady()

检查配置管理器是否已初始化。

```typescript
isReady(): boolean
```

#### dispose()

清理资源。

```typescript
async dispose(): Promise<void>
```

## ConfigProvider & useConfig

React上下文提供器和Hook，用于在组件中访问配置。

### ConfigProvider

```typescript
interface ConfigProviderProps {
  configManager: ConfigManager;
  children: React.ReactNode;
}

const ConfigProvider: React.FC<ConfigProviderProps>;
```

**示例:**
```typescript
<ConfigProvider configManager={configManager}>
  <App />
</ConfigProvider>
```

### useConfig

```typescript
interface ConfigContextType {
  config: AppConfiguration;
  isLoading: boolean;
  error: string | null;
  updateConfig: (updates: Partial<AppConfiguration>) => Promise<boolean>;
  resetConfig: () => Promise<boolean>;
}

function useConfig(): ConfigContextType;
```

**示例:**
```typescript
function MyComponent() {
  const { config, isLoading, updateConfig } = useConfig();
  
  if (isLoading) {
    return <div>加载配置中...</div>;
  }
  
  const handleUpdateTheme = async () => {
    await updateConfig({
      ui: { theme: 'light' }
    });
  };
  
  return (
    <div style={{ backgroundColor: config.ui.colors.background }}>
      <button onClick={handleUpdateTheme}>切换主题</button>
    </div>
  );
}
```

## 配置工具函数

位于 `src/config/utils.ts` 的工具函数集合。

### 配置访问

#### getConfigValue()

获取配置值。

```typescript
function getConfigValue<T>(config: AppConfiguration, path: ConfigPath): T | undefined;
```

#### setConfigValue()

设置配置值。

```typescript
function setConfigValue<T>(config: AppConfiguration, path: ConfigPath, value: T): AppConfiguration;
```

#### getConfigPaths()

获取所有配置路径。

```typescript
function getConfigPaths(config: AppConfiguration): string[];
```

### 配置操作

#### mergeConfig()

合并配置对象。

```typescript
function mergeConfig(base: any, override: any): any;
```

#### deepClone()

深拷贝配置对象。

```typescript
function deepClone<T>(obj: T): T;
```

#### compareConfigs()

比较两个配置对象的差异。

```typescript
function compareConfigs(
  config1: AppConfiguration,
  config2: AppConfiguration
): { added: string[]; removed: string[]; changed: string[] };
```

### 配置验证

#### validateConfigValueType()

验证配置值类型。

```typescript
function validateConfigValueType(value: any, expectedType: string): boolean;
```

#### validateConfigValueRange()

验证配置值范围。

```typescript
function validateConfigValueRange(value: number, min?: number, max?: number): boolean;
```

### 类型转换

#### configValueToString()

转换配置值为字符串。

```typescript
function configValueToString(value: any): string;
```

#### configValueToNumber()

转换配置值为数字。

```typescript
function configValueToNumber(value: any, defaultValue?: number): number;
```

#### configValueToBoolean()

转换配置值为布尔值。

```typescript
function configValueToBoolean(value: any, defaultValue?: boolean): boolean;
```

### 导入导出

#### exportConfigToJson()

导出配置为JSON字符串。

```typescript
function exportConfigToJson(config: AppConfiguration, pretty?: boolean): string;
```

#### importConfigFromJson()

从JSON字符串导入配置。

```typescript
function importConfigFromJson(jsonString: string): Partial<AppConfiguration>;
```

### 调试工具

#### isDebugEnabled()

检查是否启用调试模式。

```typescript
function isDebugEnabled(config: AppConfiguration): boolean;
```

#### isFeatureEnabled()

检查功能开关是否启用。

```typescript
function isFeatureEnabled(config: AppConfiguration, feature: string): boolean;
```

#### getLogLevel()

获取日志级别。

```typescript
function getLogLevel(config: AppConfiguration): string;
```

### 测试ID工具

#### getTestId()

获取测试ID。

```typescript
function getTestId(config: AppConfiguration, testIdKey: string): string;
```

#### getAllTestIds()

获取所有测试ID。

```typescript
function getAllTestIds(config: AppConfiguration): Record<string, string>;
```

## 错误处理

配置系统的错误处理机制。

### ConfigError

配置错误类。

```typescript
enum ConfigErrorType {
  LOAD_FAILED = 'LOAD_FAILED',
  VALIDATION_FAILED = 'VALIDATION_FAILED',
  SAVE_FAILED = 'SAVE_FAILED',
  ACCESS_FAILED = 'ACCESS_FAILED',
  PARSE_FAILED = 'PARSE_FAILED',
  NETWORK_FAILED = 'NETWORK_FAILED',
  PERMISSION_DENIED = 'PERMISSION_DENIED'
}

class ConfigError extends Error {
  public readonly type: ConfigErrorType;
  public readonly originalError?: Error;
  public readonly context?: Record<string, any>;
}
```

### 错误恢复策略

#### ErrorRecoveryStrategy

错误恢复策略接口。

```typescript
interface ErrorRecoveryStrategy {
  canHandle(error: ConfigError): boolean;
  recover(error: ConfigError, context?: any): Promise<AppConfiguration | null>;
}
```

#### 内置策略

- `DefaultValueFallbackStrategy`: 默认值回退策略
- `RetryStrategy`: 重试策略
- `CacheFallbackStrategy`: 缓存回退策略

### 错误处理函数

#### withErrorHandling()

包装操作以提供错误处理。

```typescript
async function withErrorHandling<T>(
  operation: () => Promise<T>,
  errorType: ConfigErrorType,
  context?: Record<string, any>
): Promise<T>;
```

#### getUserFriendlyErrorMessage()

获取用户友好的错误消息。

```typescript
function getUserFriendlyErrorMessage(error: ConfigError): string;
```

## 验证系统

配置验证系统的API。

### ValidationRule

验证规则接口。

```typescript
interface ValidationRule {
  path: string;
  validate: (value: any, config: AppConfiguration) => ValidationResult;
  message?: string;
}
```

### ConfigValidator

配置验证器类。

```typescript
class ConfigValidator {
  addRule(rule: ValidationRule): void;
  removeRule(path: string): void;
  validate(config: AppConfiguration): ValidationResult;
  createReport(result: ValidationResult): string;
}
```

### 验证函数

#### validateConfiguration()

验证完整配置。

```typescript
function validateConfiguration(config: AppConfiguration): ValidationResult;
```

#### createConfigValidator()

创建配置验证器。

```typescript
function createConfigValidator(): ConfigValidator;
```

## 热重载

热重载功能的API。

### ConfigHotReloader

热重载器类。

```typescript
interface HotReloadOptions {
  configPath: string;
  debounceDelay?: number;
  enableNotifications?: boolean;
  onReloadSuccess?: (config: AppConfiguration) => void;
  onReloadError?: (error: string) => void;
  onFileChange?: (path: string) => void;
}

class ConfigHotReloader {
  constructor(options: HotReloadOptions);
  start(): Promise<{ success: boolean; error?: string }>;
  stop(): Promise<void>;
  isActive(): boolean;
  forceReload(): Promise<void>;
  subscribe(callback: (notification: HotReloadNotification) => void): void;
  getStatus(): HotReloadStatus;
}
```

### 热重载通知

#### HotReloadNotification

```typescript
interface HotReloadNotification {
  type: 'success' | 'error' | 'info';
  message: string;
  timestamp: Date;
}
```

#### HotReloadNotificationManager

```typescript
class HotReloadNotificationManager {
  show(notification: HotReloadNotification): string;
  dismiss(id: string): boolean;
  dismissAll(): void;
  getStats(): NotificationStats;
}
```

## 测试工具

用于测试的Hook和工具函数。

### useTestId

获取单个测试ID的Hook。

```typescript
function useTestId(testIdKey: string): string;
```

**示例:**
```typescript
function MyComponent() {
  const pathInputId = useTestId('PATH_INPUT');
  
  return <input data-testid={pathInputId} />;
}
```

### useTestIds

获取所有测试ID的Hook。

```typescript
function useTestIds(): Record<string, string>;
```

### useMultipleTestIds

获取多个测试ID的Hook。

```typescript
function useMultipleTestIds(testIdKeys: string[]): Record<string, string>;
```

**示例:**
```typescript
function MyComponent() {
  const testIds = useMultipleTestIds(['PATH_INPUT', 'ADD_PATH_BUTTON']);
  
  return (
    <div>
      <input data-testid={testIds.PATH_INPUT} />
      <button data-testid={testIds.ADD_PATH_BUTTON}>添加</button>
    </div>
  );
}
```

## 类型定义

### AppConfiguration

完整的应用配置类型定义。

```typescript
interface AppConfiguration {
  version: string;
  lastModified: string;
  app: AppConfig;
  ui: UIConfig;
  performance: PerformanceConfig;
  development: DevelopmentConfig;
}
```

### ConfigPath

配置路径类型。

```typescript
type ConfigPath = 
  | 'app.points.min'
  | 'app.points.max'
  | 'app.points.default'
  | 'ui.theme'
  | 'ui.colors.primary'
  // ... 更多路径
```

### 配置子类型

详细的配置子类型定义请参考 `src/config/types.ts` 文件。

## 使用示例

### 基本使用

```typescript
import { createConfigManager } from './config/ConfigManager';
import { ConfigProvider, useConfig } from './config/ConfigContext';

// 创建配置管理器
const configManager = createConfigManager({
  enableValidation: true,
  enableHotReload: process.env.NODE_ENV === 'development'
});

// 在应用根部使用Provider
function App() {
  return (
    <ConfigProvider configManager={configManager}>
      <MyComponent />
    </ConfigProvider>
  );
}

// 在组件中使用配置
function MyComponent() {
  const { config, updateConfig } = useConfig();
  
  return (
    <div style={{ backgroundColor: config.ui.colors.background }}>
      <h1>点数: {config.app.points.default}</h1>
      <button onClick={() => updateConfig({ ui: { theme: 'light' } })}>
        切换主题
      </button>
    </div>
  );
}
```

### 高级使用

```typescript
import { 
  createConfigManager,
  withErrorHandling,
  ConfigErrorType 
} from './config';

const configManager = createConfigManager({
  enableValidation: true,
  enableHotReload: true,
  onConfigChange: (config, errors) => {
    if (errors.length > 0) {
      console.error('配置更新错误:', errors);
    }
  },
  onValidationError: (errors, warnings) => {
    console.warn('配置验证问题:', { errors, warnings });
  }
});

// 使用错误处理包装器
async function safeConfigOperation() {
  try {
    await withErrorHandling(
      () => configManager.save(),
      ConfigErrorType.SAVE_FAILED,
      { operation: 'manual_save' }
    );
    console.log('配置保存成功');
  } catch (error) {
    console.error('配置保存失败:', error);
  }
}

// 订阅配置变化
const unsubscribe = configManager.subscribe((path, newValue, oldValue) => {
  console.log(`配置变化: ${path} = ${newValue} (之前: ${oldValue})`);
});

// 清理资源
window.addEventListener('beforeunload', async () => {
  unsubscribe();
  await configManager.dispose();
});
```

## 错误处理示例

```typescript
import { 
  ConfigError, 
  ConfigErrorType, 
  getUserFriendlyErrorMessage 
} from './config/errorHandling';

try {
  await configManager.initialize();
} catch (error) {
  if (error instanceof ConfigError) {
    const userMessage = getUserFriendlyErrorMessage(error);
    console.error('配置错误:', userMessage);
    
    // 根据错误类型采取不同的处理策略
    switch (error.type) {
      case ConfigErrorType.LOAD_FAILED:
        // 使用默认配置继续运行
        break;
      case ConfigErrorType.VALIDATION_FAILED:
        // 显示验证错误详情
        break;
      case ConfigErrorType.PERMISSION_DENIED:
        // 提示用户检查权限
        break;
    }
  }
}
```

这个API参考文档涵盖了配置系统的所有主要功能和接口。开发者可以根据需要选择合适的API来实现配置管理功能。