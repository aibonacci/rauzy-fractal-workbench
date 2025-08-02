/**
 * 状态变化事件系统
 * 为AI Agent提供状态监听能力
 */

export interface StateChangeEvent {
  type: 'PATH_ADDED' | 'PATH_REMOVED' | 'CALCULATION_COMPLETE' | 'POINTS_UPDATED' | 'ERROR_OCCURRED' | 'AXIS_SETTINGS_CHANGED';
  payload: any;
  timestamp: number;
}

export class RauzyEventSystem {
  private static instance: RauzyEventSystem;
  private listeners: Map<string, Function[]> = new Map();

  private constructor() {}

  static getInstance(): RauzyEventSystem {
    if (!RauzyEventSystem.instance) {
      RauzyEventSystem.instance = new RauzyEventSystem();
    }
    return RauzyEventSystem.instance;
  }

  /**
   * 添加事件监听器
   * @param eventType 事件类型
   * @param callback 回调函数
   */
  addEventListener(eventType: StateChangeEvent['type'], callback: (event: StateChangeEvent) => void): void {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, []);
    }
    this.listeners.get(eventType)!.push(callback);
  }

  /**
   * 移除事件监听器
   * @param eventType 事件类型
   * @param callback 回调函数
   */
  removeEventListener(eventType: StateChangeEvent['type'], callback: (event: StateChangeEvent) => void): void {
    const callbacks = this.listeners.get(eventType);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  /**
   * 触发事件
   * @param event 事件对象
   */
  dispatchEvent(event: Omit<StateChangeEvent, 'timestamp'>): void {
    const fullEvent: StateChangeEvent = {
      ...event,
      timestamp: Date.now()
    };

    // 触发特定类型的监听器
    const callbacks = this.listeners.get(event.type);
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(fullEvent);
        } catch (error) {
          console.error('Error in event listener:', error);
        }
      });
    }

    // 同时触发浏览器原生事件，方便外部监听
    if (typeof window !== 'undefined') {
      const customEvent = new CustomEvent('rauzy-state-change', {
        detail: fullEvent
      });
      window.dispatchEvent(customEvent);
    }

    // 记录事件到控制台（开发模式）
    if (process.env.NODE_ENV === 'development') {
      console.log('Rauzy Event:', fullEvent);
    }
  }

  /**
   * 获取所有监听器
   * @returns 监听器映射
   */
  getListeners(): Map<string, Function[]> {
    return new Map(this.listeners);
  }

  /**
   * 清除所有监听器
   */
  clearAllListeners(): void {
    this.listeners.clear();
  }
}

// 创建全局实例
export const eventSystem = RauzyEventSystem.getInstance();

// 便捷函数
export const dispatchStateChange = (type: StateChangeEvent['type'], payload: any) => {
  eventSystem.dispatchEvent({ type, payload });
};

// 将事件系统暴露到全局，方便AI Agent使用
if (typeof window !== 'undefined') {
  (window as any).RauzyEventSystem = eventSystem;
  
  // 提供便捷的全局监听函数
  (window as any).onRauzyStateChange = (callback: (event: StateChangeEvent) => void) => {
    window.addEventListener('rauzy-state-change', (e: any) => {
      callback(e.detail);
    });
  };
}