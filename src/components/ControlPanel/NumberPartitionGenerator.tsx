import React, { useState, useCallback } from 'react';
import { useI18n } from '../../i18n/context';
import { generatePartitions, validatePartitionInput } from '../../utils/number-partition';

interface NumberPartitionGeneratorProps {
    onAddPaths: (paths: number[][]) => void;
    existingPaths: number[][];
    disabled?: boolean;
    maxPaths?: number;
}

const NumberPartitionGenerator: React.FC<NumberPartitionGeneratorProps> = ({
    onAddPaths,
    existingPaths,
    disabled = false,
    maxPaths = 20000
}) => {
    const { t } = useI18n();
    const [input, setInput] = useState('');
    const [error, setError] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);

    // Convert partition array to string key for comparison
    const partitionToKey = useCallback((partition: number[]): string => {
        return partition.join(',');
    }, []);

    // Check if a partition already exists in the path list
    const isPartitionDuplicate = useCallback((partition: number[]): boolean => {
        const partitionKey = partitionToKey(partition);
        return existingPaths.some(path => partitionToKey(path) === partitionKey);
    }, [existingPaths, partitionToKey]);

    // Handle input change
    const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        setInput(e.target.value);
        setError('');
    }, []);

    // Generate and add all partitions directly
    const handleAddPartitions = useCallback(async () => {
        const validation = validatePartitionInput(input);
        
        if (!validation.isValid) {
            setError(validation.error);
            return;
        }

        setIsGenerating(true);
        setError('');

        try {
            // Simulate async operation for better UX
            await new Promise(resolve => setTimeout(resolve, 100));

            const partitions = generatePartitions(validation.value!);
            
            let addedCount = 0;
            let skippedCount = 0;
            const pathsToAdd: number[][] = [];

            // Check for duplicates and prepare paths to add
            for (const partition of partitions) {
                if (isPartitionDuplicate(partition)) {
                    skippedCount++;
                } else {
                    pathsToAdd.push(partition);
                    addedCount++;
                }

                // Check path limit
                if (existingPaths.length + pathsToAdd.length >= maxPaths) {
                    const remaining = partitions.length - partitions.indexOf(partition) - 1;
                    skippedCount += remaining;
                    break;
                }
            }

            // Add all valid paths at once
            if (pathsToAdd.length > 0) {
                onAddPaths(pathsToAdd);
                setInput(''); // Clear input on success
            }

        } catch (error) {
            console.error('Error generating partitions:', error);
            setError(t('partition.batch.error'));
        } finally {
            setIsGenerating(false);
        }
    }, [input, existingPaths, maxPaths, onAddPaths, isPartitionDuplicate, t]);

    // Handle Enter key press
    const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !disabled && !isGenerating) {
            handleAddPartitions();
        }
    }, [disabled, isGenerating, handleAddPartitions]);

    const isOperationDisabled = disabled || isGenerating;

    return (
        <div className="space-y-2">
            {/* Input Section */}
            <div className="flex space-x-2">
                <input
                    type="text"
                    value={input}
                    onChange={handleInputChange}
                    onKeyPress={handleKeyPress}
                    placeholder={t('partition.input.placeholder')}
                    disabled={isOperationDisabled}
                    className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-400 focus:outline-none focus:border-yellow-400 disabled:opacity-50"
                />
                <button
                    onClick={handleAddPartitions}
                    disabled={isOperationDisabled}
                    className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded font-medium transition-colors"
                >
                    {isGenerating ? t('partition.input.generating') : t('partition.input.generateButton')}
                </button>
            </div>

            {/* Hint */}
            <p className="text-xs text-gray-400">
                {t('partition.input.hint')}
            </p>

            {/* Error Display */}
            {error && (
                <div className="text-red-400 text-sm bg-red-900 bg-opacity-20 p-2 rounded">
                    {error}
                </div>
            )}
        </div>
    );
};

export default NumberPartitionGenerator;