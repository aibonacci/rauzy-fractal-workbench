import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ControlPanel from '../ControlPanel/ControlPanel';
import { ControlPanelProps } from '../../types';
import { ConfigProvider } from '../../config/ConfigContext';
import { I18nProvider } from '../../i18n/context';
import { DEFAULT_CONFIG } from '../../config/defaultConfig';

// Helper function to render with providers
const renderWithProviders = (component: React.ReactElement) => {
  return render(
    <ConfigProvider initialConfig={DEFAULT_CONFIG}>
      <I18nProvider>
        {component}
      </I18nProvider>
    </ConfigProvider>
  );
};

// Mock props
const mockProps: ControlPanelProps = {
  numPoints: 100000,
  onNumPointsChange: vi.fn(),
  pathInput: '',
  onPathInputChange: vi.fn(),
  inputError: '',
  onAddPath: vi.fn(),
  pathsData: [],
  onRemovePath: vi.fn(),
  disabled: false,
  formatPointCount: (count: number) => count.toLocaleString()
};

describe('ControlPanel', () => {
  it('应该渲染标题', () => {
    renderWithProviders(<ControlPanel {...mockProps} />);
    expect(screen.getByText('Rauzy 分形工作台')).toBeInTheDocument();
  });

  it('应该渲染路径输入组件', () => {
    renderWithProviders(<ControlPanel {...mockProps} />);
    expect(screen.getByLabelText(/构建路径/)).toBeInTheDocument();
  });

  it('应该渲染点数滑块', () => {
    renderWithProviders(<ControlPanel {...mockProps} />);
    expect(screen.getByLabelText(/总点数/)).toBeInTheDocument();
  });

  it('应该显示路径列表', () => {
    renderWithProviders(<ControlPanel {...mockProps} />);
    expect(screen.getByText('路径列表')).toBeInTheDocument();
  });

  it('当有路径数据时应该显示路径', () => {
    const propsWithPaths = {
      ...mockProps,
      pathsData: [{
        path: [1, 2, 3],
        rp: 6,
        coeffs: { 1: 1, 2: 2, 3: 3 },
        cl: 5,
        sequence: [1, 2, 3],
        firstPointCoords: { re: 1, im: 2 }
      }]
    };

    renderWithProviders(<ControlPanel {...propsWithPaths} />);
    expect(screen.getByText('(1,2,3)')).toBeInTheDocument();
  });

  it('当disabled为true时应该禁用控件', () => {
    const disabledProps = { ...mockProps, disabled: true };
    renderWithProviders(<ControlPanel {...disabledProps} />);
    
    const addButton = screen.getByText('添加路径到列表');
    expect(addButton).toBeDisabled();
  });

  it('应该调用onPathInputChange当输入改变时', () => {
    renderWithProviders(<ControlPanel {...mockProps} />);
    
    const input = screen.getByLabelText(/构建路径/);
    fireEvent.change(input, { target: { value: '123' } });
    
    expect(mockProps.onPathInputChange).toHaveBeenCalledWith('123');
  });

  it('应该调用onAddPath当点击添加按钮时', () => {
    const propsWithInput = { ...mockProps, pathInput: '123' };
    renderWithProviders(<ControlPanel {...propsWithInput} />);
    
    const addButton = screen.getByText('添加路径到列表');
    fireEvent.click(addButton);
    
    expect(mockProps.onAddPath).toHaveBeenCalled();
  });

  it('应该显示输入错误', () => {
    const propsWithError = { ...mockProps, inputError: '路径无效' };
    renderWithProviders(<ControlPanel {...propsWithError} />);
    
    expect(screen.getByText('路径无效')).toBeInTheDocument();
  });
});