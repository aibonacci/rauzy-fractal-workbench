import React, { useCallback, useRef, useEffect } from 'react';
import { APP_CONFIG, TEST_IDS } from '../../utils/constants';
import { debounce } from '../../utils/debounce';

interface PointsSliderProps {
  value: number;
  onChange: (value: number) => void;
  disabled: boolean;
  formatPointCount: (count: number) => string;
}

const PointsSlider: React.FC<PointsSliderProps> = ({
  value,
  onChange,
  disabled,
  formatPointCount
}) => {
  const [displayValue, setDisplayValue] = React.useState(value);
  const isDragging = useRef(false);
  
  // 创建防抖的onChange函数
  const debouncedOnChange = useCallback(
    debounce((newValue: number) => {
      onChange(newValue);
    }, 500), // 500ms延迟
    [onChange]
  );

  // 清理防抖函数
  useEffect(() => {
    return () => {
      debouncedOnChange.cancel();
    };
  }, [debouncedOnChange]);

  // 当外部value变化时，更新显示值（但不在拖拽时）
  useEffect(() => {
    if (!isDragging.current) {
      setDisplayValue(value);
    }
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = Number(e.target.value);
    setDisplayValue(newValue);
    
    // 拖拽时不立即触发onChange，只更新显示
    if (!isDragging.current) {
      debouncedOnChange(newValue);
    }
  };

  const handleMouseDown = () => {
    isDragging.current = true;
    debouncedOnChange.cancel(); // 取消之前的防抖调用
  };

  const handleMouseUp = (e: React.MouseEvent<HTMLInputElement>) => {
    const target = e.target as HTMLInputElement;
    const newValue = Number(target.value);
    
    isDragging.current = false;
    setDisplayValue(newValue);
    
    // 拖拽结束时立即触发onChange
    debouncedOnChange.cancel();
    onChange(newValue);
  };

  const handleTouchStart = () => {
    isDragging.current = true;
    debouncedOnChange.cancel();
  };

  const handleTouchEnd = (e: React.TouchEvent<HTMLInputElement>) => {
    const target = e.target as HTMLInputElement;
    const newValue = Number(target.value);
    
    isDragging.current = false;
    setDisplayValue(newValue);
    
    // 触摸结束时立即触发onChange
    debouncedOnChange.cancel();
    onChange(newValue);
  };

  return (
    <div className="space-y-3 pt-4 border-t border-gray-700 flex-shrink-0">
      <div className="flex items-center gap-3">
        <label 
          htmlFor="points-slider" 
          className="font-medium text-sm whitespace-nowrap"
        >
          总点数:
        </label>
        
        <input
          id="points-slider"
          data-testid={TEST_IDS.POINTS_SLIDER}
          type="range"
          min={APP_CONFIG.MIN_POINTS}
          max={APP_CONFIG.MAX_POINTS}
          step={APP_CONFIG.POINTS_STEP}
          value={displayValue}
          onChange={handleChange}
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          disabled={disabled}
          className="flex-1 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
          style={{
            background: disabled 
              ? '#374151' 
              : `linear-gradient(to right, #EAB308 0%, #EAB308 ${((displayValue - APP_CONFIG.MIN_POINTS) / (APP_CONFIG.MAX_POINTS - APP_CONFIG.MIN_POINTS)) * 100}%, #374151 ${((displayValue - APP_CONFIG.MIN_POINTS) / (APP_CONFIG.MAX_POINTS - APP_CONFIG.MIN_POINTS)) * 100}%, #374151 100%)`
          }}
        />
      </div>
      
      <div className="text-center font-mono text-yellow-400 text-sm">
        {formatPointCount(displayValue)} 个点
        {isDragging.current && (
          <span className="text-gray-400 text-xs ml-2">(拖拽中...)</span>
        )}
      </div>
      
      <div className="flex justify-between text-xs text-gray-400">
        <span>{formatPointCount(APP_CONFIG.MIN_POINTS)}</span>
        <span>{formatPointCount(APP_CONFIG.MAX_POINTS)}</span>
      </div>
    </div>
  );
};

export default PointsSlider;