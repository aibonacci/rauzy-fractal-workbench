import React, { useState, useCallback } from 'react';
import { useI18n } from '../../i18n/context';

interface PartitionInputProps {
  onGenerate: (target: number) => void;
  onPreview: (target: number) => void;
  disabled?: boolean;
  isGenerating?: boolean;
}

const PartitionInput: React.FC<PartitionInputProps> = ({
  onGenerate,
  onPreview,
  disabled = false,
  isGenerating = false
}) => {
  const { t } = useI18n();
  const [inputValue, setInputValue] = useState('');
  const [error, setError] = useState('');

  const validateInput = useCallback((value: string): { isValid: boolean; error: string; number?: number } => {
    if (!value.trim()) {
      return { isValid: false, error: t('partition.input.emptyError') };
    }

    const num = parseInt(value.trim(), 10);
    
    if (isNaN(num)) {
      return { isValid: false, error: t('partition.input.formatError') };
    }

    if (num <= 0) {
      return { isValid: false, error: t('partition.input.positiveError') };
    }

    if (num > 20) {
      return { isValid: false, error: t('partition.input.rangeError') };
    }

    return { isValid: true, error: '', number: num };
  }, [t]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);
    
    // Real-time validation
    const validation = validateInput(value);
    setError(validation.error);
  }, [validateInput]);

  const handlePreview = useCallback(() => {
    const validation = validateInput(inputValue);
    if (validation.isValid && validation.number) {
      setError('');
      onPreview(validation.number);
    }
  }, [inputValue, validateInput, onPreview]);

  const handleGenerate = useCallback(() => {
    const validation = validateInput(inputValue);
    if (validation.isValid && validation.number) {
      setError('');
      onGenerate(validation.number);
    }
  }, [inputValue, validateInput, onGenerate]);

  const isInputValid = validateInput(inputValue).isValid;

  return (
    <div className="space-y-3">
      <label className="block text-sm font-bold text-gray-200">
        {t('partition.input.label')}
      </label>
      
      <div className="space-y-2">
        <input
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          placeholder={t('partition.input.placeholder')}
          disabled={disabled || isGenerating}
          className={`w-full px-3 py-2 bg-gray-700 border rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 transition-colors ${
            error 
              ? 'border-red-500 focus:ring-red-500' 
              : 'border-gray-600 focus:ring-blue-500'
          } ${disabled || isGenerating ? 'opacity-50 cursor-not-allowed' : ''}`}
        />
        
        {error && (
          <p className="text-red-400 text-xs">{error}</p>
        )}
        
        <div className="flex gap-2">
          <button
            onClick={handlePreview}
            disabled={!isInputValid || disabled || isGenerating}
            className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
          >
            {t('partition.input.previewButton')}
          </button>
          
          <button
            onClick={handleGenerate}
            disabled={!isInputValid || disabled || isGenerating}
            className="flex-1 px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
          >
            {isGenerating ? t('partition.input.generating') : t('partition.input.generateButton')}
          </button>
        </div>
      </div>
      
      <div className="text-xs text-gray-400">
        {t('partition.input.hint')}
      </div>
    </div>
  );
};

export default PartitionInput;