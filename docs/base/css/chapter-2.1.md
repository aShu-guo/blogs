# css 数据类型

CSS数据类型定义的是CSS属性中具有代表性的值，在规范的语法格式中，使用关键字外加一对尖括号（“\<”和“\>”）表示，例如数值类型是\<number\>、色值类型是\<color\>等。

任何CSS属性值一定包含一个或多个数据类型。

## background-image

举一个例子，background-image是使用频率非常高的一个CSS属性，这个CSS属性的语法结构是下面这样的

`background-image`: \<image\> | none

这个语法中出现的\<image\>就是一种数据类型，它包括下面这些类型和函数：

- \<url\>：url(test.jpg)，加载指定路径下的资源
- \<gradient\>：linear-gradient(blue, red)，渐变函数
- element()：element(#realid)，传入css选择器，指向布局中的DOM
- image()：image(ltr 'arrow.png#xywh=0,0,16,16', red)，加载arrow.png从左上角到(16, 16)坐标下的图片片段，如果加载失败则设置为red
- image-set()：image-set('test.jpg' 1x, 'test-2x.jpg' 2x)，一系列具有不同分辨率的图像
- cross-fade()：cross-fade(20% url(twenty.png), url(eighty.png))，半透明叠加的图像，其中 twenty 的不透明度为 20%， 而 eighty
  的不透明度为 80%。

\<image\>类型也支持`paint()`函数，它是CSS Paint API带来的新成员，相关规范在2016年才开始制定。

## 常见的数据类型

1. \<basic-shape\> || \<shape-box\>

```text
shape-outside =
  none                              |
  [ <basic-shape> || <shape-box> ]  |
  <image>
```

- \<shape-box\>：CSS的盒模型，content-box、padding-box、border-box、margin-box
- \<basic-shape\>：基于 inset()、circle()、ellipse()、polygon()、path() 其中一个创造出来的形状计算出浮动区域

2. \<color\>

```text
<color> =
  <color-base>    |
  currentColor    |
  <system-color>

<color-base> =
  <hex-color>       |
  <color-function>  |
  <named-color>     |
  transparent

<color-function> =
  <rgb()>     |
  <rgba()>    |
  <hsl()>     |
  <hsla()>    |
  <hwb()>     |
  <lab()>     |
  <lch()>     |
  <oklab()>   |
  <oklch()>   |
  <ictcp()>   |
  <jzazbz()>  |
  <jzczhz()>  |
  <alpha()>   |
  <color()>
```

## CSS属性值定义语法

![img.png](/imgs/base/css/chapter-2.1-1.png)
![img.png](/imgs/base/css/chapter-2.1-2.png)
![img.png](/imgs/base/css/chapter-2.1-3.png)

## 全局关键字

- inherit：集成父类属性

```css
/* 常用重置输入框的内置字体 */
input,
textarea {
  font-family: inherit;
}
```

- initial：将属性的计算值还原为`CSS语法的默认值`
- unset：如果当前CSS属性有继承属性，例如color，那么等价于使用inherit；反之则等价于使用initial，例如background-color。
  - 可用于对完全不符合的属性进行批量重置：`all: unset`
- revert：将属性还原为`浏览器的默认值`

## 指代所有CSS属性的all属性

all属性可以重置除`unicode-bidi`、`direction`以及`CSS自定义属性`以外的所有CSS属性

all的形式语法：

```text
all =
  initial       |
  inherit       |
  unset         |
  revert        |
  revert-layer
```

all:inherit、all:initial也没有任何实用价值。有实用价值的是all:unset和all:revert。

`all:unset`可以让任意一个元素样式表现和\<span\>元素一样。`all:revert`可以让元素恢复成浏览器默认的样式，也是很有用的

### direction与unicode-bidi

不支持上述两种属性的原因是direction的设计缺陷，初始值设置为了ltr，而不是auto。因为并不是所有国家的文字都是从左往右写的，又因为unicode-bidi常与direction同时出现，故这两个属性都无法被all:
unset重置

unicode-bidi和direction决定文档在web中的书写方向

1. unicode-bidi

- 形式语法

```text
unicode-bidi =
  normal            |
  embed             |
  isolate           |
  bidi-override     |
  isolate-override  |
  plaintext
```

2. direction

- 形式语法

```text
direction =
  ltr  |
  rtl
```

### 例子

<div style="direction:rtl; unicode-bidi: normal;">A line of text 你好</div>
<div style="direction:rtl; unicode-bidi: embed;">A line of text 你好</div>
<div style="direction:rtl; unicode-bidi: isolate;">A line of text 你好</div>
<div style="direction:rtl; unicode-bidi: isolate-override;">A line of text 你好</div>
<div style="direction:rtl; unicode-bidi: plaintext;">A line of text</div>

## CSS新特性的渐进增强处理技巧

不要担心CSS新特性在不同浏览器的兼容问题，在好的浏览器中展示好的视觉效果，在不支持的浏览器中展示不同的效果才是一个好的开发者应该做的。

兼容问题有3种解决方式：

1. 可以通过属性在不同浏览器的支持情况，在CSS代码中添加冗余，以保证在不同浏览器上展示相同

```css
.background-pattern {
  background: url(./pattern.png); /* IE Edge浏览器可以识别 */
  background:
    repeating-linear-gradient(...), repeating-linear-gradient(...), #00000000; /* IE Edge浏览器无法识别 */
  background-blend-mode: multiply;
}
```

2. 借助伪类区分浏览器

```css
/* IE9+浏览器识别 */
_::before,
.some-class {
}

/* 或者 */
_::after,
.some-class {
}

/* 或者 */
_::selection,
.some-class {
}
```

可以有效的区分浏览器，而且不会影响选择器的优先级。原因是：在解析CSS时，如果存在浏览器无法正确识别伪类，那么伪类所在的CSS规则集都会忽略

:::info
这个下划线是作为一个标签选择器用来占位的，本身不会产生任何匹配，我们也可以换成其他选择器，效果也是一样的，用下划线是为了节省字数
:::

3. 通过官方提供的`@support`

```css
@supports (display: flex) {
  .item {
    flex: 1;
  }
}
```

- 支持操作符

```css
/* 支持弹性布局 */
@supports (display: flex) {
}

/* 不支持弹性布局 */
@supports not (display: flex) {
}

/* 同时支持弹性布局和网格布局 */
@supports (display: flex) and (display: grid) {
}

/* 支持弹性布局或者支持网格布局 */
@supports (display: flex) or (display: grid) {
}
```

- 嵌套使用

```text
@supports =
  @supports <supports-condition> { <rule-list> }
```

```css
@supports (display: flex) and (not (display: grid)) {
  .box {
    flex: 1;
  }
}
```

:::info
在使用 and 和 or 操作符时，如果是为了定义多个表达式的执行顺序，则必须使用`圆括号`。如果不这样做的话，该条件就是无效的，会导致整个
at-rule 失效。
:::

## 参考资料

- [mdn CSS基本数据类型](https://developer.mozilla.org/zh-CN/docs/Web/CSS/CSS_Values_and_Units/CSS_data_types)
- [CSS background和border模块提案](https://drafts.csswg.org/css-backgrounds-3/)
- [CSS image模块提案](https://drafts.csswg.org/css-images-3/)
- [CSS value和unit模块提案](https://drafts.csswg.org/css-values-4/)
