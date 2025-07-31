import React from 'react';
import { TrashIcon } from '@heroicons/react/24/outline';
import { useI18n } from '../../i18n/context';

interface DeleteButtonProps {
  onClick: () => void;
  tooltip?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  'data-testid'?: string;
}

const DeleteButton: React.FC<DeleteButtonProps> = ({ 
  onClick, 
  tooltip, 
  size = 'md', 
  className = '',
  'data-testid': dataTestId
}) => {
  const { t } = useI18n();

  // 使用传入的tooltip或默认的翻译
  const tooltipText = tooltip || t('controls.pathList.deleteTooltip');

  // 根据尺寸设置样式
  const sizeClasses = {
    sm: 'w-6 h-6 p-1',
    md: 'w-8 h-8 p-1.5',
    lg: 'w-10 h-10 p-2'
  };

  return (
    <button
      onClick={onClick}
      className={`
        ${sizeClasses[size]}
        text-red-400 hover:text-red-300 hover:bg-red-600/20 
        rounded transition-colors duration-200 
        flex items-center justify-center
        focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-opacity-50
        ${className}
      `}
      title={tooltipText}
      aria-label={tooltipText}
      data-testid={dataTestId}
    >
      <TrashIcon className="w-full h-full" />
    </button>
  );
};

export default DeleteButton;