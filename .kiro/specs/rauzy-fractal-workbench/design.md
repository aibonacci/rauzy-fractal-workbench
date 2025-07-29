# 设计文档

## 概述

Rauzy分形分析工作台采用现代Web技术栈构建，以Vite作为构建工具，React 18作为前端框架。设计遵循"重计算-轻渲染"分离架构，确保在处理大规模数学计算时保持界面流畅性。应用采用三栏式固定布局，为人类研究者和AI agent提供一致的交互体验。

### 核心技术栈

- **构建工具**: Vite 4.x
- **前端框架**: React 18 (使用Hooks)
- **数学计算**: math.js 11.x
- **图形渲染**: HTML5 Canvas API
- **样式系统**: Tailwind CSS 3.x
- **开发语言**: TypeScript (可选) / JavaScript ES2022

## 架构设计

### 整体架构模式

应用采用**"重计算-轻渲染"分离架构**，将计算密集型任务与UI渲染解耦：

```
用户输入 → 状态管理 → 数学计算引擎 → 数据处理 → 渲染层
    ↓           ↓            ↓           ↓        ↓
  路径输入   React State   核心算法    数据转换   Canvas绘制
  点数调整   useMemo      刘氏定理    高亮处理   DOM更新
```

### 状态管理架构

```typescript
// 源头状态 (Source of Truth)
interface AppState {
  numPoints: number;           // 触发重量级计算
  pathsData: PathData[];       // 触发中等重量级计算
  baseData: BaseData | null;   // 缓存重量级计算结果
}

// 派生状态 (Derived State)
interface DerivedState {
  renderedPoints: RenderPoint[];  // 通过useMemo计算
  isLoading: boolean;            // 计算状态指示
  mathJsLoaded: boolean;         // 依赖加载状态
}
```

### 数据流设计

1. **点数变更流程**:
   ```
   numPoints变更 → useEffect触发 → executeRauzyCoreAlgorithm → 
   baseData更新 → useMemo重计算 → renderedPoints更新 → Canvas重绘
   ```

2. **路径变更流程**:
   ```
   路径添加/删除 → pathsData更新 → useMemo重计算 → 
   renderedPoints更新 → Canvas重绘 (无需重算baseData)
   ```

## 组件和接口设计

### 核心组件架构

```
App (主容器)
├── ControlPanel (左侧控制栏)
│   ├── PathInput (路径输入组件)
│   ├── PathList (路径列表组件)
│   └── PointsSlider (点数控制组件)
├── FractalCanvas (中间画布组件)
└── DataPanel (右侧数据面板)
    └── PathDataCard (路径数据卡片)
```

### 关键接口定义

```typescript
// 基础数据结构
interface BaseData {
  word: string;
  pointsWithBaseType: Point3D[];
  indexMaps: { [key: string]: number[] };
}

interface PathData {
  path: number[];
  rp: number;        // 总权重
  cl: number;        // 常数项
  sequence: number[]; // 位置数列
  firstPointCoords: Point2D | null;
}

interface RenderPoint {
  re: number;
  im: number;
  baseType: '1' | '2' | '3';
  highlightGroup: number; // -1表示未高亮
}

// AI Agent友好的接口
interface AgentInterface {
  pathInput: HTMLInputElement;     // data-testid="path-input"
  addButton: HTMLButtonElement;    // data-testid="add-path-button"
  pathList: HTMLElement;          // data-testid="path-list"
  pointsSlider: HTMLInputElement;  // data-testid="points-slider"
  canvas: HTMLCanvasElement;       // data-testid="fractal-canvas"
  dataPanel: HTMLElement;         // data-testid="data-panel"
}
```

### 核心算法模块设计

```typescript
// 核心计算引擎
class RauzyCalculationEngine {
  // 重量级计算：生成基础分形数据
  static executeRauzyCoreAlgorithm(targetPointCount: number): BaseData | null;
  
  // 中等重量级计算：单路径数据计算
  static calculatePathData(
    path: number[], 
    indexMaps: BaseData['indexMaps'], 
    pointsWithBaseType: BaseData['pointsWithBaseType']
  ): PathData;
  
  // 轻量级计算：渲染数据生成
  static generateRenderPoints(
    baseData: BaseData, 
    pathsData: PathData[]
  ): RenderPoint[];
}

// 数学工具模块
class MathUtils {
  static generateTribonacciSequence(maxIndex: number): { [key: string]: number };
  static calculateEigenDecomposition(matrix: number[][]): EigenResult;
  static projectToPlane(point3D: number[], projectionMatrix: number[][]): Point2D;
}
```

## 数据模型

### 分形数据模型

```typescript
// Tribonacci序列和替换规则
interface TribonacciSystem {
  substitutionRules: {
    '1': '12',
    '2': '13', 
    '3': '1'
  };
  sequence: { [index: number]: number }; // F_k^(3)
}

// 几何投影模型
interface GeometricProjection {
  eigenMatrix: number[][];      // 特征向量矩阵
  invBasisMatrix: number[][];   // 投影矩阵
  expandingDirection: number[]; // 扩张方向
  contractingPlane: number[][]; // 收缩平面
}
```

