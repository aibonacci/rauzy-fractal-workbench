import { useState, useEffect } from 'react';

interface LayoutConfig {
  mode: 'mobile' | 'tablet' | 'desktop' | 'wide' | 'ultrawide';
  controlPanelWidth: number;
  dataPanelWidth: number;
  minCanvasWidth: number;
  isStacked: boolean;
  showCollapsible: boolean;
}

const LAYOUT_MODES = {
  mobile: {
    controlPanelWidth: 280,
    dataPanelWidth: 360,
    minCanvasWidth: 320,
    isStacked: true,
    showCollapsible: true
  },
  tablet: {
    controlPanelWidth: 280,
    dataPanelWidth: 360,
    minCanvasWidth: 500,
    isStacked: true,
    showCollapsible: true
  },
  desktop: {
    controlPanelWidth: 280,
    dataPanelWidth: 360,
    minCanvasWidth: 600,
    isStacked: false,
    showCollapsible: false
  },
  wide: {
    controlPanelWidth: 300,
    dataPanelWidth: 380,
    minCanvasWidth: 700,
    isStacked: false,
    showCollapsible: false
  },
  ultrawide: {
    controlPanelWidth: 320,
    dataPanelWidth: 400,
    minCanvasWidth: 800,
    isStacked: false,
    showCollapsible: false
  }
} as const;

export const useResponsiveLayout = (): LayoutConfig => {
  const [config, setConfig] = useState<LayoutConfig>({
    mode: 'desktop',
    controlPanelWidth: 280,
    dataPanelWidth: 360,
    minCanvasWidth: 600,
    isStacked: false,
    showCollapsible: false
  });

  useEffect(() => {
    const updateLayout = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      const ratio = width / height;
      
      // 计算所需的最小宽度 (控制面板 + 数据面板 + 最小画布)
      const minRequiredWidth = 280 + 360 + 600; // 1240px
      
      let mode: LayoutConfig['mode'];
      
      if (width < 768) {
        mode = 'mobile';
      } else if (width < 1024) {
        mode = 'tablet';
      } else if (width < minRequiredWidth) {
        // 宽度不足，使用堆叠模式
        mode = 'tablet';
      } else if (ratio > 2.5) {
        mode = 'ultrawide';
      } else if (ratio > 1.8 && width > 1600) {
        mode = 'wide';
      } else {
        mode = 'desktop';
      }
      
      const layoutMode = LAYOUT_MODES[mode];
      
      setConfig({
        mode,
        ...layoutMode
      });
    };

    updateLayout();
    window.addEventListener('resize', updateLayout);
    return () => window.removeEventListener('resize', updateLayout);
  }, []);

  return config;
};

// 导出布局常量供其他组件使用
export const BREAKPOINTS = {
  mobile: 768,
  tablet: 1024,
  desktop: 1240,
  wide: 1600,
  ultrawide: 2000
} as const;