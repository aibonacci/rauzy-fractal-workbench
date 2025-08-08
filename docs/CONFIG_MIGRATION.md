# 配置系统迁移指南

## 概述

本指南帮助开发者从旧的硬编码配置系统迁移到新的动态配置系统。新的配置系统提供了类型安全、热重载、验证和错误恢复等强大功能。

## 迁移前准备

### 1. 备份现有配置

在开始迁移之前，请备份所有现有的配置文件和常量定义：

```bash
# 备份配置相关文件
cp src/utils/constants.ts src/utils/constants.ts.backup
cp src/i18n/types.ts src/i18n/types.ts.backup
# 备份其他包含配置的文件
```

### 2. 了解新的配置结构

新的配置系统采用分层结构：

```
AppConfiguration
├── app (应用核心配置)
├── ui (用户界面配置)
├── performance (性能配置)
└── development (开发配置)
```

## 迁移步骤

### 步骤1: 安装配置系统依赖

确保项目中包含了配置系统的所有文件：

```
src/config/
├── types.ts              # 类型定义
├── defaultConfig.ts      # 默认配置
├── ConfigManager.ts      # 配置管理器
├── ConfigContext.tsx     # React上下文
├── utils.ts             # 工具函数
├── validation.ts        # 验证系统
├── errorHandling.ts     # 错误处理
└── hotReload.ts         # 热重载
```

### 步骤2: 迁移应用配置

#### 旧的配置方式

```typescript
// src/utils/constants.ts (旧)
export const APP_CONFIG = {
  POINTS_MIN: 100,
  POINTS_MAX: 1000000,
  POINTS_DEFAULT: 100000,
  MAX_PATHS: 50,
  CANVAS_WIDTH: 800,
  CANVAS_HEIGHT: 600
};
```

#### 新的配置方式

```typescript
// 配置现在在 src/config/defaultConfig.ts 中定义
export const DEFAULT_CONFIG: AppConfiguration = {
  app: {
    points: {
      min: 100,
      max: 1000000,
      default: 100000,
      step: 1000
    },
    paths: {
      maxCount: 50,
      maxLength: 20
    },
    canvas: {
      width: 800,
      height: 600,
      backgroundColor: "#1f2937"
    }
  },
  // ... 其他配置
};
```

#### 更新组件使用方式

```typescript
// 旧的使用方式
import { APP_CONFIG } from '../utils/constants';

function MyComponent() {
  const minPoints = APP_CONFIG.POINTS_MIN;
  return <div>最小点数: {minPoints}</div>;
}

// 新的使用方式
import { useConfig } from '../config/ConfigContext';

function MyComponent() {
  const { config } = useConfig();
  const minPoints = config.app.points.min;
  return <div>最小点数: {minPoints}</div>;
}
```

### 步骤3: 迁移UI配置

#### 旧的颜色配置

```typescript
// 旧的颜色常量
export const BASE_COLORS_ALPHA = {
  '1': 'rgba(209, 213, 219, 0.5)',
  '2': 'rgba(209, 213, 219, 0.35)',
  '3': 'rgba(209, 213, 219, 0.2)'
};

export const HIGHLIGHT_PALETTE = [
  '#ef4444', '#f97316', '#eab308',
  '#22c55e', '#06b6d4', '#3b82f6',
  '#8b5cf6', '#ec4899'
];
```

#### 新的颜色配置

```typescript
// 现在在配置系统中
ui: {
  colors: {
    primary: "#3b82f6",
    secondary: "#10b981",
    accent: "#f59e0b",
    background: "#111827",
    surface: "#1f2937",
    text: "#f9fafb",
    baseColors: {
      '1': 'rgba(209, 213, 219, 0.5)',
      '2': 'rgba(209, 213, 219, 0.35)',
      '3': 'rgba(209, 213, 219, 0.2)'
    },
    highlightPalette: [
      '#ef4444', '#f97316', '#eab308',
      '#22c55e', '#06b6d4', '#3b82f6',
      '#8b5cf6', '#ec4899'
    ]
  }
}
```

#### 更新组件使用

```typescript
// 旧的使用方式
import { HIGHLIGHT_PALETTE } from '../utils/constants';

function PathComponent({ pathIndex }: { pathIndex: number }) {
  const color = HIGHLIGHT_PALETTE[pathIndex % HIGHLIGHT_PALETTE.length];
  return <div style={{ color }}>路径</div>;
}

// 新的使用方式
import { useConfig } from '../config/ConfigContext';

function PathComponent({ pathIndex }: { pathIndex: number }) {
  const { config } = useConfig();
  const palette = config.ui.colors.highlightPalette;
  const color = palette[pathIndex % palette.length];
  return <div style={{ color }}>路径</div>;
}
```

### 步骤4: 迁移测试ID

#### 旧的测试ID

```typescript
// 旧的测试ID常量
export const TEST_IDS = {
  PATH_INPUT: 'path-input',
  ADD_PATH_BUTTON: 'add-path-button',
  PATH_LIST: 'path-list'
} as const;
```

#### 新的测试ID系统

```typescript
// 现在使用Hook获取测试ID
import { useTestId } from '../hooks/useTestIds';

function MyComponent() {
  const pathInputId = useTestId('PATH_INPUT');
  
  return (
    <input data-testid={pathInputId} />
  );
}

// 或者获取多个测试ID
import { useMultipleTestIds } from '../hooks/useTestIds';

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

### 步骤5: 更新应用入口

#### 旧的应用入口

```typescript
// main.tsx (旧)
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
```

#### 新的应用入口

```typescript
// main.tsx (新)
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { ConfigProvider } from './config/ConfigContext';
import { createConfigManager } from './config/ConfigManager';
import { ConfigLoader } from './components/ConfigLoader/ConfigLoader';
import { ConfigErrorBoundary } from './components/ErrorBoundary/ConfigErrorBoundary';

