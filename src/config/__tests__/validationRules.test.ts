/**
 * Unit tests for configuration validation rules
 */

import { describe, it, expect } from 'vitest';
import { 
  CONFIG_VALIDATION_RULES, 
  createConfigValidator, 
  validateConfigurationLogic 
} from '../validationRules';

describe('Configuration Validation Rules', () => {
  const validator = createConfigValidator();

  describe('Rule Set Structure', () => {
    it('should have the correct structure', () => {
      expect(CONFIG_VALIDATION_RULES).toBeDefined();
      expect(CONFIG_VALIDATION_RULES.rules).toBeInstanceOf(Array);
      expect(CONFIG_VALIDATION_RULES.rules.length).toBeGreaterThan(0);
      expect(CONFIG_VALIDATION_RULES.strict).toBe(false);
    });

    it('should have all required rule properties', () => {
      CONFIG_VALIDATION_RULES.rules.forEach(rule => {
        expect(rule.path).toBeDefined();
        expect(rule.type).toBeDefined();
        expect(['number', 'string', 'boolean', 'array', 'object']).toContain(rule.type);
      });
    });
  });

  describe('Version and Metadata Validation', () => {
    it('should validate version format', () => {
      const validConfig = { version: '1.2.3', lastModified: '2025-01-08T10:00:00Z' };
      const result = validator.validate(validConfig);
      expect(result.errors.filter(e => e.path === 'version')).toHaveLength(0);

      const invalidConfig = { version: '1.2', lastModified: '2025-01-08T10:00:00Z' };
      const invalidResult = validator.validate(invalidConfig);
      expect(invalidResult.errors.some(e => e.path === 'version')).toBe(true);
    });

    it('should validate ISO timestamp format', () => {
      const validConfig = { 
        version: '1.0.0', 
        lastModified: '2025-01-08T10:00:00.123Z' 
      };
      const result = validator.validate(validConfig);
      expect(result.errors.filter(e => e.path === 'lastModified')).toHaveLength(0);

      const invalidConfig = { 
        version: '1.0.0', 
        lastModified: 'invalid-date' 
      };
      const invalidResult = validator.validate(invalidConfig);
      expect(invalidResult.errors.some(e => e.path === 'lastModified')).toBe(true);
    });
  });

  describe('App Configuration Validation', () => {
    it('should validate points configuration', () => {
      const validConfig = {
        app: {
          points: {
            min: 10000,
            max: 2000000,
            step: 10000,
            default: 50000
          }
        }
      };
      const result = validator.validate(validConfig);
      const pointsErrors = result.errors.filter(e => e.path.startsWith('app.points'));
      expect(pointsErrors).toHaveLength(0);
    });

    it('should reject invalid points ranges', () => {
      const invalidConfig = {
        app: {
          points: {
            min: -1000, // Below minimum
            max: 20000000, // Above maximum
            step: 500, // Below minimum
            default: 500 // Below minimum
          }
        }
      };
      const result = validator.validate(invalidConfig);
      const pointsErrors = result.errors.filter(e => e.path.startsWith('app.points'));
      expect(pointsErrors.length).toBeGreaterThan(0);
    });

    it('should validate paths configuration', () => {
      const validConfig = {
        app: {
          paths: { maxCount: 1000 }
        }
      };
      const result = validator.validate(validConfig);
      expect(result.errors.filter(e => e.path === 'app.paths.maxCount')).toHaveLength(0);

      const invalidConfig = {
        app: {
          paths: { maxCount: 0 } // Below minimum
        }
      };
      const invalidResult = validator.validate(invalidConfig);
      expect(invalidResult.errors.some(e => e.path === 'app.paths.maxCount')).toBe(true);
    });

    it('should validate canvas configuration', () => {
      const validConfig = {
        app: {
          canvas: {
            aspectRatio: 1.333,
            defaultWidth: 800,
            defaultHeight: 600
          }
        }
      };
      const result = validator.validate(validConfig);
      const canvasErrors = result.errors.filter(e => e.path.startsWith('app.canvas'));
      expect(canvasErrors).toHaveLength(0);
    });
  });

  describe('UI Configuration Validation', () => {
    it('should validate color formats', () => {
      const validConfig = {
        ui: {
          colors: {
            base: {
              alpha1: 'rgba(209, 213, 219, 0.5)',
              alpha2: 'rgb(209, 213, 219)',
              alpha3: 'rgba(209, 213, 219, 0.2)'
            },
            highlight: ['#FBBF24', '#F87171', '#34D399'],
            axis: 'rgba(255, 255, 255, 0.2)'
          }
        }
      };
      const result = validator.validate(validConfig);
      const colorErrors = result.errors.filter(e => e.path.startsWith('ui.colors'));
      expect(colorErrors).toHaveLength(0);
    });

    it('should reject invalid color formats', () => {
      const invalidConfig = {
        ui: {
          colors: {
            base: {
              alpha1: 'invalid-color',
              alpha2: 'rgb(300, 400, 500)', // Invalid RGB values
              alpha3: 'rgba(209, 213, 219)' // Missing alpha
            },
            highlight: ['#INVALID', 'not-a-color'],
            axis: '#GGGGGG' // Invalid hex
          }
        }
      };
      const result = validator.validate(invalidConfig);
      const colorErrors = result.errors.filter(e => e.path.startsWith('ui.colors'));
      expect(colorErrors.length).toBeGreaterThan(0);
    });

    it('should validate animation configuration', () => {
      const validConfig = {
        ui: {
          animations: {
            transitionDuration: 200,
            debounceDelay: 300,
            animationEasing: 'ease-in-out'
          }
        }
      };
      const result = validator.validate(validConfig);
      const animationErrors = result.errors.filter(e => e.path.startsWith('ui.animations'));
      expect(animationErrors).toHaveLength(0);

      const invalidConfig = {
        ui: {
          animations: {
            transitionDuration: -100, // Below minimum
            debounceDelay: 3000, // Above maximum
            animationEasing: 'invalid-easing' // Not in allowed values
          }
        }
      };
      const invalidResult = validator.validate(invalidConfig);
      const invalidAnimationErrors = invalidResult.errors.filter(e => e.path.startsWith('ui.animations'));
      expect(invalidAnimationErrors.length).toBeGreaterThan(0);
    });

    it('should validate notification configuration', () => {
      const validConfig = {
        ui: {
          notifications: {
            defaultDuration: 3000,
            successDuration: 2000,
            errorDuration: 0, // 0 means no auto-close
            warningDuration: 3000,
            infoDuration: 3000,
            maxCount: 5
          }
        }
      };
      const result = validator.validate(validConfig);
      const notificationErrors = result.errors.filter(e => e.path.startsWith('ui.notifications'));
      expect(notificationErrors).toHaveLength(0);
    });

    it('should validate layout configuration', () => {
      const validConfig = {
        ui: {
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
          }
        }
      };
      const result = validator.validate(validConfig);
      const layoutErrors = result.errors.filter(e => e.path.startsWith('ui.layout'));
      expect(layoutErrors).toHaveLength(0);
    });
  });

  describe('Performance Configuration Validation', () => {
    it('should validate cache configuration', () => {
      const validConfig = {
        performance: {
          cache: {
            maxSize: 100,
            defaultTTL: 300000,
            partitionCacheSize: 20
          }
        }
      };
      const result = validator.validate(validConfig);
      const cacheErrors = result.errors.filter(e => e.path.startsWith('performance.cache'));
      expect(cacheErrors).toHaveLength(0);
    });

    it('should validate rendering configuration', () => {
      const validConfig = {
        performance: {
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
          }
        }
      };
      const result = validator.validate(validConfig);
      const renderingErrors = result.errors.filter(e => e.path.startsWith('performance.rendering'));
      expect(renderingErrors).toHaveLength(0);
    });

    it('should validate performance thresholds', () => {
      const validConfig = {
        performance: {
          performance: {
            benchmarkThresholds: {
              fast: 50,
              medium: 100,
              slow: 500
            },
            batchSizes: {
              pathGeneration: 1000,
              rendering: 5000
            }
          }
        }
      };
      const result = validator.validate(validConfig);
      const perfErrors = result.errors.filter(e => e.path.startsWith('performance.performance'));
      expect(perfErrors).toHaveLength(0);
    });
  });

  describe('Development Configuration Validation', () => {
    it('should validate debug configuration', () => {
      const validConfig = {
        development: {
          debug: {
            enabled: true,
            logLevel: 'warn',
            showPerformanceMetrics: false
          }
        }
      };
      const result = validator.validate(validConfig);
      const debugErrors = result.errors.filter(e => e.path.startsWith('development.debug'));
      expect(debugErrors).toHaveLength(0);

      const invalidConfig = {
        development: {
          debug: {
            enabled: 'true', // Should be boolean
            logLevel: 'trace', // Not in allowed values
            showPerformanceMetrics: 1 // Should be boolean
          }
        }
      };
      const invalidResult = validator.validate(invalidConfig);
      const invalidDebugErrors = invalidResult.errors.filter(e => e.path.startsWith('development.debug'));
      expect(invalidDebugErrors.length).toBeGreaterThan(0);
    });

    it('should validate features configuration', () => {
      const validConfig = {
        development: {
          features: {
            hotReload: true,
            configValidation: true,
            typeChecking: false
          }
        }
      };
      const result = validator.validate(validConfig);
      const featuresErrors = result.errors.filter(e => e.path.startsWith('development.features'));
      expect(featuresErrors).toHaveLength(0);
    });

    it('should validate test IDs configuration', () => {
      const validConfig = {
        development: {
          testIds: {
            pathInput: 'path-input',
            addPathButton: 'add-path-button',
            pathList: 'path-list',
            fractalCanvas: 'fractal-canvas',
            customId: 'custom-test-id'
          }
        }
      };
      const result = validator.validate(validConfig);
      const testIdErrors = result.errors.filter(e => e.path === 'development.testIds');
      expect(testIdErrors).toHaveLength(0);

      const invalidConfig = {
        development: {
          testIds: {
            pathInput: 'path-input',
            // Missing required IDs
          }
        }
      };
      const invalidResult = validator.validate(invalidConfig);
      const invalidTestIdErrors = invalidResult.errors.filter(e => e.path === 'development.testIds');
      expect(invalidTestIdErrors.length).toBeGreaterThan(0);
    });
  });

  describe('Cross-field Validation', () => {
    it('should validate points min/max/default relationships', () => {
      const validConfig = {
        app: {
          points: {
            min: 10000,
            max: 100000,
            step: 10000,
            default: 50000
          }
        }
      };
      const result = validateConfigurationLogic(validConfig);
      expect(result.errors.filter(e => e.path.startsWith('app.points'))).toHaveLength(0);

      const invalidConfig1 = {
        app: {
          points: {
            min: 100000,
            max: 10000, // max < min
            default: 50000
          }
        }
      };
      const invalidResult1 = validateConfigurationLogic(invalidConfig1);
      expect(invalidResult1.errors.some(e => e.message.includes('min must be less than'))).toBe(true);

      const invalidConfig2 = {
        app: {
          points: {
            min: 10000,
            max: 100000,
            default: 5000 // default < min
          }
        }
      };
      const invalidResult2 = validateConfigurationLogic(invalidConfig2);
      expect(invalidResult2.errors.some(e => e.message.includes('must be between'))).toBe(true);
    });

    it('should validate breakpoint ordering', () => {
      const validConfig = {
        ui: {
          layout: {
            breakpoints: {
              mobile: 768,
              tablet: 1024,
              desktop: 1240
            }
          }
        }
      };
      const result = validateConfigurationLogic(validConfig);
      expect(result.errors.filter(e => e.path.includes('breakpoints'))).toHaveLength(0);

      const invalidConfig = {
        ui: {
          layout: {
            breakpoints: {
              mobile: 1024,
              tablet: 768, // tablet < mobile
              desktop: 1240
            }
          }
        }
      };
      const invalidResult = validateConfigurationLogic(invalidConfig);
      expect(invalidResult.errors.some(e => e.message.includes('mobile breakpoint must be less than tablet'))).toBe(true);
    });

    it('should validate performance threshold ordering', () => {
      const validConfig = {
        performance: {
          performance: {
            benchmarkThresholds: {
              fast: 50,
              medium: 100,
              slow: 500
            }
          }
        }
      };
      const result = validateConfigurationLogic(validConfig);
      expect(result.errors.filter(e => e.path.includes('benchmarkThresholds'))).toHaveLength(0);

      const invalidConfig = {
        performance: {
          performance: {
            benchmarkThresholds: {
              fast: 100,
              medium: 50, // medium < fast
              slow: 500
            }
          }
        }
      };
      const invalidResult = validateConfigurationLogic(invalidConfig);
      expect(invalidResult.errors.some(e => e.message.includes('fast threshold must be less than medium'))).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should handle malformed configuration gracefully', () => {
      const malformedConfig = {
        app: 'not an object',
        ui: null,
        performance: undefined
      };
      
      const result = validator.validate(malformedConfig);
      // Should not throw, but may have validation errors
      expect(result).toBeDefined();
      expect(result.isValid).toBeDefined();
      expect(result.errors).toBeInstanceOf(Array);
    });

    it('should handle cross-field validation errors gracefully', () => {
      const configWithErrors = {
        app: {
          points: {
            min: 'not a number',
            max: 'also not a number'
          }
        }
      };
      
      const result = validateConfigurationLogic(configWithErrors);
      expect(result).toBeDefined();
      expect(result.errors).toBeInstanceOf(Array);
    });
  });

  describe('Validator Factory', () => {
    it('should create validator with default rules', () => {
      const createdValidator = createConfigValidator();
      expect(createdValidator).toBeDefined();
      expect(createdValidator.getRules().length).toBeGreaterThan(0);
    });
  });
});