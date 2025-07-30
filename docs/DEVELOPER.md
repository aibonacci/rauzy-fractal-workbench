# 开发者文档

本文档为 Rauzy 分形分析工作台的开发者提供详细的技术信息和开发指南。

## 🏗️ 项目架构

### 技术栈

```
Frontend Framework: React 18 + TypeScript
Build Tool: Vite 7.x
Math Library: Math.js 14.x
Styling: Tailwind CSS 4.x
Testing: Vitest + Testing Library
Graphics: HTML5 Canvas API
```

### 目录结构

```
rauzy-fractal-workbench/
├── src/
│   ├── components/          # React组件
│   │   ├── ControlPanel/    # 控制面板组件
│   │   ├── FractalCanvas/   # 分形画布组件
│   │   ├── DataPanel/       # 数据面板组件
│   │   ├── ErrorBoundary/   # 错误边界组件
│   │   ├── Notification/    # 通知系统组件
│   │   └── __tests__/       # 组件测试
│   ├── hooks/               # 自定义Hooks
│   ├── types/               # TypeScript类型定义
│   ├── utils/               # 工具函数
│   │   ├── constants.ts     # 常量定义
│   │   ├── helpers.ts       # 辅助函数
│   │   ├── performance.ts   # 性能优化工具
│   │   ├── rauzy-core.ts    # 核心算法
│   │   ├── liu-theorem.ts   # 刘氏定理实现
│   │   ├── tribonacci.ts    # Tribonacci数列
│   │   ├── agent-helper.ts  # AI Agent接口
│   │   ├── event-system.ts  # 事件系统
│   │   └── __tests__/       # 工具测试
│   ├── App.tsx              # 主应用组件
│   ├── main.tsx             # 应用入口
│   └── index.css            # 全局样式
├── docs/                    # 文档
├── .github/                 # GitHub Actions
├── .husky/                  # Git hooks
├── public/                  # 静态资源
└── dist/                    # 构建输出
```

## 🧮 核心算法

### Rauzy分形生成算法

位置：`src/utils/rauzy-core.ts`

```typescript
export function executeRauzyCoreAlgorithm(targetPointCount: number): BaseData | null
```

**算法步骤：**

1. **矩阵特征值分解**
   ```typescript
   const M = math.matrix([[1, 1, 1], [1, 0, 0], [0, 1, 0]]);
   const eigenInfo = math.eigs(M);
   ```

2. **符号序列生成**
   ```typescript
   // Tribonacci替换规则
   // 1 → 12, 2 → 13, 3 → 1
   ```

3. **几何投影**
   ```typescript
   // 投影到收缩平面
   const pointInEigenBasis = math.multiply(invBasisMatrix, point3D);
   ```

### 刘氏定理实现

位置：`src/utils/liu-theorem.ts`

```typescript
export function calculatePathData(
  path: number[], 
  indexMaps: { [key: string]: number[] }, 
  pointsWithBaseType: BasePoint[]
): PathData
```

**核心公式：**

```typescript
// 主项系数计算
coeffs[1] = F[rp - 2] || 0;
coeffs[2] = (F[rp - 2] || 0) + (F[rp - 3] || 0);
coeffs[3] = (F[rp - 2] || 0) + (F[rp - 3] || 0) + (F[rp - 4] || 0);

// 复合位置数列
const pLk = coeffs[1] * W1k + coeffs[2] * W2k + coeffs[3] * W3k;
const wLk = Math.round(pLk - cl);
```

### Tribonacci数列生成

位置：`src/utils/tribonacci.ts`

```typescript
export function getTribonacci(n: number): number
```

**特点：**
- 智能缓存机制
- 按需计算
- 内存优化

## 🎨 组件设计

### 组件层次结构

```
App
├── MathCalculationErrorBoundary
├── ControlPanel
│   ├── PathInput
│   ├── PathList
│   └── PointsSlider
├── FractalCanvas
├── DataPanel
│   └── PathDataCard[]
└── NotificationSystem
```

### 状态管理

使用React内置状态管理：

```typescript
interface AppState {
  numPoints: number;
  pathInput: string;
  inputError: string;
  baseData: BaseData | null;
  pathsData: PathData[];
  calculationState: CalculationState;
}
```

**状态流：**
```
用户输入 → setState → useEffect → 计算 → 更新状态 → 重新渲染
```

### 性能优化策略