const configManager = createConfigManager({
  enableValidation: true,
  enableHotReload: process.env.NODE_ENV === 'development',
  configPath: './config.json'
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ConfigErrorBoundary>
      <ConfigLoader configManager={configManager}>
        <ConfigProvider configManager={configManager}>
          <App />
        </ConfigProvider>
      </ConfigLoader>
    </ConfigErrorBoundary>
  </StrictMode>
);
```

### 步骤6: 创建配置文件

在项目根目录创建 `config.json` 文件：

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
    }
  }
}
```

## 迁移检查清单

### 代码迁移

- [ ] 移除旧的常量文件 (`constants.ts`)
- [ ] 更新所有组件使用 `useConfig` Hook
- [ ] 替换硬编码的配置值
- [ ] 更新测试文件使用新的测试ID系统
- [ ] 添加配置Provider到应用根部
- [ ] 创建配置文件

### 功能验证

- [ ] 验证所有配置值正确加载
- [ ] 测试配置热重载功能
- [ ] 验证配置验证系统工作正常
- [ ] 测试错误处理和恢复
- [ ] 确认所有测试通过

### 性能检查

- [ ] 检查应用启动时间
- [ ] 验证配置访问性能
- [ ] 测试热重载性能影响
- [ ] 检查内存使用情况

## 常见迁移问题

### 问题1: 配置值未定义

**症状**: 组件中访问配置值时返回 `undefined`

**原因**: 配置路径错误或配置未正确加载

**解决方案**:
```typescript
// 检查配置路径是否正确
const { config } = useConfig();
console.log('当前配置:', config);

// 使用可选链操作符防止错误
const minPoints = config?.app?.points?.min ?? 100;
```

### 问题2: 热重载不工作

**症状**: 修改配置文件后应用未更新

**原因**: 热重载未启用或文件监听失败

**解决方案**:
```typescript
// 确保启用热重载
const configManager = createConfigManager({
  enableHotReload: process.env.NODE_ENV === 'development'
});

// 检查热重载状态
console.log('热重载状态:', configManager.isHotReloadActive());
```

### 问题3: 配置验证失败

**症状**: 控制台显示配置验证错误

**原因**: 配置值不符合验证规则

**解决方案**:
```typescript
// 检查验证结果
const validationResult = configManager.validate();
if (!validationResult.isValid) {
  console.error('验证错误:', validationResult.errors);
}

// 查看详细的验证报告
const report = configManager.getValidationReport();
console.log('验证报告:', report);
```

### 问题4: 测试ID不工作

**症状**: 测试中无法找到元素

**原因**: 测试ID Hook未正确使用

**解决方案**:
```typescript
// 确保在测试中提供配置上下文
import { render } from '@testing-library/react';
import { ConfigProvider } from '../config/ConfigContext';
import { DEFAULT_CONFIG } from '../config/defaultConfig';

const renderWithConfig = (component: React.ReactElement) => {
  return render(
    <ConfigProvider initialConfig={DEFAULT_CONFIG}>
      {component}
    </ConfigProvider>
  );
};
```

## 迁移后优化

### 1. 配置缓存

对于频繁访问的配置值，考虑使用缓存：

```typescript
import { useMemo } from 'react';
import { useConfig } from '../config/ConfigContext';

function MyComponent() {
  const { config } = useConfig();
  
  // 缓存计算结果
  const colorPalette = useMemo(() => {
    return config.ui.colors.highlightPalette;
  }, [config.ui.colors.highlightPalette]);
  
  return <div>使用缓存的颜色调色板</div>;
}
```

### 2. 配置订阅

对于需要响应配置变化的组件：

```typescript
import { useEffect } from 'react';
import { useConfig } from '../config/ConfigContext';

function MyComponent() {
  const { config } = useConfig();
  
  useEffect(() => {
    // 响应主题变化
    document.body.className = config.ui.theme;
  }, [config.ui.theme]);
  
  return <div>主题响应组件</div>;
}
```

### 3. 配置预加载

对于大型应用，考虑预加载配置：

```typescript
// 在应用启动时预加载配置
async function preloadConfig() {
  const configManager = createConfigManager();
  await configManager.initialize();
  
  // 预热缓存
  configManager.getConfig();
  
  return configManager;
}
```

## 回滚计划

如果迁移过程中遇到严重问题，可以按以下步骤回滚：

### 1. 恢复备份文件

```bash
# 恢复旧的配置文件
cp src/utils/constants.ts.backup src/utils/constants.ts
cp src/i18n/types.ts.backup src/i18n/types.ts
```

### 2. 移除配置系统

```bash
# 移除配置系统文件
rm -rf src/config/
```

### 3. 恢复旧的导入语句

使用查找替换工具将新的导入语句替换回旧的：

```typescript
// 将这些导入
import { useConfig } from '../config/ConfigContext';

// 替换回
import { APP_CONFIG } from '../utils/constants';
```

### 4. 恢复应用入口

将 `main.tsx` 恢复到迁移前的状态。

## 总结

配置系统迁移是一个系统性的过程，需要仔细规划和测试。遵循本指南的步骤，可以确保迁移过程顺利进行。迁移完成后，应用将获得更强大的配置管理能力，包括：

- 类型安全的配置访问
- 实时配置热重载
- 强大的配置验证
- 完善的错误处理
- 更好的开发体验

如果在迁移过程中遇到问题，请参考常见问题部分或查阅详细的API文档。