/**
 * 辅助工具函数
 */

/**
 * 格式化点数显示
 * @param count 点数
 * @returns 格式化后的字符串
 */
export function formatPointCount(count: number): string {
  if (count >= 1000000) {
    return `${(count / 1000000).toFixed(1)}M`;
  } else if (count >= 1000) {
    return `${(count / 1000).toFixed(0)}K`;
  }
  return count.toLocaleString();
}

/**
 * 验证路径字符串
 * @param pathString 路径字符串
 * @returns 验证结果
 */
export function validatePath(pathString: string): {
  isValid: boolean;
  error?: string;
  path?: number[];
} {
  if (!pathString.trim()) {
    return { isValid: false, error: '路径不能为空' };
  }

  // 支持逗号分隔或直接连接的格式
  let numbers: number[];
  
  if (pathString.includes(',')) {
    // 逗号分隔格式: "1,2,3"
    numbers = pathString.split(',').map(s => {
      const num = parseInt(s.trim());
      if (isNaN(num)) {
        throw new Error('包含无效数字');
      }
      return num;
    });
  } else {
    // 直接连接格式: "123"
    numbers = pathString.split('').map(s => {
      const num = parseInt(s);
      if (isNaN(num)) {
        throw new Error('包含无效字符');
      }
      return num;
    });
  }

  try {
    // 验证所有数字都在1-3范围内
    if (numbers.some(n => ![1, 2, 3].includes(n))) {
      return { isValid: false, error: '路径只能包含1, 2, 3' };
    }

    return { isValid: true, path: numbers };
  } catch (error) {
    return { 
      isValid: false, 
      error: error instanceof Error ? error.message : '路径格式无效' 
    };
  }
}

/**
 * 检查路径是否重复
 * @param newPath 新路径
 * @param existingPaths 已存在的路径
 * @returns 是否重复
 */
export function isDuplicatePath(newPath: number[], existingPaths: number[][]): boolean {
  const newPathStr = newPath.join(',');
  return existingPaths.some(path => path.join(',') === newPathStr);
}

/**
 * 防抖函数
 * @param func 要防抖的函数
 * @param delay 延迟时间（毫秒）
 * @returns 防抖后的函数
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
}

/**
 * 节流函数
 * @param func 要节流的函数
 * @param delay 延迟时间（毫秒）
 * @returns 节流后的函数
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let lastCall = 0;
  
  return (...args: Parameters<T>) => {
    const now = Date.now();
    if (now - lastCall >= delay) {
      lastCall = now;
      func(...args);
    }
  };
}

/**
 * 深度克隆对象
 * @param obj 要克隆的对象
 * @returns 克隆后的对象
 */
export function deepClone<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }

  if (obj instanceof Date) {
    return new Date(obj.getTime()) as T;
  }

  if (obj instanceof Array) {
    return obj.map(item => deepClone(item)) as T;
  }

  if (typeof obj === 'object') {
    const cloned = {} as T;
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        cloned[key] = deepClone(obj[key]);
      }
    }
    return cloned;
  }

  return obj;
}