import React from 'react';
import { ControlPanelProps } from '../../types';
import { useI18n } from '../../i18n/context';
import PathInput from './PathInput';
import PathList from './PathList';
import PointsSlider from './PointsSlider';

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
  formatPointCount
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
      
      {/* 路径列表 */}
      <div className="flex-grow flex flex-col overflow-hidden min-h-0">
        <label className="block text-sm font-bold mb-2 flex-shrink-0">
          {t('controls.pathList.title')}
        </label>
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