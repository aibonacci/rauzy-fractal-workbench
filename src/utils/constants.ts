// 颜色常量定义
export const BASE_COLORS_ALPHA = {
  '1': 'rgba(209, 213, 219, 0.5)',
  '2': 'rgba(209, 213, 219, 0.35)',
  '3': 'rgba(209, 213, 219, 0.2)'
} as const;

// 多路径高亮的颜色调色板
export const HIGHLIGHT_PALETTE = [
  '#FBBF24', '#F87171', '#34D399', '#818CF8', '#F472B6', '#60A5FA'
] as const;

// 坐标轴颜色
export const AXIS_COLOR = 'rgba(255, 255, 255, 0.2)';

// AI Agent友好的测试ID常量
export const TEST_IDS = {
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

// 应用配置常量
export const APP_CONFIG = {
  MIN_POINTS: 10000,
  MAX_POINTS: 1000000,
  POINTS_STEP: 10000,
  DEFAULT_POINTS: 50000,
  MAX_PATHS: 300,
  CANVAS_ASPECT_RATIO: 4 / 3
} as const;