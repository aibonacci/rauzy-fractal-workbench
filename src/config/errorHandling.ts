/**
 * 配置系统错误处理
 * 提供配置加载、验证、保存等操作的错误处理和恢复策略
 */
import { AppConfiguration } from './types';
import { DEFAULT_CONFIG } from './defaultConfig';
import { deepClone } from './utils';

/**
 * 配置错误类型枚举
 */
export enum ConfigErrorType {
  LOAD_FAILED = 'LOAD_FAILED',
  VALIDATION_FAILED = 'VALIDATION_FAILED',
  SAVE_FAILED = 'SAVE_FAILED',
  ACCESS_FAILED = 'ACCESS_FAILED',
  PARSE_FAILED = 'PARSE_FAILED',
  NETWORK_FAILED = 'NETWORK_FAILED',
  PERMISSION_DENIED = 'PERMISSION_DENIED'
}

/**
 * 配置错误类
 */
export class ConfigError extends Error {
  public readonly type: ConfigErrorType;
  public readonly originalError?: Error;
  public readonly context?: Record<string, any>;

  constructor(
    type: ConfigErrorType,
    message: string,
    originalError?: Error,
    context?: Record<string, any>
  ) {
    super(message);
    this.name = 'ConfigError';
    this.type = type;
    this.originalError = originalError;
    this.context = context;
  }
}

/**
 * 错误恢复策略接口
 */
export interface ErrorRecoveryStrategy {
  canHandle(error: ConfigError): boolean;
  recover(error: ConfigError, context?: any): Promise<AppConfiguration | null>;
}

/**
 * 默认值回退策略
 */
export class DefaultValueFallbackStrategy implements ErrorRecoveryStrategy {
  canHandle(error: ConfigError): boolean {
    return [
      ConfigErrorType.LOAD_FAILED,
      ConfigErrorType.PARSE_FAILED,
      ConfigErrorType.ACCESS_FAILED
    ].includes(error.type);
  }

  async recover(error: ConfigError): Promise<AppConfiguration> {
    console.warn(`配置加载失败，使用默认配置: ${error.message}`);
    return deepClone(DEFAULT_CONFIG);
  }
}

/**
 * 重试策略
 */
export class RetryStrategy implements ErrorRecoveryStrategy {
  private maxRetries: number;
  private retryDelay: number;

  constructor(maxRetries: number = 3, retryDelay: number = 1000) {
    this.maxRetries = maxRetries;
    this.retryDelay = retryDelay;
  }

  canHandle(error: ConfigError): boolean {
    return [
      ConfigErrorType.NETWORK_FAILED,
      ConfigErrorType.SAVE_FAILED
    ].includes(error.type);
  }

