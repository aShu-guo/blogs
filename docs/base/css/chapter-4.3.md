# CSS 2D变换

## 从基本的变换方法说起

### translate

以`自身坐标`为基准，进行水平方向或垂直方向的位移。

```text
/* 往右偏移10px，往下偏移20px */
transform: translate(10px, 20px);
/* 往右偏移10px */
transform: translateX(10px);
/* 往下偏移20px */
transform: translateY(20px);
```

它并不是一个逻辑属性，即使父元素设置了`direction: rtl`，那么`translateX(10px)`也是相对右偏移10px

要注意的是，第二个值可以省略，当传入1个值时：`translate(10px)`并不表示在水平方向、垂直方向都偏移10px，而是仅在水平方向上偏移10px

<div class="w-100px h-100px bg-green">
    <div class="w-50px  h-50px bg-red" style="transform: translate(10px)"></div>
</div>

:::info
支持百分数、绝对数，支持正负数
:::

### rotate()旋转

- 角度（deg）：角度范围为0～360度，角度为负值可以理解为逆时针旋转。例如，−45deg可以理解为逆时针旋转45度。
- 百分度（grad）：一个梯度，或者说一个百分度表示1/400个整圆。因此100gads相当于90deg，它和deg单位一样支持负值，负值可以理解为逆时针方向旋转。
- 弧度（rad）：1弧度等于180/π度，或者大致等于57.3度。1.5708rad相当于100gads或是90deg，如图4-39所示。
- 圈数（turn）：这个很好理解，1圈表示360度，平时体操或跳水中出现的“后空翻720度”，也就是后空翻两圈的意思。于是有等式1turn=360deg、2turn=720deg等。

![img.png](/imgs/base/css/chapter-4.3.png)

:::info
仅支持绝对数，支持正负数

- 非法：`rotate(100%)`

:::

### scale()缩放

```text
/* 水平放大2倍，垂直缩小1/2*/
transform: scale(2, 0.5);
/* 水平放大2倍 */
transform: scaleX(2);
/* 垂直缩小1/2*/
transform: scaleY(0.5);
```

<div class="w-full bg-red hover:scale-y--1" style="transition: transform 300ms">
缩放变换支持负值。如果我们想要实现元素的水平翻转效果，可以设置transform:scaleX(-1)；想要实现元素的垂直翻转效果，可以设置transform:scaleY(-1)。
</div>

:::info
仅支持绝对数，支持正负数

- 非法：`scale(100%)`

:::

### skew()斜切

```text
/* 水平切斜10度，垂直切斜20度 */
transform: skew(10deg, 20deg);
/* 水平切斜10度 */
transform: skewX(10deg);
/* 垂直切斜20度 */
transform: skewY(20deg);
```

<div class="flex">
<div class="w-50px h-50px bg-red skew-x-60">skew-x-60</div>
<div class="w-50px h-50px bg-red skew-x-30 ml-50px">skew-x-30</div>
<div class="w-50px h-50px bg-red skew-x-10 ml-50px">skew-x-10</div>
<div class="w-50px h-50px bg-red ml-50px hover:skew-x-90 switch-animation" >skew-x-10</div>
</div>

<div class="flex mt-10px">
<div class="w-50px h-50px bg-red skew-y-60">skew-y-60</div>
<div class="w-50px h-50px bg-red skew-y-30 ml-50px">skew-y-30</div>
</div>

#### 直观理解（视觉层面）

`skew(ax, ay)` —— **倾斜（斜切）变换**

- 会让元素的形状`沿 X、Y 方向倾斜`，像被“剪切（shear）”一样。
- 它不会缩放、不会旋转，只是把角保持不变的矩形**斜成平行四边形**。

举个简单类比：

| 原矩形 |          `skew(10deg, 0)`          |          `skew(0, 20deg)`          |
| :----: | :--------------------------------: | :--------------------------------: |
|        | 沿 **X 轴** 倾斜 10°（上边向右倾） | 沿 **Y 轴** 倾斜 20°（右边向上倾） |

而 `skew(10deg, 20deg)` 同时对两个方向施加倾斜：

> 水平方向倾斜 10°，垂直方向倾斜 20°。
> 最终结果像一个被“横向剪切 + 纵向剪切”叠加的平行四边形。

<div class="w-100px h-100px bg-red skew-y-20 skew-x-10 "></div>

