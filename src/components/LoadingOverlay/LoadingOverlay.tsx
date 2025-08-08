import React from 'react';
import { useConfig } from '../../config/ConfigContext';
import { getTestId } from '../../config/utils';

interface LoadingOverlayProps {
  message?: string;
}

const LoadingOverlay: React.FC<LoadingOverlayProps> = ({ 
  message = '正在计算核心算法...' 
}) => {
  const { config } = useConfig();
  
  return (
    <div 
      className="absolute inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center rounded-lg z-10"
      data-testid={getTestId(config, 'loadingIndicator')}
    >
      <div className="text-center">
        <div className="text-white text-2xl animate-pulse mb-4">
          {message}
        </div>
        <div className="flex justify-center space-x-2">
          <div className="w-3 h-3 bg-yellow-400 rounded-full animate-bounce"></div>
          <div className="w-3 h-3 bg-yellow-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
          <div className="w-3 h-3 bg-yellow-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
        </div>
      </div>
    </div>
  );
};

export default LoadingOverlay;