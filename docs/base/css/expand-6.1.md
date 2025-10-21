# 渐变色实现原理（基于canvas）

渐变色是通过在两个或多个颜色之间平滑过渡来创建视觉效果。本文将深入探讨线性渐变和径向渐变的底层实现原理。

## 线性渐变

线性渐变是沿着一条直线（渐变线）在颜色之间进行插值。渐变线由起点和终点定义，颜色沿着这条线进行过渡。

### 基于canvas实现

Canvas API 提供了 `createLinearGradient()` 方法来创建线性渐变。

**基本原理：**

1. **定义渐变线**：通过起点 `(x0, y0)` 和终点 `(x1, y1)` 确定渐变方向
2. **添加色标**：在渐变线上指定位置（0-1之间）设置颜色
3. **颜色插值**：Canvas 自动在色标之间进行线性插值

```javascript
// 创建线性渐变
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

// 定义渐变线：从左到右
const gradient = ctx.createLinearGradient(0, 0, 200, 0);

// 添加色标
gradient.addColorStop(0, '#ff0000'); // 起点：红色
gradient.addColorStop(0.5, '#00ff00'); // 中点：绿色
gradient.addColorStop(1, '#0000ff'); // 终点：蓝色

// 应用渐变
ctx.fillStyle = gradient;
ctx.fillRect(0, 0, 200, 100);
```

**实现细节：**

对于渐变线上的任意点，Canvas 通过以下步骤计算颜色：

1. **计算位置比例**：将像素点投影到渐变线上，计算其在渐变线上的相对位置 `t`（0到1之间）
2. **确定色标区间**：找到该位置所在的两个相邻色标
3. **线性插值**：在两个色标颜色之间进行插值

```javascript
// 伪代码：颜色插值算法
function interpolateColor(color1, color2, ratio) {
  const r = color1.r + (color2.r - color1.r) * ratio;
  const g = color1.g + (color2.g - color1.g) * ratio;
  const b = color1.b + (color2.b - color1.b) * ratio;
  const a = color1.a + (color2.a - color1.a) * ratio;
  return { r, g, b, a };
}

// 计算渐变线上某点的颜色
function getGradientColor(x, y, x0, y0, x1, y1, colorStops) {
  // 1. 计算点到渐变线起点的投影比例
  const dx = x1 - x0;
  const dy = y1 - y0;
  const length = Math.sqrt(dx * dx + dy * dy);

  // 点到起点的向量
  const px = x - x0;
  const py = y - y0;

  // 投影到渐变线上的比例
  const t = (px * dx + py * dy) / (length * length);
  const clampedT = Math.max(0, Math.min(1, t));

  // 2. 在色标中找到对应区间
  for (let i = 0; i < colorStops.length - 1; i++) {
    const stop1 = colorStops[i];
    const stop2 = colorStops[i + 1];

    if (clampedT >= stop1.offset && clampedT <= stop2.offset) {
      // 3. 在区间内进行颜色插值
      const localRatio =
        (clampedT - stop1.offset) / (stop2.offset - stop1.offset);
      return interpolateColor(stop1.color, stop2.color, localRatio);
    }
  }
}
```

## 径向渐变

径向渐变从中心点向外辐射，颜色沿着半径方向进行过渡。可以创建圆形或椭圆形的渐变效果。

### 基于canvas实现

Canvas API 提供了 `createRadialGradient()` 方法来创建径向渐变。

**基本原理：**

径向渐变由两个圆定义：起始圆 `(x0, y0, r0)` 和结束圆 `(x1, y1, r1)`。渐变在这两个圆之间进行插值。

<<< @/base/css/codes/linear-gradient/canvas.vue

<ClientOnly>
<LinearGradientCanvas/>
</ClientOnly>

<script setup lang="ts">
import LinearGradientCanvas from './codes/linear-gradient/canvas.vue'
</script>

**实现细节：**

对于画布上的任意像素点 `(x, y)`，Canvas 通过以下算法计算其颜色：

```javascript
// 径向渐变颜色计算伪代码
function getRadialGradientColor(x, y, x0, y0, r0, x1, y1, r1, colorStops) {
  // 1. 计算点到两个圆心的距离
  const d0 = Math.sqrt((x - x0) ** 2 + (y - y0) ** 2);
  const d1 = Math.sqrt((x - x1) ** 2 + (y - y1) ** 2);

  // 2. 计算点在渐变中的位置
  // 这是一个复杂的数学问题，需要求解点在两圆之间的相对位置

  // 简化版本（当两圆心重合时）：
  if (x0 === x1 && y0 === y1) {
    const distance = Math.sqrt((x - x0) ** 2 + (y - y0) ** 2);
    // 计算距离占总半径差的比例
    let t = (distance - r0) / (r1 - r0);
    t = Math.max(0, Math.min(1, t));

    // 3. 在色标中查找并插值（与线性渐变相同）
    return interpolateColorStops(t, colorStops);
  }

  // 完整版本需要解决圆锥投影问题
  // 详见 Canvas 规范的径向渐变算法
}
```

**同心圆渐变示例：**

```javascript
// 创建发光效果
const glowGradient = ctx.createRadialGradient(150, 150, 0, 150, 150, 100);
glowGradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
glowGradient.addColorStop(0.3, 'rgba(255, 200, 0, 0.8)');
glowGradient.addColorStop(0.7, 'rgba(255, 100, 0, 0.3)');
glowGradient.addColorStop(1, 'rgba(255, 0, 0, 0)');

ctx.fillStyle = glowGradient;
ctx.fillRect(0, 0, 300, 300);
```

**偏心渐变示例：**

```javascript
// 创建聚光灯效果
const spotlightGradient = ctx.createRadialGradient(
  120,
  120,
  10, // 光源中心
  150,
  150,
  100, // 扩散范围
);
spotlightGradient.addColorStop(0, '#ffffff');
spotlightGradient.addColorStop(1, '#000000');

ctx.fillStyle = spotlightGradient;
ctx.fillRect(0, 0, 300, 300);
```

## 总结

**Canvas vs Shader 对比：**

| 特性       | Canvas API     | WebGL Shader            |
| ---------- | -------------- | ----------------------- |
| **易用性** | 简单，API 直观 | 复杂，需要理解 GPU 编程 |
| **性能**   | 适合中小型渲染 | 高性能，适合大量像素    |
| **灵活性** | 功能固定       | 完全可定制              |
| **动画**   | 需要重绘       | 可通过 uniform 实时更新 |
| **兼容性** | 广泛支持       | 需要 WebGL 支持         |

**最佳实践：**

1. **简单场景**：使用 Canvas API，代码简洁易维护
2. **高性能需求**：使用 Shader，特别是大面积渐变或实时动画
3. **复杂效果**：Shader 提供更多控制，可实现各种自定义渐变
4. **优化技巧**：使用纹理存储色标数据，避免在着色器中使用过多条件判断