#### 数学定义（几何层面）

假设一个点 `(x, y)`。

应用 `skew(ax, ay)` 后，它会变成：

$$
x' = x + \tan(ax) \cdot y
$$

$$
y' = y + \tan(ay) \cdot x
$$

也就是说：

- `ax` 控制 **X 方向** 的倾斜（让 X 随着 Y 改变）；
- `ay` 控制 **Y 方向** 的倾斜（让 Y 随着 X 改变）。

所以 `skew(10deg, 20deg)` 实际上是：

```
x' = x + tan(10°) * y
y' = y + tan(20°) * x
```

由于 tan(10°) ≈ 0.1763，tan(20°) ≈ 0.3640
可理解为：

- 每向下 1px，向右偏移 0.176px；
- 每向右 1px，向下偏移 0.364px。

#### 线性代数表示（矩阵层面）

在 2D 变换矩阵中，`skew(ax, ay)` 对应矩阵为：

$$
M =
\begin{bmatrix}
1 & \tan(ax) & 0 \\
\tan(ay) & 1 & 0 \\
0 & 0 & 1
\end{bmatrix}
$$

与其他变换（rotate / scale / translate）一样，它是一个线性变换矩阵。

矩阵形式对比一下：

| 变换               | 矩阵形式                                         |
| ------------------ | ------------------------------------------------ |
| 平移(translate)    | [ [1, 0, tx], [0, 1, ty], [0, 0, 1] ]            |
| 缩放(scale)        | [ [sx, 0, 0], [0, sy, 0], [0, 0, 1] ]            |
| 旋转(rotate θ)     | [ [cosθ, -sinθ, 0], [sinθ, cosθ, 0], [0, 0, 1] ] |
| 倾斜(skew(ax, ay)) | [ [1, tan(ax), 0], [tan(ay), 1, 0], [0, 0, 1] ]  |

#### 与 skewX / skewY 的关系

```css
transform: skew (ax, ay);
```

等价于：

```css
transform: skewX (ax) skewY (ay);
```

但注意顺序问题：

- 在 CSS 中，`skew(ax, ay)` 实际上是先 `skewX(ax)` 再 `skewY(ay)`；
- 若单独写 `skewX(a) skewY(b)`，效果与 `skew(a, b)` 一致。

---

#### 几个常见例子

| transform            | 效果                                 |
| -------------------- | ------------------------------------ |
| `skew(10deg, 0)`     | 元素顶部边线向右倾斜（像平行四边形） |
| `skew(0, 20deg)`     | 元素右边边线向上倾斜                 |
| `skew(10deg, 20deg)` | 同时在两个方向倾斜，形成复杂的斜形   |
| `skew(-10deg, 0)`    | 元素顶部向左倾斜                     |
| `skew(0, -20deg)`    | 元素右边向下倾斜                     |

#### 补充：与 rotate 的区别

| 项目       | rotate          | skew                                |
| ---------- | --------------- | ----------------------------------- |
| 变换类型   | 旋转            | 剪切（线性）                        |
| 保持角度   | ✅ 保持矩形直角 | ❌ 改变直角为锐角或钝角             |
| 对长度影响 | 不改变          | 改变斜方向的投影长度                |
| 可逆性     | 可逆            | 可逆（但非正交变换）                |
| 用途       | 旋转对象        | 制造透视 / 伪 3D 效果、倾斜标题文字 |

#### 一个直观可视化代码

<div class="box"></div>

