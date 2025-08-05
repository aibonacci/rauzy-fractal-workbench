/**
 * 数字划分算法单元测试
 */

import {
  generatePartitions,
  validatePartitionInput,
  getTheoreticalPartitionCount,
  validatePartitions,
  formatPartition,
  getPartitionStats,
  clearPartitionCache,
  getPartitionCacheStats,
  precomputeCommonPartitions
} from '../number-partition';

describe('数字划分算法测试', () => {
  beforeEach(() => {
    // 每个测试前清空缓存
    clearPartitionCache();
  });

  describe('输入验证测试', () => {
    test('应该接受有效的正整数', () => {
      const result = validatePartitionInput('5');
      expect(result.isValid).toBe(true);
      expect(result.value).toBe(5);
      expect(result.error).toBeUndefined();
    });

    test('应该拒绝空输入', () => {
      const result = validatePartitionInput('');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('请输入一个数字');
    });

    test('应该拒绝非数字输入', () => {
      const result = validatePartitionInput('abc');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('输入必须是一个有效的数字');
    });

    test('应该拒绝小数', () => {
      const result = validatePartitionInput('3.14');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('输入必须是一个整数');
    });

    test('应该拒绝零和负数', () => {
      const result1 = validatePartitionInput('0');
      expect(result1.isValid).toBe(false);
      expect(result1.error).toBe('数字必须大于0');

      const result2 = validatePartitionInput('-5');
      expect(result2.isValid).toBe(false);
      expect(result2.error).toBe('数字必须大于0');
    });

    test('应该拒绝超出范围的数字', () => {
      const result = validatePartitionInput('25');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('数字不能超过20（避免组合爆炸）');
    });
  });

  describe('划分生成算法测试', () => {
    test('应该正确生成 n=1 的划分', () => {
      const partitions = generatePartitions(1);
      expect(partitions).toEqual([[1]]);
      expect(partitions.length).toBe(1);
    });

    test('应该正确生成 n=2 的划分', () => {
      const partitions = generatePartitions(2);
      const expected = [[1, 1], [2]];
      expect(partitions).toEqual(expected);
      expect(partitions.length).toBe(2);
    });

    test('应该正确生成 n=3 的划分', () => {
      const partitions = generatePartitions(3);
      const expected = [[1, 1, 1], [1, 2], [2, 1], [3]];
      expect(partitions).toEqual(expected);
      expect(partitions.length).toBe(4);
    });

    test('应该正确生成 n=4 的划分', () => {
      const partitions = generatePartitions(4);
      const expected = [
        [1, 1, 1, 1],
        [1, 1, 2],
        [1, 2, 1],
        [1, 3],
        [2, 1, 1],
        [2, 2],
        [3, 1]
      ];
      expect(partitions).toEqual(expected);
      expect(partitions.length).toBe(7);
    });

    test('应该正确生成 n=5 的划分', () => {
      const partitions = generatePartitions(5);
      // 验证数量
      expect(partitions.length).toBe(13);
      
      // 验证所有划分的和都等于5
      partitions.forEach(partition => {
        const sum = partition.reduce((acc, val) => acc + val, 0);
        expect(sum).toBe(5);
      });

      // 验证包含预期的一些划分
      expect(partitions).toContainEqual([1, 1, 1, 1, 1]);
      expect(partitions).toContainEqual([2, 3]);
      expect(partitions).toContainEqual([3, 2]);
      expect(partitions).toContainEqual([1, 1, 3]);
    });

    test('应该按字典序排序结果', () => {
      const partitions = generatePartitions(4);
      
      // 验证排序：[1,1,1,1] < [1,1,2] < [1,2,1] < [1,3] < [2,1,1] < [2,2] < [3,1]
      for (let i = 0; i < partitions.length - 1; i++) {
        const current = partitions[i];
        const next = partitions[i + 1];
        
        // 比较字典序
        let isLexicographicallySmaller = false;
        for (let j = 0; j < Math.min(current.length, next.length); j++) {
          if (current[j] < next[j]) {
            isLexicographicallySmaller = true;
            break;
          } else if (current[j] > next[j]) {
            break;
          }
        }
        
        // 如果前缀相同，较短的应该在前面
        if (!isLexicographicallySmaller && current.length < next.length) {
          isLexicographicallySmaller = true;
        }
        
        expect(isLexicographicallySmaller).toBe(true);
      }
    });

    test('应该处理边界情况', () => {
      // 测试较大的数字
      const partitions10 = generatePartitions(10);
      expect(partitions10.length).toBeGreaterThan(0);
      
      // 验证所有划分都有效
      expect(validatePartitions(10, partitions10)).toBe(true);
    });
  });

  describe('理论数量计算测试', () => {
    test('应该计算正确的理论划分数量', () => {
      expect(getTheoreticalPartitionCount(1)).toBe(1);
      expect(getTheoreticalPartitionCount(2)).toBe(2);
      expect(getTheoreticalPartitionCount(3)).toBe(4);
      expect(getTheoreticalPartitionCount(4)).toBe(7);
      expect(getTheoreticalPartitionCount(5)).toBe(13);
      expect(getTheoreticalPartitionCount(6)).toBe(24);
    });

    test('应该处理边界情况', () => {
      expect(getTheoreticalPartitionCount(0)).toBe(0);
      expect(getTheoreticalPartitionCount(-1)).toBe(0);
    });
  });

  describe('划分验证测试', () => {
    test('应该验证正确的划分', () => {
      const validPartitions = [[1, 1, 1], [1, 2], [2, 1], [3]];
      expect(validatePartitions(3, validPartitions)).toBe(true);
    });

    test('应该检测错误的和', () => {
      const invalidPartitions = [[1, 1, 1], [1, 3]]; // [1,3] 的和是4，不是3
      expect(validatePartitions(3, invalidPartitions)).toBe(false);
    });

    test('应该检测无效的元素', () => {
      const invalidPartitions = [[1, 1, 1], [4]]; // 4不在{1,2,3}中
      expect(validatePartitions(3, invalidPartitions)).toBe(false);
    });
  });

  describe('格式化和统计测试', () => {
    test('应该正确格式化划分', () => {
      expect(formatPartition([1, 2, 3])).toBe('[1,2,3]');
      expect(formatPartition([1])).toBe('[1]');
      expect(formatPartition([])).toBe('[]');
    });

    test('应该计算正确的统计信息', () => {
      const partitions = [[1, 1, 1], [1, 2], [2, 1], [3]];
      const stats = getPartitionStats(partitions);
      
      expect(stats.count).toBe(4);
      expect(stats.minLength).toBe(1);
      expect(stats.maxLength).toBe(3);
      expect(stats.avgLength).toBe(2);
      expect(stats.lengthDistribution).toEqual({
        1: 1,
        2: 2,
        3: 1
      });
    });

    test('应该处理空划分列表', () => {
      const stats = getPartitionStats([]);
      expect(stats.count).toBe(0);
      expect(stats.minLength).toBe(0);
      expect(stats.maxLength).toBe(0);
      expect(stats.avgLength).toBe(0);
      expect(stats.lengthDistribution).toEqual({});
    });
  });

  describe('缓存机制测试', () => {
    test('应该缓存计算结果', () => {
      // 第一次计算
      const partitions1 = generatePartitions(5);
      const cacheStats1 = getPartitionCacheStats();
      expect(cacheStats1.size).toBe(1);
      expect(cacheStats1.keys).toContain(5);

      // 第二次计算应该使用缓存
      const partitions2 = generatePartitions(5);
      expect(partitions2).toEqual(partitions1);
      
      // 缓存大小不应该增加
      const cacheStats2 = getPartitionCacheStats();
      expect(cacheStats2.size).toBe(1);
    });

    test('应该正确清空缓存', () => {
      generatePartitions(3);
      expect(getPartitionCacheStats().size).toBe(1);
      
      clearPartitionCache();
      expect(getPartitionCacheStats().size).toBe(0);
    });

    test('应该限制缓存大小', () => {
      // 生成超过缓存限制的数量
      for (let i = 1; i <= 25; i++) {
        if (i <= 20) { // 只测试有效范围内的数字
          generatePartitions(i);
        }
      }
      
      const cacheStats = getPartitionCacheStats();
      expect(cacheStats.size).toBeLessThanOrEqual(20); // 缓存大小限制
    });
  });

  describe('预计算功能测试', () => {
    test('应该预计算常用数字', () => {
      clearPartitionCache();
      expect(getPartitionCacheStats().size).toBe(0);
      
      precomputeCommonPartitions();
      
      const cacheStats = getPartitionCacheStats();
      expect(cacheStats.size).toBe(10); // 预计算1-10
      expect(cacheStats.keys).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    });
  });

  describe('性能测试', () => {
    test('应该在合理时间内完成计算', () => {
      const startTime = performance.now();
      
      // 测试较大的数字
      const partitions = generatePartitions(15);
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      // 应该在1秒内完成
      expect(duration).toBeLessThan(1000);
      expect(partitions.length).toBeGreaterThan(0);
      expect(validatePartitions(15, partitions)).toBe(true);
    });

    test('缓存应该显著提高性能', () => {
      clearPartitionCache();
      
      // 第一次计算（无缓存）
      const start1 = performance.now();
      generatePartitions(12);
      const time1 = performance.now() - start1;
      
      // 第二次计算（有缓存）
      const start2 = performance.now();
      generatePartitions(12);
      const time2 = performance.now() - start2;
      
      // 缓存应该显著更快
      expect(time2).toBeLessThan(time1 * 0.1); // 至少快10倍
    });
  });

  describe('数学正确性验证', () => {
    test('生成的划分数量应该匹配理论值', () => {
      for (let n = 1; n <= 10; n++) {
        const partitions = generatePartitions(n);
        const theoretical = getTheoreticalPartitionCount(n);
        expect(partitions.length).toBe(theoretical);
      }
    });

    test('所有划分应该是唯一的', () => {
      const partitions = generatePartitions(8);
      const partitionStrings = partitions.map(p => JSON.stringify(p));
      const uniqueStrings = new Set(partitionStrings);
      
      expect(uniqueStrings.size).toBe(partitions.length);
    });

    test('应该包含所有可能的划分', () => {
      // 对于小数字，手动验证完整性
      const partitions4 = generatePartitions(4);
      const expected4 = [
        [1, 1, 1, 1],
        [1, 1, 2],
        [1, 2, 1],
        [1, 3],
        [2, 1, 1],
        [2, 2],
        [3, 1]
      ];
      
      expect(partitions4.length).toBe(expected4.length);
      expected4.forEach(expectedPartition => {
        expect(partitions4).toContainEqual(expectedPartition);
      });
    });
  });
});