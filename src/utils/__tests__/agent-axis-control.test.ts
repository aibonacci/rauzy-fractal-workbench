/**
 * AI Agent坐标轴控制测试
 */

import { AgentOperationHelper } from '../agent-helper';

// Mock DOM elements
const createMockCheckbox = (checked: boolean = false): HTMLInputElement => {
  const checkbox = document.createElement('input');
  checkbox.type = 'checkbox';
  checkbox.checked = checked;
  checkbox.dispatchEvent = jest.fn();
  return checkbox;
};

describe('AgentOperationHelper - Axis Control', () => {
  beforeEach(() => {
    // 清理DOM
    document.body.innerHTML = '';
  });

  describe('toggleAxes', () => {
    test('should toggle axes on', async () => {
      const checkbox = createMockCheckbox(false);
      checkbox.setAttribute('data-testid', 'show-axes-checkbox');
      document.body.appendChild(checkbox);

      const result = await AgentOperationHelper.toggleAxes(true);

      expect(result).toBe(true);
      expect(checkbox.checked).toBe(true);
      expect(checkbox.dispatchEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'change',
          bubbles: true
        })
      );
    });

    test('should toggle axes off', async () => {
      const checkbox = createMockCheckbox(true);
      checkbox.setAttribute('data-testid', 'show-axes-checkbox');
      document.body.appendChild(checkbox);

      const result = await AgentOperationHelper.toggleAxes(false);

      expect(result).toBe(true);
      expect(checkbox.checked).toBe(false);
    });

    test('should return false when checkbox not found', async () => {
      const result = await AgentOperationHelper.toggleAxes(true);
      expect(result).toBe(false);
    });
  });

  describe('toggleLabels', () => {
    test('should toggle labels on', async () => {
      const checkbox = createMockCheckbox(false);
      checkbox.setAttribute('data-testid', 'show-labels-checkbox');
      document.body.appendChild(checkbox);

      const result = await AgentOperationHelper.toggleLabels(true);

      expect(result).toBe(true);
      expect(checkbox.checked).toBe(true);
    });
  });

  describe('toggleGrid', () => {
    test('should toggle grid on', async () => {
      const checkbox = createMockCheckbox(false);
      checkbox.setAttribute('data-testid', 'show-grid-checkbox');
      document.body.appendChild(checkbox);

      const result = await AgentOperationHelper.toggleGrid(true);

      expect(result).toBe(true);
      expect(checkbox.checked).toBe(true);
    });
  });

  describe('getCurrentAxisSettings', () => {
    test('should return current axis settings', () => {
      // 创建所有必需的复选框
      const axesCheckbox = createMockCheckbox(true);
      axesCheckbox.setAttribute('data-testid', 'show-axes-checkbox');
      
      const labelsCheckbox = createMockCheckbox(false);
      labelsCheckbox.setAttribute('data-testid', 'show-labels-checkbox');
      
      const gridCheckbox = createMockCheckbox(true);
      gridCheckbox.setAttribute('data-testid', 'show-grid-checkbox');

      document.body.appendChild(axesCheckbox);
      document.body.appendChild(labelsCheckbox);
      document.body.appendChild(gridCheckbox);

      const settings = AgentOperationHelper.getCurrentAxisSettings();

      expect(settings).toEqual({
        showAxes: true,
        showLabels: false,
        showGrid: true
      });
    });

    test('should return null when checkboxes not found', () => {
      const settings = AgentOperationHelper.getCurrentAxisSettings();
      expect(settings).toBeNull();
    });
  });

  describe('setAxisSettings', () => {
    test('should set multiple axis settings', async () => {
      // 创建所有复选框
      const axesCheckbox = createMockCheckbox(false);
      axesCheckbox.setAttribute('data-testid', 'show-axes-checkbox');
      
      const labelsCheckbox = createMockCheckbox(false);
      labelsCheckbox.setAttribute('data-testid', 'show-labels-checkbox');
      
      const gridCheckbox = createMockCheckbox(false);
      gridCheckbox.setAttribute('data-testid', 'show-grid-checkbox');

      document.body.appendChild(axesCheckbox);
      document.body.appendChild(labelsCheckbox);
      document.body.appendChild(gridCheckbox);

      const result = await AgentOperationHelper.setAxisSettings({
        showAxes: true,
        showGrid: true
      });

      expect(result).toBe(true);
      expect(axesCheckbox.checked).toBe(true);
      expect(gridCheckbox.checked).toBe(true);
      // labels应该保持不变
      expect(labelsCheckbox.checked).toBe(false);
    });
  });
});