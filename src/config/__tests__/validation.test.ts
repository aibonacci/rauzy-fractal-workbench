/**
 * Unit tests for configuration validation system
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { 
  ConfigValidator, 
  ValidationRule, 
  ValidationRuleSet, 
  ValidationResult,
  ValidationError 
} from '../validation';

describe('ConfigValidator', () => {
  let validator: ConfigValidator;

  beforeEach(() => {
    validator = new ConfigValidator();
  });

  describe('Rule Management', () => {
    it('should add and retrieve validation rules', () => {
      const rule: ValidationRule = {
        path: 'test.value',
        type: 'number',
        required: true,
        min: 0,
        max: 100
      };

      validator.addRule(rule);
      const rules = validator.getRules();

      expect(rules).toHaveLength(1);
      expect(rules[0]).toEqual(rule);
    });

    it('should remove validation rules', () => {
      const rule: ValidationRule = {
        path: 'test.value',
        type: 'string',
        required: true
      };

      validator.addRule(rule);
      expect(validator.getRules()).toHaveLength(1);

      validator.removeRule('test.value');
      expect(validator.getRules()).toHaveLength(0);
    });

    it('should load rules from rule set', () => {
      const ruleSet: ValidationRuleSet = {
        strict: true,
        rules: [
          { path: 'app.name', type: 'string', required: true },
          { path: 'app.version', type: 'number', required: true, min: 1 }
        ]
      };

      validator.loadRules(ruleSet);
      const rules = validator.getRules();

      expect(rules).toHaveLength(2);
      expect(rules.find(r => r.path === 'app.name')).toBeDefined();
      expect(rules.find(r => r.path === 'app.version')).toBeDefined();
    });
  });

  describe('Type Validation', () => {
    it('should validate number types', () => {
      validator.addRule({
        path: 'count',
        type: 'number',
        required: true
      });

      const validResult = validator.validate({ count: 42 });
      expect(validResult.isValid).toBe(true);
      expect(validResult.errors).toHaveLength(0);

      const invalidResult = validator.validate({ count: '42' });
      expect(invalidResult.isValid).toBe(false);
      expect(invalidResult.errors).toHaveLength(1);
      expect(invalidResult.errors[0].message).toContain('Invalid type');
    });

    it('should validate string types', () => {
      validator.addRule({
        path: 'name',
        type: 'string',
        required: true
      });

      const validResult = validator.validate({ name: 'test' });
      expect(validResult.isValid).toBe(true);

      const invalidResult = validator.validate({ name: 123 });
      expect(invalidResult.isValid).toBe(false);
      expect(invalidResult.errors[0].message).toContain('Invalid type');
    });

    it('should validate boolean types', () => {
      validator.addRule({
        path: 'enabled',
        type: 'boolean',
        required: true
      });

      const validResult = validator.validate({ enabled: true });
      expect(validResult.isValid).toBe(true);

      const invalidResult = validator.validate({ enabled: 'true' });
      expect(invalidResult.isValid).toBe(false);
    });

    it('should validate array types', () => {
      validator.addRule({
        path: 'items',
        type: 'array',
        required: true
      });

      const validResult = validator.validate({ items: [1, 2, 3] });
      expect(validResult.isValid).toBe(true);

      const invalidResult = validator.validate({ items: 'not an array' });
      expect(invalidResult.isValid).toBe(false);
    });

    it('should validate object types', () => {
      validator.addRule({
        path: 'config',
        type: 'object',
        required: true
      });

      const validResult = validator.validate({ config: { key: 'value' } });
      expect(validResult.isValid).toBe(true);

      const invalidResult = validator.validate({ config: [1, 2, 3] });
      expect(invalidResult.isValid).toBe(false);
    });

    it('should handle NaN as invalid number', () => {
      validator.addRule({
        path: 'value',
        type: 'number',
        required: true
      });

      const result = validator.validate({ value: NaN });
      expect(result.isValid).toBe(false);
      expect(result.errors[0].message).toContain('Invalid type');
    });
  });

  describe('Required Field Validation', () => {
    it('should validate required fields', () => {
      validator.addRule({
        path: 'required.field',
        type: 'string',
        required: true
      });

      const validResult = validator.validate({ required: { field: 'value' } });
      expect(validResult.isValid).toBe(true);

      const missingResult = validator.validate({});
      expect(missingResult.isValid).toBe(false);
      expect(missingResult.errors[0].message).toContain('Required configuration property is missing');

      const nullResult = validator.validate({ required: { field: null } });
      expect(nullResult.isValid).toBe(false);
      expect(nullResult.errors[0].message).toContain('Required configuration property is missing');
    });

    it('should allow optional fields to be missing', () => {
      validator.addRule({
        path: 'optional.field',
        type: 'string',
        required: false
      });

      const result = validator.validate({});
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('Range Validation', () => {
    it('should validate number ranges', () => {
      validator.addRule({
        path: 'score',
        type: 'number',
        required: true,
        min: 0,
        max: 100
      });

      const validResult = validator.validate({ score: 50 });
      expect(validResult.isValid).toBe(true);

      const tooLowResult = validator.validate({ score: -10 });
      expect(tooLowResult.isValid).toBe(false);
      expect(tooLowResult.errors[0].message).toContain('below minimum');

      const tooHighResult = validator.validate({ score: 150 });
      expect(tooHighResult.isValid).toBe(false);
      expect(tooHighResult.errors[0].message).toContain('above maximum');
    });

    it('should validate array length ranges', () => {
      validator.addRule({
        path: 'items',
        type: 'array',
        required: true,
        min: 2,
        max: 5
      });

      const validResult = validator.validate({ items: [1, 2, 3] });
      expect(validResult.isValid).toBe(true);

      const tooShortResult = validator.validate({ items: [1] });
      expect(tooShortResult.isValid).toBe(false);
      expect(tooShortResult.errors[0].message).toContain('below minimum');

      const tooLongResult = validator.validate({ items: [1, 2, 3, 4, 5, 6] });
      expect(tooLongResult.isValid).toBe(false);
      expect(tooLongResult.errors[0].message).toContain('above maximum');
    });

    it('should validate string length ranges', () => {
      validator.addRule({
        path: 'name',
        type: 'string',
        required: true,
        min: 3,
        max: 10
      });

      const validResult = validator.validate({ name: 'test' });
      expect(validResult.isValid).toBe(true);

      const tooShortResult = validator.validate({ name: 'ab' });
      expect(tooShortResult.isValid).toBe(false);
      expect(tooShortResult.errors[0].message).toContain('below minimum');

      const tooLongResult = validator.validate({ name: 'this is too long' });
      expect(tooLongResult.isValid).toBe(false);
      expect(tooLongResult.errors[0].message).toContain('above maximum');
    });
  });

  describe('Pattern Validation', () => {
    it('should validate string patterns', () => {
      validator.addRule({
        path: 'email',
        type: 'string',
        required: true,
        pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      });

      const validResult = validator.validate({ email: 'test@example.com' });
      expect(validResult.isValid).toBe(true);

      const invalidResult = validator.validate({ email: 'invalid-email' });
      expect(invalidResult.isValid).toBe(false);
      expect(invalidResult.errors[0].message).toContain('does not match required pattern');
    });

    it('should validate version patterns', () => {
      validator.addRule({
        path: 'version',
        type: 'string',
        required: true,
        pattern: /^\d+\.\d+\.\d+$/
      });

      const validResult = validator.validate({ version: '1.2.3' });
      expect(validResult.isValid).toBe(true);

      const invalidResult = validator.validate({ version: '1.2' });
      expect(invalidResult.isValid).toBe(false);
    });
  });

  describe('Allowed Values Validation', () => {
    it('should validate allowed values', () => {
      validator.addRule({
        path: 'level',
        type: 'string',
        required: true,
        allowedValues: ['debug', 'info', 'warn', 'error']
      });

      const validResult = validator.validate({ level: 'info' });
      expect(validResult.isValid).toBe(true);

      const invalidResult = validator.validate({ level: 'trace' });
      expect(invalidResult.isValid).toBe(false);
      expect(invalidResult.errors[0].message).toContain('not in allowed values');
    });

    it('should validate numeric allowed values', () => {
      validator.addRule({
        path: 'priority',
        type: 'number',
        required: true,
        allowedValues: [1, 2, 3, 5, 8]
      });

      const validResult = validator.validate({ priority: 3 });
      expect(validResult.isValid).toBe(true);

      const invalidResult = validator.validate({ priority: 4 });
      expect(invalidResult.isValid).toBe(false);
    });
  });

  describe('Custom Validation', () => {
    it('should support custom validators returning boolean', () => {
      validator.addRule({
        path: 'evenNumber',
        type: 'number',
        required: true,
        validator: (value: number) => value % 2 === 0
      });

      const validResult = validator.validate({ evenNumber: 4 });
      expect(validResult.isValid).toBe(true);

      const invalidResult = validator.validate({ evenNumber: 3 });
      expect(invalidResult.isValid).toBe(false);
      expect(invalidResult.errors[0].message).toContain('Custom validation failed');
    });

    it('should support custom validators returning error messages', () => {
      validator.addRule({
        path: 'password',
        type: 'string',
        required: true,
        validator: (value: string) => {
          if (value.length < 8) return 'Password must be at least 8 characters';
          if (!/[A-Z]/.test(value)) return 'Password must contain uppercase letter';
          if (!/[0-9]/.test(value)) return 'Password must contain a number';
          return true;
        }
      });

      const validResult = validator.validate({ password: 'SecurePass123' });
      expect(validResult.isValid).toBe(true);

      const tooShortResult = validator.validate({ password: 'short' });
      expect(tooShortResult.isValid).toBe(false);
      expect(tooShortResult.errors[0].message).toBe('Password must be at least 8 characters');

      const noUpperResult = validator.validate({ password: 'lowercase123' });
      expect(noUpperResult.isValid).toBe(false);
      expect(noUpperResult.errors[0].message).toBe('Password must contain uppercase letter');
    });
  });

  describe('Path Resolution', () => {
    it('should resolve nested paths correctly', () => {
      validator.addRule({
        path: 'app.config.database.host',
        type: 'string',
        required: true
      });

      const validResult = validator.validate({
        app: {
          config: {
            database: {
              host: 'localhost'
            }
          }
        }
      });
      expect(validResult.isValid).toBe(true);

      const missingResult = validator.validate({
        app: {
          config: {}
        }
      });
      expect(missingResult.isValid).toBe(false);
    });

    it('should handle missing intermediate objects', () => {
      validator.addRule({
        path: 'deep.nested.value',
        type: 'string',
        required: true
      });

      const result = validator.validate({ deep: {} });
      expect(result.isValid).toBe(false);
      expect(result.errors[0].message).toContain('Required configuration property is missing');
    });
  });

  describe('Strict Mode', () => {
    it('should warn about unknown properties in strict mode', () => {
      const strictValidator = new ConfigValidator({
        strict: true,
        rules: [
          { path: 'known.property', type: 'string', required: true }
        ]
      });

      const result = strictValidator.validate({
        known: { property: 'value' },
        unknown: { property: 'value' }
      });

      expect(result.isValid).toBe(true);
      expect(result.warnings).toHaveLength(1);
      expect(result.warnings[0].message).toContain('Unknown configuration property');
      expect(result.warnings[0].path).toBe('unknown');
    });

    it('should not warn about unknown properties in non-strict mode', () => {
      const nonStrictValidator = new ConfigValidator({
        strict: false,
        rules: [
          { path: 'known.property', type: 'string', required: true }
        ]
      });

      const result = nonStrictValidator.validate({
        known: { property: 'value' },
        unknown: { property: 'value' }
      });

      expect(result.isValid).toBe(true);
      expect(result.warnings).toHaveLength(0);
    });
  });

  describe('Multiple Validation Errors', () => {
    it('should collect multiple validation errors', () => {
      validator.addRule({
        path: 'value1',
        type: 'number',
        required: true,
        min: 0,
        max: 10
      });
      validator.addRule({
        path: 'value2',
        type: 'string',
        required: true,
        pattern: /^[A-Z]+$/
      });

      const result = validator.validate({
        value1: -5, // Below minimum
        value2: 'lowercase' // Doesn't match pattern
      });

      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(2);
      expect(result.errors.some(e => e.message.includes('below minimum'))).toBe(true);
      expect(result.errors.some(e => e.message.includes('does not match required pattern'))).toBe(true);
    });
  });

  describe('Validation Report', () => {
    it('should create a formatted validation report', () => {
      validator.addRule({
        path: 'test.value',
        type: 'number',
        required: true,
        min: 0
      });

      const result = validator.validate({ test: { value: -1 } });
      const report = validator.createReport(result);

      expect(report).toContain('Configuration Validation Report');
      expect(report).toContain('Status: INVALID');
      expect(report).toContain('Errors: 1');
      expect(report).toContain('below minimum');
      expect(report).toContain('Current value: -1');
    });

    it('should create report with warnings', () => {
      const strictValidator = new ConfigValidator({
        strict: true,
        rules: [
          { path: 'known', type: 'string', required: true }
        ]
      });

      const result = strictValidator.validate({
        known: 'value',
        unknown: 'property'
      });
      const report = strictValidator.createReport(result);

      expect(report).toContain('Status: VALID');
      expect(report).toContain('Warnings: 1');
      expect(report).toContain('Unknown configuration property');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty configuration', () => {
      const result = validator.validate({});
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should handle null configuration', () => {
      const result = validator.validate(null);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should handle undefined configuration', () => {
      const result = validator.validate(undefined);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should handle circular references gracefully', () => {
      const circular: any = { name: 'test' };
      circular.self = circular;

      validator.addRule({
        path: 'name',
        type: 'string',
        required: true
      });

      const result = validator.validate(circular);
      expect(result.isValid).toBe(true);
    });
  });
});