#### 1. 计算优化
```typescript
// 缓存重复计算
const cacheKey = `rauzy-core-${targetPointCount}`;
const cachedResult = ComputationCache.get(cacheKey);

// 异步计算避免阻塞
const calculateBaseData = useCallback(async (points: number) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const data = executeRauzyCoreAlgorithm(points);
      resolve(data);
    }, 50);
  });
}, []);
```

#### 2. 渲染优化
```typescript
// useMemo缓存转换结果
const transformedPoints = useMemo(() => {
  // 计算点的边界和变换
}, [points]);

// 视口裁剪
const visiblePoints = CanvasOptimizer.viewportCulling(screenPoints, viewport);

// 批量绘制
CanvasOptimizer.batchDrawPoints(ctx, visiblePoints, getStyle, getSize);
```

#### 3. 内存管理
```typescript
// 清理大型数组
MemoryManager.cleanupLargeArrays(array1, array2);

// 优化Canvas内存
MemoryManager.optimizeCanvasMemory(canvas);

// 注册清理回调
MemoryManager.registerCleanup(() => {
  // 清理逻辑
});
```

## 🧪 测试策略

### 测试类型

1. **单元测试**：工具函数和算法
2. **组件测试**：React组件渲染
3. **集成测试**：AI Agent接口
4. **性能测试**：计算和渲染性能

### 测试配置

```typescript
// vitest.config.ts
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test-setup.ts'],
    css: true,
  },
});
```

### 测试示例

```typescript
// 数学算法测试
describe('executeRauzyCoreAlgorithm', () => {
  it('应该生成正确的基础数据', () => {
    const result = executeRauzyCoreAlgorithm(100);
    expect(result).not.toBeNull();
    expect(result.word).toBeDefined();
    expect(result.pointsWithBaseType).toBeInstanceOf(Array);
  });
});

// 组件测试
describe('ControlPanel', () => {
  it('应该渲染路径输入组件', () => {
    render(<ControlPanel {...mockProps} />);
    expect(screen.getByLabelText(/构建路径/)).toBeInTheDocument();
  });
});
```

## 🔧 开发工具

### 代码质量

```json
// .eslintrc.js
{
  "extends": [
    "eslint:recommended",
    "@typescript-eslint/recommended",
    "plugin:react/recommended",
    "plugin:react-hooks/recommended"
  ]
}
```

### Git工作流

```bash
# 功能开发
git checkout -b feature/new-algorithm
git commit -m "feat(math): implement new calculation method"
git push origin feature/new-algorithm

# 提交规范
feat: 新功能
fix: 修复bug
docs: 文档更新
style: 代码格式
refactor: 重构
perf: 性能优化
test: 测试
chore: 构建工具
```

### 构建优化

```typescript
// vite.config.js
export default defineConfig({
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
  }
});
```

## 🚀 部署配置

### 环境变量

```bash
# .env.production
VITE_APP_TITLE=Rauzy分形分析工作台
VITE_API_BASE_URL=https://api.example.com
VITE_ENABLE_DEBUG=false
```

### GitHub Pages部署

```yaml
# .github/workflows/deploy.yml
- name: Deploy to GitHub Pages
  uses: peaceiris/actions-gh-pages@v3
  with:
    github_token: ${{ secrets.GITHUB_TOKEN }}
    publish_dir: ./dist
```

### Docker部署

```dockerfile
# Dockerfile
FROM node:18-alpine as builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

## 🔍 调试技巧

### 开发模式调试

```typescript
// 启用详细日志
if (process.env.NODE_ENV === 'development') {
  console.log('Rauzy Event:', fullEvent);
}

// 性能监控
const endMeasurement = PerformanceMonitor.startMeasurement('operation-name');
// ... 执行操作
endMeasurement();
```

### 浏览器调试

```javascript
// 控制台调试命令
window.RAUZY_DEBUG = true;
window.AgentOperationHelper.getCurrentPaths();
window.RauzyEventSystem.getListeners();
```

### 性能分析

```typescript
// 内存使用监控
const memoryInfo = MemoryManager.monitorMemoryUsage();
console.log('内存使用:', memoryInfo);

