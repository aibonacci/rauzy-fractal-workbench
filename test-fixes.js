// 测试修复效果的简单脚本
const { getTribonacci } = require('./dist/assets/index-CEA22L4M.js');

console.log('测试Tribonacci修复...');

// 测试小数值
try {
  console.log('getTribonacci(10):', getTribonacci(10));
  console.log('getTribonacci(100):', getTribonacci(100));
  console.log('getTribonacci(1000):', getTribonacci(1000));
  console.log('✅ 小数值测试通过');
} catch (error) {
  console.log('❌ 小数值测试失败:', error.message);
}

// 测试大数值（之前会栈溢出）
try {
  console.log('getTribonacci(10000):', getTribonacci(10000));
  console.log('✅ 大数值测试通过');
} catch (error) {
  console.log('❌ 大数值测试失败:', error.message);
}

console.log('测试完成');