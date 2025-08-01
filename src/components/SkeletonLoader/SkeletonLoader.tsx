import React from 'react';

interface SkeletonLoaderProps {
  show: boolean;
  progress?: number;
  message?: string;
}

const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({
  show,
  progress = 0,
  message = '正在初始化...'
}) => {
  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-gray-900 flex items-center justify-center z-50">
      <div className="max-w-md w-full mx-4 text-center">
        {/* Logo和标题 */}
        <div className="mb-8">
          <div className="text-4xl mb-4">🔺</div>
          <h1 className="text-2xl font-bold text-white mb-2">
            Rauzy Fractal Workbench
          </h1>
          <p className="text-gray-400 text-sm">
            分形数学可视化工具
          </p>
        </div>

        {/* 加载状态 */}
        <div className="mb-6">
          <div className="text-white text-lg mb-2">{message}</div>
          <div className="text-gray-400 text-sm">
            {progress > 0 ? `${progress.toFixed(1)}% 完成` : '准备中...'}
          </div>
        </div>

        {/* 进度条 */}
        <div className="w-full bg-gray-700 rounded-full h-2 mb-6">
          <div 
            className="bg-yellow-400 h-2 rounded-full transition-all duration-300 ease-out"
            style={{ width: `${Math.max(0, Math.min(100, progress))}%` }}
          />
        </div>

        {/* 骨架屏界面预览 */}
        <div className="bg-gray-800 rounded-lg p-4 mb-4">
          <div className="flex space-x-4">
            {/* 左侧控制面板骨架 */}
            <div className="w-1/3 space-y-3">
              <div className="h-4 bg-gray-700 rounded animate-pulse"></div>
              <div className="h-8 bg-gray-700 rounded animate-pulse"></div>
              <div className="h-4 bg-gray-700 rounded animate-pulse"></div>
              <div className="h-6 bg-gray-700 rounded animate-pulse"></div>
            </div>
            
            {/* 中央画布骨架 */}
            <div className="flex-1 h-32 bg-gray-700 rounded animate-pulse flex items-center justify-center">
              <div className="text-gray-500 text-sm">分形画布</div>
            </div>
            
            {/* 右侧数据面板骨架 */}
            <div className="w-1/4 space-y-2">
              <div className="h-3 bg-gray-700 rounded animate-pulse"></div>
              <div className="h-3 bg-gray-700 rounded animate-pulse"></div>
              <div className="h-3 bg-gray-700 rounded animate-pulse"></div>
              <div className="h-3 bg-gray-700 rounded animate-pulse"></div>
            </div>
          </div>
        </div>

        {/* 加载动画 */}
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-400"></div>
        </div>
      </div>
    </div>
  );
};

export default SkeletonLoader;