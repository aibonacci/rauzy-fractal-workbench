import React from 'react';
import { PathData } from '../../types';
import { HIGHLIGHT_PALETTE, TEST_IDS } from '../../utils/constants';

interface PathDataCardProps {
  pathData: PathData;
  index: number;
}

const PathDataCard: React.FC<PathDataCardProps> = ({ pathData, index }) => {
  const formatCoordinate = (coord: { re: number; im: number } | null): string => {
    if (!coord) return 'N/A';
    return `(${coord.re.toFixed(4)}, ${coord.im.toFixed(4)})`;
  };

  const formatSequence = (sequence: number[]): string => {
    if (sequence.length === 0) return 'N/A';
    const preview = sequence.slice(0, 5);
    const suffix = sequence.length > 5 ? '...' : '';
    return preview.join(', ') + suffix;
  };

  return (
    <div 
      className="bg-gray-700 p-3 rounded-lg hover:bg-gray-650 transition-colors"
      data-testid={`${TEST_IDS.PATH_DATA_CARD}-${index}`}
    >
      {/* 路径标题 */}
      <div className="flex items-center gap-2 mb-3">
        <span
          style={{
            backgroundColor: HIGHLIGHT_PALETTE[index % HIGHLIGHT_PALETTE.length]
          }}
          className="w-4 h-4 rounded-full flex-shrink-0"
          title="路径颜色指示器"
        />
        <h4 className="font-bold font-mono break-all text-white">
          路径 ({pathData.path.join(',')})
        </h4>
      </div>

      {/* 数据详情 */}
      <div className="text-xs font-mono space-y-2 text-gray-300">
        {/* 基础参数 */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <span className="text-gray-400">r值:</span>
            <span className="text-white ml-1">{pathData.rp}</span>
          </div>
          <div>
            <span className="text-gray-400">C值:</span>
            <span className="text-white ml-1">{pathData.cl}</span>
          </div>
        </div>

        {/* 系数 */}
        <div>
          <div className="text-gray-400 mb-1">系数:</div>
          <div className="bg-gray-800 p-2 rounded text-xs">
            <div>α₁: <span className="text-white">{pathData.coeffs[1]}</span></div>
            <div>α₂: <span className="text-white">{pathData.coeffs[2]}</span></div>
            <div>α₃: <span className="text-white">{pathData.coeffs[3]}</span></div>
          </div>
        </div>

        {/* 首项坐标 */}
        <div>
          <span className="text-gray-400">首项坐标:</span>
          <div className="text-white mt-1 break-all">
            {formatCoordinate(pathData.firstPointCoords)}
          </div>
        </div>

        {/* 位置数列 */}
        <div>
          <div className="text-gray-400 mb-1">
            位置数列 (前5项, 共{pathData.sequence.length}项):
          </div>
          <div className="text-white bg-gray-800 p-2 rounded break-all text-xs">
            {formatSequence(pathData.sequence)}
          </div>
        </div>

        {/* 统计信息 */}
        {pathData.sequence.length > 0 && (
          <div className="pt-2 border-t border-gray-600">
            <div className="text-gray-400 text-xs">
              序列长度: <span className="text-white">{pathData.sequence.length}</span>
              {pathData.sequence.length > 0 && (
                <>
                  {' | '}
                  最大值: <span className="text-white">{Math.max(...pathData.sequence)}</span>
                  {' | '}
                  最小值: <span className="text-white">{Math.min(...pathData.sequence)}</span>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PathDataCard;