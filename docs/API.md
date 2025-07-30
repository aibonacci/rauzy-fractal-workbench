# AI Agent API 文档

本文档详细描述了 Rauzy 分形分析工作台为 AI Agent 提供的程序化操作接口。

## 概述

Rauzy 分形工作台提供了完整的 AI Agent 友好接口，支持：

- 程序化操作用户界面
- 状态变化监听
- 数据获取和分析
- 错误处理和恢复

## 核心类：AgentOperationHelper

### 路径操作

#### `addPath(pathString: string): Promise<boolean>`

添加新的分析路径。

**参数:**
- `pathString`: 路径字符串，支持格式 "1213" 或 "1,2,1,3"

**返回值:**
- `Promise<boolean>`: 操作是否成功

**示例:**
```javascript
// 添加路径
const success = await AgentOperationHelper.addPath('1213');
if (success) {
  console.log('路径添加成功');
} else {
  console.log('路径添加失败');
}
```

**错误情况:**
- 路径格式无效
- 路径已存在
- 达到最大路径数限制（100条）
- 基础数据未准备好

#### `removePath(pathIndex: number): Promise<boolean>`

删除指定索引的路径。

**参数:**
- `pathIndex`: 路径在列表中的索引（从0开始）

**返回值:**
- `Promise<boolean>`: 操作是否成功

**示例:**
```javascript
// 删除第一条路径
const success = await AgentOperationHelper.removePath(0);
```

### 点数控制

#### `setPointCount(count: number): Promise<boolean>`

设置分形的总点数。

**参数:**
- `count`: 点数，范围 10,000 - 1,000,000

**返回值:**
- `Promise<boolean>`: 操作是否成功

**示例:**
```javascript
// 设置为50万个点
await AgentOperationHelper.setPointCount(500000);
```

#### `getCurrentPointCount(): number | null`

获取当前设置的点数。

**返回值:**
- `number | null`: 当前点数，如果获取失败返回null

### 状态查询

#### `getCurrentPaths(): string[]`

获取当前所有路径的字符串表示。

**返回值:**
- `string[]`: 路径字符串数组

**示例:**
```javascript
const paths = AgentOperationHelper.getCurrentPaths();
console.log('当前路径:', paths); // ['1,2,1,3', '2,3,1']
```

#### `isLoading(): boolean`

检查应用是否正在进行计算。

**返回值:**
- `boolean`: 是否正在加载

#### `getPathData(pathIndex: number): PathData | null`

获取指定路径的详细数据。

**参数:**
- `pathIndex`: 路径索引

**返回值:**
- `PathData | null`: 路径数据对象或null

**PathData 结构:**
```typescript
interface PathData {
  path: number[];           // 路径数组
  rp: number;              // 总权重
  coeffs: {                // 系数
    1: number;
    2: number; 
    3: number;
  };
  cl: number;              // 常数项
  sequence: number[];      // 位置数列
  firstPointCoords: {      // 首项坐标
    re: number;
    im: number;
  } | null;
}
```

### 等待操作

#### `waitForCalculation(timeout?: number): Promise<void>`

等待当前计算完成。

**参数:**
- `timeout`: 超时时间（毫秒），默认30秒

**返回值:**
- `Promise<void>`: 计算完成时resolve

**示例:**
```javascript
// 等待计算完成
try {
  await AgentOperationHelper.waitForCalculation();
  console.log('计算完成');
} catch (error) {
  console.log('计算超时');
}
```

#### `waitForPathCount(expectedCount: number, timeout?: number): Promise<boolean>`

等待路径数量达到指定值。

**参数:**
- `expectedCount`: 期望的路径数量
- `timeout`: 超时时间（毫秒），默认10秒

**返回值:**
- `Promise<boolean>`: 是否在超时前达到期望数量

### Canvas 数据

#### `getCanvasImageData(): ImageData | null`

获取Canvas的图像数据。

**返回值:**
- `ImageData | null`: Canvas图像数据或null

**示例:**
```javascript
const imageData = AgentOperationHelper.getCanvasImageData();
if (imageData) {
  console.log('图像尺寸:', imageData.width, 'x', imageData.height);
}
```

## 事件系统

### 全局事件监听

使用 `window.onRauzyStateChange` 监听应用状态变化：

```javascript
window.onRauzyStateChange((event) => {
  console.log('事件类型:', event.type);
  console.log('事件数据:', event.payload);
  console.log('时间戳:', event.timestamp);
});
```

### 事件类型

#### `PATH_ADDED`
路径添加事件

**Payload:**
```typescript
{
  path: number[];        // 添加的路径
  pathData: PathData;    // 路径数据
  totalPaths: number;    // 总路径数
}
```

#### `PATH_REMOVED`
路径删除事件

**Payload:**
```typescript
{
  path: number[];        // 删除的路径
  index: number;         // 删除的索引
  remainingPaths: number; // 剩余路径数
}
```

#### `CALCULATION_COMPLETE`
计算完成事件

**Payload:**
```typescript
{
  numPoints: number;     // 点数
  pathCount: number;     // 路径数量
}
```

#### `POINTS_UPDATED`
点数更新事件

**Payload:**
```typescript
{
  numPoints: number;     // 新的点数
}
```

#### `ERROR_OCCURRED`
错误发生事件

