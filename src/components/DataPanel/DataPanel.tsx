import React, { useState } from 'react';
import { DataPanelProps } from '../../types';
import { useI18n } from '../../i18n/context';
import { useTestId } from '../../hooks/useTestIds';
import PathDataCard from './PathDataCard';
import LanguageToggle from '../LanguageToggle/LanguageToggle';
import ExternalLinks from '../ExternalLinks/ExternalLinks';

const DataPanel: React.FC<DataPanelProps> = ({ pathsData }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { t } = useI18n();
  const dataPanelTestId = useTestId('dataPanel');
  
  return (
    <div 
      className="h-full flex flex-col"
      data-testid={dataPanelTestId}
    >
      {/* 标题行：包含标题、工具组和折叠按钮 */}
      <div className="flex items-center justify-between mb-4 flex-shrink-0">
        <h3 className="text-sm font-bold text-yellow-400 flex-shrink-0 truncate">
          {t('dataPanel.title')}
        </h3>
        
        <div className="flex items-center gap-1 flex-shrink-0">
          {/* 语言切换按钮 - 缩小尺寸 */}
          <div className="flex-shrink-0">
            <LanguageToggle className="scale-75" />
          </div>
          
          {/* 外部链接 - 缩小尺寸 */}
          <div className="flex-shrink-0">
            <ExternalLinks className="scale-75" />
          </div>
          
          {/* 折叠按钮 - 仅在小屏幕显示 */}
          <button 
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="sm:hidden p-1 hover:bg-gray-700 rounded transition-colors flex-shrink-0"
            aria-label={isCollapsed ? t('dataPanel.expand') : t('dataPanel.collapse')}
          >
            <svg 
              className={`w-3 h-3 transition-transform ${isCollapsed ? 'rotate-180' : ''}`}
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>
      </div>

      {/* 数据内容 */}
      <div className={`flex-1 overflow-y-auto ${isCollapsed ? 'hidden sm:block' : ''}`}>
        {pathsData.length === 0 ? (
          <div className="text-center text-gray-500 text-sm pt-8">
            <div className="mb-4">
              <svg 
                className="w-16 h-16 mx-auto text-gray-600" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={1} 
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" 
                />
              </svg>
            </div>
            <p className="mb-2 font-medium">{t('dataPanel.noData')}</p>
            <p className="text-xs text-gray-600 mb-4">
              {t('dataPanel.addPathHint')}
            </p>
            <div className="text-xs text-gray-500 space-y-1">
              <p>{t('dataPanel.supportedFormats')}</p>
              <p>• {t('dataPanel.formatExamples.sequence')}</p>
              <p>• {t('dataPanel.formatExamples.comma')}</p>
              <p>• {t('dataPanel.maxPaths')}</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {pathsData.map((pathData, index) => (
              <PathDataCard
                key={`${pathData.path.join(',')}-${index}`}
                pathData={pathData}
                index={index}
              />
            ))}
            
            {/* 路径计数 */}
            <div className="mt-4 pt-3 border-t border-gray-700">
              <div className="text-xs text-gray-400 text-center">
                {t('dataPanel.totalAnalyzed', { count: pathsData.length.toString() })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DataPanel;