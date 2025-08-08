# 配置系统文档

## 概述

Rauzy分形工作台使用了一个强大的配置系统，支持类型安全、热重载、验证和错误恢复。配置系统将应用程序的所有可配置参数集中管理，提供了灵活的自定义选项。

## 配置文件格式

配置文件使用JSON格式，位于项目根目录的`config.json`文件中。如果文件不存在，系统会自动创建一个包含默认值的配置文件。

### 基本结构

```json
{
  "version": "1.0.0",
  "lastModified": "2024-01-01T00:00:00.000Z",
  "app": {
    "points": {
      "min": 100,
      "max": 1000000,
      "default": 100000,
      "step": 1000
    },
    "paths": {
      "maxCount": 50,
      "maxLength": 20
    },
    "canvas": {
      "width": 800,
      "height": 600,
      "backgroundColor": "#1f2937"
    }
  },
  "ui": {
    "theme": "dark",
    "colors": {
      "primary": "#3b82f6",
      "secondary": "#10b981",
      "accent": "#f59e0b",
      "background": "#111827",
      "surface": "#1f2937",
      "text": "#f9fafb"
    },
    "animations": {
      "enabled": true,
      "duration": 300,
      "easing": "ease-in-out"
    },
    "notifications": {
      "enabled": true,
      "position": "top-right",
      "defaultDuration": 5000,
      "successDuration": 3000,
      "errorDuration": 8000,
      "warningDuration": 6000,
      "infoDuration": 4000
    }
  },
  "performance": {
    "cache": {
      "enabled": true,
      "maxSize": 1000,
      "ttl": 300000
    },
    "rendering": {
      "webgl": {
        "enabled": true,
        "antialias": true,
        "preserveDrawingBuffer": false
      },
      "canvas": {
        "width": 800,
        "height": 600,
        "pixelRatio": 1
      }
    },
    "computation": {
      "maxWorkers": 4,
      "chunkSize": 10000,
      "timeout": 30000
    }
  },
  "development": {
    "debug": {
      "enabled": false,
      "logLevel": "warn",
      "showPerformanceMetrics": false
    },
    "features": {
      "hotReload": true,
      "typeChecking": true,
      "configValidation": true
    },
    "testIds": {
      "PATH_INPUT": "path-input",
      "ADD_PATH_BUTTON": "add-path-button",
      "PATH_LIST": "path-list",
      "PATH_ITEM": "path-item",
      "DELETE_PATH_BUTTON": "delete-path-button",
      "POINTS_SLIDER": "points-slider",
      "FRACTAL_CANVAS": "fractal-canvas",
      "DATA_PANEL": "data-panel",
      "PATH_DATA_CARD": "path-data-card",
      "LOADING_INDICATOR": "loading-indicator",
      "LANGUAGE_TOGGLE": "language-toggle",
      "EXTERNAL_LINKS": "external-links",
      "PROGRESS_INDICATOR": "progress-indicator",
      "NOTIFICATION_SYSTEM": "notification-system",
      "AXIS_CONTROL_PANEL": "axis-control-panel",
      "NUMBER_PARTITION_GENERATOR": "number-partition-generator"
    },
    "language": {
      "defaultLanguage": "en",
      "storageKey": "rauzy-language",
      "supportedLanguages": ["en", "zh"]
    }
  }
}
```

## 配置分类

### 1. 应用配置 (app)

控制应用程序的核心功能参数。

- **points**: 点数相关配置
  - `min`: 最小点数 (默认: 100)
  - `max`: 最大点数 (默认: 1000000)
  - `default`: 默认点数 (默认: 100000)
  - `step`: 点数步长 (默认: 1000)

- **paths**: 路径相关配置
  - `maxCount`: 最大路径数量 (默认: 50)
  - `maxLength`: 路径最大长度 (默认: 20)

- **canvas**: 画布配置
  - `width`: 画布宽度 (默认: 800)
  - `height`: 画布高度 (默认: 600)
  - `backgroundColor`: 背景颜色 (默认: "#1f2937")

### 2. UI配置 (ui)

控制用户界面的外观和行为。

- **theme**: 主题模式 ("light" | "dark")
- **colors**: 颜色配置
  - `primary`: 主色调
  - `secondary`: 次要色调
  - `accent`: 强调色
  - `background`: 背景色
  - `surface`: 表面色
  - `text`: 文本色

