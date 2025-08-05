import { DEFAULT_DEVELOPMENT_CONFIG } from '../config/defaultConfig';
import { PathData } from '../types';

/**
 * AI Agent操作辅助工具类
 * 提供程序化操作接口，方便AI Agent进行自动化操作
 */
export class AgentOperationHelper {
  /**
   * 等待元素出现
   * @param selector 选择器
   * @param timeout 超时时间（毫秒）
   * @returns Promise<Element>
   */
  private static waitForElement(selector: string, timeout = 5000): Promise<Element> {
    return new Promise((resolve, reject) => {
      const element = document.querySelector(selector);
      if (element) {
        resolve(element);
        return;
      }

      const observer = new MutationObserver(() => {
        const element = document.querySelector(selector);
        if (element) {
          observer.disconnect();
          resolve(element);
        }
      });

      observer.observe(document.body, {
        childList: true,
        subtree: true
      });

      setTimeout(() => {
        observer.disconnect();
        reject(new Error(`Element ${selector} not found within ${timeout}ms`));
      }, timeout);
    });
  }

  /**
   * 等待计算完成
   * @param timeout 超时时间（毫秒）
   * @returns Promise<void>
   */
  static async waitForCalculation(timeout = 30000): Promise<void> {
    return new Promise((resolve, reject) => {
      const checkLoading = () => {
        const loadingIndicator = document.querySelector(`[data-testid="${DEFAULT_DEVELOPMENT_CONFIG.testIds.loadingIndicator}"]`);
        if (!loadingIndicator) {
          resolve();
          return;
        }
        setTimeout(checkLoading, 100);
      };

      checkLoading();

      setTimeout(() => {
        reject(new Error(`Calculation did not complete within ${timeout}ms`));
      }, timeout);
    });
  }

  /**
   * 添加路径
   * @param pathString 路径字符串
   * @returns Promise<boolean> 是否成功
   */
  static async addPath(pathString: string): Promise<boolean> {
    try {
      // 获取路径输入框
      const pathInput = await this.waitForElement(`[data-testid="${DEFAULT_DEVELOPMENT_CONFIG.testIds.pathInput}"]`) as HTMLInputElement;
      
      // 清空并输入新路径
      pathInput.value = '';
      pathInput.dispatchEvent(new Event('input', { bubbles: true }));
      
      pathInput.value = pathString;
      pathInput.dispatchEvent(new Event('input', { bubbles: true }));

      // 点击添加按钮
      const addButton = await this.waitForElement(`[data-testid="${DEFAULT_DEVELOPMENT_CONFIG.testIds.addPathButton}"]`) as HTMLButtonElement;
      
      if (addButton.disabled) {
        console.warn('Add button is disabled');
        return false;
      }

      addButton.click();

      // 等待一小段时间让UI更新
      await new Promise(resolve => setTimeout(resolve, 100));

      return true;
    } catch (error) {
      console.error('Failed to add path:', error);
      return false;
    }
  }

  /**
   * 删除路径
   * @param pathIndex 路径索引
   * @returns Promise<boolean> 是否成功
   */
  static async removePath(pathIndex: number): Promise<boolean> {
    try {
      const deleteButton = await this.waitForElement(
        `[data-testid="${DEFAULT_DEVELOPMENT_CONFIG.testIds.deletePathButton}-${pathIndex}"]`
      ) as HTMLButtonElement;

      deleteButton.click();

      // 等待一小段时间让UI更新
      await new Promise(resolve => setTimeout(resolve, 100));

      return true;
    } catch (error) {
      console.error('Failed to remove path:', error);
      return false;
    }
  }

  /**
   * 设置点数
   * @param count 点数
   * @returns Promise<boolean> 是否成功
   */
  static async setPointCount(count: number): Promise<boolean> {
    try {
      const slider = await this.waitForElement(`[data-testid="${DEFAULT_DEVELOPMENT_CONFIG.testIds.pointsSlider}"]`) as HTMLInputElement;
      
      slider.value = count.toString();
      slider.dispatchEvent(new Event('input', { bubbles: true }));
      slider.dispatchEvent(new Event('change', { bubbles: true }));

      // 触发mouseup事件来确保值被应用
      slider.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));

