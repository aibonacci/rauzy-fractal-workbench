import React from 'react';
import { ControlPanelProps } from '../../types';
import { useI18n } from '../../i18n/context';
import PathInput from './PathInput';
import PathList from './PathList';
import PointsSlider from './PointsSlider';
import NumberPartitionGenerator from './NumberPartitionGenerator';
import PathLengthGenerator from './PathLengthGenerator';

const ControlPanel: React.FC<ControlPanelProps> = ({
  numPoints,
  onNumPointsChange,
  pathInput,
  onPathInputChange,
  inputError,
  onAddPath,
  pathsData,
  onRemovePath,
  disabled,
  formatPointCount,
  onAddPaths,
  onClearAllPaths
}) => {
  const { t } = useI18n();
  return (
    <div className="w-full sm:w-[260px] md:w-[270px] lg:w-[280px] bg-gray-800 border-r sm:border-r border-b sm:border-b-0 border-gray-700 flex-col p-4 space-y-4 flex-shrink-0 flex order-0 sm:order-none overflow-y-auto">
      {/* 标题 */}
      <h1 className="text-xl font-bold text-yellow-400 flex-shrink-0">
        {t('app.title')}
      </h1>
      
      {/* 路径输入 */}
      <PathInput
        value={pathInput}
        onChange={onPathInputChange}
        onSubmit={onAddPath}
        error={inputError}
        disabled={disabled}
      />
      
      {/* 数字划分生成器 */}
      <div className="flex-shrink-0">
        <label className="block text-sm font-bold mb-2">
          {t('controls.partitionGenerator.title')}
        </label>
        <NumberPartitionGenerator
          onAddPaths={onAddPaths}
          existingPaths={pathsData.map(p => p.path)}
          disabled={disabled}
          maxPaths={20000}
        />
      </div>
      
      {/* 路径长度生成器 */}
      <div className="flex-shrink-0">
        <label className="block text-sm font-bold mb-2">
          {t('controls.pathLengthGenerator.title')}
        </label>
        <PathLengthGenerator
          onAddPaths={onAddPaths}
          existingPaths={pathsData.map(p => p.path)}
          disabled={disabled}
          maxPaths={20000}
        />
      </div>
      
      {/* 路径列表 */}
      <div className="flex-grow flex flex-col overflow-hidden min-h-0">
        <div className="flex items-center justify-between mb-2 flex-shrink-0">
          <label className="block text-sm font-bold">
            {t('controls.pathList.title')}
          </label>
          {pathsData.length > 0 && (
            <button
              onClick={onClearAllPaths}
              disabled={disabled}
              className="p-1 text-gray-400 hover:text-red-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              title={t('controls.pathList.clearAll')}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          )}
        </div>
        <PathList
          pathsData={pathsData}
          onRemovePath={onRemovePath}
        />
      </div>
      
      {/* 点数控制 */}
      <PointsSlider
        value={numPoints}
        onChange={onNumPointsChange}
        disabled={disabled}
        formatPointCount={formatPointCount}
      />
    </div>
  );
};

export default ControlPanel;