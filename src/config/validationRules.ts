/**
 * Configuration validation rules
 * Defines validation rules for all configuration properties
 */

import { ValidationRuleSet, ValidationRule, ConfigValidator } from './validation';

/**
 * Validation rules for the application configuration
 */
export const CONFIG_VALIDATION_RULES: ValidationRuleSet = {
  strict: false, // Allow unknown properties for flexibility
  rules: [
    // Version and metadata
    {
      path: 'version',
      type: 'string',
      required: true,
      pattern: /^\d+\.\d+\.\d+$/,
      description: 'Semantic version string (e.g., "1.0.0")'
    },
    {
      path: 'lastModified',
      type: 'string',
      required: true,
      pattern: /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/,
      description: 'ISO 8601 timestamp'
    },

    // App configuration
    {
      path: 'app.points.min',
      type: 'number',
      required: true,
      min: 1000,
      max: 100000,
      description: 'Minimum number of points for fractal generation'
    },
    {
      path: 'app.points.max',
      type: 'number',
      required: true,
      min: 10000,
      max: 10000000,
      description: 'Maximum number of points for fractal generation'
    },
    {
      path: 'app.points.step',
      type: 'number',
      required: true,
      min: 1000,
      max: 100000,
      description: 'Step size for point slider'
    },
    {
      path: 'app.points.default',
      type: 'number',
      required: true,
      min: 1000,
      max: 10000000,
      validator: (value: number) => {
        // Default should be between min and max (will be validated by ConfigManager)
        return value >= 1000 && value <= 10000000;
      },
      description: 'Default number of points'
    },
    {
      path: 'app.paths.maxCount',
      type: 'number',
      required: true,
      min: 1,
      max: 100000,
      description: 'Maximum number of paths allowed'
    },
    {
      path: 'app.canvas.aspectRatio',
      type: 'number',
      required: true,
      min: 0.5,
      max: 3.0,
      description: 'Canvas aspect ratio (width/height)'
    },
    {
      path: 'app.canvas.defaultWidth',
      type: 'number',
      required: true,
      min: 200,
      max: 4000,
      description: 'Default canvas width in pixels'
    },
    {
      path: 'app.canvas.defaultHeight',
      type: 'number',
      required: true,
      min: 200,
      max: 4000,
      description: 'Default canvas height in pixels'
    },

    // UI configuration - colors
    {
      path: 'ui.colors.base.alpha1',
      type: 'string',
      required: true,
      pattern: /^rgba?\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*(,\s*[\d.]+)?\s*\)$/,
      description: 'Base color with alpha (CSS rgba format)'
    },
    {
      path: 'ui.colors.base.alpha2',
      type: 'string',
      required: true,
      pattern: /^rgba?\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*(,\s*[\d.]+)?\s*\)$/,
      description: 'Base color with alpha (CSS rgba format)'
    },
    {
      path: 'ui.colors.base.alpha3',
      type: 'string',
      required: true,
      pattern: /^rgba?\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*(,\s*[\d.]+)?\s*\)$/,
      description: 'Base color with alpha (CSS rgba format)'
    },
    {
      path: 'ui.colors.highlight',
      type: 'array',
      required: true,
      min: 1,
      max: 20,
      validator: (colors: string[]) => {
        const hexPattern = /^#[0-9A-Fa-f]{6}$/;
        return colors.every(color => hexPattern.test(color)) || 'All highlight colors must be valid hex colors';
      },
      description: 'Array of highlight colors in hex format'
    },
    {
      path: 'ui.colors.axis',
      type: 'string',
      required: true,
      pattern: /^rgba?\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*(,\s*[\d.]+)?\s*\)$/,
      description: 'Axis color (CSS rgba format)'
    },

    // UI configuration - animations
    {
      path: 'ui.animations.transitionDuration',
      type: 'number',
      required: true,
      min: 0,
      max: 2000,
      description: 'Transition duration in milliseconds'
    },
    {
      path: 'ui.animations.debounceDelay',
      type: 'number',
      required: true,
      min: 0,
      max: 2000,
      description: 'Debounce delay in milliseconds'
    },
    {
      path: 'ui.animations.animationEasing',
      type: 'string',
      required: true,
      allowedValues: ['ease', 'ease-in', 'ease-out', 'ease-in-out', 'linear'],
      description: 'CSS animation easing function'
    },

    // UI configuration - notifications
    {
      path: 'ui.notifications.defaultDuration',
      type: 'number',
      required: true,
      min: 1000,
      max: 30000,
      description: 'Default notification duration in milliseconds'
    },
    {
      path: 'ui.notifications.successDuration',
      type: 'number',
      required: true,
      min: 0,
      max: 30000,
      description: 'Success notification duration in milliseconds (0 = no auto-close)'
    },
    {
      path: 'ui.notifications.errorDuration',
      type: 'number',
      required: true,
      min: 0,
      max: 30000,
      description: 'Error notification duration in milliseconds (0 = no auto-close)'
    },
    {
      path: 'ui.notifications.warningDuration',
      type: 'number',
      required: true,
      min: 0,
      max: 30000,
      description: 'Warning notification duration in milliseconds (0 = no auto-close)'
    },
    {
      path: 'ui.notifications.infoDuration',
      type: 'number',
      required: true,
      min: 0,
      max: 30000,
      description: 'Info notification duration in milliseconds (0 = no auto-close)'
    },
    {
      path: 'ui.notifications.maxCount',
      type: 'number',
      required: true,
      min: 1,
      max: 20,
      description: 'Maximum number of notifications to show simultaneously'
    },

    // UI configuration - layout
    {
      path: 'ui.layout.breakpoints.mobile',
      type: 'number',
      required: true,
      min: 320,
      max: 1024,
      description: 'Mobile breakpoint in pixels'
    },
    {
      path: 'ui.layout.breakpoints.tablet',
      type: 'number',
      required: true,
      min: 768,
      max: 1440,
      description: 'Tablet breakpoint in pixels'
    },
    {
      path: 'ui.layout.breakpoints.desktop',
      type: 'number',
      required: true,
      min: 1024,
      max: 2560,
      description: 'Desktop breakpoint in pixels'
    },
    {
      path: 'ui.layout.panelWidths.control',
      type: 'number',
      required: true,
      min: 200,
      max: 500,
      description: 'Control panel width in pixels'
    },
    {
      path: 'ui.layout.panelWidths.data',
      type: 'number',
      required: true,
      min: 250,
      max: 600,
      description: 'Data panel width in pixels'
    },
    {
      path: 'ui.layout.panelWidths.minCanvas',
      type: 'number',
      required: true,
      min: 400,
      max: 1000,
      description: 'Minimum canvas width in pixels'
    },

    // Performance configuration - cache
    {
      path: 'performance.cache.maxSize',
      type: 'number',
      required: true,
      min: 10,
      max: 1000,
      description: 'Maximum cache size (number of entries)'
    },
    {
      path: 'performance.cache.defaultTTL',
      type: 'number',
      required: true,
      min: 60000,
      max: 3600000,
      description: 'Default cache TTL in milliseconds'
    },
    {
      path: 'performance.cache.partitionCacheSize',
      type: 'number',
      required: true,
      min: 5,
      max: 100,
      description: 'Partition cache size (number of entries)'
    },

    // Performance configuration - rendering
    {
      path: 'performance.rendering.webgl.pointSize',
      type: 'number',
      required: true,
      min: 1.0,
      max: 20.0,
      description: 'WebGL point size'
    },
    {
      path: 'performance.rendering.webgl.maxPointSize',
      type: 'number',
      required: true,
      min: 5.0,
      max: 50.0,
      description: 'Maximum WebGL point size'
    },
    {
      path: 'performance.rendering.webgl.lineWidth',
      type: 'number',
      required: true,
      min: 0.5,
      max: 10.0,
      description: 'WebGL line width'
    },
    {
      path: 'performance.rendering.canvas2d.lineWidth',
      type: 'number',
      required: true,
      min: 0.5,
      max: 10.0,
      description: 'Canvas2D line width'
    },
    {
      path: 'performance.rendering.canvas2d.pointRadius',
      type: 'number',
      required: true,
      min: 1.0,
      max: 10.0,
      description: 'Canvas2D point radius'
    },

    // Performance configuration - benchmarks
    {
      path: 'performance.performance.benchmarkThresholds.fast',
      type: 'number',
      required: true,
      min: 10,
      max: 200,
      description: 'Fast performance threshold in milliseconds'
    },
    {
      path: 'performance.performance.benchmarkThresholds.medium',
      type: 'number',
      required: true,
      min: 50,
      max: 500,
      description: 'Medium performance threshold in milliseconds'
    },
    {
      path: 'performance.performance.benchmarkThresholds.slow',
      type: 'number',
      required: true,
      min: 200,
      max: 2000,
      description: 'Slow performance threshold in milliseconds'
    },
    {
      path: 'performance.performance.batchSizes.pathGeneration',
      type: 'number',
      required: true,
      min: 100,
      max: 10000,
      description: 'Batch size for path generation'
    },
    {
      path: 'performance.performance.batchSizes.rendering',
      type: 'number',
      required: true,
      min: 1000,
      max: 50000,
      description: 'Batch size for rendering operations'
    },

    // Development configuration - debug
    {
      path: 'development.debug.enabled',
      type: 'boolean',
      required: true,
      description: 'Enable debug mode'
    },
    {
      path: 'development.debug.logLevel',
      type: 'string',
      required: true,
      allowedValues: ['error', 'warn', 'info', 'debug'],
      description: 'Debug log level'
    },
    {
      path: 'development.debug.showPerformanceMetrics',
      type: 'boolean',
      required: true,
      description: 'Show performance metrics in debug mode'
    },

    // Development configuration - features
    {
      path: 'development.features.hotReload',
      type: 'boolean',
      required: true,
      description: 'Enable configuration hot reload'
    },
    {
      path: 'development.features.configValidation',
      type: 'boolean',
      required: true,
      description: 'Enable configuration validation'
    },
    {
      path: 'development.features.typeChecking',
      type: 'boolean',
      required: true,
      description: 'Enable runtime type checking'
    },

    // Development configuration - test IDs (object validation)
    {
      path: 'development.testIds',
      type: 'object',
      required: true,
      validator: (testIds: Record<string, string>) => {
        if (!testIds || typeof testIds !== 'object') {
          return 'testIds must be an object';
        }
        
        const requiredIds = ['pathInput', 'addPathButton', 'pathList', 'fractalCanvas'];
        const missing = requiredIds.filter(id => !testIds[id]);
        
        if (missing.length > 0) {
          return `Missing required test IDs: ${missing.join(', ')}`;
        }
        
        // Validate that all values are strings
        for (const [key, value] of Object.entries(testIds)) {
          if (typeof value !== 'string' || value.trim() === '') {
            return `Test ID "${key}" must be a non-empty string`;
          }
        }
        
        return true;
      },
      description: 'Test IDs for UI components'
    }
  ]
};