### 路径分析模型

```typescript
// 复合路径模型
interface CompositePath {
  sequence: number[];           // 路径序列 [1,2,1,3,...]
  totalWeight: number;          // r_p = Σl_j
  constantTerm: number;         // C_L^(3)
  coefficients: {               // 主项系数
    '1': number,
    '2': number, 
    '3': number
  };
}

// 位置函数模型
interface PositionFunction {
  basePositions: {              // W_i^(3)(k)
    '1': number[],
    '2': number[],
    '3': number[]
  };
  compositePositions: number[]; // W_L^(3)(k)
}
```

## 错误处理

### 计算错误处理

```typescript
interface CalculationError {
  type: 'MATH_JS_NOT_LOADED' | 'EIGEN_CALCULATION_FAILED' | 'INVALID_PATH';
  message: string;
  recoveryAction?: () => void;
}

// 错误边界组件
class MathCalculationErrorBoundary extends React.Component {
  // 捕获数学计算中的错误
  // 提供用户友好的错误信息
  // 支持错误恢复机制
}
```

### 输入验证

```typescript
interface PathValidator {
  validatePathString(input: string): ValidationResult;
  checkDuplicatePath(path: number[], existingPaths: PathData[]): boolean;
  validatePathLength(path: number[]): boolean;
}

interface ValidationResult {
  isValid: boolean;
  errorMessage?: string;
  sanitizedPath?: number[];
}
```

## 测试策略

### 单元测试

```typescript
// 数学算法测试
describe('RauzyCalculationEngine', () => {
  test('executeRauzyCoreAlgorithm generates correct base data');
  test('calculatePathData implements Liu theorem correctly');
  test('generateRenderPoints handles highlighting correctly');
});

// 组件测试
describe('FractalCanvas', () => {
  test('renders fractal points correctly');
  test('handles canvas resize properly');
  test('applies correct color highlighting');
});
```

### 集成测试

```typescript
// AI Agent交互测试
describe('Agent Interface', () => {
  test('path input accepts programmatic input');
  test('add button responds to programmatic clicks');
  test('data attributes are correctly set');
  test('DOM state reflects calculation results');
});

// 端到端工作流测试
describe('Research Workflow', () => {
  test('complete path analysis workflow');
  test('multiple path comparison workflow');
  test('large dataset performance workflow');
});
```

### 性能测试

```typescript
// 计算性能基准
describe('Performance Benchmarks', () => {
  test('100K points calculation under 2 seconds');
  test('1M points calculation under 10 seconds');
  test('path addition under 100ms');
  test('canvas rendering under 50ms');
});
```

## AI Agent友好性设计

### DOM标识符策略

```typescript
// 标准化的data-testid命名约定
const TEST_IDS = {
  PATH_INPUT: 'path-input',
  ADD_PATH_BUTTON: 'add-path-button', 
  PATH_LIST: 'path-list',
  PATH_ITEM: 'path-item',
  DELETE_PATH_BUTTON: 'delete-path-button',
  POINTS_SLIDER: 'points-slider',
  FRACTAL_CANVAS: 'fractal-canvas',
  DATA_PANEL: 'data-panel',
  PATH_DATA_CARD: 'path-data-card',
  LOADING_INDICATOR: 'loading-indicator'
} as const;
```

### 程序化操作接口

```typescript
// Agent操作辅助函数
class AgentOperationHelper {
  static async addPath(pathString: string): Promise<boolean>;
  static async removePath(pathIndex: number): Promise<boolean>;
  static async setPointCount(count: number): Promise<boolean>;
  static async waitForCalculation(): Promise<void>;
  static getPathData(pathIndex: number): PathData | null;
  static getCanvasImageData(): ImageData;
}
```

### 状态可观测性

```typescript
// 状态变化事件
interface StateChangeEvent {
  type: 'PATH_ADDED' | 'PATH_REMOVED' | 'CALCULATION_COMPLETE' | 'POINTS_UPDATED';
  payload: any;
  timestamp: number;
}

// Agent可以监听这些事件来跟踪应用状态
window.addEventListener('rauzy-state-change', (event: StateChangeEvent) => {
  // Agent处理状态变化
});
```

## 性能优化

### 计算优化

1. **异步计算**: 使用setTimeout将重计算推迟到下一个事件循环
2. **结果缓存**: baseData缓存避免重复计算
3. **增量更新**: 路径变更时只重计算高亮信息
4. **内存管理**: 及时清理大型数组和Canvas上下文

### 渲染优化

1. **Canvas优化**: 使用requestAnimationFrame进行平滑渲染
2. **视口裁剪**: 只渲染可见区域内的点
3. **批量绘制**: 合并相同类型点的绘制操作
4. **响应式缩放**: 智能缩放算法适应不同屏幕尺寸

### 内存优化

