import React, { useState, useCallback, useMemo } from 'react';
import { useI18n } from '../../i18n/context';

interface PartitionPreviewProps {
  partitions: number[][];
  selectedPartitions: Set<string>;
  onSelectionChange: (selected: Set<string>) => void;
  onAddSelected: () => void;
  isVisible: boolean;
  onToggleVisibility: () => void;
}

const PartitionPreview: React.FC<PartitionPreviewProps> = ({
  partitions,
  selectedPartitions,
  onSelectionChange,
  onAddSelected,
  isVisible,
  onToggleVisibility
}) => {
  const { t } = useI18n();

  // Convert partition array to string key for selection tracking
  const partitionToKey = useCallback((partition: number[]): string => {
    return partition.join(',');
  }, []);

  // Handle individual partition selection
  const handlePartitionToggle = useCallback((partition: number[]) => {
    const key = partitionToKey(partition);
    const newSelected = new Set(selectedPartitions);
    
    if (newSelected.has(key)) {
      newSelected.delete(key);
    } else {
      newSelected.add(key);
    }
    
    onSelectionChange(newSelected);
  }, [selectedPartitions, onSelectionChange, partitionToKey]);

  // Handle select all
  const handleSelectAll = useCallback(() => {
    const allKeys = new Set(partitions.map(partitionToKey));
    onSelectionChange(allKeys);
  }, [partitions, onSelectionChange, partitionToKey]);

  // Handle select none
  const handleSelectNone = useCallback(() => {
    onSelectionChange(new Set());
  }, [onSelectionChange]);

  const selectedCount = selectedPartitions.size;
  const totalCount = partitions.length;

  // Render partition as a formatted string
  const renderPartition = useCallback((partition: number[]) => {
    return `[${partition.join(',')}]`;
  }, []);

  if (totalCount === 0) {
    return null;
  }

  return (
    <div className="space-y-3 border border-gray-600 rounded-md bg-gray-750">
      {/* Header with toggle */}
      <div 
        className="flex items-center justify-between p-3 cursor-pointer hover:bg-gray-700 transition-colors"
        onClick={onToggleVisibility}
      >
        <div className="flex items-center space-x-2">
          <h3 className="text-sm font-semibold text-gray-200">
            {t('partition.preview.title')}
          </h3>
          <span className="text-xs text-gray-400">
            {t('partition.preview.count', { count: totalCount.toString() })}
          </span>
        </div>
        
        <div className="flex items-center space-x-2">
          {selectedCount > 0 && (
            <span className="text-xs text-blue-400">
              {selectedCount} selected
            </span>
          )}
          <svg
            className={`w-4 h-4 text-gray-400 transition-transform ${
              isVisible ? 'rotate-180' : ''
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>

      {/* Content */}
      {isVisible && (
        <div className="px-3 pb-3 space-y-3">
          {/* Selection controls */}
          <div className="flex gap-2">
            <button
              onClick={handleSelectAll}
              className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              {t('partition.preview.selectAll')}
            </button>
            <button
              onClick={handleSelectNone}
              className="px-2 py-1 text-xs bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
            >
              {t('partition.preview.selectNone')}
            </button>
          </div>

          {/* Partitions grid */}
          <div className="max-h-48 overflow-y-auto">
            <div className="grid grid-cols-2 gap-1">
              {partitions.map((partition, index) => {
                const key = partitionToKey(partition);
                const isSelected = selectedPartitions.has(key);
                
                return (
                  <label
                    key={index}
                    className={`flex items-center space-x-2 p-2 rounded cursor-pointer transition-colors ${
                      isSelected 
                        ? 'bg-blue-600 bg-opacity-20 border border-blue-500' 
                        : 'hover:bg-gray-700 border border-transparent'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => handlePartitionToggle(partition)}
                      className="w-3 h-3 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500 focus:ring-2"
                    />
                    <span className="text-xs text-gray-300 font-mono">
                      {renderPartition(partition)}
                    </span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Add selected button */}
          {selectedCount > 0 && (
            <button
              onClick={onAddSelected}
              className="w-full px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors text-sm"
            >
              {t('partition.preview.addSelected', { count: selectedCount.toString() })}
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default PartitionPreview;