import React from 'react';
import { TEST_IDS } from '../../utils/constants';

interface PathInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  error: string;
  disabled: boolean;
}

const PathInput: React.FC<PathInputProps> = ({
  value,
  onChange,
  onSubmit,
  error,
  disabled
}) => {
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !disabled) {
      onSubmit();
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
  };

  return (
    <div className="space-y-2">
      <label 
        htmlFor="path-input" 
        className="block text-sm font-bold mb-2"
      >
        构建路径 (例如: 1213)
      </label>
      
      <input
        id="path-input"
        data-testid={TEST_IDS.PATH_INPUT}
        type="text"
        value={value}
        onChange={handleChange}
        onKeyPress={handleKeyPress}
        disabled={disabled}
        placeholder="输入路径，如: 1213 或 1,2,1,3"
        className="w-full bg-gray-900 border border-gray-600 rounded px-3 py-2 font-mono text-yellow-400 focus:ring-2 focus:ring-yellow-500 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
      />
      
      {error && (
        <p className="text-red-400 text-xs mt-1" role="alert">
          {error}
        </p>
      )}
      
      <button
        data-testid={TEST_IDS.ADD_PATH_BUTTON}
        onClick={onSubmit}
        disabled={disabled || !value.trim()}
        className="w-full mt-2 bg-yellow-500 text-gray-900 font-bold py-2 rounded-lg hover:bg-yellow-400 disabled:bg-gray-500 disabled:cursor-not-allowed transition-colors"
      >
        添加路径到列表
      </button>
    </div>
  );
};

export default PathInput;