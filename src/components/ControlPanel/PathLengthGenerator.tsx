import React, { useState, useCallback } from 'react';
import { useI18n } from '../../i18n/context';
import { 
  generatePathsByLength, 
  validatePathLengthInput,
  calculatePathCountByLength 
} from '../../utils/path-length-generator';

interface PathLengthGeneratorProps {
    onAddPaths: (paths: number[][]) => void;
    existingPaths: number[][];
    disabled?: boolean;
    maxPaths?: number;
}

const PathLengthGenerator: React.FC<PathLengthGeneratorProps> = ({
    onAddPaths,
    existingPaths,
    disabled = false,
    maxPaths = 20000
}) => {
    const { t } = useI18n();
    const [input, setInput] = useState('');
    const [error, setError] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);

    // Convert path array to string key for comparison
    const pathToKey = useCallback((path: number[]): string => {
        return path.join(',');
    }, []);

    // Check if a path already exists in the path list
    const isPathDuplicate = useCallback((path: number[]): boolean => {
        const pathKey = pathToKey(path);
        return existingPaths.some(existingPath => pathToKey(existingPath) === pathKey);
    }, [existingPaths, pathToKey]);

    // Handle input change
    const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        setInput(e.target.value);
        setError('');
    }, []);

    // Generate and add all paths of specified length
    const handleAddPathsByLength = useCallback(async () => {
        const validation = validatePathLengthInput(input);
        
        if (!validation.isValid) {
            setError(validation.error);
            return;
        }

        setIsGenerating(true);
        setError('');

        try {
            // Simulate async operation for better UX
            await new Promise(resolve => setTimeout(resolve, 100));

            const paths = generatePathsByLength(validation.value!);
            
            let addedCount = 0;
            let skippedCount = 0;
            const pathsToAdd: number[][] = [];

            // Check for duplicates and prepare paths to add
            for (const path of paths) {
                if (isPathDuplicate(path)) {
                    skippedCount++;
                } else {
                    pathsToAdd.push(path);
                    addedCount++;
                }

                // Check path limit
                if (existingPaths.length + pathsToAdd.length >= maxPaths) {
                    const remaining = paths.length - paths.indexOf(path) - 1;
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
            console.error('Error generating paths by length:', error);
            setError(t('pathLength.error'));
        } finally {
            setIsGenerating(false);
        }
    }, [input, existingPaths, maxPaths, onAddPaths, isPathDuplicate, t]);

    // Handle Enter key press
    const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !disabled && !isGenerating) {
            handleAddPathsByLength();
        }
    }, [disabled, isGenerating, handleAddPathsByLength]);

    // Calculate expected path count for preview
    const getExpectedCount = useCallback(() => {
        const validation = validatePathLengthInput(input);
        if (validation.isValid && validation.value) {
            return calculatePathCountByLength(validation.value);
        }
        return 0;
    }, [input]);

    const isOperationDisabled = disabled || isGenerating;
    const expectedCount = getExpectedCount();

    return (
        <div className="space-y-2">
            {/* Input Section */}
            <div className="flex space-x-2">
                <input
                    type="text"
                    value={input}
                    onChange={handleInputChange}
                    onKeyPress={handleKeyPress}
                    placeholder={t('pathLength.input.placeholder')}
                    disabled={isOperationDisabled}
                    className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-400 focus:outline-none focus:border-yellow-400 disabled:opacity-50"
                />
                <button
                    onClick={handleAddPathsByLength}
                    disabled={isOperationDisabled}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded font-medium transition-colors"
                >
                    {isGenerating ? t('pathLength.input.generating') : t('pathLength.input.generateButton')}
                </button>
            </div>

            {/* Expected count preview */}
            {expectedCount > 0 && !error && (
                <p className="text-xs text-blue-400">
                    {t('pathLength.input.expectedCount', { count: expectedCount.toString() })}
                </p>
            )}

            {/* Hint */}
            <p className="text-xs text-gray-400">
                {t('pathLength.input.hint')}
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

export default PathLengthGenerator;