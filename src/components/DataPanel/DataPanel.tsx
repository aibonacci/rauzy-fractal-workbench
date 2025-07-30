import React from 'react';
import { DataPanelProps } from '../../types';
import { TEST_IDS } from '../../utils/constants';
import PathDataCard from './PathDataCard';

const DataPanel: React.FC<DataPanelProps> = ({ pathsData }) => {
  return (
    <div 
      className="h-full flex flex-col"
      data-testid={TEST_IDS.DATA_PANEL}
    >
      {/* 标题 */}
      <h3 className="text-lg font-bold text-yellow-400 mb-4 flex-shrink-0">
        路径数据面板
      </h3>

      {/* 数据内容 */}
      <div className="flex-1 overflow-y-auto">
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
            <p className="mb-2">暂无路径数据</p>
            <p className="text-xs text-gray-600">
              请在左侧添加路径进行分析
            </p>
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
            
            {/* 汇总信息 */}
            <div className="mt-6 pt-4 border-t border-gray-700">
              <div className="text-xs text-gray-400 text-center">
                <div className="mb-2">
                  共分析 <span className="text-yellow-400 font-bold">{pathsData.length}</span> 条路径
                </div>
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <div className="text-gray-500">总序列项数:</div>
                    <div className="text-white font-mono">
                      {pathsData.reduce((sum, data) => sum + data.sequence.length, 0)}
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-500">平均权重:</div>
                    <div className="text-white font-mono">
                      {pathsData.length > 0 
                        ? (pathsData.reduce((sum, data) => sum + data.rp, 0) / pathsData.length).toFixed(2)
                        : '0'
                      }
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DataPanel;