  async recover(error: ConfigError, context?: { operation: () => Promise<any> }): Promise<AppConfiguration | null> {
    if (!context?.operation) {
      return null;
    }

    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        console.log(`重试配置操作 (${attempt}/${this.maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, this.retryDelay * attempt));
        return await context.operation();
      } catch (retryError) {
        if (attempt === this.maxRetries) {
          throw new ConfigError(
            error.type,
            `重试${this.maxRetries}次后仍然失败: ${error.message}`,
            retryError instanceof Error ? retryError : undefined
          );
        }
      }
    }
    return null;
  }
}

/**
 * 缓存回退策略
 */
export class CacheFallbackStrategy implements ErrorRecoveryStrategy {
  private cacheKey: string = 'rauzy-config-cache';

  canHandle(error: ConfigError): boolean {
    return [
      ConfigErrorType.LOAD_FAILED,
      ConfigErrorType.NETWORK_FAILED
    ].includes(error.type);
  }

  async recover(error: ConfigError): Promise<AppConfiguration | null> {
    try {
      const cachedConfig = localStorage.getItem(this.cacheKey);
      if (cachedConfig) {
        console.log('使用缓存的配置');
        return JSON.parse(cachedConfig);
      }
    } catch (cacheError) {
      console.warn('缓存配置读取失败:', cacheError);
    }
    return null;
  }

  /**
   * 缓存配置
   */
  cacheConfig(config: AppConfiguration): void {
    try {
      localStorage.setItem(this.cacheKey, JSON.stringify(config));
    } catch (error) {
      console.warn('配置缓存失败:', error);
    }
  }
}

/**
 * 配置错误处理器
 */
export class ConfigErrorHandler {
  private strategies: ErrorRecoveryStrategy[] = [];

  constructor() {
    // 注册默认策略
    this.addStrategy(new CacheFallbackStrategy());
    this.addStrategy(new RetryStrategy());
    this.addStrategy(new DefaultValueFallbackStrategy());
  }

  /**
   * 添加错误恢复策略
   */
  addStrategy(strategy: ErrorRecoveryStrategy): void {
    this.strategies.push(strategy);
  }

  /**
   * 移除错误恢复策略
   */
  removeStrategy(strategyClass: new (...args: any[]) => ErrorRecoveryStrategy): void {
    this.strategies = this.strategies.filter(
      strategy => !(strategy instanceof strategyClass)
    );
  }

  /**
   * 处理配置错误
   */
  async handleError(error: ConfigError, context?: any): Promise<AppConfiguration> {
    console.error('配置错误:', error);

    // 尝试使用恢复策略
    for (const strategy of this.strategies) {
      if (strategy.canHandle(error)) {
        try {
          const result = await strategy.recover(error, context);
          if (result) {
            return result;
          }
        } catch (recoveryError) {
          console.warn('错误恢复策略失败:', recoveryError);
        }
      }
    }

    // 所有策略都失败，返回默认配置
    console.warn('所有错误恢复策略都失败，使用默认配置');
    return deepClone(DEFAULT_CONFIG);
  }
}

/**
 * 全局配置错误处理器实例
 */
export const configErrorHandler = new ConfigErrorHandler();

/**
 * 配置操作包装器，提供错误处理
 */
export async function withErrorHandling<T>(
  operation: () => Promise<T>,
  errorType: ConfigErrorType,
  context?: Record<string, any>
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    const configError = new ConfigError(
      errorType,
      error instanceof Error ? error.message : '未知错误',
      error instanceof Error ? error : undefined,
      context
    );
    throw configError;
  }
}

/**
 * 用户友好的错误消息映射
 */
export const ERROR_MESSAGES: Record<ConfigErrorType, string> = {
  [ConfigErrorType.LOAD_FAILED]: '配置文件加载失败，请检查文件是否存在或格式是否正确',
  [ConfigErrorType.VALIDATION_FAILED]: '配置验证失败，请检查配置值是否符合要求',
  [ConfigErrorType.SAVE_FAILED]: '配置保存失败，请检查文件权限或磁盘空间',
  [ConfigErrorType.ACCESS_FAILED]: '配置访问失败，请检查配置路径是否正确',
  [ConfigErrorType.PARSE_FAILED]: '配置解析失败，请检查配置文件格式',
  [ConfigErrorType.NETWORK_FAILED]: '网络请求失败，请检查网络连接',
  [ConfigErrorType.PERMISSION_DENIED]: '权限不足，无法访问配置文件'
};

/**
 * 获取用户友好的错误消息
 */
export function getUserFriendlyErrorMessage(error: ConfigError): string {
  const baseMessage = ERROR_MESSAGES[error.type] || '未知配置错误';
  if (error.context?.details) {
    return `${baseMessage}: ${error.context.details}`;
  }
  return baseMessage;
}

/**
 * 配置错误报告
 */
export interface ConfigErrorReport {
  timestamp: Date;
  error: ConfigError;
  userMessage: string;
  stackTrace?: string;
  context?: Record<string, any>;
}

/**
 * 创建错误报告
 */
export function createErrorReport(error: ConfigError): ConfigErrorReport {
  return {
    timestamp: new Date(),
    error,
    userMessage: getUserFriendlyErrorMessage(error),
    stackTrace: error.stack,
    context: error.context
  };
}

/**
 * 错误报告收集器
 */
export class ErrorReportCollector {
  private reports: ConfigErrorReport[] = [];
  private maxReports: number = 100;

  /**
   * 添加错误报告
   */
  addReport(error: ConfigError): void {
    const report = createErrorReport(error);
    this.reports.unshift(report);
    
    // 保持报告数量在限制内
    if (this.reports.length > this.maxReports) {
      this.reports = this.reports.slice(0, this.maxReports);
    }
  }

  /**
   * 获取所有错误报告
   */
  getReports(): ConfigErrorReport[] {
    return [...this.reports];
  }

  /**
   * 获取最近的错误报告
   */
  getRecentReports(count: number = 10): ConfigErrorReport[] {
    return this.reports.slice(0, count);
  }

  /**
   * 清除错误报告
   */
  clearReports(): void {
    this.reports = [];
  }

  /**
   * 导出错误报告
   */
  exportReports(): string {
    return JSON.stringify(this.reports, null, 2);
  }
}

/**
 * 全局错误报告收集器实例
 */
export const errorReportCollector = new ErrorReportCollector();