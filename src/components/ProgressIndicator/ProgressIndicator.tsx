import React from 'react';

interface ProgressIndicatorProps {
  progress: number; // 0-100
  message?: string;
  onCancel?: () => void;
  showCancel?: boolean;
}

const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({
  progress,
  message = '计算中...',
  onCancel,
  showCancel = true
}) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4 border border-gray-700">
        <div className="text-center mb-4">
          <h3 className="text-lg font-semibold text-white mb-2">
            {message}
          </h3>
          <p className="text-gray-400 text-sm">
            {progress.toFixed(1)}% 完成
          </p>
        </div>
        
        {/* 进度条 */}
        <div className="w-full bg-gray-700 rounded-full h-3 mb-4">
          <div 
            className="bg-yellow-400 h-3 rounded-full transition-all duration-300 ease-out"
            style={{ width: `${Math.max(0, Math.min(100, progress))}%` }}
          />
        </div>
        
        {/* 取消按钮 */}
        {showCancel && onCancel && (
          <div className="text-center">
            <button
              onClick={onCancel}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors text-sm"
            >
              取消计算
            </button>
          </div>
        )}
        
        {/* 加载动画 */}
        <div className="flex justify-center mt-4">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-yellow-400"></div>
        </div>
      </div>
    </div>
  );
};

export default ProgressIndicator;