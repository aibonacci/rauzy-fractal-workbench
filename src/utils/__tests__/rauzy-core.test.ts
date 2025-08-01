import { describe, it, expect, beforeEach, vi } from 'vitest';
import { executeRauzyCoreAlgorithm, validateBaseData } from '../rauzy-core';

// Mock math.js
const mockMath = {
  matrix: vi.fn(),
  eigs: vi.fn(),
  column: vi.fn(),
  divide: vi.fn(),
  re: vi.fn(),
  im: vi.fn(),
  transpose: vi.fn(),
  inv: vi.fn(),
  multiply: vi.fn()
};

// Mock window object for Node.js environment
Object.defineProperty(global, 'window', {
  value: {},
  writable: true
});

describe('Rauzy核心算法', () => {
  beforeEach(() => {
    // 重置所有mock
    vi.clearAllMocks();
    
    // 设置window.math
    Object.defineProperty(global.window, 'math', {
      value: mockMath,
      writable: true,
      configurable: true
    });
  });

  it('当math.js未加载时应该返回null', async () => {
    // @ts-ignore
    delete global.window.math;
    
    const result = await executeRauzyCoreAlgorithm(1000);
    expect(result).toBeNull();
  });

  it('应该正确设置矩阵和特征值计算', () => {
    // Mock返回值
    const mockEigenInfo = {
      values: {
        toArray: () => [2.618, { re: -0.309, im: 0.951 }, { re: -0.309, im: -0.951 }]
      },
      vectors: 'mock-vectors'
    };

    mockMath.matrix.mockReturnValue('mock-matrix');
    mockMath.eigs.mockReturnValue(mockEigenInfo);
    mockMath.column.mockReturnValue({ get: () => 1, toArray: () => ({ flat: () => [1, 0, 0] }) });
    mockMath.divide.mockReturnValue({ get: () => 1, toArray: () => ({ flat: () => [1, 0, 0] }) });
    mockMath.re.mockReturnValue({ toArray: () => ({ flat: () => [1, 0, 0] }) });
    mockMath.im.mockReturnValue({ toArray: () => ({ flat: () => [0, 1, 0] }) });
    mockMath.transpose.mockReturnValue('mock-basis-matrix');
    mockMath.inv.mockReturnValue('mock-inv-matrix');
    mockMath.multiply.mockReturnValue({ get: () => 0 });

    executeRauzyCoreAlgorithm(100);

    // 验证矩阵创建
    expect(mockMath.matrix).toHaveBeenCalledWith([[1, 1, 1], [1, 0, 0], [0, 1, 0]]);
    
    // 验证特征值计算
    expect(mockMath.eigs).toHaveBeenCalled();
  });

  it('应该正确生成符号序列', () => {
    // 设置基本的mock返回值
    const mockEigenInfo = {
      values: {
        toArray: () => [2.618, { re: -0.309, im: 0.951 }, { re: -0.309, im: -0.951 }]
      },
      vectors: 'mock-vectors'
    };

    mockMath.matrix.mockReturnValue('mock-matrix');
    mockMath.eigs.mockReturnValue(mockEigenInfo);
    mockMath.column.mockReturnValue({ get: () => 1, toArray: () => ({ flat: () => [1, 0, 0] }) });
    mockMath.divide.mockReturnValue({ get: () => 1, toArray: () => ({ flat: () => [1, 0, 0] }) });
    mockMath.re.mockReturnValue({ toArray: () => ({ flat: () => [1, 0, 0] }) });
    mockMath.im.mockReturnValue({ toArray: () => ({ flat: () => [0, 1, 0] }) });
    mockMath.transpose.mockReturnValue('mock-basis-matrix');
    mockMath.inv.mockReturnValue('mock-inv-matrix');
    mockMath.multiply.mockReturnValue({ get: () => 0 });

    const result = executeRauzyCoreAlgorithm(10);
    
    expect(result).not.toBeNull();
    if (result) {
      expect(result.word).toBeDefined();
      expect(typeof result.word).toBe('string');
      expect(result.word.length).toBeLessThanOrEqual(10);
      
      // 验证符号序列只包含1, 2, 3
      for (const char of result.word) {
        expect(['1', '2', '3']).toContain(char);
      }
    }
  });

  it('应该正确构建索引映射', () => {
    // 设置mock返回值
    const mockEigenInfo = {
      values: {
        toArray: () => [2.618, { re: -0.309, im: 0.951 }, { re: -0.309, im: -0.951 }]
      },
      vectors: 'mock-vectors'
    };

    mockMath.matrix.mockReturnValue('mock-matrix');
    mockMath.eigs.mockReturnValue(mockEigenInfo);
    mockMath.column.mockReturnValue({ get: () => 1, toArray: () => ({ flat: () => [1, 0, 0] }) });
    mockMath.divide.mockReturnValue({ get: () => 1, toArray: () => ({ flat: () => [1, 0, 0] }) });
    mockMath.re.mockReturnValue({ toArray: () => ({ flat: () => [1, 0, 0] }) });
    mockMath.im.mockReturnValue({ toArray: () => ({ flat: () => [0, 1, 0] }) });
    mockMath.transpose.mockReturnValue('mock-basis-matrix');
    mockMath.inv.mockReturnValue('mock-inv-matrix');
    mockMath.multiply.mockReturnValue({ get: () => 0 });

    const result = executeRauzyCoreAlgorithm(20);
    
    expect(result).not.toBeNull();
    if (result) {
      expect(result.indexMaps).toBeDefined();
      expect(result.indexMaps['1']).toBeInstanceOf(Array);
      expect(result.indexMaps['2']).toBeInstanceOf(Array);
      expect(result.indexMaps['3']).toBeInstanceOf(Array);
      
      // 验证索引映射的总长度等于word长度
      const totalIndices = 
        result.indexMaps['1'].length + 
        result.indexMaps['2'].length + 
        result.indexMaps['3'].length;
      expect(totalIndices).toBe(result.word.length);
    }
  });

  it('应该处理计算错误', () => {
    mockMath.matrix.mockImplementation(() => {
      throw new Error('Matrix calculation failed');
    });

    const result = executeRauzyCoreAlgorithm(100);
    expect(result).toBeNull();
  });
});

describe('validateBaseData', () => {
  it('应该验证null数据', () => {
    expect(validateBaseData(null)).toBe(false);
  });

  it('应该验证有效的基础数据', () => {
    const validData = {
      word: '12131',
      pointsWithBaseType: [
        { re: 1, im: 2, baseType: '1' as const },
        { re: 2, im: 3, baseType: '2' as const }
      ],
      indexMaps: {
        '1': [1, 3, 5],
        '2': [2, 4],
        '3': []
      }
    };

    expect(validateBaseData(validData)).toBe(true);
  });

  it('应该拒绝无效的基础数据', () => {
    const invalidData = {
      word: 123, // 应该是字符串
      pointsWithBaseType: [],
      indexMaps: {}
    };

    // @ts-ignore - 故意传入错误类型进行测试
    expect(validateBaseData(invalidData)).toBe(false);
  });
});