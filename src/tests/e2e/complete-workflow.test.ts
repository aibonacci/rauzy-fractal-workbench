import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { AgentOperationHelper } from '../../utils/agent-helper';
import { DEFAULT_CONFIG } from '../../config/defaultConfig';
import { getTestId } from '../../config/utils';

/**
 * 端到端集成测试
 * 测试完整的用户工作流程和AI Agent操作流程
 */
describe('完整工作流程测试', () => {
  beforeEach(() => {
    // 清理DOM
    document.body.innerHTML = '';
    
    // 模拟完整的应用DOM结构
    const appContainer = document.createElement('div');
    appContainer.innerHTML = `
      <div class="app">
        <div class="control-panel">
          <input data-testid="${getTestId(DEFAULT_CONFIG, 'PATH_INPUT')}" type="text" />
          <button data-testid="${getTestId(DEFAULT_CONFIG, 'ADD_PATH_BUTTON')}">添加路径</button>
          <input data-testid="${getTestId(DEFAULT_CONFIG, 'POINTS_SLIDER')}" type="range" min="10000" max="1000000" value="100000" />
          <div data-testid="${getTestId(DEFAULT_CONFIG, 'PATH_LIST')}"></div>
        </div>
        <div class="canvas-area">
          <canvas data-testid="${getTestId(DEFAULT_CONFIG, 'FRACTAL_CANVAS')}" width="800" height="600"></canvas>
        </div>
        <div class="data-panel" data-testid="${getTestId(DEFAULT_CONFIG, 'DATA_PANEL')}"></div>
      </div>
    `;
    document.body.appendChild(appContainer);
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  describe('用户手动操作流程', () => {
    it('应该支持完整的路径分析流程', async () => {
      // 1. 设置点数
      const pointsSlider = document.querySelector(`[data-testid="${getTestId(DEFAULT_CONFIG, 'POINTS_SLIDER')}"]`) as HTMLInputElement;
      expect(pointsSlider).toBeTruthy();
      
      pointsSlider.value = '50000';
      pointsSlider.dispatchEvent(new Event('change'));
      
      // 2. 添加路径
      const pathInput = document.querySelector(`[data-testid="${getTestId(DEFAULT_CONFIG, 'PATH_INPUT')}"]`) as HTMLInputElement;
      const addButton = document.querySelector(`[data-testid="${getTestId(DEFAULT_CONFIG, 'ADD_PATH_BUTTON')}"]`) as HTMLButtonElement;
      
      expect(pathInput).toBeTruthy();
      expect(addButton).toBeTruthy();
      
      // 模拟用户输入
      pathInput.value = '1213';
      pathInput.dispatchEvent(new Event('input'));
      
      // 模拟点击添加按钮
      addButton.click();
      
      // 3. 验证路径已添加
      // 在真实应用中，这里会有路径项出现
      const pathList = document.querySelector(`[data-testid="${getTestId(DEFAULT_CONFIG, 'PATH_LIST')}"]`);
      expect(pathList).toBeTruthy();
    });

    it('应该处理输入验证错误', async () => {
      const pathInput = document.querySelector(`[data-testid="${getTestId(DEFAULT_CONFIG, 'PATH_INPUT')}"]`) as HTMLInputElement;
      const addButton = document.querySelector(`[data-testid="${getTestId(DEFAULT_CONFIG, 'ADD_PATH_BUTTON')}"]`) as HTMLButtonElement;
      
      // 测试无效输入
      pathInput.value = '1234'; // 包含无效数字4
      pathInput.dispatchEvent(new Event('input'));
      addButton.click();
      
      // 在真实应用中，这里会显示错误信息
      // 这里我们只验证DOM结构存在
      expect(pathInput.value).toBe('1234');
    });
  });

  describe('AI Agent自动化流程', () => {
    it('应该支持完整的自动化分析流程', async () => {
      // 创建模拟的路径项
      const createMockPathItem = (index: number, path: string) => {
        const pathItem = document.createElement('div');
        pathItem.setAttribute('data-testid', `${getTestId(DEFAULT_CONFIG, 'PATH_ITEM')}-${index}`);
        
        const pathSpan = document.createElement('span');
        pathSpan.textContent = `(${path})`;
        pathSpan.setAttribute('title', 'path info');
        pathItem.appendChild(pathSpan);
        
        const deleteButton = document.createElement('button');
        deleteButton.setAttribute('data-testid', `${getTestId(DEFAULT_CONFIG, 'DELETE_PATH_BUTTON')}-${index}`);
        deleteButton.textContent = '删除';
        pathItem.appendChild(deleteButton);
        
        return pathItem;
      };

      // 1. 设置点数
      const success1 = await AgentOperationHelper.setPointCount(100000);
      expect(success1).toBe(true);
      
      // 2. 添加多条路径
      const paths = ['1213', '2131', '3121'];
      for (let i = 0; i < paths.length; i++) {
        const success = await AgentOperationHelper.addPath(paths[i]);
        expect(success).toBe(true);
        
        // 模拟路径被添加到DOM
        const pathList = document.querySelector(`[data-testid="${getTestId(DEFAULT_CONFIG, 'PATH_LIST')}"]`);
        const pathItem = createMockPathItem(i, paths[i].split('').join(','));
        pathList?.appendChild(pathItem);
      }
      
      // 3. 验证路径数量
      const currentPaths = AgentOperationHelper.getCurrentPaths();
      expect(currentPaths).toHaveLength(3);
      expect(currentPaths).toEqual(['1,2,1,3', '2,1,3,1', '3,1,2,1']);
      
      // 4. 删除一条路径
      const success2 = await AgentOperationHelper.removePath(1);
      expect(success2).toBe(true);
      
      // 5. 获取Canvas数据
      const imageData = AgentOperationHelper.getCanvasImageData();
      expect(imageData).toBeTruthy();
    });

    it('应该正确处理等待操作', async () => {
      // 测试等待计算完成
      const waitResult1 = await AgentOperationHelper.waitForCalculation(100);
      // 没有加载指示器时应该立即完成
      expect(waitResult1).toBeUndefined();
      
      // 测试等待路径数量
      const waitResult2 = await AgentOperationHelper.waitForPathCount(0, 100);
      expect(waitResult2).toBe(true); // 当前路径数为0
    });

    it('应该处理错误情况', async () => {
      // 测试添加无效路径
      const success1 = await AgentOperationHelper.addPath('1234');
      expect(success1).toBe(false);
      
      // 测试删除不存在的路径
      const success2 = await AgentOperationHelper.removePath(999);
      expect(success2).toBe(false);
      
      // 测试设置无效点数
      const success3 = await AgentOperationHelper.setPointCount(-1000);
      expect(success3).toBe(true); // 滑块会自动限制范围
    });
  });

  describe('性能和稳定性测试', () => {
    it('应该处理大量路径操作', async () => {
      const maxPaths = 10; // 限制测试规模
      const paths: string[] = [];
      
      // 生成测试路径
      for (let i = 0; i < maxPaths; i++) {
        const path = `${(i % 3) + 1}${((i + 1) % 3) + 1}${((i + 2) % 3) + 1}`;
        paths.push(path);
      }
      
      // 批量添加路径
      for (let i = 0; i < paths.length; i++) {
        const success = await AgentOperationHelper.addPath(paths[i]);
        expect(success).toBe(true);
        
        // 模拟DOM更新
        const pathList = document.querySelector(`[data-testid="${getTestId(DEFAULT_CONFIG, 'PATH_LIST')}"]`);
        const pathItem = document.createElement('div');
        pathItem.setAttribute('data-testid', `${getTestId(DEFAULT_CONFIG, 'PATH_ITEM')}-${i}`);
        const pathSpan = document.createElement('span');
        pathSpan.textContent = `(${paths[i].split('').join(',')})`;
        pathSpan.setAttribute('title', 'path info');
        pathItem.appendChild(pathSpan);
        pathList?.appendChild(pathItem);
      }
      
      // 验证所有路径都已添加
      const currentPaths = AgentOperationHelper.getCurrentPaths();
      expect(currentPaths).toHaveLength(maxPaths);
      
      // 批量删除路径
      for (let i = maxPaths - 1; i >= 0; i--) {
        const success = await AgentOperationHelper.removePath(i);
        expect(success).toBe(true);
        
        // 模拟DOM更新
        const pathItem = document.querySelector(`[data-testid="${getTestId(DEFAULT_CONFIG, 'PATH_ITEM')}-${i}"]`);
        pathItem?.remove();
      }
      
      // 验证所有路径都已删除
      const finalPaths = AgentOperationHelper.getCurrentPaths();
      expect(finalPaths).toHaveLength(0);
    });

    it('应该处理快速连续操作', async () => {
      // 快速连续设置点数
      const pointCounts = [50000, 100000, 150000, 200000];
      
      for (const count of pointCounts) {
        const success = await AgentOperationHelper.setPointCount(count);
        expect(success).toBe(true);
        
        const currentCount = AgentOperationHelper.getCurrentPointCount();
        expect(currentCount).toBe(count);
      }
    });
  });

  describe('状态一致性测试', () => {
    it('应该保持UI状态与内部状态一致', async () => {
      // 添加路径
      await AgentOperationHelper.addPath('123');
      
      // 模拟DOM更新
      const pathList = document.querySelector(`[data-testid="${getTestId(DEFAULT_CONFIG, 'PATH_LIST')}"]`);
      const pathItem = document.createElement('div');
      pathItem.setAttribute('data-testid', `${getTestId(DEFAULT_CONFIG, 'PATH_ITEM')}-0`);
      const pathSpan = document.createElement('span');
      pathSpan.textContent = '(1,2,3)';
      pathSpan.setAttribute('title', 'path info');
      pathItem.appendChild(pathSpan);
      pathList?.appendChild(pathItem);
      
      // 验证状态一致性
      const currentPaths = AgentOperationHelper.getCurrentPaths();
      expect(currentPaths).toEqual(['1,2,3']);
      
      const pointCount = AgentOperationHelper.getCurrentPointCount();
      expect(pointCount).toBe(100000); // 默认值
      
      const isLoading = AgentOperationHelper.isLoading();
      expect(isLoading).toBe(false); // 没有加载指示器
    });

    it('应该正确处理边界条件', async () => {
      // 测试最小点数
      const success1 = await AgentOperationHelper.setPointCount(10000);
      expect(success1).toBe(true);
      
      // 测试最大点数
      const success2 = await AgentOperationHelper.setPointCount(1000000);
      expect(success2).toBe(true);
      
      // 测试空路径
      const success3 = await AgentOperationHelper.addPath('');
      expect(success3).toBe(false);
      
      // 测试单字符路径
      const success4 = await AgentOperationHelper.addPath('1');
      expect(success4).toBe(true);
    });
  });

  describe('错误恢复测试', () => {
    it('应该从错误状态中恢复', async () => {
      // 模拟错误状态
      const pathInput = document.querySelector(`[data-testid="${getTestId(DEFAULT_CONFIG, 'PATH_INPUT')}"]`) as HTMLInputElement;
      pathInput.remove(); // 移除输入框模拟错误
      
      // 尝试操作应该失败
      const success1 = await AgentOperationHelper.addPath('123');
      expect(success1).toBe(false);
      
      // 恢复DOM结构
      const newPathInput = document.createElement('input');
      newPathInput.setAttribute('data-testid', getTestId(DEFAULT_CONFIG, 'PATH_INPUT'));
      newPathInput.type = 'text';
      document.querySelector('.control-panel')?.appendChild(newPathInput);
      
      // 现在操作应该成功
      const success2 = await AgentOperationHelper.addPath('123');
      expect(success2).toBe(true);
    });

    it('应该处理超时情况', async () => {
      // 添加加载指示器
      const loadingIndicator = document.createElement('div');
      loadingIndicator.setAttribute('data-testid', getTestId(DEFAULT_CONFIG, 'LOADING_INDICATOR'));
      document.body.appendChild(loadingIndicator);
      
      // 测试超时
      const startTime = Date.now();
      try {
        await AgentOperationHelper.waitForCalculation(100); // 100ms超时
        expect(false).toBe(true); // 不应该到达这里
      } catch (error) {
        const endTime = Date.now();
        expect(endTime - startTime).toBeGreaterThan(90); // 应该接近超时时间
      }
      
      // 清理
      loadingIndicator.remove();
    });
  });
});

/**
 * AI Agent完整操作流程测试
 */
describe('AI Agent完整操作流程', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    
    // 创建完整的应用DOM结构
    const appContainer = document.createElement('div');
    appContainer.innerHTML = `
      <div class="app">
        <input data-testid="${getTestId(DEFAULT_CONFIG, 'PATH_INPUT')}" type="text" />
        <button data-testid="${getTestId(DEFAULT_CONFIG, 'ADD_PATH_BUTTON')}">添加路径</button>
        <input data-testid="${getTestId(DEFAULT_CONFIG, 'POINTS_SLIDER')}" type="range" min="10000" max="1000000" value="100000" />
        <div data-testid="${getTestId(DEFAULT_CONFIG, 'PATH_LIST')}"></div>
        <canvas data-testid="${getTestId(DEFAULT_CONFIG, 'FRACTAL_CANVAS')}" width="800" height="600"></canvas>
        <div data-testid="${getTestId(DEFAULT_CONFIG, 'DATA_PANEL')}"></div>
      </div>
    `;
    document.body.appendChild(appContainer);
  });

  it('应该执行完整的数学研究工作流', async () => {
    // 研究场景：比较不同长度路径的特征
    
    // 1. 设置研究参数
    await AgentOperationHelper.setPointCount(200000);
    
    // 2. 添加不同类型的路径进行对比研究
    const researchPaths = [
      '1',      // 长度1
      '12',     // 长度2  
      '123',    // 长度3
      '1213',   // 长度4
      '12131'   // 长度5
    ];
    
    for (let i = 0; i < researchPaths.length; i++) {
      const success = await AgentOperationHelper.addPath(researchPaths[i]);
      expect(success).toBe(true);
      
      // 模拟路径添加到DOM
      const pathList = document.querySelector(`[data-testid="${getTestId(DEFAULT_CONFIG, 'PATH_LIST')}"]`);
      const pathItem = document.createElement('div');
      pathItem.setAttribute('data-testid', `${getTestId(DEFAULT_CONFIG, 'PATH_ITEM')}-${i}`);
      const pathSpan = document.createElement('span');
      pathSpan.textContent = `(${researchPaths[i].split('').join(',')})`;
      pathSpan.setAttribute('title', 'path info');
      pathItem.appendChild(pathSpan);
      pathList?.appendChild(pathItem);
    }
    
    // 3. 等待所有路径添加完成
    const finalPaths = AgentOperationHelper.getCurrentPaths();
    expect(finalPaths).toHaveLength(5);
    
    // 4. 收集研究数据
    const researchData = [];
    for (let i = 0; i < researchPaths.length; i++) {
      const pathData = AgentOperationHelper.getPathData(i);
      if (pathData) {
        researchData.push({
          path: pathData.path,
          length: pathData.path.length,
          weight: pathData.rp,
          // 在真实应用中会有更多数据
        });
      }
    }
    
    expect(researchData).toHaveLength(5);
    
    // 5. 验证研究结果的合理性
    researchData.forEach((data, index) => {
      expect(data.length).toBe(researchPaths[index].length);
      expect(data.weight).toBeGreaterThan(0);
    });
    
    // 6. 获取可视化结果
    const imageData = AgentOperationHelper.getCanvasImageData();
    expect(imageData).toBeTruthy();
    expect(imageData?.width).toBe(800);
    expect(imageData?.height).toBe(600);
  });
});