import React from 'react';
import { PathData } from '../../types';
import { useI18n } from '../../i18n/context';
import { useConfig } from '../../config/ConfigContext';

interface PathDataCardProps {
  pathData: PathData;
  index: number;
}

const PathDataCard: React.FC<PathDataCardProps> = ({ pathData, index }) => {
  const { t } = useI18n();
  const { config } = useConfig();
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
      className="bg-gray-700 p-2 rounded-lg hover:bg-gray-650 transition-colors"
      data-testid={`${config.development.testIds.pathDataCard}-${index}`}
    >
      {/* 路径标题 */}
      <div className="flex items-center gap-2 mb-2">
        <span
          style={{
            backgroundColor: config.ui.colors.highlight[index % config.ui.colors.highlight.length]
          }}
          className="w-3 h-3 rounded-full flex-shrink-0"
          title={t('dataPanel.pathCard.colorIndicator')}
        />
        <h4 className="font-bold font-mono break-all text-white text-sm">
          {t('dataPanel.pathCard.pathTitle', { path: pathData.path.join(',') })}
        </h4>
      </div>

      {/* 数据详情 */}
      <div className="text-xs font-mono space-y-1.5 text-gray-300">
        {/* 基础参数 */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <span className="text-gray-400">{t('dataPanel.pathCard.rValue')}</span>
            <span className="text-white ml-1">{pathData.rp}</span>
          </div>
          <div>
            <span className="text-gray-400">{t('dataPanel.pathCard.cValue')}</span>
            <span className="text-white ml-1">{pathData.cl}</span>
          </div>
        </div>

        {/* 系数 */}
        <div>
          <div className="text-gray-400 mb-1">{t('dataPanel.pathCard.coefficients')}</div>
          <div className="bg-gray-800 p-1.5 rounded text-xs">
            <div>α₁: <span className="text-white">{pathData.coeffs[1]}</span></div>
            <div>α₂: <span className="text-white">{pathData.coeffs[2]}</span></div>
            <div>α₃: <span className="text-white">{pathData.coeffs[3]}</span></div>
          </div>
        </div>

        {/* 首项坐标 */}
        <div>
          <span className="text-gray-400">{t('dataPanel.pathCard.firstPointCoords')}</span>
          <div className="text-white mt-1 break-all">
            {formatCoordinate(pathData.firstPointCoords)}
          </div>
        </div>

        {/* 位置数列 */}
        <div>
          <div className="text-gray-400 mb-1">
            {t('dataPanel.pathCard.positionSequence', { count: pathData.sequence.length.toString() })}
          </div>
          <div className="text-white bg-gray-800 p-1.5 rounded break-all text-xs">
            {formatSequence(pathData.sequence)}
          </div>
        </div>


      </div>
    </div>
  );
};

export default PathDataCard;