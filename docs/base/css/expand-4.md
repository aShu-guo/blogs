# BFC与FFC

## BFC

BFC（Block Formatting Context，块级格式化上下文） 是 CSS 渲染过程中的一个独立布局区域。它决定了元素如何定位、与其他元素的关系，以及如何处理内部和外部元素的相互作用。

BFC 的核心是`创建一个隔离的容器`，其内部的布局规则`不受外部影响`，也`不会影响外部布局`。

### BFC特性

- 内部元素垂直排列：BFC 内的块级元素默认从上到下排列（每个元素独占一行）。
- 边距（margin）不会与外部合并：BFC 内元素的上下 margin 不会与外部元素合并（解决边距重叠问题，即margin塌陷问题）。
- 独立布局，隔离外部浮动：BFC 内部不受外部浮动影响，外部浮动也不会侵入 BFC 区域。
- 包含浮动元素：BFC 会`自动计算浮动子元素的高度，避免父容器高度坍塌`。
- 阻止文本环绕浮动：BFC 区域内的文本不会环绕外部浮动元素（如实现两栏布局）。

### 触发条件

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

### 特性应用

#### float导致父容器高度塌陷问题

**未触发BFC**

<div class="bd-1px_red">
  <div class="float-left color-red">123</div>
</div>

**触发BFC**

 <div class="bd-1px_red flow-root">
    <div class="float-left color-red">123</div>
</div>

#### margin塌陷

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

### 经典触发BFC

```css
.div-1::after {
  content: '';
  display: block;
  overflow: hidden;
  clear: both;
}
```

## 层叠上下文与BFC

“**层叠上下文 (Stacking Context)**” 和 “**BFC (Block Formatting Context)**” 是 CSS 两个非常核心但完全不同的**布局机制**。
它们经常被混用，但本质上控制的是 **两个不同维度**：

- **层叠上下文**：控制 **Z 轴方向（绘制顺序、层叠顺序）**
- **BFC（块级格式化上下文）**：控制 **布局流、盒子排版与包含关系（X/Y 方向）**

| 对比项       | 层叠上下文 (Stacking Context)                                            | 块级格式化上下文 (BFC)                         |
| ------------ | ------------------------------------------------------------------------ | ---------------------------------------------- |
| **控制维度** | Z 轴（绘制层叠顺序）                                                     | X/Y 轴（盒子排版、浮动、清除等）               |
| **目的**     | 控制元素与兄弟元素在视觉层面的上下关系                                   | 控制元素内部的块级盒子布局规则                 |
| **影响对象** | 绘制层叠顺序（z-index、opacity等）                                       | 盒子排版、margin折叠、float清除等              |
| **关键属性** | `z-index`, `position`, `opacity`, `transform`, `filter`, `isolation`, 等 | `float`, `overflow`, `display`, `position`, 等 |
| **表现结果** | 哪个元素在上面（视觉叠放顺序）                                           | 元素内部块级布局的独立性                       |
| **坐标维度** | Z 轴                                                                     | X/Y 平面                                       |

### 触发条件

一个元素会创建新的 **stacking context**，当满足以下任一条件时：

| 条件                                                               | 示例                              |
| ------------------------------------------------------------------ | --------------------------------- |
| `position` 为 `absolute` 或 `relative`，且 `z-index` 值不为 `auto` | `position: relative; z-index: 1;` |
| `position` 为 `fixed` 或 `sticky`                                  | `position: fixed;`                |
| `opacity < 1`                                                      | `opacity: 0.99;`                  |
| `transform` 不为 `none`                                            | `transform: translateZ(0);`       |
| `filter` 不为 `none`                                               | `filter: blur(0);`                |
| `will-change: transform`                                           | 提示 GPU 合成层                   |
| `isolation: isolate`                                               | 强制创建新的层叠上下文            |
| `mix-blend-mode` 不为 `normal`                                     | 触发复合层                        |

它是浏览器绘制的分层模型的一部分，决定元素在 **Z 轴上的绘制顺序**。

**Stacking Context 的特性：**

1. 各上下文之间相互独立；
2. 内部元素的 z-index 仅在其所属上下文中比较；
3. 子元素不会“穿透”父上下文到外层；
4. 控制元素的合成层（有时涉及 GPU）。

**常见应用场景：**

- 控制层级（z-index 生效的前提）
- 修复 stacking 顺序问题（如模态遮罩被盖住）
- 触发 GPU 加速（`transform: translateZ(0)`）

## BFC与层叠上下文同时出现

有些属性会**同时创建**两者：

| 属性                       | 触发层叠上下文 | 触发BFC |
| -------------------------- | -------------- | ------- |
| `position: absolute/fixed` | ✅             | ✅      |
| `transform`                | ✅             | ❌      |
| `overflow: hidden`         | ❌             | ✅      |
| `display: flex`            | ❌             | ✅      |
| `opacity < 1`              | ✅             | ❌      |
| `contain: layout`          | ❌             | ✅      |
| `isolation: isolate`       | ✅             | ❌      |

例如：

```css
.box {
  position: absolute;
  z-index: 10;
  overflow: hidden;
}
```

这段代码会同时：

- 创建一个新的 **层叠上下文**（因为 position + z-index）
- 创建一个新的 **BFC**（因为 position: absolute）
