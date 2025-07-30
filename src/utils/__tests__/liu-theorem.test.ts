import { describe, it, expect } from 'vitest';
import { 
  calculatePathData, 
  validatePathData, 
  calculateMultiplePathsData,
  calculatePathStatistics 
} from '../liu-theorem';
import { BasePoint } from '../../types';

describe('刘氏定理计算引擎', () => {
  const mockIndexMaps = {
    '1': [1, 3, 5, 7, 9],
    '2': [2, 4, 6, 8, 10],
    '3': [11, 12, 13, 14, 15]
  };

  const mockPointsWithBaseType: BasePoint[] = [
    { re: 0, im: 0, baseType: '1' },
    { re: 1, im: 1, baseType: '2' },
    { re: 2, im: 2, baseType: '1' },
    { re: 3, im: 3, baseType: '3' },
    { re: 4, im: 4, baseType: '2' }
  ];

  describe('calculatePathData', () => {
    it('应该正确计算简单路径数据', () => {
      const path = [1, 2];
      const result = calculatePathData(path, mockIndexMaps, mockPointsWithBaseType);

      expect(result.path).toEqual([1, 2]);
      expect(result.rp).toBe(3); // 1 + 2 = 3
      expect(typeof result.cl).toBe('number');
      expect(Array.isArray(result.sequence)).toBe(true);
      expect(result.coeffs).toHaveProperty('1');
      expect(result.coeffs).toHaveProperty('2');
      expect(result.coeffs).toHaveProperty('3');
    });

    it('应该拒绝空路径', () => {
      expect(() => {
        calculatePathData([], mockIndexMaps, mockPointsWithBaseType);
      }).toThrow('路径不能为空');
    });

    it('应该拒绝无效路径', () => {
      expect(() => {
        calculatePathData([1, 4, 2], mockIndexMaps, mockPointsWithBaseType);
      }).toThrow('路径只能包含1, 2, 3');
    });
  });
});