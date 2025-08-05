/**
 * 默认配置定义
 * 包含所有配置项的默认值，确保系统始终可用
 */

import { AppConfiguration } from './types';

export const DEFAULT_CONFIG: AppConfiguration = {
  version: '1.0.0',
  lastModified: new Date().toISOString(),
  
  // 应用核心配置
  app: {
    points: {
      min: 10000,
      max: 2000000,
      step: 10000,
      default: 50000
    },
    paths: {
      maxCount: 20000
    },
    canvas: {
      aspectRatio: 4 / 3, // 1.333...
      defaultWidth: 800,
      defaultHeight: 600
    }
  },

  // UI和视觉配置
  ui: {
    colors: {
      base: {
        alpha1: 'rgba(209, 213, 219, 0.5)',
        alpha2: 'rgba(209, 213, 219, 0.35)',
        alpha3: 'rgba(209, 213, 219, 0.2)'
      },
      highlight: [
        '#FBBF24', '#F87171', '#34D399', 
        '#818CF8', '#F472B6', '#60A5FA'
      ],
      axis: 'rgba(255, 255, 255, 0.2)'
    },
    animations: {
      transitionDuration: 200, // 毫秒
      debounceDelay: 300, // 毫秒
      animationEasing: 'ease-in-out'
    },
    notifications: {
      defaultDuration: 3000, // 毫秒
      successDuration: 2000, // 毫秒
      errorDuration: 0, // 不自动消失
      warningDuration: 3000, // 毫秒
      infoDuration: 3000, // 毫秒
      maxCount: 5
    },
    layout: {
      breakpoints: {
        mobile: 768,
        tablet: 1024,
        desktop: 1240
      },
      panelWidths: {
        control: 280,
        data: 360,
        minCanvas: 600
      }
    },
    external: {
      links: {
        liuTheorem: {
          url: 'https://placeholder-liu-theorem.com',
          icon: 'AcademicCapIcon',
          target: '_blank',
          rel: 'noopener noreferrer'
        },
        github: {
          url: 'https://github.com/your-username/rauzy-fractal-workbench',
          icon: 'CodeBracketIcon',
          target: '_blank',
          rel: 'noopener noreferrer'
        }
      },
      iconSizes: {
        sm: 'w-6 h-6',
        md: 'w-8 h-8',
        lg: 'w-10 h-10'
      }
    }
  },

  // 性能和缓存配置
  performance: {
    cache: {
      maxSize: 100, // 最大缓存条目数
      defaultTTL: 300000, // 5分钟 (5 * 60 * 1000)
      partitionCacheSize: 20
    },
    rendering: {
      webgl: {
        pointSize: 3.0,
        maxPointSize: 10.0,
        lineWidth: 2.0
      },
      canvas2d: {
        lineWidth: 1.0,
        pointRadius: 2.0
      }
    },
    performance: {
      benchmarkThresholds: {
        fast: 50, // 毫秒
        medium: 100, // 毫秒
        slow: 500 // 毫秒
      },
      batchSizes: {
        pathGeneration: 1000,
        rendering: 5000
      }
    }
  },

  // 开发和测试配置
  development: {
    testIds: {
      pathInput: 'path-input',
      addPathButton: 'add-path-button',
      pathList: 'path-list',
      pathItem: 'path-item',
      deletePathButton: 'delete-path-button',
      pointsSlider: 'points-slider',
      fractalCanvas: 'fractal-canvas',
      dataPanel: 'data-panel',
      pathDataCard: 'path-data-card',
      loadingIndicator: 'loading-indicator'
    },
    debug: {
      enabled: false,
      logLevel: 'warn',
      showPerformanceMetrics: false
    },
    features: {
      hotReload: true,
      configValidation: true,
      typeChecking: true
    },
    language: {
      defaultLanguage: 'en',
      storageKey: 'rauzy-workbench-language',
      supportedLanguages: ['en', 'zh'] as const
    }
  }
};

// 导出各个配置部分的默认值，便于单独使用
export const DEFAULT_APP_CONFIG = DEFAULT_CONFIG.app;
export const DEFAULT_UI_CONFIG = DEFAULT_CONFIG.ui;
export const DEFAULT_PERFORMANCE_CONFIG = DEFAULT_CONFIG.performance;
export const DEFAULT_DEVELOPMENT_CONFIG = DEFAULT_CONFIG.development;