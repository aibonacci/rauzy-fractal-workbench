// 国际化类型定义
export type Language = 'en' | 'zh';

export interface Translations {
  app: {
    title: string;
    loading: string;
  };
  controls: {
    pathInput: {
      label: string;
      placeholder: string;
      addButton: string;
    };
    pathList: {
      title: string;
      empty: string;
      deleteTooltip: string;
      totalPaths: string;
      colorIndicator: string;
      pathInfo: string;
      clearAll: string;
    };
    pointsSlider: {
      label: string;
      unit: string;
      dragging: string;
    };
    partitionGenerator: {
      title: string;
    };
    pathLengthGenerator: {
      title: string;
    };
  };
  dataPanel: {
    title: string;
    noData: string;
    addPathHint: string;
    supportedFormats: string;
    totalAnalyzed: string;
    expand: string;
    collapse: string;
    formatExamples: {
      sequence: string;
      comma: string;
    };
    maxPaths: string;
    pathCard: {
      pathTitle: string;
      colorIndicator: string;
      rValue: string;
      cValue: string;
      coefficients: string;
      firstPointCoords: string;
      positionSequence: string;
    };
  };
  canvas: {
    totalPoints: string;
    renderedPoints: string;
    renderTime: string;
  };
  notifications: {
    calculationComplete: string;
    calculationFailed: string;
    pathAdded: string;
    calculationCanceled: string;
    mathJsLoadFailed: string;
    startingCalculation: string;
    calculating: string;
    baseDataCalculationFailed: string;
    baseDataCalculationError: string;
    pathInvalid: string;
    pathParsingFailed: string;
    pathAlreadyExists: string;
    baseDataNotReady: string;
    pathDataCalculationError: string;
    pointsGenerated: string;
    maxPathsReached: string;
    pathAddedSuccess: string;
    allPathsCleared: string;
  };
  links: {
    liuTheorem: string;
    github: string;
    liuTheoremTooltip: string;
    githubTooltip: string;
  };
  pathLength: {
    input: {
      placeholder: string;
      generateButton: string;
      generating: string;
      hint: string;
      expectedCount: string;
    };
    error: string;
  };
  common: {
    delete: string;
    cancel: string;
    confirm: string;
    loading: string;
    switchLanguage: string;
    currentLanguage: string;
  };
}

export interface I18nContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, params?: Record<string, string>) => string;
}

// 外部链接类型定义
export interface ExternalLinkConfig {
  url: string;
  icon: string;
  target: string;
  rel: string;
}

// 图标尺寸类型
export type IconSize = 'sm' | 'md' | 'lg';

export const LANGUAGE_CONFIG = {
  DEFAULT_LANGUAGE: 'en' as const,
  STORAGE_KEY: 'rauzy-workbench-language',
  SUPPORTED_LANGUAGES: ['en', 'zh'] as const
} as const;

// 外部链接和图标尺寸配置已迁移到配置系统 (src/config/types.ts 和 src/config/defaultConfig.ts)

// UI配置常量已迁移到配置系统 (src/config/types.ts 和 src/config/defaultConfig.ts)