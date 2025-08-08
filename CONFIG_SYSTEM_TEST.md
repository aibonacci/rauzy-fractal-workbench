# 配置系统测试验证

## 快速验证步骤

### 1. 检查配置文件
确认 `public/config.json` 文件存在且格式正确：
```bash
# 检查文件是否存在
ls -la public/config.json

# 验证JSON格式
cat public/config.json | jq .
```

### 2. 验证配置加载
在浏览器开发者工具中检查：
1. 打开Network标签
2. 刷新页面
3. 查找对 `/config.json` 的请求
4. 确认返回状态为200且内容正确

### 3. 检查控制台输出
正常情况下应该看到：
```
配置已更新
```

如果仍有错误，可能看到：
```
配置文件load错误: ...
配置验证错误: ...
```

### 4. 测试配置访问
在浏览器控制台中运行：
```javascript
// 检查配置是否可访问
window.__CONFIG_DEBUG__ = true;
```

## 常见问题排查

### 问题1: 404错误
如果看到 `Failed to fetch configuration: HTTP 404`：
- 确认 `public/config.json` 文件存在
- 检查文件路径是否正确
- 重启开发服务器

### 问题2: JSON解析错误
如果看到 `JSON parsing error`：
- 使用JSON验证工具检查文件格式
- 确认没有多余的逗号或语法错误
- 检查文件编码是否为UTF-8

### 问题3: 验证错误
如果看到 `Validation error`：
- 检查配置文件是否包含所有必需字段
- 确认数据类型正确
- 查看具体的验证错误信息

### 问题4: 热重载不工作
如果配置热重载不工作：
- 确认开发环境设置正确
- 检查 `enableHotReload` 是否为 `true`
- 验证文件监听权限

## 配置系统状态检查

### 检查配置管理器状态
```javascript
// 在浏览器控制台中运行
console.log('配置管理器状态:', {
  isInitialized: window.__configManager?.isInitialized(),
  config: window.__configManager?.getConfig(),
  metadata: window.__configManager?.getMetadata()
});
```

### 检查React Context
```javascript
// 检查配置上下文是否正常
const configContext = document.querySelector('[data-config-provider]');
console.log('配置上下文:', configContext);
```

## 性能验证

### 配置访问性能
```javascript
// 测试配置访问性能
const start = performance.now();
for (let i = 0; i < 1000; i++) {
  window.__configManager?.get('ui.theme');
}
const end = performance.now();
console.log(`1000次配置访问耗时: ${end - start}ms`);
```

### 内存使用检查
```javascript
// 检查内存使用
if (performance.memory) {
  console.log('内存使用:', {
    used: `${(performance.memory.usedJSHeapSize / 1024 / 1024).toFixed(2)}MB`,
    total: `${(performance.memory.totalJSHeapSize / 1024 / 1024).toFixed(2)}MB`,
    limit: `${(performance.memory.jsHeapSizeLimit / 1024 / 1024).toFixed(2)}MB`
  });
}
```

## 预期结果

### 正常启动
- ✅ 配置文件成功加载
- ✅ 配置验证通过
- ✅ 应用正常渲染
- ✅ 无控制台错误

### 性能指标
- ✅ 配置加载时间 < 100ms
- ✅ 配置访问时间 < 0.01ms
- ✅ 内存使用 < 5MB增长

### 功能验证
- ✅ 主题切换正常
- ✅ 语言切换正常
- ✅ 配置热重载工作（开发环境）
- ✅ 错误处理正常

## 故障恢复

如果配置系统完全失败：

### 1. 回退到默认配置
```javascript
// 强制使用默认配置
window.__configManager?.reset();
```

### 2. 清除缓存
```javascript
// 清除配置缓存
localStorage.removeItem('rauzy-config-cache');
sessionStorage.clear();
```

### 3. 重新初始化
```javascript
// 重新初始化配置系统
window.location.reload();
```

---

**测试日期**: 2024年8月8日  
**版本**: 1.0.0  
**状态**: 🧪 待验证