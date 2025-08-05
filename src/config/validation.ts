/**
 * Configuration validation system
 * Provides type checking, range validation, and custom validation rules
 */

export interface ValidationError {
  path: string;
  message: string;
  value: any;
  expectedType?: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
}

export type ValidationType = 'number' | 'string' | 'boolean' | 'array' | 'object';

export interface ValidationRule {
  path: string;
  type: ValidationType;
  required?: boolean;
  min?: number;
  max?: number;
  pattern?: RegExp;
  allowedValues?: any[];
  validator?: (value: any) => boolean | string;
  description?: string;
}

export interface ValidationRuleSet {
  rules: ValidationRule[];
  strict?: boolean; // If true, unknown properties cause errors
}

/**
 * Configuration validator class
 * Supports type checking, range validation, and custom validation rules
 */
export class ConfigValidator {
  private rules: Map<string, ValidationRule> = new Map();
  private strict: boolean = false;

  constructor(ruleSet?: ValidationRuleSet) {
    if (ruleSet) {
      this.loadRules(ruleSet);
    }
  }

  /**
   * Load validation rules from a rule set
   */
  loadRules(ruleSet: ValidationRuleSet): void {
    this.strict = ruleSet.strict ?? false;
    ruleSet.rules.forEach(rule => {
      this.addRule(rule);
    });
  }

  /**
   * Add a single validation rule
   */
  addRule(rule: ValidationRule): void {
    this.rules.set(rule.path, rule);
  }

  /**
   * Remove a validation rule
   */
  removeRule(path: string): void {
    this.rules.delete(path);
  }

  /**
   * Get all validation rules
   */
  getRules(): ValidationRule[] {
    return Array.from(this.rules.values());
  }

  /**
   * Validate a configuration object
   */
  validate(config: any): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationError[] = [];

    // Validate against defined rules
    for (const [path, rule] of this.rules) {
      const value = this.getValueByPath(config, path);
      const result = this.validateValue(value, rule, path);
      
      if (result.errors.length > 0) {
        errors.push(...result.errors);
      }
      if (result.warnings.length > 0) {
        warnings.push(...result.warnings);
      }
    }