      return true;
    } catch (error) {
      console.error('Failed to set point count:', error);
      return false;
    }
  }

  /**
   * 获取路径数据
   * @param pathIndex 路径索引
   * @returns PathData | null
   */
  static getPathData(pathIndex: number): PathData | null {
    try {
      const pathCard = document.querySelector(`[data-testid="${DEFAULT_DEVELOPMENT_CONFIG.testIds.pathDataCard}-${pathIndex}"]`);
      if (!pathCard) return null;

      // 从DOM中提取路径数据（这是一个简化的实现）
      const pathText = pathCard.querySelector('h4')?.textContent;
      if (!pathText) return null;

      const pathMatch = pathText.match(/\(([^)]+)\)/);
      if (!pathMatch) return null;

      const path = pathMatch[1].split(',').map(n => parseInt(n.trim()));

      // 注意：这里只能获取基本信息，完整的PathData需要从应用状态中获取
      return {
        path,
        rp: 0, // 需要从DOM中解析或从应用状态获取
        coeffs: { 1: 0, 2: 0, 3: 0 },
        cl: 0,
        sequence: [],
        firstPointCoords: null
      };
    } catch (error) {
      console.error('Failed to get path data:', error);
      return null;
    }
  }

  /**
   * 获取Canvas图像数据
   * @returns ImageData | null
   */
  static getCanvasImageData(): ImageData | null {
    try {
      const canvas = document.querySelector(`[data-testid="${DEFAULT_DEVELOPMENT_CONFIG.testIds.fractalCanvas}"]`) as HTMLCanvasElement;
      if (!canvas) return null;

      const ctx = canvas.getContext('2d');
      if (!ctx) return null;

      return ctx.getImageData(0, 0, canvas.width, canvas.height);
    } catch (error) {
      console.error('Failed to get canvas image data:', error);
      return null;
    }
  }

  /**
   * 获取当前路径列表
   * @returns string[] 路径字符串数组
   */
  static getCurrentPaths(): string[] {
    try {
      const pathItems = document.querySelectorAll(`[data-testid^="${DEFAULT_DEVELOPMENT_CONFIG.testIds.pathItem}"]`);
      const paths: string[] = [];

      pathItems.forEach(item => {
        const pathText = item.querySelector('span[title]')?.textContent;
        if (pathText) {
          const match = pathText.match(/\(([^)]+)\)/);
          if (match) {
            paths.push(match[1]);
          }
        }
      });

      return paths;
    } catch (error) {
      console.error('Failed to get current paths:', error);
      return [];
    }
  }

  /**
   * 检查应用是否正在加载
   * @returns boolean
   */
  static isLoading(): boolean {
    const loadingIndicator = document.querySelector(`[data-testid="${DEFAULT_DEVELOPMENT_CONFIG.testIds.loadingIndicator}"]`);
    return loadingIndicator !== null;
  }

  /**
   * 获取当前点数设置
   * @returns number | null
   */
  static getCurrentPointCount(): number | null {
    try {
      const slider = document.querySelector(`[data-testid="${DEFAULT_DEVELOPMENT_CONFIG.testIds.pointsSlider}"]`) as HTMLInputElement;
      return slider ? parseInt(slider.value) : null;
    } catch (error) {
      console.error('Failed to get current point count:', error);
      return null;
    }
  }

  // ========== 坐标轴控制方法 ==========

  /**
   * 控制坐标轴显示
   * @param show 是否显示坐标轴
   * @returns Promise<boolean> 操作是否成功
   */
  static async toggleAxes(show: boolean): Promise<boolean> {
    try {
      const checkbox = document.querySelector('[data-testid="show-axes-checkbox"]') as HTMLInputElement;
      if (!checkbox) {
        console.error('坐标轴复选框未找到');
        return false;
      }

      if (checkbox.checked !== show) {
        checkbox.checked = show;
        checkbox.dispatchEvent(new Event('change', { bubbles: true }));
        
        // 等待一小段时间让变更生效
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      console.log(`🎯 坐标轴显示已${show ? '开启' : '关闭'}`);
      return true;
    } catch (error) {
      console.error('切换坐标轴显示失败:', error);
      return false;
    }
  }

  /**
   * 控制标签显示
   * @param show 是否显示标签
   * @returns Promise<boolean> 操作是否成功
   */
  static async toggleLabels(show: boolean): Promise<boolean> {
    try {
      const checkbox = document.querySelector('[data-testid="show-labels-checkbox"]') as HTMLInputElement;
      if (!checkbox) {
        console.error('标签复选框未找到');
        return false;
      }

      if (checkbox.checked !== show) {
        checkbox.checked = show;
        checkbox.dispatchEvent(new Event('change', { bubbles: true }));
        
        // 等待一小段时间让变更生效
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      console.log(`🎯 坐标轴标签已${show ? '开启' : '关闭'}`);
      return true;
    } catch (error) {
      console.error('切换标签显示失败:', error);
      return false;
    }
  }

  /**
   * 控制网格显示
   * @param show 是否显示网格
   * @returns Promise<boolean> 操作是否成功
   */
  static async toggleGrid(show: boolean): Promise<boolean> {
    try {
      const checkbox = document.querySelector('[data-testid="show-grid-checkbox"]') as HTMLInputElement;
      if (!checkbox) {
        console.error('网格复选框未找到');
        return false;
      }

      if (checkbox.checked !== show) {
        checkbox.checked = show;
        checkbox.dispatchEvent(new Event('change', { bubbles: true }));
        
        // 等待一小段时间让变更生效
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      console.log(`🎯 网格线已${show ? '开启' : '关闭'}`);
      return true;
    } catch (error) {
      console.error('切换网格显示失败:', error);
      return false;
    }
  }

  /**
   * 获取当前坐标轴设置
   * @returns object | null 当前坐标轴设置
   */
  static getCurrentAxisSettings(): { showAxes: boolean; showLabels: boolean; showGrid: boolean } | null {
    try {
      const axesCheckbox = document.querySelector('[data-testid="show-axes-checkbox"]') as HTMLInputElement;
      const labelsCheckbox = document.querySelector('[data-testid="show-labels-checkbox"]') as HTMLInputElement;
      const gridCheckbox = document.querySelector('[data-testid="show-grid-checkbox"]') as HTMLInputElement;

      if (!axesCheckbox || !labelsCheckbox || !gridCheckbox) {
        console.error('坐标轴控件未找到');
        return null;
      }

      return {
        showAxes: axesCheckbox.checked,
        showLabels: labelsCheckbox.checked,
        showGrid: gridCheckbox.checked
      };
    } catch (error) {
      console.error('获取坐标轴设置失败:', error);
      return null;
    }
  }

  /**
   * 批量设置坐标轴选项
   * @param settings 坐标轴设置
   * @returns Promise<boolean> 操作是否成功
   */
  static async setAxisSettings(settings: {
    showAxes?: boolean;
    showLabels?: boolean;
    showGrid?: boolean;
  }): Promise<boolean> {
    try {
      let success = true;

      if (settings.showAxes !== undefined) {
        success = success && await this.toggleAxes(settings.showAxes);
      }

      if (settings.showLabels !== undefined) {
        success = success && await this.toggleLabels(settings.showLabels);
      }

      if (settings.showGrid !== undefined) {
        success = success && await this.toggleGrid(settings.showGrid);
      }

      if (success) {
        console.log('🎯 坐标轴设置批量更新成功:', settings);
      }

      return success;
    } catch (error) {
      console.error('批量设置坐标轴失败:', error);
      return false;
    }
  }

  /**
   * 等待特定数量的路径被添加
   * @param expectedCount 期望的路径数量
   * @param timeout 超时时间（毫秒）
   * @returns Promise<boolean>
   */
  static async waitForPathCount(expectedCount: number, timeout = 10000): Promise<boolean> {
    return new Promise((resolve) => {
      const checkCount = () => {
        const currentPaths = this.getCurrentPaths();
        if (currentPaths.length === expectedCount) {
          resolve(true);
          return;
        }
        setTimeout(checkCount, 100);
      };

      checkCount();

      setTimeout(() => {
        resolve(false);
      }, timeout);
    });
  }
}

// 将AgentOperationHelper暴露到全局，方便AI Agent使用
if (typeof window !== 'undefined') {
  (window as any).AgentOperationHelper = AgentOperationHelper;
}