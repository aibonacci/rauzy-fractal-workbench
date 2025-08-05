import { describe, it, expect, beforeEach } from 'vitest';
import {
  validatePathLengthInput,
  generatePathsByLength,
  calculatePathCountByLength,
  formatPathsByLength,
  getPathLengthStatistics
} from '../path-length-generator';

describe('路径长度生成器测试', () => {
  describe('输入验证测试', () => {
    it('应该接受有效的正整数', () => {
      const result = validatePathLengthInput('3');
      expect(result.isValid).toBe(true);
      expect(result.value).toBe(3);
      expect(result.error).toBe('');
    });

    it('应该拒绝空输入', () => {
      const result = validatePathLengthInput('');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Please enter a path length');
    });

    it('应该拒绝非数字输入', () => {
      const result = validatePathLengthInput('abc');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Please enter a valid integer');
    });

    it('应该拒绝零和负数', () => {
      const result1 = validatePathLengthInput('0');
      expect(result1.isValid).toBe(false);
      expect(result1.error).toBe('Path length must be positive');

      const result2 = validatePathLengthInput('-1');
      expect(result2.isValid).toBe(false);
      expect(result2.error).toBe('Path length must be positive');
    });

    it('应该拒绝过大的数字', () => {
      const result = validatePathLengthInput('11');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Path length must be 10 or less (too many combinations)');
    });
  });

  describe('路径生成算法测试', () => {
    it('应该正确生成长度为1的路径', () => {
      const paths = generatePathsByLength(1);
      expect(paths).toEqual([[1], [2], [3]]);
      expect(paths.length).toBe(3);
    });

    it('应该正确生成长度为2的路径', () => {
      const paths = generatePathsByLength(2);
      expect(paths.length).toBe(9); // 3^2 = 9
      
      // 检查是否包含所有预期的路径
      const pathStrings = paths.map(p => p.join(','));
      expect(pathStrings).toContain('1,1');
      expect(pathStrings).toContain('1,2');
      expect(pathStrings).toContain('1,3');
      expect(pathStrings).toContain('2,1');
      expect(pathStrings).toContain('2,2');
      expect(pathStrings).toContain('2,3');
      expect(pathStrings).toContain('3,1');
      expect(pathStrings).toContain('3,2');
      expect(pathStrings).toContain('3,3');
    });

    it('应该正确生成长度为3的路径', () => {
      const paths = generatePathsByLength(3);
      expect(paths.length).toBe(27); // 3^3 = 27
      expect(paths[0]).toEqual([1, 1, 1]); // 第一个应该是字典序最小的
      expect(paths[paths.length - 1]).toEqual([3, 3, 3]); // 最后一个应该是字典序最大的
    });

    it('应该按字典序排序结果', () => {
      const paths = generatePathsByLength(2);
      expect(paths[0]).toEqual([1, 1]);
      expect(paths[1]).toEqual([1, 2]);
      expect(paths[2]).toEqual([1, 3]);
      expect(paths[3]).toEqual([2, 1]);
      expect(paths[4]).toEqual([2, 2]);
      expect(paths[5]).toEqual([2, 3]);
      expect(paths[6]).toEqual([3, 1]);
      expect(paths[7]).toEqual([3, 2]);
      expect(paths[8]).toEqual([3, 3]);
    });

    it('应该处理边界情况', () => {
      expect(generatePathsByLength(0)).toEqual([]);
      expect(generatePathsByLength(-1)).toEqual([]);
    });
  });

  describe('理论数量计算测试', () => {
    it('应该计算正确的理论路径数量', () => {
      expect(calculatePathCountByLength(1)).toBe(3);
      expect(calculatePathCountByLength(2)).toBe(9);
      expect(calculatePathCountByLength(3)).toBe(27);
      expect(calculatePathCountByLength(4)).toBe(81);
      expect(calculatePathCountByLength(5)).toBe(243);
    });

    it('应该处理边界情况', () => {
      expect(calculatePathCountByLength(0)).toBe(0);
      expect(calculatePathCountByLength(-1)).toBe(0);
    });
  });

  describe('格式化和统计测试', () => {
    it('应该正确格式化路径', () => {
      const paths = [[1, 1], [1, 2], [1, 3]];
      const formatted = formatPathsByLength(paths);
      expect(formatted).toBe('1,1, 1,2, 1,3');
    });

    it('应该处理大量路径的格式化', () => {
      const paths = generatePathsByLength(3); // 27个路径
      const formatted = formatPathsByLength(paths);
      expect(formatted).toContain('...');
      expect(formatted).toContain('and 22 more');
    });

    it('应该计算正确的统计信息', () => {
      const paths = [[1, 1], [1, 2], [2, 1], [2, 2]];
      const stats = getPathLengthStatistics(paths);
      
      expect(stats.totalPaths).toBe(4);
      expect(stats.pathLength).toBe(2);
      expect(stats.minWeight).toBe(2); // [1,1] = 2
      expect(stats.maxWeight).toBe(4); // [2,2] = 4
      expect(stats.totalWeight).toBe(12); // 2+3+3+4 = 12
      expect(stats.averageWeight).toBe(3); // 12/4 = 3
    });

    it('应该处理空路径列表', () => {
      const stats = getPathLengthStatistics([]);
      expect(stats.totalPaths).toBe(0);
      expect(stats.pathLength).toBe(0);
      expect(stats.averageWeight).toBe(0);
    });
  });

  describe('数学正确性验证', () => {
    it('生成的路径数量应该匹配理论值', () => {
      for (let length = 1; length <= 5; length++) {
        const paths = generatePathsByLength(length);
        const expectedCount = calculatePathCountByLength(length);
        expect(paths.length).toBe(expectedCount);
      }
    });

    it('所有路径应该是唯一的', () => {
      const paths = generatePathsByLength(4);
      const pathStrings = paths.map(path => path.join(','));
      const uniquePathStrings = new Set(pathStrings);
      expect(uniquePathStrings.size).toBe(paths.length);
    });

    it('所有路径应该具有正确的长度', () => {
      for (let length = 1; length <= 5; length++) {
        const paths = generatePathsByLength(length);
        paths.forEach(path => {
          expect(path.length).toBe(length);
          path.forEach(digit => {
            expect([1, 2, 3]).toContain(digit);
          });
        });
      }
    });
  });
});