/**
 * Create a validator with the default configuration rules
 */
export function createConfigValidator() {
  return new ConfigValidator(CONFIG_VALIDATION_RULES);
}

/**
 * Validate configuration with cross-field validation
 */
export function validateConfigurationLogic(config: any) {
  const validator = createConfigValidator();
  const result = validator.validate(config);
  
  // Add cross-field validation
  const crossFieldErrors = [];
  
  try {
    // Validate that points.default is between points.min and points.max
    const pointsMin = config?.app?.points?.min;
    const pointsMax = config?.app?.points?.max;
    const pointsDefault = config?.app?.points?.default;
    
    if (typeof pointsMin === 'number' && typeof pointsMax === 'number') {
      if (pointsMin >= pointsMax) {
        crossFieldErrors.push({
          path: 'app.points',
          message: 'points.min must be less than points.max',
          value: { min: pointsMin, max: pointsMax }
        });
      }
      
      if (typeof pointsDefault === 'number') {
        if (pointsDefault < pointsMin || pointsDefault > pointsMax) {
          crossFieldErrors.push({
            path: 'app.points.default',
            message: `points.default (${pointsDefault}) must be between points.min (${pointsMin}) and points.max (${pointsMax})`,
            value: pointsDefault
          });
        }
      }
    }
    
    // Validate that breakpoints are in ascending order
    const mobile = config?.ui?.layout?.breakpoints?.mobile;
    const tablet = config?.ui?.layout?.breakpoints?.tablet;
    const desktop = config?.ui?.layout?.breakpoints?.desktop;
    
    if (typeof mobile === 'number' && typeof tablet === 'number' && typeof desktop === 'number') {
      if (mobile >= tablet) {
        crossFieldErrors.push({
          path: 'ui.layout.breakpoints',
          message: 'mobile breakpoint must be less than tablet breakpoint',
          value: { mobile, tablet }
        });
      }
      if (tablet >= desktop) {
        crossFieldErrors.push({
          path: 'ui.layout.breakpoints',
          message: 'tablet breakpoint must be less than desktop breakpoint',
          value: { tablet, desktop }
        });
      }
    }
    
    // Validate that performance thresholds are in ascending order
    const fast = config?.performance?.performance?.benchmarkThresholds?.fast;
    const medium = config?.performance?.performance?.benchmarkThresholds?.medium;
    const slow = config?.performance?.performance?.benchmarkThresholds?.slow;
    
    if (typeof fast === 'number' && typeof medium === 'number' && typeof slow === 'number') {
      if (fast >= medium) {
        crossFieldErrors.push({
          path: 'performance.performance.benchmarkThresholds',
          message: 'fast threshold must be less than medium threshold',
          value: { fast, medium }
        });
      }
      if (medium >= slow) {
        crossFieldErrors.push({
          path: 'performance.performance.benchmarkThresholds',
          message: 'medium threshold must be less than slow threshold',
          value: { medium, slow }
        });
      }
    }
  } catch (error) {
    crossFieldErrors.push({
      path: 'configuration',
      message: `Cross-field validation error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      value: config
    });
  }
  
  return {
    isValid: result.isValid && crossFieldErrors.length === 0,
    errors: [...result.errors, ...crossFieldErrors],
    warnings: result.warnings
  };
}