- **animations**: 动画配置
  - `enabled`: 是否启用动画
  - `duration`: 动画持续时间 (毫秒)
  - `easing`: 缓动函数

- **notifications**: 通知配置
  - `enabled`: 是否启用通知
  - `position`: 通知位置
  - `defaultDuration`: 默认显示时长
  - `successDuration`: 成功通知时长
  - `errorDuration`: 错误通知时长
  - `warningDuration`: 警告通知时长
  - `infoDuration`: 信息通知时长

### 3. 性能配置 (performance)

控制应用程序的性能相关设置。

- **cache**: 缓存配置
  - `enabled`: 是否启用缓存
  - `maxSize`: 最大缓存大小
  - `ttl`: 缓存生存时间 (毫秒)

- **rendering**: 渲染配置
  - `webgl`: WebGL配置
    - `enabled`: 是否启用WebGL
    - `antialias`: 是否启用抗锯齿
    - `preserveDrawingBuffer`: 是否保留绘图缓冲区
  - `canvas`: Canvas配置
    - `width`: 画布宽度
    - `height`: 画布高度
    - `pixelRatio`: 像素比率

- **computation**: 计算配置
  - `maxWorkers`: 最大工作线程数
  - `chunkSize`: 数据块大小
  - `timeout`: 计算超时时间 (毫秒)

### 4. 开发配置 (development)

控制开发和调试相关的功能。

- **debug**: 调试配置
  - `enabled`: 是否启用调试模式
  - `logLevel`: 日志级别 ("debug" | "info" | "warn" | "error")
  - `showPerformanceMetrics`: 是否显示性能指标

- **features**: 功能开关
  - `hotReload`: 是否启用热重载
  - `typeChecking`: 是否启用类型检查
  - `configValidation`: 是否启用配置验证

- **testIds**: 测试ID配置
  - 包含所有UI元素的测试ID映射

- **language**: 语言配置
  - `defaultLanguage`: 默认语言
  - `storageKey`: 本地存储键名
  - `supportedLanguages`: 支持的语言列表

## 配置验证

配置系统包含强大的验证功能，确保配置值的正确性：

### 验证规则

1. **类型验证**: 确保配置值的类型正确
2. **范围验证**: 检查数值是否在有效范围内
3. **格式验证**: 验证字符串格式（如颜色值、URL等）
4. **依赖验证**: 检查配置项之间的依赖关系

### 验证错误处理

- 验证失败时，系统会使用默认值
- 错误信息会记录到控制台
- 用户友好的错误提示
- 自动错误恢复机制

## 热重载功能

配置系统支持热重载，在开发模式下自动检测配置文件变化：

### 启用热重载

```typescript
const configManager = createConfigManager({
  enableHotReload: true,
  configPath: './config.json'
});
```

### 热重载特性

- 自动检测文件变化
- 实时更新应用配置
- 验证新配置的有效性
- 错误时回滚到之前的配置
- 通知系统提示更新状态

## 错误处理和恢复

配置系统具有完善的错误处理机制：

### 错误类型

- `LOAD_FAILED`: 配置文件加载失败
- `VALIDATION_FAILED`: 配置验证失败
- `SAVE_FAILED`: 配置保存失败
- `ACCESS_FAILED`: 配置访问失败
- `PARSE_FAILED`: 配置解析失败
- `NETWORK_FAILED`: 网络请求失败
- `PERMISSION_DENIED`: 权限不足

### 恢复策略

1. **默认值回退**: 使用默认配置值
2. **缓存回退**: 使用本地缓存的配置
3. **重试机制**: 自动重试失败的操作
4. **备份恢复**: 从备份文件恢复配置

## API使用指南

### 基本用法

```typescript
import { useConfig } from './config/ConfigContext';

function MyComponent() {
  const { config } = useConfig();
  
  return (
    <div style={{ backgroundColor: config.ui.colors.background }}>
      <h1>点数: {config.app.points.default}</h1>
    </div>
  );
}
```

### 配置管理器

```typescript
import { createConfigManager } from './config/ConfigManager';

const configManager = createConfigManager({
  enableValidation: true,
  enableHotReload: true,
  onConfigChange: (config, errors) => {
    console.log('配置已更新', config);
  }
});

// 初始化
await configManager.initialize();

// 获取配置
const config = configManager.getConfig();

// 设置配置值
configManager.set('app.points.default', 50000);

// 批量更新
configManager.update({
  ui: {
    theme: 'light',
    colors: { primary: '#ff0000' }
  }
});

// 保存到文件
await configManager.save();
```

