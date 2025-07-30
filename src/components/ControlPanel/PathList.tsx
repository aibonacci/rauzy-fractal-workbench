import React from 'react';
import { PathData } from '../../types';
import { HIGHLIGHT_PALETTE, TEST_IDS } from '../../utils/constants';

interface PathListProps {
  pathsData: PathData[];
  onRemovePath: (index: number) => void;
}

const PathList: React.FC<PathListProps> = ({ pathsData, onRemovePath }) => {
  if (pathsData.length === 0) {
    return (
      <div 
        className="bg-gray-900 p-4 rounded-lg text-center text-gray-500 text-sm"
        data-testid={TEST_IDS.PATH_LIST}
      >
        请构建并添加路径进行分析
      </div>
    );
  }

  return (
    <div 
      className="bg-gray-900 p-2 rounded-lg space-y-2 flex-grow overflow-y-auto"
      data-testid={TEST_IDS.PATH_LIST}
    >
      {pathsData.map((data, index) => (
        <div
          key={`${data.path.join(',')}-${index}`}
          className="flex items-center justify-between bg-gray-700 p-2 rounded hover:bg-gray-600 transition-colors"
          data-testid={`${TEST_IDS.PATH_ITEM}-${index}`}
        >
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <span
              style={{
                backgroundColor: HIGHLIGHT_PALETTE[index % HIGHLIGHT_PALETTE.length]
              }}
              className="w-4 h-4 rounded-full flex-shrink-0"
              title={`路径颜色指示器`}
            />
            <span 
              className="font-mono text-sm break-all text-white"
              title={`路径: ${data.path.join(',')}, 权重: ${data.rp}`}
            >
              ({data.path.join(',')})
            </span>
          </div>
          
          <button
            onClick={() => onRemovePath(index)}
            data-testid={`${TEST_IDS.DELETE_PATH_BUTTON}-${index}`}
            className="text-xs bg-red-600 hover:bg-red-500 px-2 py-1 rounded flex-shrink-0 transition-colors"
            title="删除此路径"
          >
            删除
          </button>
        </div>
      ))}
      
      {pathsData.length > 0 && (
        <div className="text-xs text-gray-400 text-center pt-2 border-t border-gray-700">
          共 {pathsData.length} 条路径
        </div>
      )}
    </div>
  );
};

export default PathList;