    // Check for unknown properties in strict mode
    if (this.strict) {
      const unknownPaths = this.findUnknownPaths(config);
      unknownPaths.forEach(path => {
        warnings.push({
          path,
          message: `Unknown configuration property: ${path}`,
          value: this.getValueByPath(config, path)
        });
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Validate a single value against a rule
   */
  private validateValue(value: any, rule: ValidationRule, path: string): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationError[] = [];

    // Check if required value is missing
    if (rule.required && (value === undefined || value === null)) {
      errors.push({
        path,
        message: `Required configuration property is missing: ${path}`,
        value,
        expectedType: rule.type
      });
      return { isValid: false, errors, warnings };
    }

    // Skip validation if value is undefined/null and not required
    if (value === undefined || value === null) {
      return { isValid: true, errors, warnings };
    }

    // Type validation
    if (!this.validateType(value, rule.type)) {
      errors.push({
        path,
        message: `Invalid type for ${path}. Expected ${rule.type}, got ${typeof value}`,
        value,
        expectedType: rule.type
      });
      return { isValid: false, errors, warnings };
    }

    // Range validation for numbers
    if (rule.type === 'number' && typeof value === 'number') {
      if (rule.min !== undefined && value < rule.min) {
        errors.push({
          path,
          message: `Value ${value} is below minimum ${rule.min} for ${path}`,
          value
        });
      }
      if (rule.max !== undefined && value > rule.max) {
        errors.push({
          path,
          message: `Value ${value} is above maximum ${rule.max} for ${path}`,
          value
        });
      }
    }

    // Array length validation
    if (rule.type === 'array' && Array.isArray(value)) {
      if (rule.min !== undefined && value.length < rule.min) {
        errors.push({
          path,
          message: `Array length ${value.length} is below minimum ${rule.min} for ${path}`,
          value
        });
      }
      if (rule.max !== undefined && value.length > rule.max) {
        errors.push({
          path,
          message: `Array length ${value.length} is above maximum ${rule.max} for ${path}`,
          value
        });
      }
    }

    // String length validation
    if (rule.type === 'string' && typeof value === 'string') {
      if (rule.min !== undefined && value.length < rule.min) {
        errors.push({
          path,
          message: `String length ${value.length} is below minimum ${rule.min} for ${path}`,
          value
        });
      }
      if (rule.max !== undefined && value.length > rule.max) {
        errors.push({
          path,
          message: `String length ${value.length} is above maximum ${rule.max} for ${path}`,
          value
        });
      }
    }

    // Pattern validation for strings
    if (rule.pattern && typeof value === 'string') {
      if (!rule.pattern.test(value)) {
        errors.push({
          path,
          message: `Value "${value}" does not match required pattern for ${path}`,
          value
        });
      }
    }

    // Allowed values validation
    if (rule.allowedValues && !rule.allowedValues.includes(value)) {
      errors.push({
        path,
        message: `Value "${value}" is not in allowed values [${rule.allowedValues.join(', ')}] for ${path}`,
        value
      });
    }

    // Custom validator
    if (rule.validator) {
      const customResult = rule.validator(value);
      if (customResult === false) {
        errors.push({
          path,
          message: `Custom validation failed for ${path}`,
          value
        });
      } else if (typeof customResult === 'string') {
        errors.push({
          path,
          message: customResult,
          value
        });
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Validate value type
   */
  private validateType(value: any, expectedType: ValidationType): boolean {
    switch (expectedType) {
      case 'number':
        return typeof value === 'number' && !isNaN(value);
      case 'string':
        return typeof value === 'string';
      case 'boolean':
        return typeof value === 'boolean';
      case 'array':
        return Array.isArray(value);
      case 'object':
        return typeof value === 'object' && value !== null && !Array.isArray(value);
      default:
        return false;
    }
  }

  /**
   * Get value from object by dot-notation path
   */
  private getValueByPath(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => {
      return current && current[key] !== undefined ? current[key] : undefined;
    }, obj);
  }

  /**
   * Find unknown paths in configuration (for strict mode)
   */
  private findUnknownPaths(config: any, prefix = ''): string[] {
    const unknownPaths: string[] = [];
    const knownPaths = new Set(this.rules.keys());

    const traverse = (obj: any, currentPath: string) => {
      if (typeof obj !== 'object' || obj === null) {
        return;
      }

      for (const key in obj) {
        const fullPath = currentPath ? `${currentPath}.${key}` : key;
        
        // Check if this path or any parent path is known
        const isKnownPath = knownPaths.has(fullPath);
        const hasKnownParent = Array.from(knownPaths).some(knownPath => 
          fullPath.startsWith(knownPath + '.')
        );
        const hasKnownChild = Array.from(knownPaths).some(knownPath => 
          knownPath.startsWith(fullPath + '.')
        );
        
        if (!isKnownPath && !hasKnownParent && !hasKnownChild) {
          // This is an unknown path with no known relationships
          unknownPaths.push(fullPath);
          // Don't traverse children of unknown paths to avoid duplicates
          continue;
        }

        if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
          traverse(obj[key], fullPath);
        }
      }
    };

    traverse(config, prefix);
    return unknownPaths;
  }

  /**
   * Create a validation summary report
   */
  createReport(result: ValidationResult): string {
    const lines: string[] = [];
    
    lines.push('Configuration Validation Report');
    lines.push('================================');
    lines.push(`Status: ${result.isValid ? 'VALID' : 'INVALID'}`);
    lines.push(`Errors: ${result.errors.length}`);
    lines.push(`Warnings: ${result.warnings.length}`);
    lines.push('');

    if (result.errors.length > 0) {
      lines.push('ERRORS:');
      result.errors.forEach((error, index) => {
        lines.push(`${index + 1}. ${error.path}: ${error.message}`);
        if (error.value !== undefined) {
          lines.push(`   Current value: ${JSON.stringify(error.value)}`);
        }
        if (error.expectedType) {
          lines.push(`   Expected type: ${error.expectedType}`);
        }
      });
      lines.push('');
    }

    if (result.warnings.length > 0) {
      lines.push('WARNINGS:');
      result.warnings.forEach((warning, index) => {
        lines.push(`${index + 1}. ${warning.path}: ${warning.message}`);
        if (warning.value !== undefined) {
          lines.push(`   Current value: ${JSON.stringify(warning.value)}`);
        }
      });
    }

    return lines.join('\n');
  }
}