### 配置工具函数

```typescript
import { 
  getConfigValue, 
  setConfigValue, 
  validateConfigValueType,
  exportConfigToJson,
  importConfigFromJson 
} from './config/utils';

// 获取配置值
const pointsMin = getConfigValue(config, 'app.points.min');

// 设置配置值
const newConfig = setConfigValue(config, 'app.points.min', 200);

// 验证类型
const isValid = validateConfigValueType(100, 'number');

// 导出配置
const jsonString = exportConfigToJson(config);

// 导入配置
const importedConfig = importConfigFromJson(jsonString);
```

### 测试ID工具

```typescript
import { useTestId, useTestIds } from './hooks/useTestIds';

function MyComponent() {
  const pathInputId = useTestId('PATH_INPUT');
  const allTestIds = useTestIds();
  
  return (
    <input data-testid={pathInputId} />
  );
}
```

## 最佳实践

### 1. 配置组织

- 按功能模块组织配置
- 使用有意义的配置键名
- 提供合理的默认值
- 添加配置注释和文档

### 2. 类型安全

- 使用TypeScript类型定义
- 启用配置验证
- 处理配置访问错误

### 3. 性能优化

- 避免频繁的配置访问
- 使用配置缓存
- 合理设置热重载防抖时间

### 4. 错误处理

- 提供用户友好的错误消息
- 实现优雅的降级策略
- 记录详细的错误信息

### 5. 开发体验

- 启用开发模式的热重载
- 使用配置验证捕获错误
- 提供配置编辑工具

## 配置迁移

### 版本升级

当配置格式发生变化时，系统会自动处理配置迁移：

1. 检测配置版本
2. 应用迁移规则
3. 验证迁移结果
4. 创建备份文件

### 手动迁移

```typescript
import { migrateConfig } from './config/migration';

const oldConfig = loadOldConfig();
const newConfig = migrateConfig(oldConfig, '1.0.0', '2.0.0');
```

## 故障排除

### 常见问题

1. **配置文件不存在**
   - 系统会自动创建默认配置文件
   - 检查文件权限

2. **配置验证失败**
   - 检查配置值的类型和范围
   - 查看控制台错误信息

3. **热重载不工作**
   - 确保启用了热重载功能
   - 检查文件监听权限

4. **配置更新不生效**
   - 确保组件使用了useConfig Hook
   - 检查配置路径是否正确

### 调试技巧

1. 启用调试模式：
```json
{
  "development": {
    "debug": {
      "enabled": true,
      "logLevel": "debug"
    }
  }
}
```

2. 查看配置状态：
```typescript
const metadata = configManager.getMetadata();
console.log('配置状态:', metadata);
```

3. 导出当前配置：
```typescript
const currentConfig = configManager.exportConfigToJson();
console.log('当前配置:', currentConfig);
```

## 扩展配置系统

### 添加新的配置项

1. 更新类型定义 (`src/config/types.ts`)
2. 添加默认值 (`src/config/defaultConfig.ts`)
3. 添加验证规则 (`src/config/validationRules.ts`)
4. 更新文档

### 自定义验证规则

```typescript
import { ValidationRule } from './config/validation';

const customRule: ValidationRule = {
  path: 'app.custom.value',
  validate: (value) => {
    if (typeof value !== 'string' || value.length < 3) {
      return { isValid: false, message: '值必须是至少3个字符的字符串' };
    }
    return { isValid: true };
  }
};
```

### 自定义错误恢复策略

```typescript
import { ErrorRecoveryStrategy } from './config/errorHandling';

class CustomRecoveryStrategy implements ErrorRecoveryStrategy {
  canHandle(error: ConfigError): boolean {
    return error.type === ConfigErrorType.CUSTOM_ERROR;
  }
  
  async recover(error: ConfigError): Promise<AppConfiguration | null> {
    // 自定义恢复逻辑
    return null;
  }
}
```

## 总结

配置系统为Rauzy分形工作台提供了强大而灵活的配置管理能力。通过合理使用配置系统，可以：

- 提高应用的可配置性和可维护性
- 提供更好的开发体验
- 确保配置的类型安全和有效性
- 支持热重载和实时配置更新
- 提供完善的错误处理和恢复机制

遵循本文档的指导，可以充分利用配置系统的各项功能，构建更加健壮和用户友好的应用程序。