# 深入理解CSS逻辑属性

CSS世界是基于flow的，这与CSS2.1基于方向的理念是不同的。

CSS逻辑属性（CSS Logical
Properties）是CSS的一个模块，它允许开发者使用逻辑性的术语`（如“块方向”和“行内方向”）`
来定义布局，而不是物理方向（如“上”、“右”、“下”、“左”）。这种抽象使得布局能够根据不同的书写模式（writing
mode）自动适应，从而更好地支持`多语言`和`国际化`。

## write-mode

指定文本的排列方式

- horizontal-tb：水平文本，从上到下（如英文、中文）

<div class="write-normal bg-#3c3c3c">
hello world
</div>

- vertical-rl：垂直文本，从右到左（如传统中文、日文）

<div class="write-vertical-right w-full bg-#3c3c3c">
<div>垂直文本，从右到左（如传统中文、日文）</div>
<div>垂直文本，从右到左（如传统中文、日文）</div>
</div>

- vertical-lr：垂直文本，从左到右（如蒙古文）

<div class="write-vertical-left bg-#3c3c3c">
<div>垂直文本，从右到左（如传统中文、日文）</div>
<div>垂直文本，从右到左（如传统中文、日文）</div>
</div>

## 逻辑方向

- Block Dimension：在排列方式中，与块元素方向一致（例如：write-mode: vertical-lr，块方向为lr）
- Inline Dimension：在排列方式中，与行内元素方向一致（例如：write-mode: vertical-lr，行内方向为vertical）

## 逻辑属性

| 物理属性         | 逻辑属性（块方向）    | 逻辑属性（行内方向）   |
| ---------------- | --------------------- | ---------------------- |
| `width`          |                       | `inline-size`          |
| `height`         | `block-size`          |                        |
| `margin-top`     | `margin-block-start`  |                        |
| `margin-right`   |                       | `margin-inline-end`    |
| `margin-bottom`  | `margin-block-end`    |                        |
| `margin-left`    |                       | `margin-inline-start`  |
| `padding-top`    | `padding-block-start` |                        |
| `padding-right`  |                       | `padding-inline-end`   |
| `padding-bottom` | `padding-block-end`   |                        |
| `padding-left`   |                       | `padding-inline-start` |
| `border-top`     | `border-block-start`  |                        |
| `border-right`   |                       | `border-inline-end`    |
| `border-bottom`  | `border-block-end`    |                        |
| `border-left`    |                       | `border-inline-start`  |
| `top`            | `inset-block-start`   |                        |
| `right`          |                       | `inset-inline-end`     |
| `bottom`         | `inset-block-end`     |                        |
| `left`           |                       | `inset-inline-start`   |
| `min-width`      |                       | `min-inline-size`      |
| `max-width`      |                       | `max-inline-size`      |
| `min-height`     | `min-block-size`      |                        |
| `max-height`     | `max-block-size`      |                        |

- end：根据CSS flow方向，末尾
- start：根据CSS flow方向，首部

## direction

在实现对称布局时更有用，例如微信对话框

<div class="w-full bg-#3c3c3c">
<div>
<span>hello world</span>
</div>
<div style="direction: rtl">
<span>hello world</span>
</div>
</div>

:::info

- CSS逻辑属性需要配合`writing-mode`属性、`direction`属性或者`text-orientation`属性使用才有意义。
- CSS中还有其他一些CSS属性值也可以改变DOM元素的呈现方向，例如flex-direction属性中的属性值row-reverse和column-reverse，但是请注意，这些属性值和CSS逻辑属性之间没
  有任何关系。

:::

## text-align属性支持的逻辑属性值

text-align: start;

text-align: end;

## inset

可以用

```css
.container {
  inset: 0;
}
```

替换

```css
.container {
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
}
```
