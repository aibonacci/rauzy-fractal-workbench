# Rauzy分形分析工作台

一个基于React的交互式Web应用，用于研究三阶斐波那契（Tribonacci）符号序列的代数性质与其几何体现——劳齐分形（Rauzy Fractal）之间的深刻联系。

## 功能特性

- 🔢 **数学计算引擎**: 实现Tribonacci数列生成和特征值分解算法
- 🎨 **可视化分形**: 基于Canvas的高性能分形渲染
- 📊 **路径分析**: 支持多条复合路径的同时分析和高亮显示
- 🤖 **AI友好**: 为AI agent提供程序化操作接口
- ⚡ **高性能**: 支持10K到1M点数的实时计算

## 技术栈

- **构建工具**: Vite 4.x
- **前端框架**: React 18 (TypeScript)
- **数学计算**: math.js 11.x
- **图形渲染**: HTML5 Canvas API
- **样式系统**: Tailwind CSS 3.x

## 快速开始

### 安装依赖

\`\`\`bash
npm install
\`\`\`

### 启动开发服务器

\`\`\`bash
npm run dev
\`\`\`

### 构建生产版本

\`\`\`bash
npm run build
\`\`\`

## 项目结构

\`\`\`
src/
├── components/          # React组件
│   ├── ControlPanel/   # 左侧控制面板
│   ├── FractalCanvas/  # 中间分形画布
│   └── DataPanel/      # 右侧数据面板
├── utils/              # 工具函数
│   ├── math/          # 数学计算模块
│   └── canvas/        # Canvas渲染工具
├── types/             # TypeScript类型定义
└── App.tsx            # 主应用组件
\`\`\`

## 使用说明

1. **设置点数**: 使用左侧滑块调整分形的总点数（10K-1M）
2. **添加路径**: 在输入框中输入路径字符串（如"1213"），点击添加
3. **查看分形**: 中间画布实时显示分形图形，不同路径用不同颜色高亮
4. **分析数据**: 右侧面板显示每条路径的详细计算数据

## AI Agent接口

应用为AI agent提供标准化的DOM接口：

- \`data-testid="path-input"\`: 路径输入框
- \`data-testid="add-path-button"\`: 添加路径按钮
- \`data-testid="points-slider"\`: 点数控制滑块
- \`data-testid="fractal-canvas"\`: 分形画布
- \`data-testid="data-panel"\`: 数据面板

## 开发指南

### 代码规范

项目使用ESLint和Prettier进行代码格式化，请在提交前运行：

\`\`\`bash
npm run lint
npm run format
\`\`\`

### 测试

\`\`\`bash
npm run test
\`\`\`

## 许可证

MIT License

## 贡献

欢迎提交Issue和Pull Request来改进项目。