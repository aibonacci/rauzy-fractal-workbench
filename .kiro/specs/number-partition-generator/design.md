# 数字划分生成器设计文档

## 设计概述

数字划分生成器是一个新的功能模块，集成到现有的Rauzy分形工作台中。它允许用户输入一个正整数r，系统自动生成该数字基于{1,2,3}的所有可能划分，并提供批量添加到路径列表的功能。

## 架构设计

### 组件架构

```
ControlPanel
├── PathInput (现有)
├── NumberPartitionGenerator (新增)
│   ├── PartitionInput
│   ├── PartitionPreview
│   └── BatchAddControls
├── PathList (现有)
└── PointsSlider (现有)
```

### 数据流设计

```
用户输入r → 生成算法 → 路径组合列表 → 预览/选择 → 批量添加 → 路径列表更新
```

## 核心算法设计

### 数字划分算法

基于动态规划的递归生成算法：

```typescript
function generatePartitions(target: number, maxValue: number = 3): number[][] {
  const result: number[][] = [];
  
  function backtrack(remaining: number, currentPath: number[], minValue: number) {
    if (remaining === 0) {
      result.push([...currentPath]);
      return;
    }
    
    for (let i = minValue; i <= Math.min(maxValue, remaining); i++) {
      currentPath.push(i);
      backtrack(remaining - i, currentPath, 1); // 允许重复使用1,2,3
      currentPath.pop();
    }
  }
  
  backtrack(target, [], 1);
  return result;
}
```

### 算法复杂度分析

- 时间复杂度：O(3^r)，其中r是目标数字
- 空间复杂度：O(r × 结果数量)
- 对于r=20，预计生成约1000-2000个组合

### 优化策略

1. **记忆化缓存**：缓存已计算的划分结果
2. **增量生成**：支持按需生成，避免一次性计算所有组合
3. **Web Worker**：对于大数字使用后台线程计算

## 用户界面设计

### 组件布局

```
┌─────────────────────────────────┐
│ 数字划分生成器                    │
├─────────────────────────────────┤
│ 输入数字: [____] [预览] [生成]    │
├─────────────────────────────────┤
│ 预览区域 (可折叠)                 │
│ ☑ [1,1,1] ☑ [1,2] ☑ [2,1] ☑ [3] │
│ 共4个组合，选中4个                │
├─────────────────────────────────┤
│ [添加选中路径] [全选] [清空选择]   │
└─────────────────────────────────┘
```

### 交互设计

1. **输入验证**：实时验证输入的有效性
2. **预览展示**：以紧凑的网格形式显示所有组合
3. **批量操作**：提供全选、反选、清空等快捷操作
4. **进度反馈**：显示生成进度和结果统计

## 数据结构设计

### 核心数据类型

```typescript
interface PartitionResult {
  target: number;
  partitions: number[][];
  generatedAt: number;
  count: number;
}

interface PartitionState {
  inputValue: string;
  isGenerating: boolean;
  previewVisible: boolean;
  selectedPartitions: Set<string>;
  lastResult: PartitionResult | null;
  error: string;
}
```

### 缓存策略

```typescript
class PartitionCache {
  private cache = new Map<number, PartitionResult>();
  private maxCacheSize = 20;
  
  get(target: number): PartitionResult | null;
  set(target: number, result: PartitionResult): void;
  clear(): void;
}
```

## 集成设计

### 与现有系统的集成点

1. **路径管理**：复用现有的路径添加和验证逻辑
2. **状态管理**：集成到主应用的状态管理中
3. **国际化**：支持多语言界面
4. **样式系统**：使用现有的Tailwind CSS样式

### API接口设计

```typescript
interface NumberPartitionGeneratorProps {
  onAddPaths: (paths: number[][]) => void;
  existingPaths: number[][];
  disabled: boolean;
  maxPaths: number;
}

interface PartitionGeneratorAPI {
  generatePartitions(target: number): Promise<number[][]>;
  validateInput(input: string): ValidationResult;
  addPathsBatch(paths: number[][]): Promise<AddResult>;
}
```

## 性能考虑

### 性能目标

- r ≤ 10：瞬时响应（<100ms）
- r ≤ 15：快速响应（<500ms）
- r ≤ 20：可接受响应（<2s）

### 优化措施

1. **懒加载**：只在用户需要时才生成预览
2. **虚拟滚动**：对于大量组合使用虚拟列表
3. **防抖处理**：输入防抖避免频繁计算
4. **分页显示**：超过100个组合时分页显示

## 错误处理

### 错误类型和处理策略

1. **输入错误**：
   - 非数字输入：显示格式错误提示
   - 超出范围：显示范围限制提示
   - 空输入：禁用生成按钮

2. **计算错误**：
   - 内存不足：降级到简化算法
   - 超时：提供取消选项
   - 算法异常：显示友好错误信息

3. **集成错误**：
   - 路径添加失败：显示具体失败原因
   - 重复路径：提供跳过或替换选项

## 测试策略

### 单元测试

- 划分算法的正确性测试
- 边界条件测试（r=1, r=20）
- 性能基准测试

### 集成测试

- 与路径管理系统的集成测试
- UI交互测试
- 错误处理测试

### 用户验收测试

- 典型使用场景测试
- 性能和响应性测试
- 可用性测试

## 实现计划

### 第一阶段：核心功能
- 实现基本的划分算法
- 创建输入组件
- 实现批量添加功能

### 第二阶段：用户体验
- 添加预览功能
- 实现选择性添加
- 优化性能和响应性

### 第三阶段：高级功能
- 添加缓存机制
- 实现数学理论展示
- 完善错误处理和用户反馈

## 维护和扩展

### 可扩展性设计

- 支持不同的划分基数（不仅限于{1,2,3}）
- 支持自定义划分规则
- 支持导出和导入划分结果

### 维护考虑

- 算法性能监控
- 用户使用统计
- 错误日志收集