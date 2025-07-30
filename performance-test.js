// 快速性能测试脚本
// 在浏览器控制台中运行

console.log('开始性能测试...');

// 测试不同点数的计算时间
const testPointCounts = [1000, 5000, 10000, 50000];

testPointCounts.forEach(async (pointCount) => {
  console.log(`\n测试 ${pointCount} 个点:`);
  
  const startTime = performance.now();
  
  // 模拟设置点数
  if (window.AgentOperationHelper) {
    await window.AgentOperationHelper.setPointCount(pointCount);
    await window.AgentOperationHelper.waitForCalculation(30000);
    
    const endTime = performance.now();
    const duration = endTime - startTime;
    
    console.log(`${pointCount} 个点计算耗时: ${duration.toFixed(2)}ms`);
    
    // 检查是否有数据生成
    const currentPaths = window.AgentOperationHelper.getCurrentPaths();
    console.log(`当前路径数: ${currentPaths.length}`);
    
    // 检查Canvas是否有图像数据
    const imageData = window.AgentOperationHelper.getCanvasImageData();
    console.log(`Canvas数据: ${imageData ? '有' : '无'}`);
  } else {
    console.log('AgentOperationHelper 不可用');
  }
});

console.log('\n性能测试完成');