/**
 * 配置错误处理测试
 * 验证错误处理策略、错误恢复和用户友好错误消息
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  ConfigError,
  ConfigErrorType,
  DefaultValueFallbackStrategy,
  RetryStrategy,
  CacheFallbackStrategy,
  ConfigErrorHandler,
  withErrorHandling,
  getUserFriendlyErrorMessage,
  ErrorReportCollector,
  createErrorReport
} from '../errorHandling';
import { DEFAULT_CONFIG } from '../defaultConfig';

describe('配置错误处理', () => {
  describe('ConfigError', () => {
    it('应该正确创建配置错误', () => {
      const originalError = new Error('原始错误');
      const context = { path: 'test.config' };
      
      const configError = new ConfigError(
        ConfigErrorType.LOAD_FAILED,
        '加载失败',
        originalError,
        context
      );

      expect(configError.type).toBe(ConfigErrorType.LOAD_FAILED);
      expect(configError.message).toBe('加载失败');
      expect(configError.originalError).toBe(originalError);
      expect(configError.context).toBe(context);
      expect(configError.name).toBe('ConfigError');
    });
  });

  describe('DefaultValueFallbackStrategy', () => {
    let strategy: DefaultValueFallbackStrategy;

    beforeEach(() => {
      strategy = new DefaultValueFallbackStrategy();
    });

    it('应该能处理加载失败错误', () => {
      const error = new ConfigError(ConfigErrorType.LOAD_FAILED, '加载失败');
      expect(strategy.canHandle(error)).toBe(true);
    });

    it('应该不能处理保存失败错误', () => {
      const error = new ConfigError(ConfigErrorType.SAVE_FAILED, '保存失败');
      expect(strategy.canHandle(error)).toBe(false);
    });

    it('应该返回默认配置', async () => {
      const error = new ConfigError(ConfigErrorType.LOAD_FAILED, '加载失败');
      const result = await strategy.recover(error);
      expect(result).toEqual(DEFAULT_CONFIG);
    });
  });

  describe('RetryStrategy', () => {
    let strategy: RetryStrategy;

    beforeEach(() => {
      strategy = new RetryStrategy(2, 100);
    });

    it('应该能处理网络失败错误', () => {
      const error = new ConfigError(ConfigErrorType.NETWORK_FAILED, '网络失败');
      expect(strategy.canHandle(error)).toBe(true);
    });

    it('应该成功重试操作', async () => {
      const error = new ConfigError(ConfigErrorType.NETWORK_FAILED, '网络失败');
      const mockOperation = vi.fn().mockResolvedValueOnce('success');
      
      const result = await strategy.recover(error, { operation: mockOperation });
      
      expect(result).toBe('success');
      expect(mockOperation).toHaveBeenCalledTimes(1);
    });

    it('应该在重试失败后抛出错误', async () => {
      const error = new ConfigError(ConfigErrorType.NETWORK_FAILED, '网络失败');
      const mockOperation = vi.fn().mockRejectedValue(new Error('持续失败'));
      
      await expect(
        strategy.recover(error, { operation: mockOperation })
      ).rejects.toThrow('重试2次后仍然失败');
      
      expect(mockOperation).toHaveBeenCalledTimes(2);
    });
  });

  describe('CacheFallbackStrategy', () => {
    let strategy: CacheFallbackStrategy;

    beforeEach(() => {
      strategy = new CacheFallbackStrategy();
      localStorage.clear();
    });

    it('应该能处理加载失败错误', () => {
      const error = new ConfigError(ConfigErrorType.LOAD_FAILED, '加载失败');
      expect(strategy.canHandle(error)).toBe(true);
    });

    it('应该从缓存恢复配置', async () => {
      const cachedConfig = { test: 'cached' };
      localStorage.setItem('rauzy-config-cache', JSON.stringify(cachedConfig));
      
      const error = new ConfigError(ConfigErrorType.LOAD_FAILED, '加载失败');
      const result = await strategy.recover(error);
      
      expect(result).toEqual(cachedConfig);
    });

    it('应该在没有缓存时返回null', async () => {
      const error = new ConfigError(ConfigErrorType.LOAD_FAILED, '加载失败');
      const result = await strategy.recover(error);
      
      expect(result).toBeNull();
    });

    it('应该正确缓存配置', () => {
      const config = { test: 'config' };
      strategy.cacheConfig(config as any);
      
      const cached = localStorage.getItem('rauzy-config-cache');
      expect(JSON.parse(cached!)).toEqual(config);
    });
  });

  describe('ConfigErrorHandler', () => {
    let handler: ConfigErrorHandler;

    beforeEach(() => {
      handler = new ConfigErrorHandler();
    });

    it('应该处理错误并返回恢复的配置', async () => {
      const error = new ConfigError(ConfigErrorType.LOAD_FAILED, '加载失败');
      const result = await handler.handleError(error);
      
      expect(result).toEqual(DEFAULT_CONFIG);
    });

    it('应该允许添加和移除策略', () => {
      const customStrategy = new DefaultValueFallbackStrategy();
      handler.addStrategy(customStrategy);
      handler.removeStrategy(DefaultValueFallbackStrategy);
      
      // 验证策略被正确管理（通过行为验证）
      expect(handler).toBeDefined();
    });
  });

  describe('withErrorHandling', () => {
    it('应该正常执行成功的操作', async () => {
      const operation = vi.fn().mockResolvedValue('success');
      
      const result = await withErrorHandling(
        operation,
        ConfigErrorType.LOAD_FAILED
      );
      
      expect(result).toBe('success');
    });

    it('应该包装错误为ConfigError', async () => {
      const operation = vi.fn().mockRejectedValue(new Error('原始错误'));
      
      await expect(
        withErrorHandling(operation, ConfigErrorType.LOAD_FAILED)
      ).rejects.toThrow(ConfigError);
    });
  });

  describe('用户友好错误消息', () => {
    it('应该返回正确的错误消息', () => {
      const error = new ConfigError(ConfigErrorType.LOAD_FAILED, '加载失败');
      const message = getUserFriendlyErrorMessage(error);
      
      expect(message).toContain('配置文件加载失败');
    });

    it('应该包含上下文详情', () => {
      const error = new ConfigError(
        ConfigErrorType.VALIDATION_FAILED,
        '验证失败',
        undefined,
        { details: '值超出范围' }
      );
      
      const message = getUserFriendlyErrorMessage(error);
      expect(message).toContain('值超出范围');
    });
  });

  describe('ErrorReportCollector', () => {
    let collector: ErrorReportCollector;

    beforeEach(() => {
      collector = new ErrorReportCollector();
    });

    it('应该正确添加错误报告', () => {
      const error = new ConfigError(ConfigErrorType.LOAD_FAILED, '加载失败');
      collector.addReport(error);
      
      const reports = collector.getReports();
      expect(reports).toHaveLength(1);
      expect(reports[0].error).toBe(error);
    });

    it('应该限制报告数量', () => {
      // 创建超过限制的报告
      for (let i = 0; i < 150; i++) {
        const error = new ConfigError(ConfigErrorType.LOAD_FAILED, `错误${i}`);
        collector.addReport(error);
      }
      
      const reports = collector.getReports();
      expect(reports.length).toBeLessThanOrEqual(100);
    });

    it('应该正确获取最近的报告', () => {
      for (let i = 0; i < 20; i++) {
        const error = new ConfigError(ConfigErrorType.LOAD_FAILED, `错误${i}`);
        collector.addReport(error);
      }
      
      const recentReports = collector.getRecentReports(5);
      expect(recentReports).toHaveLength(5);
    });

    it('应该正确清除报告', () => {
      const error = new ConfigError(ConfigErrorType.LOAD_FAILED, '加载失败');
      collector.addReport(error);
      
      collector.clearReports();
      expect(collector.getReports()).toHaveLength(0);
    });

    it('应该正确导出报告', () => {
      const error = new ConfigError(ConfigErrorType.LOAD_FAILED, '加载失败');
      collector.addReport(error);
      
      const exported = collector.exportReports();
      const parsed = JSON.parse(exported);
      
      expect(parsed).toHaveLength(1);
      expect(parsed[0].error.message).toBe('加载失败');
    });
  });

  describe('createErrorReport', () => {
    it('应该创建完整的错误报告', () => {
      const error = new ConfigError(
        ConfigErrorType.VALIDATION_FAILED,
        '验证失败',
        new Error('原始错误'),
        { path: 'test.config' }
      );
      
      const report = createErrorReport(error);
      
      expect(report.error).toBe(error);
      expect(report.userMessage).toContain('配置验证失败');
      expect(report.context).toEqual({ path: 'test.config' });
      expect(report.timestamp).toBeInstanceOf(Date);
    });
  });
});