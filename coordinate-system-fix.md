# 坐标系统修复

## 🔍 问题分析

### 发现的问题
1. **Y轴方向错误**：屏幕坐标系Y轴向下，WebGL坐标系Y轴向上，没有正确转换
2. **画布尺寸混淆**：使用了canvas内部尺寸而不是CSS显示尺寸
3. **坐标变换逻辑错误**：缩放和拖拽的数学计算不正确

### 具体表现
- 拖拽时图形不跟随鼠标移动
- 缩放时缩放中心不在鼠标位置
- 交互感觉"反向"或"偏移"

## 🔧 修复方案

### 1. 缩放修复
**原有问题**：
```typescript
// 错误：使用canvas内部尺寸和错误的坐标变换
const mouseX = e.clientX - rect.left;
const mouseY = e.clientY - rect.top;
const centerX = (mouseX - this.canvas.width / 2) / this.transform.scale - this.transform.offsetX;
```

**修复后**：
```typescript
// 正确：使用CSS尺寸和标准化坐标
const mouseX = e.clientX - rect.left;
const mouseY = e.clientY - rect.top;

// 转换为标准化坐标 [-1, 1]
const normalizedX = (mouseX / rect.width) * 2 - 1;
const normalizedY = -((mouseY / rect.height) * 2 - 1); // Y轴翻转

// 计算世界坐标
const worldX = (normalizedX - this.transform.offsetX) / this.transform.scale;
const worldY = (normalizedY - this.transform.offsetY) / this.transform.scale;

// 保持鼠标位置不变的缩放
this.transform.offsetX = normalizedX - worldX * newScale;
this.transform.offsetY = normalizedY - worldY * newScale;
```

### 2. 拖拽修复
**原有问题**：
```typescript
// 错误：直接使用像素差值，没有考虑坐标系转换
const deltaX = e.clientX - lastX;
const deltaY = e.clientY - lastY;
this.transform.offsetX += deltaX / this.transform.scale;
```

**修复后**：
```typescript
// 正确：转换为标准化坐标差值
const deltaX = (e.clientX - lastX) / rect.width * 2; // 标准化
const deltaY = -(e.clientY - lastY) / rect.height * 2; // Y轴翻转

// 根据缩放调整移动速度
this.transform.offsetX += deltaX / this.transform.scale;
this.transform.offsetY += deltaY / this.transform.scale;
```

## 📊 关键改进

### 1. 坐标系统统一
- **屏幕坐标** → **标准化坐标** → **世界坐标**
- 正确处理Y轴翻转（屏幕向下，WebGL向上）
- 使用CSS尺寸而不是canvas内部尺寸

### 2. 数学计算修正
- **缩放**：保持鼠标位置为缩放中心
- **拖拽**：图形跟随鼠标移动方向
- **变换链**：正确的坐标变换顺序

### 3. 调试信息增强
```typescript
console.log(`🔍 缩放: ${newScale.toFixed(2)}, 鼠标: (${normalizedX.toFixed(2)}, ${normalizedY.toFixed(2)})`);
console.log(`🔍 拖拽: offset=(${this.transform.offsetX.toFixed(2)}, ${this.transform.offsetY.toFixed(2)}), delta=(${deltaX.toFixed(3)}, ${deltaY.toFixed(3)})`);
```

## 🧪 测试验证

修复后应该看到：

### 缩放行为
- ✅ 鼠标滚轮向上：图形放大，以鼠标位置为中心
- ✅ 鼠标滚轮向下：图形缩小，以鼠标位置为中心
- ✅ 缩放过程中鼠标下的点保持不动

### 拖拽行为
- ✅ 鼠标向右拖拽：图形向右移动
- ✅ 鼠标向左拖拽：图形向左移动
- ✅ 鼠标向上拖拽：图形向上移动
- ✅ 鼠标向下拖拽：图形向下移动

### 调试日志
- ✅ 显示正确的标准化鼠标坐标
- ✅ 显示正确的偏移量和增量值
- ✅ 便于调试和验证交互行为

## 🎯 技术要点

### 坐标系转换公式
```typescript
// 屏幕坐标 → 标准化坐标
normalizedX = (screenX / canvasWidth) * 2 - 1;
normalizedY = -((screenY / canvasHeight) * 2 - 1); // Y轴翻转

// 标准化坐标 → 世界坐标
worldX = (normalizedX - offsetX) / scale;
worldY = (normalizedY - offsetY) / scale;
```

### 变换矩阵
在着色器中的变换顺序：
1. 数据坐标 → 标准化坐标（数据边界）
2. 标准化坐标 → 缩放坐标（scale）
3. 缩放坐标 → 最终坐标（offset）

这个修复确保了WebGL渲染器的交互行为符合用户直觉，提供了流畅自然的缩放和拖拽体验。