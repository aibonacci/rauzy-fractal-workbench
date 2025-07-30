import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { AgentOperationHelper } from '../agent-helper';
import { TEST_IDS } from '../constants';

// Mock DOM elements
const createMockElement = (tagName: string, attributes: Record<string, any> = {}) => {
  const element = document.createElement(tagName);
  Object.assign(element, attributes);
  return element;
};

describe('AgentOperationHelper', () => {
  beforeEach(() => {
    // 清理DOM
    document.body.innerHTML = '';
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('addPath', () => {
    it('应该能够添加路径', async () => {
      // 创建模拟的DOM元素
      const pathInput = createMockElement('input', {
        value: '',
        dispatchEvent: vi.fn()
      });
      pathInput.setAttribute('data-testid', TEST_IDS.PATH_INPUT);

      const addButton = createMockElement('button', {
        disabled: false,
        click: vi.fn()
      });
      addButton.setAttribute('data-testid', TEST_IDS.ADD_PATH_BUTTON);

      document.body.appendChild(pathInput);
      document.body.appendChild(addButton);

      const result = await AgentOperationHelper.addPath('123');

      expect(result).toBe(true);
      expect(pathInput.value).toBe('123');
      expect(pathInput.dispatchEvent).toHaveBeenCalled();
      expect(addButton.click).toHaveBeenCalled();
    });

    it('当添加按钮被禁用时应该返回false', async () => {
      const pathInput = createMockElement('input');
      pathInput.setAttribute('data-testid', TEST_IDS.PATH_INPUT);

      const addButton = createMockElement('button', { disabled: true });
      addButton.setAttribute('data-testid', TEST_IDS.ADD_PATH_BUTTON);

      document.body.appendChild(pathInput);
      document.body.appendChild(addButton);

      const result = await AgentOperationHelper.addPath('123');

      expect(result).toBe(false);
    });

    it('当元素不存在时应该返回false', async () => {
      const result = await AgentOperationHelper.addPath('123');
      expect(result).toBe(false);
    });
  });

  describe('setPointCount', () => {
    it('应该能够设置点数', async () => {
      const slider = createMockElement('input', {
        type: 'range',
        value: '100000',
        dispatchEvent: vi.fn()
      });
      slider.setAttribute('data-testid', TEST_IDS.POINTS_SLIDER);

      document.body.appendChild(slider);

      const result = await AgentOperationHelper.setPointCount(200000);

      expect(result).toBe(true);
      expect(slider.value).toBe('200000');
      expect(slider.dispatchEvent).toHaveBeenCalledTimes(3); // input, change, mouseup
    });
  });

  describe('getCurrentPaths', () => {
    it('应该能够获取当前路径列表', () => {
      // 创建模拟的路径项
      const pathItem1 = document.createElement('div');
      pathItem1.setAttribute('data-testid', `${TEST_IDS.PATH_ITEM}-0`);
      
      const pathSpan1 = document.createElement('span');
      pathSpan1.textContent = '(1,2,3)';
      pathSpan1.setAttribute('title', 'some title');
      pathItem1.appendChild(pathSpan1);

      const pathItem2 = document.createElement('div');
      pathItem2.setAttribute('data-testid', `${TEST_IDS.PATH_ITEM}-1`);
      
      const pathSpan2 = document.createElement('span');
      pathSpan2.textContent = '(2,3,1)';
      pathSpan2.setAttribute('title', 'some title');
      pathItem2.appendChild(pathSpan2);

      document.body.appendChild(pathItem1);
      document.body.appendChild(pathItem2);

      const paths = AgentOperationHelper.getCurrentPaths();

      expect(paths).toEqual(['1,2,3', '2,3,1']);
    });

    it('当没有路径时应该返回空数组', () => {
      const paths = AgentOperationHelper.getCurrentPaths();
      expect(paths).toEqual([]);
    });
  });

  describe('isLoading', () => {
    it('当加载指示器存在时应该返回true', () => {
      const loadingIndicator = document.createElement('div');
      loadingIndicator.setAttribute('data-testid', TEST_IDS.LOADING_INDICATOR);
      document.body.appendChild(loadingIndicator);

      expect(AgentOperationHelper.isLoading()).toBe(true);
    });

    it('当加载指示器不存在时应该返回false', () => {
      expect(AgentOperationHelper.isLoading()).toBe(false);
    });
  });

  describe('getCurrentPointCount', () => {
    it('应该能够获取当前点数', () => {
      const slider = createMockElement('input', {
        type: 'range',
        value: '150000'
      });
      slider.setAttribute('data-testid', TEST_IDS.POINTS_SLIDER);
      document.body.appendChild(slider);

      const pointCount = AgentOperationHelper.getCurrentPointCount();
      expect(pointCount).toBe(150000);
    });

    it('当滑块不存在时应该返回null', () => {
      const pointCount = AgentOperationHelper.getCurrentPointCount();
      expect(pointCount).toBeNull();
    });
  });

  describe('waitForCalculation', () => {
    it('当没有加载指示器时应该立即resolve', async () => {
      const startTime = Date.now();
      await AgentOperationHelper.waitForCalculation();
      const endTime = Date.now();

      expect(endTime - startTime).toBeLessThan(100); // 应该很快完成
    });

    it('应该等待加载指示器消失', async () => {
      const loadingIndicator = document.createElement('div');
      loadingIndicator.setAttribute('data-testid', TEST_IDS.LOADING_INDICATOR);
      document.body.appendChild(loadingIndicator);

      // 500ms后移除加载指示器
      setTimeout(() => {
        document.body.removeChild(loadingIndicator);
      }, 500);

      const startTime = Date.now();
      await AgentOperationHelper.waitForCalculation();
      const endTime = Date.now();

      expect(endTime - startTime).toBeGreaterThan(400);
    });
  });

  describe('waitForPathCount', () => {
    it('当路径数量匹配时应该返回true', async () => {
      // 创建2个路径项
      for (let i = 0; i < 2; i++) {
        const pathItem = document.createElement('div');
        pathItem.setAttribute('data-testid', `${TEST_IDS.PATH_ITEM}-${i}`);
        
        const pathSpan = document.createElement('span');
        pathSpan.textContent = `(${i+1},2,3)`;
        pathSpan.setAttribute('title', 'some title');
        pathItem.appendChild(pathSpan);
        
        document.body.appendChild(pathItem);
      }

      const result = await AgentOperationHelper.waitForPathCount(2, 1000);
      expect(result).toBe(true);
    });

    it('当超时时应该返回false', async () => {
      const result = await AgentOperationHelper.waitForPathCount(5, 100);
      expect(result).toBe(false);
    });
  });
});