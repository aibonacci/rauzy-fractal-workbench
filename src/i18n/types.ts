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
    };
    pointsSlider: {
      label: string;
      unit: string;
      dragging: string;
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
  };
  links: {
    liuTheorem: string;
    github: string;
    liuTheoremTooltip: string;
    githubTooltip: string;
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

// 外部链接配置常量
export const EXTERNAL_LINKS = {
  LIU_THEOREM: {
    url: 'https://placeholder-liu-theorem.com', // 占位符链接
    icon: 'AcademicCapIcon',
    target: '_blank',
    rel: 'noopener noreferrer'
  },
  GITHUB: {
    url: 'https://github.com/your-username/rauzy-fractal-workbench',
    icon: 'CodeBracketIcon', 
    target: '_blank',
    rel: 'noopener noreferrer'
  }
} as const;

// 图标按钮尺寸配置
export const ICON_SIZES = {
  sm: 'w-6 h-6',
  md: 'w-8 h-8',
  lg: 'w-10 h-10'
} as const;

// 通用UI配置常量
export const UI_CONFIG = {
  TRANSITION_DURATION: 200, // 毫秒
  DEBOUNCE_DELAY: 300, // 毫秒
  TOAST_DURATION: 3000, // 毫秒
  ANIMATION_EASING: 'ease-in-out'
} as const;