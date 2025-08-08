/**
 * 配置系统错误边界
 * 捕获和处理配置系统相关的错误
 */
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { ConfigError, ConfigErrorType, getUserFriendlyErrorMessage } from '../../config/errorHandling';

interface Props {
  children: ReactNode;
  fallback?: (error: Error, errorInfo: ErrorInfo) => ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  isConfigError: boolean;
}

export class ConfigErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      isConfigError: false
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    const isConfigError = error instanceof ConfigError;
    
    return {
      hasError: true,
      error,
      isConfigError
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({
      errorInfo
    });

    // 记录错误
    console.error('配置错误边界捕获到错误:', error, errorInfo);

    // 如果是配置错误，使用配置系统的错误处理
    if (error instanceof ConfigError) {
      console.error('配置系统错误:', {
        type: error.type,
        message: error.message,
        originalError: error.originalError,
        context: error.context,
        userMessage: getUserFriendlyErrorMessage(error)
      });
    }
  }

  private handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      isConfigError: false
    });
  };

  private handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      // 如果提供了自定义fallback，使用它
      if (this.props.fallback && this.state.error && this.state.errorInfo) {
        return this.props.fallback(this.state.error, this.state.errorInfo);
      }

      // 配置错误的特殊处理
      if (this.state.isConfigError && this.state.error instanceof ConfigError) {
        const userMessage = getUserFriendlyErrorMessage(this.state.error);
        const canRetry = [
          ConfigErrorType.LOAD_FAILED,
          ConfigErrorType.SAVE_FAILED,
          ConfigErrorType.NETWORK_FAILED
        ].includes(this.state.error.type);

        return (
          <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 max-w-lg w-full">
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 bg-red-600 rounded-full flex items-center justify-center mr-3">
                  <span className="text-white font-bold text-lg">⚠</span>
                </div>
                <div>
                  <h2 className="text-red-400 text-lg font-semibold">配置系统错误</h2>
                  <p className="text-gray-400 text-sm">错误类型: {this.state.error.type}</p>
                </div>
              </div>
              
              <div className="mb-6">
                <p className="text-gray-300 mb-2">{userMessage}</p>
                {this.state.error.context && (
                  <details className="mt-3">
                    <summary className="text-gray-400 text-sm cursor-pointer hover:text-gray-300">
                      技术详情
                    </summary>
                    <div className="mt-2 p-3 bg-gray-900 rounded text-xs text-gray-400 font-mono">
                      <div><strong>错误消息:</strong> {this.state.error.message}</div>
                      {this.state.error.originalError && (
                        <div><strong>原始错误:</strong> {this.state.error.originalError.message}</div>
                      )}
                      <div><strong>上下文:</strong> {JSON.stringify(this.state.error.context, null, 2)}</div>
                    </div>
                  </details>
                )}
              </div>

              <div className="flex gap-3">
                {canRetry && (
                  <button
                    onClick={this.handleRetry}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded transition-colors"
                  >
                    重试
                  </button>
                )}
                <button
                  onClick={this.handleReload}
                  className="flex-1 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded transition-colors"
                >
                  重新加载页面
                </button>
              </div>
            </div>
          </div>
        );
      }

      // 通用错误处理
      return (
        <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 max-w-lg w-full">
            <div className="flex items-center mb-4">
              <div className="w-10 h-10 bg-red-600 rounded-full flex items-center justify-center mr-3">
                <span className="text-white font-bold text-lg">💥</span>
              </div>
              <h2 className="text-red-400 text-lg font-semibold">应用程序错误</h2>
            </div>
            
            <div className="mb-6">
              <p className="text-gray-300 mb-2">
                应用程序遇到了一个意外错误。请尝试重新加载页面。
              </p>
              <details className="mt-3">
                <summary className="text-gray-400 text-sm cursor-pointer hover:text-gray-300">
                  错误详情
                </summary>
                <div className="mt-2 p-3 bg-gray-900 rounded text-xs text-gray-400 font-mono">
                  <div><strong>错误:</strong> {this.state.error?.message}</div>
                  {this.state.errorInfo && (
                    <div><strong>组件堆栈:</strong> {this.state.errorInfo.componentStack}</div>
                  )}
                </div>
              </details>
            </div>

            <div className="flex gap-3">
              <button
                onClick={this.handleRetry}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded transition-colors"
              >
                重试
              </button>
              <button
                onClick={this.handleReload}
                className="flex-1 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded transition-colors"
              >
                重新加载页面
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ConfigErrorBoundary;