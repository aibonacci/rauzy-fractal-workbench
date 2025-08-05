import { Translations } from '../types';

export const zh: Translations = {
  app: {
    title: "Rauzy 分形工作台",
    loading: "加载中..."
  },
  controls: {
    pathInput: {
      label: "构建路径 (例如: 1213)",
      placeholder: "输入路径，如: 1213 或 1,2,1,3",
      addButton: "添加路径到列表"
    },
    pathList: {
      title: "路径列表",
      empty: "尚未添加路径。请在上方添加路径开始分析。",
      deleteTooltip: "删除路径",
      totalPaths: "总路径数: {count}",
      colorIndicator: "路径颜色指示器",
      pathInfo: "路径: {path}, 权重: {weight}",
      clearAll: "清空所有路径"
    },
    pointsSlider: {
      label: "点数",
      unit: "个点",
      dragging: "拖拽中: {value} 个点"
    },
    partitionGenerator: {
      title: "数字划分生成器"
    },
    pathLengthGenerator: {
      title: "路径长度生成器"
    }
  },
  dataPanel: {
    title: "分析数据",
    noData: "暂无分析数据",
    addPathHint: "添加路径以查看分析结果",
    supportedFormats: "支持格式:",
    totalAnalyzed: "已分析总数: {count} 条路径",
    expand: "展开数据面板",
    collapse: "收起数据面板",
    formatExamples: {
      sequence: "数字序列: 123, 132, 213",
      comma: "逗号分隔: 1,2,3 或 1, 2, 3"
    },
    maxPaths: "最多支持 300 条路径",
    pathCard: {
      pathTitle: "路径 ({path})",
      colorIndicator: "路径颜色指示器",
      rValue: "r值:",
      cValue: "C值:",
      coefficients: "系数:",
      firstPointCoords: "首项坐标:",
      positionSequence: "位置数列 ({count}项):"
    }
  },
  canvas: {
    totalPoints: "总点数: {count}",
    renderedPoints: "已渲染: {count}",
    renderTime: "渲染时间: {time}毫秒",
    renderMode: "模式: {mode}"
  },
  notifications: {
    calculationComplete: "计算成功完成",
    calculationFailed: "计算失败，请重试。",
    pathAdded: "路径已添加到分析列表",
    calculationCanceled: "计算已取消",
    mathJsLoadFailed: "Math.js 库加载失败",
    startingCalculation: "开始计算...",
    calculating: "计算中...",
    baseDataCalculationFailed: "基础数据计算失败",
    baseDataCalculationError: "计算基础数据时出错，请重试",
    pathInvalid: "路径无效",
    pathParsingFailed: "路径解析失败",
    pathAlreadyExists: "该路径已存在",
    baseDataNotReady: "基础数据未准备好，请稍候",
    pathDataCalculationError: "计算路径数据时出错",
    pointsGenerated: "已生成 {count} 个分形点",
    maxPathsReached: "最多只能添加 {maxPaths} 条路径",
    pathAddedSuccess: "路径 ({path}) 已成功添加到分析列表",
    allPathsCleared: "已清空 {count} 条路径"
  },
  links: {
    liuTheorem: "刘氏定理",
    github: "GitHub 仓库",
    liuTheoremTooltip: "了解刘氏定理 (在新标签页打开)",
    githubTooltip: "在 GitHub 上查看源代码 (在新标签页打开)"
  },
  partition: {
    input: {
      label: "数字划分生成器",
      placeholder: "输入数字 (1-20)",
      previewButton: "预览",
      generateButton: "生成并添加",
      generating: "生成中...",
      hint: "生成数字基于{1,2,3}的所有可能划分",
      emptyError: "请输入数字",
      formatError: "请输入有效的整数",
      positiveError: "数字必须为正数",
      rangeError: "数字必须在1到20之间"
    },
    preview: {
      title: "划分预览",
      count: "找到 {count} 个划分",
      selectAll: "全选",
      selectNone: "全不选",
      addSelected: "添加选中项 ({count})",
      collapse: "收起",
      expand: "展开"
    },
    batch: {
      addAll: "添加所有划分",
      addSelected: "添加选中项",
      selectAll: "全选",
      selectNone: "全不选",
      clearSelection: "清空选择",
      progress: "正在添加 {current} / {total}...",
      success: "成功添加 {count} 个划分",
      skipped: "跳过 {count} 个重复划分",
      error: "添加划分失败"
    }
  },
  pathLength: {
    input: {
      placeholder: "输入路径长度 (1-10)",
      generateButton: "生成并添加",
      generating: "生成中...",
      hint: "生成指定长度的所有可能路径，使用{1,2,3}",
      expectedCount: "将生成 {count} 条路径"
    },
    error: "生成路径失败"
  },
  common: {
    delete: "删除",
    cancel: "取消",
    confirm: "确认",
    loading: "加载中",
    switchLanguage: "切换语言",
    currentLanguage: "当前语言: {lang}"
  }
};