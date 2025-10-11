# color属性与颜色设置

## transparent关键字

transparent关键字其实是rgba(0,0,0,0)的另外一种快捷书写方式，这是CSS规范文档中明确定义的，并且所有浏览器也遵循这个规范。

## 渐变色算法

CSS中的渐变色算法与svg、canvas中的不一样

### css中渐变色

<div class="w-full h-40px" style="background: linear-gradient(red, green)"></div>

渐变色本质上就是：

> **在两个（或多个）颜色空间中的点之间进行插值。**

也就是：

$$
C(t) = (1 - t) * C_1 + t * C_2
$$

其中：

- ( C_1 ) 是起始颜色（如 `red` → RGB(255, 0, 0)）
- ( C_2 ) 是结束颜色（如 `blue` → RGB(0, 0, 255)）
- ( t ∈ [0, 1] ) 是渐变位置比例（0 表示起点，1 表示终点）

然后对每个通道分别插值：

$$
R(t) = (1 - t) * R_1 + t * R_2
$$

$$
G(t) = (1 - t) * G_1 + t * G_2
$$

$$
B(t) = (1 - t) * B_1 + t * B_2
$$

计算出的 RGB 就是该像素位置的颜色。

1. 早期（CSS2 / CSS3 时代）

渐变默认使用 **sRGB** 空间进行插值。
也就是说，浏览器在 `R,G,B` 三个通道直接线性插值。

这种方式简单，但存在一个问题：

> sRGB 是“非线性”空间，直接线性插值会导致视觉上的“暗带”（banding）。

例如从 `red → green` 时，人眼感知到的中间色会发灰、不均匀。

<div class="w-full h-40px" style="background: linear-gradient(in srgb, red, green)"></div>

2. 现代标准（CSS Color Module Level 4+）

从 **CSS Color 4** 开始，允许指定颜色空间，例如：

```css
background: linear-gradient (in lab, red, blue);
background: linear-gradient (in oklch, red, blue);
```

<div class="w-full h-40px" style="background: linear-gradient(in lab, red, green)"></div>

说明：

- `in srgb` → 传统方式（默认）

<div class="w-full h-40px" style="background: linear-gradient(in srgb, red, green)"></div>

- `in srgb-linear` → 在线性化的 sRGB 空间中插值

<div class="w-full h-40px" style="background: linear-gradient(in srgb-linear, red, green)"></div>

- `in lab` / `in oklch` → 在更符合人眼视觉均匀性的空间中插值（效果更平滑）

<div class="w-full h-40px" style="background: linear-gradient(in lab, red, green)"></div>

**Lab / OKLCH 插值的优势：**
这些空间是“感知均匀”的（perceptually uniform），插值结果更自然、亮度过渡更平滑。

#### 线性渐变（linear-gradient）

- 按照一条直线方向计算 `t` 值；
- 每个像素根据它到渐变起点的投影距离计算插值比例。

数学形式：

$$
t = \frac{(P - P_0) \cdot d}{|d|^2}
$$

其中：

- ( P ) 为当前像素坐标
- ( P_0 ) 为渐变起点
- ( d ) 为方向向量

#### 径向渐变（radial-gradient）

- 按照距离圆心的半径计算 `t` 值；
- 计算公式：
  $$
  t = \frac{|P - C|}{r}
  $$
  其中 ( C ) 是圆心，( r ) 是半径。

### svg、canvas中的渐变色

<svg style="border: 1px dotted;">
<defs>
<linearGradient id="myGradient" gradientTransform="rotate(90)">
<stop offset="0%" stop-color="red" />
<stop offset="100%" stop-color="green" />
</linearGradient>
</defs>
<circle cx="150" cy="75" r="70" fill="url(#myGradient)">
</circle>
</svg>

:::info
这种差异会影响一些功能的实现，例如前端项目中的截图功能，如果截图区域恰好存在一个渐变色的元素，那么最终产生截图的视觉效果与源图片不一致。

因为截图功能是通过将html输出为canvas来实现的
:::

## currentColor关键字

根据color的属性值来变化的，常用的使用场景：

1. svg中的几何体的颜色填充

<div class="color-red">
  <svg>
    <circle cx="150" cy="75" r="70" fill="currentColor">
    </circle>
  </svg>
</div>

2. 在背景颜色和背景渐变颜色中

<div class="color-red w-full">
  <div class="w-full h-40px" style="background: currentColor"></div>
</div>

## RGB颜色和HSL颜色的新语法

支持RGBA与HSL语法

HSL将颜色分为三个维度：色调-Hue、饱和度-Saturation、亮度-Lightness

:::info

现代浏览器还支持全新的空格加斜杠语法

```css
div{
  background: rgb(255 0 153 / 1);
}
```
:::
