import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { ControlPanel, FractalCanvas, DataPanel, LoadingOverlay } from './components';
import MathCalculationErrorBoundary from './components/ErrorBoundary/MathCalculationErrorBoundary';
import NotificationSystem from './components/Notification/NotificationSystem';
import ProgressIndicator from './components/ProgressIndicator/ProgressIndicator';
import { useNotifications } from './hooks/useNotifications';
import {
  executeRauzyCoreAlgorithm,
  calculatePathData,
  formatPointCount,
  validatePath,
  isDuplicatePath
} from './utils';
import { dispatchStateChange } from './utils/event-system';
import { BaseData, PathData, RenderPoint, AppState } from './types';
import { APP_CONFIG } from './utils/constants';

const App: React.FC = () => {
  // 通知系统
  const {
    notifications,
    removeNotification,
    showSuccess,
    showError,
    showWarning,
    showInfo
  } = useNotifications();

  // 应用状态
  const [appState, setAppState] = useState<AppState>({
    numPoints: APP_CONFIG.DEFAULT_POINTS,
    pathInput: '',
    inputError: '',
    baseData: null,
    pathsData: [],
    calculationState: {
      isLoading: false,
      mathJsLoaded: false,
      error: null
    }
  });

  // 进度状态
  const [progressState, setProgressState] = useState<{
    show: boolean;
    progress: number;
    message: string;
  }>({
    show: false,
    progress: 0,
    message: ''
  });

  // 使用 ref 来跟踪计算状态，避免重复计算
  const calculationRef = useRef<{
    currentNumPoints: number;
    isCalculating: boolean;
    abortController: AbortController | null;
    shouldCancel: boolean;
  }>({
    currentNumPoints: 0,
    isCalculating: false,
    shouldCancel: false,
    abortController: null
  });

  // 加载 Math.js 库
  useEffect(() => {
    if ((window as any).math) {
      setAppState(prev => ({
        ...prev,
        calculationState: { ...prev.calculationState, mathJsLoaded: true }
      }));
      return;
    }

    const script = document.createElement('script');
    script.src = "https://cdnjs.cloudflare.com/ajax/libs/mathjs/11.8.0/math.min.js";
    script.async = true;
    script.onload = () => {
      setAppState(prev => ({
        ...prev,
        calculationState: { ...prev.calculationState, mathJsLoaded: true }
      }));
    };
    script.onerror = () => {
      setAppState(prev => ({
        ...prev,
        calculationState: {
          ...prev.calculationState,
          error: 'Math.js 库加载失败'
        }
      }));
    };
    document.body.appendChild(script);

    return () => {
      if (script.parentNode) {
        document.body.removeChild(script);
      }
    };
  }, []);

  // 异步计算基础数据
  const calculateBaseData = useCallback(async (
    points: number, 
    onProgress?: (progress: number, message?: string) => void,
    shouldCancel?: () => boolean
  ): Promise<BaseData | null> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const data = executeRauzyCoreAlgorithm(points, onProgress, shouldCancel);
        resolve(data);
      }, 50);
    });
  }, []);

  // 当点数变化时重新计算基础数据
  useEffect(() => {
    if (!appState.calculationState.mathJsLoaded) return;

    // 避免重复计算相同的点数
    if (calculationRef.current.currentNumPoints === appState.numPoints ||
      calculationRef.current.isCalculating) {
      return;
    }

    const performCalculation = async () => {
      calculationRef.current.isCalculating = true;

      setAppState(prev => ({
        ...prev,
        calculationState: { ...prev.calculationState, isLoading: true, error: null }
      }));

      try {
        // 显示进度指示器
        if (appState.numPoints > 20000) {
          setProgressState({ show: true, progress: 0, message: '开始计算...' });
        }

        const onProgress = (progress: number, message?: string) => {
          setProgressState(prev => ({
            ...prev,
            progress,
            message: message || '计算中...'
          }));
        };

        const shouldCancel = () => calculationRef.current.shouldCancel;

        const newBaseData = await calculateBaseData(appState.numPoints, onProgress, shouldCancel);

        if (newBaseData) {
          calculationRef.current.currentNumPoints = appState.numPoints;

          // 重新计算所有路径数据
          const newPathsData = appState.pathsData.map(pathData =>
            calculatePathData(pathData.path, newBaseData.indexMaps, newBaseData.pointsWithBaseType)
          );

          setAppState(prev => ({
            ...prev,
            baseData: newBaseData,
            pathsData: newPathsData,
            calculationState: { ...prev.calculationState, isLoading: false }
          }));

          // 触发计算完成事件
          dispatchStateChange('CALCULATION_COMPLETE', {
            numPoints: appState.numPoints,
            pathCount: newPathsData.length
          });

          // 隐藏进度指示器
          setProgressState({ show: false, progress: 0, message: '' });

          // 显示计算完成通知
          showSuccess('计算完成', `已生成 ${formatPointCount(appState.numPoints)} 个分形点`);
        } else {
          throw new Error('基础数据计算失败');
        }
      } catch (error) {
        console.error('计算基础数据时出错:', error);
        
        // 隐藏进度指示器
        setProgressState({ show: false, progress: 0, message: '' });
        
        setAppState(prev => ({
          ...prev,
          calculationState: {
            ...prev.calculationState,
            isLoading: false,
            error: '计算基础数据时出错，请重试'
          }
        }));

        // 触发错误事件
        dispatchStateChange('ERROR_OCCURRED', {
          error: error instanceof Error ? error.message : '计算基础数据时出错',
          context: 'base_data_calculation'
        });

        // 显示错误通知
        showError('计算失败', '基础数据计算时出错，请重试');
      } finally {
        calculationRef.current.isCalculating = false;
      }
    };

    performCalculation();
  }, [appState.calculationState.mathJsLoaded, appState.numPoints, calculateBaseData, showSuccess, showError]);

  // 取消计算
  const handleCancelCalculation = useCallback(() => {
    calculationRef.current.shouldCancel = true;
    setProgressState({ show: false, progress: 0, message: '' });
    setAppState(prev => ({
      ...prev,
      calculationState: { ...prev.calculationState, isLoading: false }
    }));
    showInfo('计算已取消');
  }, [showInfo]);

  // 处理点数变化
  const handleNumPointsChange = useCallback((points: number) => {
    // 重置取消标志
    calculationRef.current.shouldCancel = false;
    setAppState(prev => ({ ...prev, numPoints: points }));

    // 触发点数更新事件
    dispatchStateChange('POINTS_UPDATED', { numPoints: points });
  }, []);

  // 处理路径输入变化
  const handlePathInputChange = useCallback((input: string) => {
    setAppState(prev => ({
      ...prev,
      pathInput: input,
      inputError: ''
    }));
  }, []);

  // 添加路径
  const handleAddPath = useCallback(() => {
    const validation = validatePath(appState.pathInput);

    if (!validation.isValid) {
      setAppState(prev => ({ ...prev, inputError: validation.error || '路径无效' }));
      return;
    }

    if (!validation.path) {
      setAppState(prev => ({ ...prev, inputError: '路径解析失败' }));
      return;
    }

    if (isDuplicatePath(validation.path, appState.pathsData.map(p => p.path))) {
      setAppState(prev => ({ ...prev, inputError: '该路径已存在' }));
      return;
    }

    if (appState.pathsData.length >= APP_CONFIG.MAX_PATHS) {
      setAppState(prev => ({
        ...prev,
        inputError: `最多只能添加 ${APP_CONFIG.MAX_PATHS} 条路径`
      }));
      return;
    }

    if (!appState.baseData) {
      setAppState(prev => ({ ...prev, inputError: '基础数据未准备好，请稍候' }));
      return;
    }

    try {
      const newPathData = calculatePathData(
        validation.path,
        appState.baseData.indexMaps,
        appState.baseData.pointsWithBaseType
      );

      setAppState(prev => ({
        ...prev,
        pathsData: [...prev.pathsData, newPathData],
        pathInput: '',
        inputError: ''
      }));

      // 触发路径添加事件
      dispatchStateChange('PATH_ADDED', {
        path: validation.path,
        pathData: newPathData,
        totalPaths: appState.pathsData.length + 1
      });

      // 显示成功通知
      showSuccess('路径已添加', `路径 (${validation.path.join(',')}) 已成功添加到分析列表`);
    } catch (error) {
      console.error('计算路径数据时出错:', error);
      setAppState(prev => ({ ...prev, inputError: '计算路径数据时出错' }));
    }
  }, [appState.pathInput, appState.pathsData, appState.baseData]);

  // 删除路径
  const handleRemovePath = useCallback((index: number) => {
    const pathToRemove = appState.pathsData[index];

    setAppState(prev => ({
      ...prev,
      pathsData: prev.pathsData.filter((_, i) => i !== index)
    }));

    // 触发路径删除事件
    if (pathToRemove) {
      dispatchStateChange('PATH_REMOVED', {
        path: pathToRemove.path,
        index,
        remainingPaths: appState.pathsData.length - 1
      });
    }
  }, [appState.pathsData]);

  // 生成渲染点数据
  const renderedPoints = useMemo((): RenderPoint[] => {
    if (!appState.baseData) return [];

    const points: RenderPoint[] = appState.baseData.pointsWithBaseType.map(p => ({
      ...p,
      highlightGroup: -1
    }));

    // 为每条路径的点设置高亮组
    appState.pathsData.forEach((data, pathIndex) => {
      if (data.sequence && data.sequence.length > 0) {
        data.sequence.forEach(pos => {
          if (pos > 0 && pos <= points.length) {
            points[pos - 1].highlightGroup = pathIndex;
          }
        });
      }
    });

    return points;
  }, [appState.baseData, appState.pathsData]);

  const isDisabled = !appState.baseData || appState.calculationState.isLoading;

  return (
    <MathCalculationErrorBoundary>
      <div className="bg-gray-800 text-white font-sans h-screen flex flex-col lg:flex-row overflow-hidden">
      {/* 左侧控制面板 */}
      <ControlPanel
        numPoints={appState.numPoints}
        onNumPointsChange={handleNumPointsChange}
        pathInput={appState.pathInput}
        onPathInputChange={handlePathInputChange}
        inputError={appState.inputError}
        onAddPath={handleAddPath}
        pathsData={appState.pathsData}
        onRemovePath={handleRemovePath}
        disabled={isDisabled}
        formatPointCount={formatPointCount}
      />

      {/* 中央 Canvas 区域 */}
      <div className="flex-grow bg-gray-900 flex items-center justify-center relative order-1 lg:order-none">
        <div className="w-full h-full max-w-full max-h-full aspect-[4/3]">
          <FractalCanvas
            points={renderedPoints}
            isLoading={appState.calculationState.isLoading}
          />
        </div>

        {appState.calculationState.isLoading && <LoadingOverlay />}

        {/* 点数显示 */}
        <div className="absolute bottom-4 left-4">
          <div className="text-center font-mono text-yellow-400 text-sm bg-gray-800 bg-opacity-75 px-3 py-1 rounded">
            {formatPointCount(appState.numPoints)} 个点
          </div>
        </div>
      </div>

      {/* 右侧数据面板 */}
      <div className="w-full lg:w-1/4 xl:w-80 bg-gray-800 border-l lg:border-l border-t lg:border-t-0 border-gray-700 p-4 flex-shrink-0 lg:min-w-[300px] lg:max-w-[400px] order-2 lg:order-none">
        <DataPanel pathsData={appState.pathsData} />
      </div>

      {/* 进度指示器 */}
      {progressState.show && (
        <ProgressIndicator
          progress={progressState.progress}
          message={progressState.message}
          onCancel={handleCancelCalculation}
          showCancel={true}
        />
      )}

      {/* 通知系统 */}
      <NotificationSystem
        notifications={notifications}
        onClose={removeNotification}
      />
      </div>
    </MathCalculationErrorBoundary>
  );
};

export default App;