# Rauzy 分形分析工作台

一个基于React的交互式Web应用，用于研究三阶斐波那契（Tribonacci）符号序列的代数性质与其几何体现——劳齐分形（Rauzy Fractal）之间的深刻联系。

## ✨ 特性

- 🎯 **专业级可视化**: 高性能Canvas渲染，支持百万级点数的分形显示
- 🔬 **刘氏定理计算**: 精确实现复合路径的数学分析算法
- 🎨 **多路径高亮**: 同时分析多条路径，每条路径使用不同颜色标识
- 🤖 **AI Agent友好**: 标准化DOM结构，支持程序化操作和自动化研究
- ⚡ **性能优化**: 智能缓存、视口裁剪、批量渲染等多重优化
- 📱 **响应式设计**: 适配不同屏幕尺寸的三栏式专业布局

## 🚀 快速开始

### 环境要求

- Node.js 18.0+ 或 20.0+
- 现代浏览器（Chrome 90+, Firefox 88+, Safari 14+）
- 内存建议 4GB 以上（用于大规模计算）

### 安装和运行

```bash
# 克隆项目
git clone https://github.com/your-username/rauzy-fractal-workbench.git
cd rauzy-fractal-workbench

# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build

# 预览生产版本
npm run preview
```

### 在线体验

访问 [Rauzy 分形工作台在线版](https://your-username.github.io/rauzy-fractal-workbench)

## 📖 使用指南

### 基础操作

1. **设置点数**: 使用左侧滑块调整分形的总点数（10K - 1M）
2. **添加路径**: 在路径输入框中输入数字序列（如：1213）
3. **查看分析**: 右侧面板显示每条路径的详细数学数据
4. **多路径对比**: 添加多条路径进行对比分析

### 路径格式

- 支持格式：`1213` 或 `1,2,1,3`
- 只能包含数字 1、2、3
- 最多支持 100 条路径同时分析

### 数据解读

- **r值**: 路径的总权重
- **C值**: 刘氏定理中的常数项
- **系数**: α₁, α₂, α₃ 主项系数
- **首项坐标**: 路径对应点集的第一个点坐标
- **位置数列**: 复合位置函数的计算结果

## 🤖 AI Agent API

本应用为AI Agent提供了完整的程序化操作接口：

### 基础操作

```javascript
// 添加路径
await AgentOperationHelper.addPath('1213');

// 设置点数
await AgentOperationHelper.setPointCount(200000);

// 等待计算完成
await AgentOperationHelper.waitForCalculation();

// 获取当前路径列表
const paths = AgentOperationHelper.getCurrentPaths();

// 删除路径
await AgentOperationHelper.removePath(0);
```

### 状态监听

```javascript
// 监听状态变化
window.onRauzyStateChange((event) => {
  console.log('状态变化:', event.type, event.payload);
});

// 支持的事件类型
// - PATH_ADDED: 路径添加
// - PATH_REMOVED: 路径删除  
// - CALCULATION_COMPLETE: 计算完成
// - POINTS_UPDATED: 点数更新
// - ERROR_OCCURRED: 错误发生
```

### 数据获取

```javascript
// 获取Canvas图像数据
const imageData = AgentOperationHelper.getCanvasImageData();

// 获取路径数据
const pathData = AgentOperationHelper.getPathData(0);

// 检查加载状态
const isLoading = AgentOperationHelper.isLoading();
```

## 🏗️ 技术架构

### 核心技术栈

- **前端框架**: React 18 + TypeScript
- **构建工具**: Vite 7.x
- **数学计算**: Math.js 14.x
- **图形渲染**: HTML5 Canvas API
- **样式系统**: Tailwind CSS 4.x
- **测试框架**: Vitest + Testing Library

### 架构设计

```
用户输入 → 状态管理 → 数学计算引擎 → 数据处理 → 渲染层
    ↓           ↓            ↓           ↓        ↓
  路径输入   React State   核心算法    数据转换   Canvas绘制
  点数调整   useMemo      刘氏定理    高亮处理   DOM更新
```

### 性能优化

- **计算缓存**: 智能缓存重复计算结果
- **视口裁剪**: 只渲染可见区域的点
- **批量绘制**: 按颜色分组批量绘制点
- **异步处理**: 避免UI阻塞的异步计算
- **内存管理**: 自动清理和垃圾回收

## 🧪 开发和测试

### 开发命令

```bash
# 开发模式
npm run dev

# 类型检查
npm run type-check

# 代码检查
npm run lint
npm run lint:fix

# 运行测试
npm run test
npm run test:run
npm run test:ui
```

### 测试覆盖

- ✅ 数学算法单元测试
- ✅ React组件渲染测试  
- ✅ AI Agent交互测试
- ✅ 性能基准测试
- ✅ 错误边界测试

### 代码质量

- ESLint + Prettier 代码格式化
- Husky + lint-staged 提交前检查
- Commitlint 提交信息规范
- TypeScript 严格类型检查

## 📚 数学背景

### Tribonacci 序列

三阶斐波那契数列定义为：F(n) = F(n-1) + F(n-2) + F(n-3)

### Rauzy 分形

通过Tribonacci替换规则生成的几何分形：
- 1 → 12
- 2 → 13  
- 3 → 1

### 刘氏定理

描述复合路径与几何点集对应关系的数学定理，本应用提供了该定理的完整实现。

## 🤝 贡献指南

### 提交规范

使用 [Conventional Commits](https://conventionalcommits.org/) 规范：

```
feat: 添加新功能
fix: 修复bug
docs: 更新文档
style: 代码格式调整
refactor: 代码重构
perf: 性能优化
test: 添加测试
chore: 构建工具变更
```

### 开发流程

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m 'feat: add amazing feature'`)
4. 推送分支 (`git push origin feature/amazing-feature`)
5. 创建 Pull Request

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 🙏 致谢

- 感谢数学研究社区对Rauzy分形理论的贡献
- 感谢开源社区提供的优秀工具和库
- 特别感谢刘氏定理的数学基础研究

## 📞 联系方式

- 项目主页: [GitHub Repository](https://github.com/your-username/rauzy-fractal-workbench)
- 问题反馈: [Issues](https://github.com/your-username/rauzy-fractal-workbench/issues)
- 功能建议: [Discussions](https://github.com/your-username/rauzy-fractal-workbench/discussions)

---

**Rauzy 分形分析工作台** - 让数学之美可视化 ✨