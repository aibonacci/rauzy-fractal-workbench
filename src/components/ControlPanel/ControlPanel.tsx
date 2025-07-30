import React from 'react';
import { ControlPanelProps } from '../../types';
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
  return (
    <div className="w-full lg:w-1/5 bg-gray-800 border-r lg:border-r border-b lg:border-b-0 border-gray-700 flex-col p-4 space-y-4 flex-shrink-0 flex lg:min-w-[250px] order-0 lg:order-none">
      {/* 标题 */}
      <h1 className="text-xl font-bold text-yellow-400 flex-shrink-0">
        Rauzy 分形工作台
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
          路径列表
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