```typescript
// 内存管理策略
class MemoryManager {
  static cleanupLargeArrays(data: BaseData): void;
  static optimizeCanvasMemory(canvas: HTMLCanvasElement): void;
  static monitorMemoryUsage(): MemoryInfo;
}
```

## 版本控制和协作

### Git工作流设计

```
main (生产分支)
├── develop (开发分支)
├── feature/* (功能分支)
├── hotfix/* (热修复分支)
└── release/* (发布分支)
```

### 分支策略

1. **main分支**: 生产就绪代码，每个提交都应该是可部署的
2. **develop分支**: 集成分支，包含下一个版本的最新开发代码
3. **feature分支**: 新功能开发，从develop分支创建
4. **hotfix分支**: 紧急修复，从main分支创建

### 提交规范

```typescript
// 提交信息格式
interface CommitMessage {
  type: 'feat' | 'fix' | 'docs' | 'style' | 'refactor' | 'test' | 'chore';
  scope?: 'core' | 'ui' | 'math' | 'canvas' | 'agent';
  subject: string;
  body?: string;
  footer?: string;
}

// 示例提交信息
// feat(math): implement Liu theorem calculation engine
// fix(canvas): resolve rendering issue with large datasets  
// docs(agent): add API documentation for programmatic interface
```

### 代码审查流程

```typescript
// Pull Request模板
interface PRTemplate {
  title: string;
  description: string;
  type: 'feature' | 'bugfix' | 'hotfix' | 'docs';
  checklist: {
    codeReview: boolean;
    testsPassing: boolean;
    documentationUpdated: boolean;
    agentCompatibilityTested: boolean;
  };
  screenshots?: string[]; // 对于UI变更
  performanceImpact?: string; // 对于算法变更
}
```

### 版本标记策略

```typescript
// 语义化版本控制
interface VersionStrategy {
  major: number; // 破坏性变更
  minor: number; // 新功能添加
  patch: number; // 错误修复
  prerelease?: string; // alpha, beta, rc
}

// 版本标记规则
// v1.0.0 - 初始发布版本
// v1.1.0 - 添加新的数学算法功能
// v1.1.1 - 修复Canvas渲染bug
// v2.0.0 - 重大架构变更或API破坏性更新
```

### 持续集成配置

```yaml
# .github/workflows/ci.yml
name: CI/CD Pipeline
on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      - name: Install dependencies
        run: npm ci
      - name: Run tests
        run: npm run test
      - name: Run agent compatibility tests
        run: npm run test:agent
      - name: Build application
        run: npm run build
```

### 发布流程

```typescript
// 自动化发布脚本
interface ReleaseProcess {
  preRelease: {
    runTests: boolean;
    updateChangelog: boolean;
    bumpVersion: boolean;
    createTag: boolean;
  };
  release: {
    buildProduction: boolean;
    deployToStaging: boolean;
    runE2ETests: boolean;
    deployToProduction: boolean;
  };
  postRelease: {
    createGitHubRelease: boolean;
    updateDocumentation: boolean;
    notifyStakeholders: boolean;
  };
}
```

## 部署和构建

### Vite配置

```typescript
// vite.config.ts
export default defineConfig({
  plugins: [react()],
  build: {
    target: 'es2022',
    rollupOptions: {
      output: {
        manualChunks: {
          'math-vendor': ['mathjs'],
          'react-vendor': ['react', 'react-dom']
        }
      }
    }
  },
  optimizeDeps: {
    include: ['mathjs']
  }
});
```

### 生产优化

1. **代码分割**: 按功能模块分割JavaScript包
2. **资源压缩**: 启用Gzip/Brotli压缩
3. **缓存策略**: 合理设置静态资源缓存头
4. **CDN部署**: 数学库等大型依赖使用CDN加载

### Git Hooks配置

```typescript
// husky配置 - 代码质量保证
interface GitHooks {
  preCommit: {
    lintStaged: boolean;    // 代码格式检查
    typeCheck: boolean;     // TypeScript类型检查
    testChanged: boolean;   // 运行相关测试
  };
  commitMsg: {
    validateFormat: boolean; // 提交信息格式验证
    enforceConventions: boolean; // 强制提交规范
  };
  prePush: {
    runFullTests: boolean;  // 完整测试套件
    buildCheck: boolean;    // 构建验证
  };
}

// lint-staged配置
const lintStagedConfig = {
  '*.{ts,tsx,js,jsx}': ['eslint --fix', 'prettier --write'],
  '*.{css,scss,md}': ['prettier --write'],
  '*.{ts,tsx}': ['tsc --noEmit']
};
```

### 项目文档结构

```
docs/
├── README.md                 # 项目概述和快速开始
├── CONTRIBUTING.md          # 贡献指南
├── CHANGELOG.md             # 版本变更日志
├── API.md                   # AI Agent API文档
├── MATH_ALGORITHMS.md       # 数学算法文档
├── DEPLOYMENT.md            # 部署指南
└── TROUBLESHOOTING.md       # 故障排除指南
```