**Payload:**
```typescript
{
  error: string;         // 错误信息
  context: string;       // 错误上下文
  stack?: string;        // 错误堆栈（开发模式）
}
```

## DOM 元素标识

所有关键UI元素都有标准化的 `data-testid` 属性：

### 输入控件
- `path-input`: 路径输入框
- `add-path-button`: 添加路径按钮
- `points-slider`: 点数滑块

### 显示元素
- `path-list`: 路径列表容器
- `path-item-{index}`: 路径项（index为索引）
- `delete-path-button-{index}`: 删除按钮
- `fractal-canvas`: 分形画布
- `data-panel`: 数据面板
- `path-data-card-{index}`: 路径数据卡片
- `loading-indicator`: 加载指示器

## 使用示例

### 完整的自动化流程

```javascript
async function automatedAnalysis() {
  try {
    // 1. 设置点数
    await AgentOperationHelper.setPointCount(100000);
    
    // 2. 等待基础计算完成
    await AgentOperationHelper.waitForCalculation();
    
    // 3. 添加多条路径
    const paths = ['1213', '2131', '3121'];
    for (const path of paths) {
      await AgentOperationHelper.addPath(path);
    }
    
    // 4. 等待所有路径添加完成
    await AgentOperationHelper.waitForPathCount(3);
    
    // 5. 获取分析结果
    const results = [];
    for (let i = 0; i < 3; i++) {
      const pathData = AgentOperationHelper.getPathData(i);
      if (pathData) {
        results.push({
          path: pathData.path.join(','),
          weight: pathData.rp,
          constant: pathData.cl,
          sequenceLength: pathData.sequence.length
        });
      }
    }
    
    console.log('分析结果:', results);
    
    // 6. 获取可视化数据
    const imageData = AgentOperationHelper.getCanvasImageData();
    if (imageData) {
      console.log('已获取分形图像数据');
    }
    
  } catch (error) {
    console.error('自动化分析失败:', error);
  }
}

// 运行自动化分析
automatedAnalysis();
```

### 实时监控

```javascript
// 监控应用状态
let pathCount = 0;
let calculationCount = 0;

window.onRauzyStateChange((event) => {
  switch (event.type) {
    case 'PATH_ADDED':
      pathCount++;
      console.log(`路径已添加，当前总数: ${pathCount}`);
      break;
      
    case 'PATH_REMOVED':
      pathCount--;
      console.log(`路径已删除，当前总数: ${pathCount}`);
      break;
      
    case 'CALCULATION_COMPLETE':
      calculationCount++;
      console.log(`计算完成 #${calculationCount}，点数: ${event.payload.numPoints}`);
      break;
      
    case 'ERROR_OCCURRED':
      console.error('发生错误:', event.payload.error);
      break;
  }
});
```

## 错误处理

### 常见错误类型

1. **元素未找到**: DOM元素不存在或未加载
2. **操作超时**: 等待操作超过指定时间
3. **输入验证失败**: 路径格式错误或参数无效
4. **计算错误**: 数学计算过程中的错误
5. **状态不一致**: 应用状态异常

### 错误处理策略

```javascript
async function robustOperation() {
  const maxRetries = 3;
  let retries = 0;
  
  while (retries < maxRetries) {
    try {
      await AgentOperationHelper.addPath('1213');
      break; // 成功，退出循环
    } catch (error) {
      retries++;
      console.warn(`操作失败，重试 ${retries}/${maxRetries}:`, error.message);
      
      if (retries >= maxRetries) {
        throw new Error(`操作失败，已重试 ${maxRetries} 次`);
      }
      
      // 等待一段时间后重试
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
}
```

## 性能考虑

### 批量操作

```javascript
// 推荐：批量添加路径
async function addMultiplePaths(paths) {
  for (const path of paths) {
    await AgentOperationHelper.addPath(path);
    // 短暂延迟避免过载
    await new Promise(resolve => setTimeout(resolve, 100));
  }
}

// 不推荐：并发添加（可能导致竞态条件）
// Promise.all(paths.map(path => AgentOperationHelper.addPath(path)));
```

### 内存管理

```javascript
// 定期清理大量数据
async function longRunningAnalysis() {
  for (let i = 0; i < 100; i++) {
    // 执行分析
    await performAnalysis();
    
    // 每10次清理一次
    if (i % 10 === 0) {
      // 清理路径
      const currentPaths = AgentOperationHelper.getCurrentPaths();
      for (let j = currentPaths.length - 1; j >= 0; j--) {
        await AgentOperationHelper.removePath(j);
      }
    }
  }
}
```

## 调试技巧

### 启用详细日志

```javascript
// 在控制台中启用调试模式
window.RAUZY_DEBUG = true;

// 监听所有事件
window.onRauzyStateChange((event) => {
  console.log('[DEBUG]', event);
});
```

### 状态检查

```javascript
// 检查应用状态
function checkAppState() {
  return {
    isLoading: AgentOperationHelper.isLoading(),
    pathCount: AgentOperationHelper.getCurrentPaths().length,
    pointCount: AgentOperationHelper.getCurrentPointCount(),
    hasCanvas: !!AgentOperationHelper.getCanvasImageData()
  };
}

console.log('应用状态:', checkAppState());
```

这个API文档为AI Agent提供了完整的操作指南，支持复杂的自动化数学研究工作流。