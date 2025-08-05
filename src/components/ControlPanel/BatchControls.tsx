import React, { useCallback } from 'react';
import { useI18n } from '../../i18n/context';

interface BatchControlsProps {
  partitions: number[][];
  selectedPartitions: Set<string>;
  onSelectionChange: (selected: Set<string>) => void;
  onAddAll: () => void;
  onAddSelected: () => void;
  isProcessing?: boolean;
  progress?: {
    current: number;
    total: number;
  };
  lastResult?: {
    added: number;
    skipped: number;
    error?: string;
  };
}

const BatchControls: React.FC<BatchControlsProps> = ({
  partitions,
  selectedPartitions,
  onSelectionChange,
  onAddAll,
  onAddSelected,
  isProcessing = false,
  progress,
  lastResult
}) => {
  const { t } = useI18n();

  // Convert partition array to string key
  const partitionToKey = useCallback((partition: number[]): string => {
    return partition.join(',');
  }, []);

  // Handle select all
  const handleSelectAll = useCallback(() => {
    const allKeys = new Set(partitions.map(partitionToKey));
    onSelectionChange(allKeys);
  }, [partitions, onSelectionChange, partitionToKey]);

  // Handle select none
  const handleSelectNone = useCallback(() => {
    onSelectionChange(new Set());
  }, [onSelectionChange]);

  // Handle clear selection
  const handleClearSelection = useCallback(() => {
    onSelectionChange(new Set());
  }, [onSelectionChange]);

  const selectedCount = selectedPartitions.size;
  const totalCount = partitions.length;
  const hasPartitions = totalCount > 0;
  const hasSelection = selectedCount > 0;

  if (!hasPartitions) {
    return null;
  }

  return (
    <div className="space-y-3">
      {/* Selection controls */}
      <div className="flex gap-2">
        <button
          onClick={handleSelectAll}
          disabled={isProcessing || selectedCount === totalCount}
          className="flex-1 px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {t('partition.batch.selectAll')}
        </button>
        
        <button
          onClick={handleSelectNone}
          disabled={isProcessing || selectedCount === 0}
          className="flex-1 px-2 py-1 text-xs bg-gray-600 text-white rounded hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {t('partition.batch.selectNone')}
        </button>
        
        {hasSelection && (
          <button
            onClick={handleClearSelection}
            disabled={isProcessing}
            className="px-2 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {t('partition.batch.clearSelection')}
          </button>
        )}
      </div>

      {/* Action buttons */}
      <div className="space-y-2">
        <button
          onClick={onAddAll}
          disabled={isProcessing}
          className="w-full px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
        >
          {isProcessing && !hasSelection 
            ? t('partition.batch.progress', { 
                current: progress?.current?.toString() || '0', 
                total: progress?.total?.toString() || '0' 
              })
            : t('partition.batch.addAll')
          }
        </button>
        
        {hasSelection && (
          <button
            onClick={onAddSelected}
            disabled={isProcessing}
            className="w-full px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
          >
            {isProcessing && hasSelection
              ? t('partition.batch.progress', { 
                  current: progress?.current?.toString() || '0', 
                  total: progress?.total?.toString() || '0' 
                })
              : t('partition.batch.addSelected') + ` (${selectedCount})`
            }
          </button>
        )}
      </div>

      {/* Progress indicator */}
      {isProcessing && progress && (
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-gray-400">
            <span>
              {t('partition.batch.progress', { 
                current: progress.current.toString(), 
                total: progress.total.toString() 
              })}
            </span>
            <span>{Math.round((progress.current / progress.total) * 100)}%</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(progress.current / progress.total) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Result feedback */}
      {lastResult && !isProcessing && (
        <div className="text-xs space-y-1">
          {lastResult.error ? (
            <div className="text-red-400 bg-red-900 bg-opacity-20 p-2 rounded">
              {t('partition.batch.error')}: {lastResult.error}
            </div>
          ) : (
            <div className="text-green-400 bg-green-900 bg-opacity-20 p-2 rounded space-y-1">
              <div>
                {t('partition.batch.success', { count: lastResult.added.toString() })}
              </div>
              {lastResult.skipped > 0 && (
                <div className="text-yellow-400">
                  {t('partition.batch.skipped', { count: lastResult.skipped.toString() })}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Selection summary */}
      {hasSelection && !isProcessing && (
        <div className="text-xs text-gray-400 text-center">
          {selectedCount} of {totalCount} partitions selected
        </div>
      )}
    </div>
  );
};

export default BatchControls;