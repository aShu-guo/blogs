# 在CSS边框上做文章

在CSS2.1时代，边框只能是纯色的。但是在CSS3时代，可以通过border-image定制边框颜色

## border-image

所有与装饰有关的CSS属性都能从其他设计软件中找到对应的功能，如`背景`、`描边`、`阴影`，甚至`滤镜`和`混合模式`
，但是唯独borderimage属性是CSS这门语言独有的，就算其他软件有边框装饰，也不是border-image这种表现机制

但是存在3个问题：

- 心智负担高
- 最终的效果与UI并不完全相符
- 4个角的怪异行为

## 语法

```text
border-image =
  <'border-image-source'>                             ||
  <'border-image-slice'> [ / <'border-image-width'> | / <'border-image-width'>? / <'border-image-outset'> ]?  ||
  <'border-image-repeat'>
```

- source: 边框图像的路径（可以是URL，也可以是渐变）
- slice: 将图像分割为9个区域的偏移量（1-4个值，可以是`数字`或`百分比`）
- width: 边框图像的宽度（可选，默认值为1），可以设置值，为`border-width的倍数`
- outset: 边框图像超出边框盒的量（可选），可以设置值，为`border-width的倍数`
- repeat: 定义中间部分和边缘部分如何重复或拉伸（可选，值：stretch, repeat, round, space）
  - stretch：（默认）会拉伸边片以填满边长，
  - repeat：会重复平铺（可能截断）
  - round：平铺图案并且“整齐恰好填满”（常用于图案无缝平铺），
  - space：会把重复项之间留空隙以填满整条边

## 理解

源图片的原始尺寸为162x162，每个方块的尺寸为54

![img.png](/imgs/base/css/chapter-3-3.svg)

### 九宫格

![img.png](/imgs/base/css/chapter-3-3.1.png)

将一张图片分割成9个区域：

- 四个角（corner）：对应边框的四个角，`不会缩放`。
- 四个边（edge）：对应边框的四个边，可以`拉伸`、`重复`或`铺满`。
- 一个中心（middle）：默认不显示，除非设置`fill`关键字。

### border-image-slice

通过border-image-slice划分源图形，将图像分割为9个区域的偏移量（1-4个值，可以是`数字`或`百分比`）

```text
border-image-slice: <number-percentage>{1,4} && fill?
```

用于指定4个方向上相对于边的偏移量，方向为：上、右、下、左。

例如：

```css
.box {
  border-image-slice: 20;
}
```

表示在距离源图像上方20px、距离源图像右侧20px、距离源图像下方20px、距离源图像左侧20px的地方进行划分

---

<div class="w-100px h-100px bg-#3c3c3c flex-wrap bd-20px" style="border-image: url('/imgs/base/css/chapter-3-3.svg') 54">

</div>

<div class="mt-20px w-100px h-100px bg-#3c3c3c flex-wrap bd-20px" style="border-image: url('/imgs/base/css/chapter-3-3.svg') ">

</div>

默认情况下，源图像划分的中心位置是不参与填充的。如果想要有填充效果，可以额外使用fill关键字

<div class="mt-20px w-100px h-100px bg-#3c3c3c flex-wrap bd-20px" style="border-image: url('/imgs/base/css/chapter-3-3.svg') 54 fill">

</div>

### border-image-width

边框图像的宽度（可选，默认值为1），可以设置值，为`border-width的倍数`

![img.png](/imgs/base/css/chapter-3-3.2.png)

---

<div class="mt-20px w-100px h-100px bg-#3c3c3c flex-wrap bd-20px" style="border-image: url('/imgs/base/css/chapter-3-3.svg') 54 fill / 1 / 0">

</div>

```css
.box {
  border-image: url('/imgs/base/css/chapter-3-3.svg') 54 fill / 1 / 0;
}
```

- 边框图片：/imgs/base/css/chapter-3-3.svg
- slice：距离源文件边的距离为54px
- 边框图像的宽度为边框宽度的1倍，即与边框宽度保持一致
- 超出边框宽度为0

### border-image-outset

边框图像超出边框盒的量（可选），可以设置值，为`border-width的倍数`

<div class="mt-20px w-100px h-100px bg-#3c3c3c flex-wrap bd-20px" style="border-image: url('/imgs/base/css/chapter-3-3.svg') 54 fill / 1 / 1">

</div>

### border-image-repeat

定义控制九宫格上、右、下、左4个区域（对应的区域序号是5～8，我称这几个区域为平铺区）图形的`平铺规则`（可选，值：stretch, repeat, round, space）

- stretch：让源图像拉伸以充满显示区域

<div class="mt-20px w-100px h-100px bg-#3c3c3c flex-wrap bd-20px" style="border-image: url('/imgs/base/css/chapter-3-3.svg') 27 fill / 1 / 0 stretch">

</div>

- repeat：让源图像紧密相连平铺，`保持原始比例`，平铺单元在边界位置处`可能会被截断`

<div class="mt-20px w-100px h-100px bg-#3c3c3c flex-wrap bd-20px" style="border-image: url('/imgs/base/css/chapter-3-3.svg') 27 fill / 1 / 0 repeat">

</div>

- round：让源图像紧密相连平铺，`适当伸缩`，以确保平铺单元在边界位置处`不会被截断`。

<div class="mt-20px w-100px h-100px bg-#3c3c3c flex-wrap bd-20px" style="border-image: url('/imgs/base/css/chapter-3-3.svg') 27 fill / 1 / 0 round">

</div>

- space：让源图像`保持原始尺寸`，平铺时彼此保持适当的`等宽间隙`，以确保平铺单元在边界位置处`不会被截断`

<div class="mt-20px w-100px h-100px bg-#3c3c3c flex-wrap bd-20px" style="border-image: url('/imgs/base/css/chapter-3-3.svg') 27 fill / 1 / 0 space">

</div>

:::warning

- border-image 会替换原始边框（即边框线颜色/样式会被图片替换）。
- border-radius 对 border-image 没作用——边框图像不会被圆角裁剪（MDN 给出了解决方案，如在 background
  上做两层图）。如果想要圆角效果，最好在图片本身或使用背景/clip 技巧实现。
- border-image-width 并不会影响border-width，只是影响border-image的宽度，但是在最终渲染出来的效果中看着像是改变了border-width。

:::

:::danger 注意

- outset、inset：只能对应单向扩展，`仅支持正值`。例如：box-shadow、text-shadow
- offset：扩展的方向既能向外也能向内，反映在属性值上就是offset`既支持正值也支持负值`。例如：outline-offset、text-underline-offset等CSS属性

:::

## 工具

1. [box-image生成器](https://developer.mozilla.org/zh-CN/docs/Web/CSS/CSS_backgrounds_and_borders/Border-image_generator)