// 性能统计
const stats = PerformanceMonitor.getAllStats();
console.log('性能统计:', stats);
```

## 🔌 扩展开发

### 添加新算法

1. **创建算法文件**
   ```typescript
   // src/utils/new-algorithm.ts
   export function newAlgorithm(params: AlgorithmParams): Result {
     // 实现算法逻辑
   }
   ```

2. **添加类型定义**
   ```typescript
   // src/types/index.ts
   export interface AlgorithmParams {
     // 参数定义
   }
   ```

3. **编写测试**
   ```typescript
   // src/utils/__tests__/new-algorithm.test.ts
   describe('newAlgorithm', () => {
     it('应该正确计算结果', () => {
       // 测试逻辑
     });
   });
   ```

### 添加新组件

1. **创建组件目录**
   ```
   src/components/NewComponent/
   ├── NewComponent.tsx
   ├── index.ts
   └── __tests__/
       └── NewComponent.test.tsx
   ```

2. **实现组件**
   ```typescript
   // NewComponent.tsx
   import React from 'react';
   
   interface NewComponentProps {
     // Props定义
   }
   
   const NewComponent: React.FC<NewComponentProps> = (props) => {
     return <div>新组件</div>;
   };
   
   export default NewComponent;
   ```

3. **导出组件**
   ```typescript
   // src/components/index.ts
   export { default as NewComponent } from './NewComponent/NewComponent';
   ```

### AI Agent接口扩展

1. **添加新方法**
   ```typescript
   // src/utils/agent-helper.ts
   static async newOperation(params: any): Promise<boolean> {
     try {
       // 实现新操作
       return true;
     } catch (error) {
       console.error('操作失败:', error);
       return false;
     }
   }
   ```

2. **添加事件类型**
   ```typescript
   // src/utils/event-system.ts
   export interface StateChangeEvent {
     type: 'PATH_ADDED' | 'PATH_REMOVED' | 'NEW_EVENT_TYPE';
     payload: any;
     timestamp: number;
   }
   ```

## 📊 监控和分析

### 性能监控

```typescript
// 关键指标监控
const metrics = {
  calculationTime: PerformanceMonitor.getStats('rauzy-core-algorithm'),
  renderTime: PerformanceMonitor.getStats('canvas-render'),
  memoryUsage: MemoryManager.monitorMemoryUsage(),
  cacheStats: ComputationCache.getStats()
};
```

### 错误追踪

```typescript
// 全局错误处理
window.addEventListener('error', (event) => {
  console.error('全局错误:', event.error);
  // 发送错误报告
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('未处理的Promise拒绝:', event.reason);
});
```

### 用户行为分析

```typescript
// 事件统计
let eventStats = {
  pathAdded: 0,
  pathRemoved: 0,
  calculationComplete: 0
};

window.onRauzyStateChange((event) => {
  eventStats[event.type]++;
});
```

## 🔒 安全考虑

### 输入验证

```typescript
// 严格的输入验证
export function validatePath(pathString: string): ValidationResult {
  if (!pathString.trim()) {
    return { isValid: false, error: '路径不能为空' };
  }
  
  // 防止XSS攻击
  const sanitized = pathString.replace(/[^1-3,]/g, '');
  
  return { isValid: true, path: sanitized };
}
```

### 内存安全

```typescript
// 防止内存泄漏
useEffect(() => {
  return () => {
    // 清理定时器
    clearInterval(intervalId);
    // 清理事件监听器
    window.removeEventListener('resize', handleResize);
    // 清理Canvas上下文
    MemoryManager.optimizeCanvasMemory(canvas);
  };
}, []);
```

### 计算安全

```typescript
// 防止无限循环和栈溢出
export function safeCalculation(params: any): Result | null {
  const maxIterations = 10000;
  let iterations = 0;
  
  while (condition && iterations < maxIterations) {
    // 计算逻辑
    iterations++;
  }
  
  if (iterations >= maxIterations) {
    console.warn('计算达到最大迭代次数');
    return null;
  }
  
  return result;
}
```

## 📝 文档维护

### API文档更新

当添加新的AI Agent接口时，需要更新：
1. `docs/API.md` - API文档
2. `README.md` - 使用示例
3. TypeScript类型定义

### 代码注释规范

```typescript
/**
 * 计算复合路径的数学数据
 * @param path - 路径数组，只能包含1、2、3
 * @param indexMaps - 基础位置数列映射
 * @param pointsWithBaseType - 几何坐标数据
 * @returns 包含所有计算结果的路径数据对象
 * @throws {Error} 当路径格式无效时抛出错误
 * @example
 * ```typescript
 * const result = calculatePathData([1, 2, 1, 3], indexMaps, points);
 * console.log(result.rp); // 总权重
 * ```
 */
export function calculatePathData(
  path: number[], 
  indexMaps: { [key: string]: number[] }, 
  pointsWithBaseType: BasePoint[]
): PathData
```

这个开发者文档提供了完整的技术信息，帮助开发者理解项目架构、扩展功能和维护代码。