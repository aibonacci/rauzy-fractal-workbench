import React from 'react';
import { PathData } from '../../types';
import { useI18n } from '../../i18n/context';
import { useConfig } from '../../config/ConfigContext';
import DeleteButton from '../DeleteButton/DeleteButton';

interface PathListProps {
  pathsData: PathData[];
  onRemovePath: (index: number) => void;
}

const PathList: React.FC<PathListProps> = ({ pathsData, onRemovePath }) => {
  const { t } = useI18n();
  const { config } = useConfig();

  if (pathsData.length === 0) {
    return (
      <div 
        className="bg-gray-900 p-4 rounded-lg text-center text-gray-500 text-sm"
        data-testid={config.development.testIds.pathList}
      >
        {t('controls.pathList.empty')}
      </div>
    );
  }

  return (
    <div 
      className="bg-gray-900 p-2 rounded-lg space-y-2 flex-grow overflow-y-auto"
      data-testid={config.development.testIds.pathList}
    >
      {pathsData.map((data, index) => (
        <div
          key={`${data.path.join(',')}-${index}`}
          className="flex items-center justify-between bg-gray-700 p-2 rounded hover:bg-gray-600 transition-colors"
          data-testid={`${config.development.testIds.pathItem}-${index}`}
        >
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <span
              style={{
                backgroundColor: config.ui.colors.highlight[index % config.ui.colors.highlight.length]
              }}
              className="w-4 h-4 rounded-full flex-shrink-0"
              title={t('controls.pathList.colorIndicator', { index: (index + 1).toString() })}
            />
            <span 
              className="font-mono text-sm break-all text-white"
              title={t('controls.pathList.pathInfo', { 
                path: data.path.join(','), 
                weight: data.rp.toString() 
              })}
            >
              ({data.path.join(',')})
            </span>
          </div>
          
          <DeleteButton
            onClick={() => onRemovePath(index)}
            size="sm"
            className="flex-shrink-0"
            data-testid={`${config.development.testIds.deletePathButton}-${index}`}
          />
        </div>
      ))}
      
      {pathsData.length > 0 && (
        <div className="text-xs text-gray-400 text-center pt-2 border-t border-gray-700">
          {t('controls.pathList.totalPaths', { count: pathsData.length.toString() })}
        </div>
      )}
    </div>
  );
};

export default PathList;