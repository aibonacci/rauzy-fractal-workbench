/**
 * 防抖工具函数
 */

export type DebouncedFunction<T extends (...args: any[]) => any> = {
  (...args: Parameters<T>): void;
  cancel: () => void;
  flush: () => void;
};

/**
 * 创建防抖函数
 * @param func 要防抖的函数
 * @param delay 延迟时间（毫秒）
 * @param immediate 是否立即执行第一次调用
 * @returns 防抖后的函数
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number,
  immediate = false
): DebouncedFunction<T> {
  let timeoutId: NodeJS.Timeout | null = null;
  let lastArgs: Parameters<T> | null = null;

  const debouncedFunction = (...args: Parameters<T>) => {
    lastArgs = args;

    const callNow = immediate && !timeoutId;

    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(() => {
      timeoutId = null;
      if (!immediate && lastArgs) {
        func(...lastArgs);
      }
    }, delay);

    if (callNow) {
      func(...args);
    }
  };

  debouncedFunction.cancel = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
    lastArgs = null;
  };

  debouncedFunction.flush = () => {
    if (timeoutId && lastArgs) {
      clearTimeout(timeoutId);
      func(...lastArgs);
      timeoutId = null;
      lastArgs = null;
    }
  };

  return debouncedFunction as DebouncedFunction<T>;
}

/**
 * 创建节流函数
 * @param func 要节流的函数
 * @param delay 节流间隔（毫秒）
 * @returns 节流后的函数
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): DebouncedFunction<T> {
  let timeoutId: NodeJS.Timeout | null = null;
  let lastExecTime = 0;
  let lastArgs: Parameters<T> | null = null;

  const throttledFunction = (...args: Parameters<T>) => {
    const now = Date.now();
    lastArgs = args;

    if (now - lastExecTime >= delay) {
      func(...args);
      lastExecTime = now;
    } else if (!timeoutId) {
      timeoutId = setTimeout(() => {
        if (lastArgs) {
          func(...lastArgs);
          lastExecTime = Date.now();
        }
        timeoutId = null;
      }, delay - (now - lastExecTime));
    }
  };

  throttledFunction.cancel = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
    lastArgs = null;
  };

  throttledFunction.flush = () => {
    if (lastArgs) {
      func(...lastArgs);
      lastExecTime = Date.now();
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
    }
  };

  return throttledFunction as DebouncedFunction<T>;
}