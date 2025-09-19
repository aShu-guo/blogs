# 贯穿全书的尺寸体系

如果用一个金字塔来表示，那么在最上层的概念就是`Intrinsic Sizing`和`Extrinsic Sizing`。“Intrinsic
Sizing”被称为“内在尺寸”，表示元素最终的尺寸表现是由内容决定的；“Extrinsic Sizing”被称为“外在尺寸”，表示元素最终的尺寸表现是由上下文决定的。

## width属性中的关键字

### fit-content

元素会尽可能使用可用空间，但不超出max-content

1. 绝对定位元素在水平、垂直方向上居中的常规写法

<div class="w-full h-100px bg-#3c3c3c relative">
<div class="absolute absolute-center color-red">123123</div>
</div>

2. 基于width: fit-content的写法

<div class="w-full h-100px bg-#3c3c3c relative">
<div class="absolute top-0 right-0 bottom-0 left-0 m-auto w-fit h-fit color-red">123123</div>
</div>

这样写法优点：

- 节省了transform属性的使用，防止与transition、css animate冲突。
    - 关键帧@keyframe上的css属性的优先级最高

一个例子

设置了fit-content：

<div>
<div class="bg-#3c3c3c w-[fit-content]">123</div>
<div class="bg-#3c3c3c w-[fit-content]">设置了fit-content</div>
<div class="bg-#3c3c3c w-[fit-content]">hello world</div>
</div>

没有设置fit-content：

<div>
<div class="bg-#3c3c3c">123</div>
<div class="bg-#3c3c3c">没有设置fit-content</div>
<div class="bg-#3c3c3c">hello world</div>
</div>

### stretch、fill-available、available

`stretch`使用来替换后两者的，都是尽可能的填充满尺寸

<div>
<button class="bg-#3c3c3c">12313</button>
<button style="width: stretch" class="bg-#3c3c3c">123</button>
</div>

- block水平的元素、弹性布局和网格布局中的子项默认都自带弹性拉伸特性；
- 其次，对于替换元素、表格元素、内联块级元素等这些具有“包裹性”的元素，建议使用“宽度分离原则”
    - 也就是外面嵌套一层普通的块级元素，块级元素具有弹性拉伸特性，因此可以很好地实现替换元素的宽度自适应布局效果

### min-content

即“首选最小宽度”或者“最小内容宽度”。（可以用来垂直展示中文）

1. 替换元素

min-content为元素的原始尺寸宽度

2. CJK文字

CJK是Chinese/Japanese/Korean的缩写，指的是中文、日文、韩文这几种文字。

- 文本中不包含标点，则最小宽度为单个文字的宽度。

<div style="width: min-content">
单个文字的宽度
</div>

- 如果包含标点，则浏览器的兼容不同，在现代浏览器中最小宽度为标点+单个文字的宽度

<div style="width: min-content">
单个文字的宽度。
</div>

3. 非CJK文字

最小宽度为由字符单元确定，直到遇到中断字符

<div style="width: min-content">hello world!</div>

4. 一个包裹其他元素的最小宽度

为所有包裹元素的最长宽度

<div class="inline-block bd-red">
<div>123123</div>
<div>123123123123</div>
<div>一个包裹其他元素的最小宽度，为所有包裹元素的最长宽度</div>
<div>hello world!</div>
</div>

### max-content

尽量让内容在一行展示，即使会溢出。

<div class="w-200px bd-red">
<div style="width: max-content">尽量让内容在一行展示，即使会溢出；尽量让内容在一行展示，即使会溢出；尽量让内容在一行展示，即使会溢出；</div>
</div>

:::info
可以用于处理禁止字体换行的场景。width: max-content相对于text-wrap: nowrap兼容性更好

width: max-content

![img.png](/imgs/base/css/chapter-3-1.png)

text-wrap: nowrap

![img.png](/imgs/base/css/chapter-3-2.png)
:::

## 总结

- 带content这个单词的3个：关键字fit-content、min-content和max-content都是“内在尺寸”（intrinsic sizing），尺寸表现和内容相关；
- stretch关键字（也包括available关键字和fill-available关键字）是“外在尺寸”（extrinsic sizing），尺寸表现和上下文有关。

这4个关键字一起撑起了CSS世界的尺寸体系。
