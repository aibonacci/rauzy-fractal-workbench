import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { ControlPanel, WebGLFractalCanvas as FractalCanvas, DataPanel, LoadingOverlay } from './components';
import AxisControlPanel from './components/AxisControlPanel/AxisControlPanel';
import MathCalculationErrorBoundary from './components/ErrorBoundary/MathCalculationErrorBoundary';
import NotificationSystem from './components/Notification/NotificationSystem';
import ProgressIndicator from './components/ProgressIndicator/ProgressIndicator';
import { SkeletonLoader } from './components/SkeletonLoader';
import { useNotifications } from './hooks/useNotifications';
import {
  calculatePathData,
  formatPointCount,
  validatePath,
  isDuplicatePath
} from './utils';
import { executeOptimizedRauzyCoreAlgorithm } from './utils/rauzy-core-optimized';
import { dispatchStateChange } from './utils/event-system';
import { BaseData, PathData, RenderPoint, AppState } from './types';
import { APP_CONFIG } from './utils/constants';
import { useI18n } from './i18n/context';
import { AxisSettings, DEFAULT_AXIS_SETTINGS } from './utils/webgl-axis-renderer';
import './utils/performance-test'; // 导入性能测试工具

const App: React.FC = () => {
  // 国际化
  const { t } = useI18n();
  
  // 通知系统
  const {
    notifications,
    removeNotification,
    showSuccess,
    showError,
    showWarning,
    showInfo
  } = useNotifications();

  // 初始化状态
  const [initState, setInitState] = useState({
    isInitializing: true,
    mathJsLoaded: false,
    uiReady: false,
    shouldStartCalculation: false
  });

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

  // 坐标轴状态
  const [axisSettings, setAxisSettings] = useState<AxisSettings>(DEFAULT_AXIS_SETTINGS);

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

  // 初始化流程
  useEffect(() => {
    const initializeApp = async () => {
      try {
        // 步骤1: 立即显示UI框架
        setInitState(prev => ({ ...prev, uiReady: true }));
        
        // 步骤2: 延迟加载Math.js，避免阻塞初始渲染
        await new Promise(resolve => setTimeout(resolve, 100));
        
        if (!(window as any).math) {
          const script = document.createElement('script');
          script.src = "https://cdnjs.cloudflare.com/ajax/libs/mathjs/11.8.0/math.min.js";
          script.async = true;
          
          await new Promise<void>((resolve, reject) => {
            script.onload = () => resolve();
            script.onerror = () => reject(new Error('Math.js加载失败'));
            document.body.appendChild(script);
          });
        }
        
        // 步骤3: Math.js加载完成
        setInitState(prev => ({ ...prev, mathJsLoaded: true }));
        setAppState(prev => ({
          ...prev,
          calculationState: { ...prev.calculationState, mathJsLoaded: true }
        }));
        
        // 步骤4: 延迟一段时间再完成初始化，让用户看到界面
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // 步骤5: 完成初始化，但不立即开始计算
        setInitState(prev => ({ 
          ...prev, 
          isInitializing: false,
          shouldStartCalculation: false // 让用户主动触发计算
        }));
        
      } catch (error) {
        console.error('初始化失败:', error);
        setAppState(prev => ({
          ...prev,
          calculationState: {
            ...prev.calculationState,
            error: t('notifications.mathJsLoadFailed')
          }
        }));
        setInitState(prev => ({ ...prev, isInitializing: false }));
      }
    };

    initializeApp();
  }, [t]);

  // 异步计算基础数据
  const calculateBaseData = useCallback(async (
    points: number, 
    onProgress?: (progress: number, message?: string) => void,
    shouldCancel?: () => boolean
  ): Promise<BaseData | null> => {
    // 添加小延迟确保UI状态更新
    await new Promise(resolve => setTimeout(resolve, 50));
    return await executeOptimizedRauzyCoreAlgorithm(points, onProgress, shouldCancel);
  }, []);

  // 当点数变化时重新计算基础数据（仅在初始化完成后）
  useEffect(() => {
    if (!appState.calculationState.mathJsLoaded || initState.isInitializing) return;

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
          setProgressState({ show: true, progress: 0, message: t('notifications.startingCalculation') });
        }

        const onProgress = (progress: number, message?: string) => {
          setProgressState(prev => ({
            ...prev,
            progress,
            message: message || t('notifications.calculating')
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
          showSuccess(t('notifications.calculationComplete'), t('notifications.pointsGenerated', { count: formatPointCount(appState.numPoints) }));
        } else {
          throw new Error(t('notifications.baseDataCalculationFailed'));
        }
      } catch (error) {
        console.error('Error calculating base data:', error);
        
        // 隐藏进度指示器
        setProgressState({ show: false, progress: 0, message: '' });
        
        setAppState(prev => ({
          ...prev,
          calculationState: {
            ...prev.calculationState,
            isLoading: false,
            error: t('notifications.baseDataCalculationError')
          }
        }));

        // 触发错误事件
        dispatchStateChange('ERROR_OCCURRED', {
          error: error instanceof Error ? error.message : t('notifications.baseDataCalculationError'),
          context: 'base_data_calculation'
        });

        // 显示错误通知
        showError(t('notifications.calculationFailed'), t('notifications.baseDataCalculationError'));
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
    showInfo(t('notifications.calculationCanceled'));
  }, [showInfo]);

  // 处理坐标轴设置变化
  const handleAxisSettingsChange = useCallback((newSettings: AxisSettings) => {
    setAxisSettings(newSettings);
    
    // 触发坐标轴设置变化事件
    dispatchStateChange('AXIS_SETTINGS_CHANGED', {
      settings: newSettings,
      timestamp: Date.now()
    });

    console.log('🎯 坐标轴设置已更新:', newSettings);
  }, []);

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
      setAppState(prev => ({ ...prev, inputError: validation.error || t('notifications.pathInvalid') }));
      return;
    }

    if (!validation.path) {
      setAppState(prev => ({ ...prev, inputError: t('notifications.pathParsingFailed') }));
      return;
    }

    if (isDuplicatePath(validation.path, appState.pathsData.map(p => p.path))) {
      setAppState(prev => ({ ...prev, inputError: t('notifications.pathAlreadyExists') }));
      return;
    }

    if (appState.pathsData.length >= APP_CONFIG.MAX_PATHS) {
      setAppState(prev => ({
        ...prev,
        inputError: t('notifications.maxPathsReached', { maxPaths: APP_CONFIG.MAX_PATHS.toString() })
      }));
      return;
    }

    if (!appState.baseData) {
      setAppState(prev => ({ ...prev, inputError: t('notifications.baseDataNotReady') }));
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
      showSuccess(t('notifications.pathAdded'), t('notifications.pathAddedSuccess', { path: validation.path.join(',') }));
    } catch (error) {
      console.error('Error calculating path data:', error);
      setAppState(prev => ({ ...prev, inputError: t('notifications.pathDataCalculationError') }));
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

  // 🎨 生成渲染点集（覆盖模式，参考正确实现）
  const renderedPoints = useMemo((): RenderPoint[] => {
    if (!appState.baseData) return [];
    
    // 1. 先创建所有背景点（highlightGroup = -1）
    const points: RenderPoint[] = appState.baseData.pointsWithBaseType.map(p => ({ 
      ...p, 
      highlightGroup: -1 
    }));
    
    console.log(`🎭 创建背景点集: ${points.length} 个点 (覆盖模式)`);
    
    // 2. 用路径高亮覆盖对应的背景点
    appState.pathsData.forEach((data, pathIndex) => {
      if (data && data.sequence) {
        console.log(`🎯 处理路径 ${pathIndex}: [${data.path.join(',')}], 序列长度: ${data.sequence.length}`);
        
        const highlightIndices = new Set(data.sequence.map(pos => pos - 1)); // base-1转base-0
        let highlightCount = 0;
        
        highlightIndices.forEach(index => {
          if (index >= 0 && index < points.length) {
            points[index].highlightGroup = pathIndex; // 覆盖背景点
            highlightCount++;
          }
        });
        
        console.log(`  -> 高亮了 ${highlightCount} 个点`);
      }
    });
    
    console.log(`🎨 渲染点集生成完成: 总计${points.length}个点`);
    return points;
  }, [appState.baseData, appState.pathsData]);

  const isDisabled = initState.isInitializing || appState.calculationState.isLoading;

  return (
    <MathCalculationErrorBoundary>
      {/* 骨架屏加载界面 */}
      <SkeletonLoader 
        show={initState.isInitializing}
        progress={initState.mathJsLoaded ? 80 : (initState.uiReady ? 40 : 10)}
        message={
          !initState.uiReady ? '正在加载界面...' :
          !initState.mathJsLoaded ? '正在加载数学库...' :
          '准备就绪...'
        }
      />
      
      <div className="bg-gray-800 text-white font-sans h-screen flex flex-col sm:flex-row overflow-hidden">
      {/* 左侧控制面板 */}
      <div className="w-full sm:w-[280px] md:w-[300px] lg:w-[320px] bg-gray-800 border-r sm:border-r border-b sm:border-b-0 border-gray-700 p-3 flex-shrink-0 order-0 sm:order-none overflow-y-auto">
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
        
        {/* 坐标轴控制面板 */}
        <AxisControlPanel
          settings={axisSettings}
          onSettingsChange={handleAxisSettingsChange}
          disabled={isDisabled}
        />
      </div>

      {/* 中央 Canvas 区域 */}
      <div className="flex-grow bg-gray-900 flex items-center justify-center relative order-1 sm:order-none min-w-0">
        <div className="w-full h-full max-w-full max-h-full aspect-[4/3] canvas-container">
          <FractalCanvas
            points={renderedPoints}
            isLoading={appState.calculationState.isLoading}
            axisSettings={axisSettings}
          />
        </div>

        {appState.calculationState.isLoading && <LoadingOverlay />}

        {/* 渲染统计信息 */}
        <div className="absolute bottom-4 left-4">
          <div className="font-mono text-yellow-400 text-xs bg-gray-800 bg-opacity-90 px-3 py-2 rounded space-y-1">
            <div>{t('canvas.renderMode', { mode: 'WebGL' })}</div>
            <div>{t('canvas.totalPoints', { count: formatPointCount(appState.numPoints) })}</div>
            <div>{t('canvas.renderedPoints', { count: formatPointCount(renderedPoints.length) })}</div>
            <div>{t('canvas.renderTime', { time: ((window as any).lastRenderStats?.renderTime || '0') })}</div>
          </div>
        </div>
      </div>

      {/* 右侧数据面板 - 进一步压缩宽度 */}
      <div className="w-full sm:w-[220px] md:w-[240px] lg:w-[260px] bg-gray-800 border-l sm:border-l border-t sm:border-t-0 border-gray-700 p-2 flex-shrink-0 order-2 sm:order-none overflow-y-auto">
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