<style scoped>
  .box {
    width: 150px;
    height: 100px;
    background: linear-gradient(to right, #4ecdc4, #556270);
    margin: 60px;
    transform: skew(10deg, 20deg);
    transition: 0.4s;
  }
  .box:hover {
    transform: skew(0deg, 0deg);
  }
</style>

你会看到：

- 初始是被“剪切”倾斜的矩形；
- hover 恢复正常矩形；
- 可感受到“X轴倾斜10°、Y轴倾斜20°”的视觉差异。

#### 总结

| 维度     | 说明                                          |
| -------- | --------------------------------------------- |
| 含义     | 沿 X、Y 方向分别倾斜                          |
| 函数定义 | `skew(ax, ay)` = `skewX(ax) skewY(ay)`        |
| 数学定义 | x′=x+tan(ax)·y；y′=y+tan(ay)·x                |
| 矩阵表示 | [ [1, tan(ax), 0], [tan(ay), 1, 0], [0,0,1] ] |
| 使用场景 | 制造倾斜 UI、拟态透视、文字倾斜、卡片动态变形 |

## transform属性的若干细节特性

1. 无论元素应用transform的什么值，元素的大小和位置都不会改变

<div class="flex">
    <div class="w-100px h-100px bg-red scale-50"></div>
    <div class="w-100px h-100px bg-green"></div>
</div>

```html
<div class="flex">
  <div class="w-100px h-100px bg-red scale-50"></div>
  <div class="w-100px h-100px bg-green"></div>
</div>
```

2. 内联元素（不包括替换元素）是无法应用transform变换的，且不支持所有变换特性

<span class="color-red text-24px scale-50">hello world</span>
<span class="color-red text-12px scale-50">hello world</span>

```html
<span class="color-red text-20px scale-50">hello world</span>
```

在内联元素span上应用`scale-50`，并不会缩小字体

但是在替换元素上是可以应用transform，例如img

3. 锯齿或虚化的问题

在应用旋转或者斜切变换的时候，元素边缘会表现出明显的锯齿，文字会明显虚化。

根本原因是低分辨率显示器无渲染出小于`1px x 1px`的像素

4. 不同顺序不同效果

一次性应用`多个不同`的变换函数，顺序不同，效果不同

<div class="w-100px h-100px bg-green">
    <div class="w-50px h-50px bg-red" style="transform: translateX(40px) scale(.75)"></div>
</div>
<div class="w-100px h-100px bg-green mt-20px">
    <div class="w-50px h-50px bg-red"  style="transform: scale(.75) translateX(40px)"></div>
</div>

:::info
需要注意的是，如果是通过unocss、tailwind等`原子类框架`添加css class影响元素transform时，并不会出现`不同顺序不同效果`的特性视觉效果

<div class="w-100px h-100px bg-green">
    <div class="w-50px h-50px bg-red scale-75 translate-x-40px "></div>
</div>

原因是原子类框架底层已经定义好transform顺序，并通过var接收添加的影响transform的原子类，合并后展示最终视觉效果

```css
.scale-75 {
  --un-scale-x: 0.75;
  --un-scale-y: 0.75;
  transform: translateX(var(--un-translate-x)) translateY(var(--un-translate-y))
    translateZ(var(--un-translate-z)) rotate(var(--un-rotate))
    rotateX(var(--un-rotate-x)) rotateY(var(--un-rotate-y))
    rotateZ(var(--un-rotate-z)) skewX(var(--un-skew-x)) skewY(var(--un-skew-y))
    scaleX(var(--un-scale-x)) scaleY(var(--un-scale-y))
    scaleZ(var(--un-scale-z));
}
```

:::

5. clip/clip-path前置剪裁

一个元素应用transform变换之后，同时再应用clip或者clip-path等属性，总是优先执行`clip/clip-path`属性对应的裁剪效果

<div class="w-100px h-100px bg-red scale-150" style="clip-path: circle(50px)"></div>

```html
<div
  class="w-100px h-100px bg-red scale-150"
  style="clip-path: circle(50px)"
></div>
```

## 元素应用transform属性后的变化

### 创建层叠上下文

<div class="flex">
    <div class="w-100px h-100px bg-red hover:scale-100"></div>
    <div class="w-100px h-100px bg-green ml--25px hover:scale-100"></div>
    <div class="w-100px h-100px bg-blue ml--25px hover:scale-100"></div>
</div>

```html
<div class="flex">
  <div class="w-100px h-100px bg-red hover:scale-100"></div>
  <div class="w-100px h-100px bg-green ml--25px hover:scale-100"></div>
  <div class="w-100px h-100px bg-blue ml--25px hover:scale-100"></div>
</div>
```

### 限制z-index:-1的层级表现

z-index:-1是定位在第一个层叠上下文祖先元素的背景层上的

### 固定定位失效

设置了transform的元素，如果position为fixed，则固定定位会失效

<div class="w-100px h-100px bg-red fixed right-0 bottom-0"></div>

容器设置了`scale-100`，子元素的fixed失效，效果类似absolute

<div class="scale-100">
    <div class="w-100px h-100px bg-red fixed right-0 bottom-0 mt-10px"></div>
</div>

:::tip

filter滤镜也会让子元素的固定定位效果失效

:::

### 改变overflow对绝对定位元素的限制

### 改变绝对定位元素的包含块

过去absolute元素的位置都是相对于第一个position不是static的元素进行定位，现在也可以相对于第一个transform不为none的元素进行定位

<div class="w-150px h-150px bg-#3c3c3c">
    <div class="w-100px h-100px bg-red ml-10px mt-10px relative">
        <div class="w-50px h-50px bg-blue absolute top-10px left-10px"></div>
    </div>
</div>

<div class="w-150px h-150px bg-#3c3c3c">
    <div class="w-100px h-100px bg-red ml-10px mt-10px scale-100">
        <div class="w-50px h-50px bg-blue absolute top-10px left-10px"></div>
    </div>
</div>

:::tip

absolute元素的位置相对于：

- 第一个position不是static的元素
- 第一个transform不为none的元素

:::

## 深入了解矩阵函数matrix()

transform变换还支持矩阵函数matrix()。无论是位移、旋转、缩放还是斜切，其变换的本质都是应用矩阵函数matrix()进行矩阵变换。

```text
transform: matrix(a, b, c, d, e, f);
```

![img.png](/imgs/base/css/chapter-4.3.1.png)

坐标`(x, y)`根据转换矩阵，转换到新坐标`(x', y')`

![img.png](/imgs/base/css/chapter-4.3.2.png)

### 位移：translate()函数

transform: matrix(1, 0, 0, 1, tx, ty);

<div class="w-200px h-200px bg-green">
    <div class="w-100px h-100px bg-red" style="transform: matrix(1, 0, 0, 1, 10, 20)"></div>
</div>

```html
<div class="w-200px h-200px bg-green">
  <div
    class="w-100px h-100px bg-red"
    style="transform: matrix(1, 0, 0, 1, 10, 20)"
  ></div>
</div>
```

### 缩放：scale()函数

transform: matrix(sx, 0, 0, sy, 0, 1);

<div class="w-100px h-100px bg-red" style="transform: matrix(0.5, 0, 0, 0.5, 0, 1)"></div>

```html
<div
  class="w-100px h-100px bg-red"
  style="transform: matrix(0.5, 0, 0, 0.5, 0, 1)"
></div>
```

### 旋转：rotate()函数

transform: matrix(cosθ, sinθ, -sinθ, cosθ, 0, 0);

<div class="w-100px h-100px bg-red" style="transform: matrix(0.500000, 0.866025, -0.866025, 0.500000, 0, 0)"></div>

```html
<div
  class="w-100px h-100px bg-red"
  style="transform: matrix(0.500000, 0.866025, -0.866025, 0.500000, 0, 0)"
></div>
```

### 斜切：skew()函数

transform: matrix(1, tan(ay), tan(ax), 1, 0, 0);

<div class="w-100px h-100px bg-red" style="transform: matrix(1, 1.73, 1.73, 1, 0, 0)"></div>

```html
<div
  class="w-100px h-100px bg-red"
  style="transform: matrix(1, 1.73, 1.73, 1, 0, 0)"
></div>
```

### 传递多个值

transform: matrix(0.5, 0.866, -0.866, 0.5, 0, 0) matrix(3, 0, 0, 1, 0, 0);

按照顺序`左乘`矩阵

### 3D矩阵变换

3D矩阵变换不再是3×3， 而是4×4，

例如：transform: matrix3d(sx, 0, 0, 0, 0, sy, 0, 0, 0, 0, sz, 0, 0, 0, 0, 1);

![img.png](/imgs/base/css/chapter-4.3.3.png)

## 常常被遗忘的transform-origin属性

偏移transform原点

## scale()函数缩放和zoom属性缩放的区别

- 标准和非标准区别。zoom为非标准属性，scale为标准属性
- 坐标系不同。zoom坐标原点为左上角，scale为元素中心点
- 占据的尺寸空间表现不同。zoom会改变元素尺寸，触发重绘、重排，scale不会改变
- zoom不会创建新的层叠上下文，scale会创建

## 了解全新的translate、scale和rotate属性

最新的CSS Transforms Level 2规范针对位移、缩放和旋转定义了全新的CSS属性。

```text
translate: 50%;

scale: 1;

rotate: 45deg;
```

可以直接使用，效果等同于使用`transform`属性
