import React, { Component, ErrorInfo, ReactNode } from 'react';
import { dispatchStateChange } from '../../utils/event-system';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

/**
 * 数学计算错误边界组件
 * 捕获数学计算中的错误并提供用户友好的错误信息
 */
class MathCalculationErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error: Error): State {
    // 更新state以显示错误UI
    return {
      hasError: true,
      error,
      errorInfo: null
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // 记录错误信息
    console.error('数学计算错误边界捕获到错误:', error, errorInfo);
    
    this.setState({
      error,
      errorInfo
    });

    // 触发错误事件
    dispatchStateChange('ERROR_OCCURRED', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      context: 'math_calculation_error_boundary'
    });
  }

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      // 如果提供了自定义fallback，使用它
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // 默认错误UI
      return (
        <div className="min-h-screen bg-gray-800 text-white flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-gray-700 rounded-lg p-6 shadow-xl">
            <div className="flex items-center mb-4">
              <svg 
                className="w-8 h-8 text-red-400 mr-3" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" 
                />
              </svg>
              <h2 className="text-xl font-bold text-red-400">计算错误</h2>
            </div>
            
            <div className="mb-4">
              <p className="text-gray-300 mb-2">
                数学计算过程中发生了错误，这可能是由于：
              </p>
              <ul className="text-sm text-gray-400 list-disc list-inside space-y-1">
                <li>数据量过大导致内存不足</li>
                <li>Math.js库加载失败</li>
                <li>矩阵计算异常</li>
                <li>浏览器兼容性问题</li>
              </ul>
            </div>

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <div className="mb-4 p-3 bg-gray-800 rounded text-xs">
                <p className="text-red-300 font-mono break-all">
                  {this.state.error.message}
                </p>
                {this.state.error.stack && (
                  <details className="mt-2">
                    <summary className="text-gray-400 cursor-pointer">
                      查看详细错误信息
                    </summary>
                    <pre className="mt-2 text-gray-500 whitespace-pre-wrap text-xs">
                      {this.state.error.stack}
                    </pre>
                  </details>
                )}
              </div>
            )}

            <div className="flex space-x-3">
              <button
                onClick={this.handleRetry}
                className="flex-1 bg-yellow-500 text-gray-900 font-bold py-2 px-4 rounded hover:bg-yellow-400 transition-colors"
              >
                重试
              </button>
              <button
                onClick={this.handleReload}
                className="flex-1 bg-gray-600 text-white font-bold py-2 px-4 rounded hover:bg-gray-500 transition-colors"
              >
                重新加载
              </button>
            </div>

            <div className="mt-4 text-xs text-gray-500 text-center">
              如果问题持续存在，请尝试刷新页面或减少计算点数
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default MathCalculationErrorBoundary;