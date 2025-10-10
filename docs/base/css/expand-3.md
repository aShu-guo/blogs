# CSS元素分类

在 CSS 中，替换元素的分类基于其内容来源的独立性，核心标准是：元素的内容是否由外部资源直接替换，而非由文档内的 HTML
或文本内容决定。这种分类是 [CSS 规范](https://www.w3.org/TR/css-display-3/)中定义的底层逻辑。

## 分类依据

1. 内容来源的本质差异

- 替换元素：内容由`外部资源`（如 src 属性指向的图像、视频文件）渲染，不受文档树内的文本或子节点影响。
  示例：\<img\> 的显示内容由 src="photo.jpg" 决定，而非其内部的 alt 文本。

- 非替换元素：内容直接由 HTML 子节点或生成的内容（如 ::before 伪元素）渲染。
  示例：\<div\> 的内容是其内部的文本或子元素。

2. 渲染行为的独立性

- 替换元素有内在尺寸（Intrinsic Dimensions），尺寸默认由资源本身决定（如图像原始宽高）。
- 非替换元素的尺寸默认由内容流（Content Flow）决定（如文本长度、子元素布局）。

3. CSS 属性的响应差异

- 替换元素对某些 CSS 属性（如 vertical-align、line-height）的响应机制不同（详见下文表格）。

## 其他分类

替换元素与非替换元素是 `内容渲染维度` 的分类，而 CSS 中还有其他独立维度的分类方式，它们共同描述元素的完整行为：

| 分类维度 |                类别                |                                                                说明 |
| -------- | :--------------------------------: | ------------------------------------------------------------------: |
| 内容来源 |              替换元素              |                         内容由外部资源替换（如 \<img\>, \<video\>） |
|          |             非替换元素             |                内容由文档内容或生成内容决定（如 \<div\>, \<span\>） |
| 显示类型 |      块级元素（Block-level）       |                             默认占满父容器宽度（如 \<div\>, \<p\>） |
|          |      行内元素（Inline-level）      |                            默认按文本流排列（如 \<span\>, \<a\>）） |
| 布局模式 |     包含块（Containing Block）     | 影响子元素布局的参考坐标系（如 position: relative/absolute 的元素） |
|          | 格式化上下文（Formatting Context） |                                     决定内部布局规则（如 BFC、FFC） |

关键交叉点示例：

1. 替换元素 + 行内显示（如 `<img>`）

- `默认 display: inline`，但可设置宽高（行为类似行内块状）。
- 受 line-height 和 vertical-align 影响，但对齐基于整个元素框（而非文本基线）。

2. 非替换元素 + 块级显示（如 \<div\>）

- `宽度默认占满父容器，高度由内容撑开`。
- 内部遵循块级布局规则（如垂直排列子元素）。

3. 特例：表单控件的争议

- \<input type="text"\>：
  非替换元素（内容由用户输入或 value 属性渲染，非外部资源）。
- \<input type="image"\>：
  替换元素（内容被 src 图像替换）。
- \<input type="range"\>：
  浏览器可能视为替换元素（因滑块样式由系统/主题资源控制）。

## 为什么分类重要？

理解替换元素的特性可解决常见问题：

1. 图像底部间隙：  
   行内替换元素（\<img\>）默认对齐基线（vertical-align: baseline），下方会预留字符下沉空间。  
   修复：设置 vertical-align: middle 或 display: block。

2. 尺寸控制差异：  
   替换元素设置 width: 100% 时基于自身内在尺寸，而非父容器（需配合 max-width 限制）。

3. 伪元素的替换行为：

```css
div::before {
    content: url(icon.png);

/*  此时伪元素变为替换元素！ * /
}
```

## BFC

BFC（Block Formatting Context，块级格式化上下文） 是 CSS 渲染过程中的一个独立布局区域。它决定了元素如何定位、与其他元素的关系，以及如何处理内部和外部元素的相互作用。

BFC 的核心是`创建一个隔离的容器`，其内部的布局规则`不受外部影响`，也`不会影响外部布局`。

### BFC特性

- 内部元素垂直排列：BFC 内的块级元素默认从上到下排列（每个元素独占一行）。
- 边距（margin）不会与外部合并：BFC 内元素的上下 margin 不会与外部元素合并（解决边距重叠问题，即margin塌陷问题）。
- 独立布局，隔离外部浮动：BFC 内部不受外部浮动影响，外部浮动也不会侵入 BFC 区域。
- 包含浮动元素：BFC 会`自动计算浮动子元素的高度，避免父容器高度坍塌`。
- 阻止文本环绕浮动：BFC 区域内的文本不会环绕外部浮动元素（如实现两栏布局）。

```css
.container {
  /* 任选其一即可 */
  overflow: hidden; /* 最常用（非 visible 值） */
  display: flow-root; /* 专为 BFC 设计（无副作用） */
  float: left 或 right; /* 非 none */
  position: absolute 或 fixed;
  display:
    inline-block,
    table-cell,
    table-caption,
    flex,
    grid 等;
  contain: layout, content, paint; /* 新规范属性 */
}
```

1. float导致父容器高度塌陷问题

**未触发BFC**

<div class="bd-1px_red">
  <div class="float-left color-red">123</div>
</div>

**触发BFC**

 <div class="bd-1px_red flow-root">
    <div class="float-left color-red">123</div>
</div>

2. margin塌陷

**未触发BFC**

<div class="mb-10px bg-#3c3c3c h-20px"></div>
<div class="mt-20px bg-green h-20px"></div>

**触发BFC**

- 用一个div包裹

<div class="mb-10px bg-#3c3c3c h-20px"></div>
<div class="overflow-hidden">
  <div class="mt-20px h-20px bg-green "></div>
</div>

- 在两个div之间创建一个不可见的元素（通过伪元素触发，本质也是通过overflow:hidden触发）

<div class=" div-1">
<div class="mb-10px h-20px bg-#3c3c3c"></div>
</div>
<div class="mt-20px bg-green h-20px"></div>

<style>
.div-1::after { content: '';display: block;overflow: hidden;clear: both;    }
</style>

:::info
经典触发BFC方式：

```css
.div-1::after {
  content: '';
  display: block;
  overflow: hidden;
  clear: both;
}
```

:::
