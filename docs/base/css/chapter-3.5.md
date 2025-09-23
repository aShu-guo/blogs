# font-family属性和@font-face规则新特性

字体族表示一个系列字体。字体族又分为`普通字体族`和`通用字体族`，例如Arial就是普通字体族。

```text
font-family =
  [ <family-name> | <generic-family> ]#
```

`<family-name>` 和 `<generic-family>`只能同时出现1个，并且可以出现多次，以逗号分隔

## 通用字体族

1. 传统的通用字体族包含以下内容：

- serif：衬线字体，开始和结束有装饰

<div class="font-serif">hello world 你好</div>

- sans-serif：无衬线字体

<div class="font-sans">hello world 你好</div>

- monospace：等宽字体，即所有字的宽度都是相等的

<div class="font-mono">hello world 你好</div>

- cursive：手写字体，中文中的楷体（font-family: Kaiti） 就属于手写字体。

<div style="font-family: cursive">hello world 你好</div>

- fantasy：奇幻字体，主要用来装饰和表现效果，字形和原本字符可以没有关系。

<div style="font-family: fantasy">hello world 你好</div>

2. 全新的通用字体族：

- system-ui：系统UI字体，很好地解决了使用系统字体的需求
- emoji：适用于emoji字符的字体家族。
- math：适用于数学表达式的字体家族。
- fangsong：中文字体中的仿宋字体家族。

### system-ui

:::info

指定具体的字体存在以下不足：

1. 字体可能会相互冲突

用户下载了自定义的字体，但是屏幕分辨率无法完美支持，导致展示效果差

2. 系统升级后可能有了更适合网页的字体

指定了具体字体，无法根据系统自动升级到更合适的字体

如何在保持用户界面效果一致和更合适之间抉择

:::

### emoji

用于展示emoji，系统已经内置了，但是也要显示指定

1. 一个无衬线字体CSS最佳实践代码

```css
@font-face {
  font-family: Emoji;
  src:
    local('Apple Color Emoji'), local('Segoe UI Emoji'),
    local('Segoe UI Symbol'), local('Noto Color Emoji');
  unicode-range: U+1F000-1F644, U+203C-3299;
}

body {
  font-family:
    system-ui,
    -apple-system,
    Segoe UI,
    Roboto,
    Emoji,
    Helvetica,
    Arial,
    sans-serif;
}
```

2. 衬线字体

```css
.font-serif {
  font-family: Georgia, Cambria, 'Times New Roman', Times, serif;
}
```

3. 等宽字体

```css
.font-mono {
  font-family:
    Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace;
}
```

### math通用字体族

用于展示数学公式

### fangsong通用字体族

这个字体族来自中文字体“仿宋”，仿宋是介于宋体（衬线字体）和楷体（手写字体）之间的一种字体。

## local()函数与系统字体的调用

1. 简化字体族的调用。例如不同系统上的等宽字体的名称是不同的，因此需要写多个字体族以兼容。但是通过`local()`可以简化调用

```css
@font-face {
  font-family: Mono;
  /* 单个单词可以不用加引号 */
  src:
    local('Menlo'), local('Monaco'), local('Consolas'),
    local('Liberation Mono'), local('Courier New'), local('monospace');
}

.code {
  font-family: Mono;
}
```

2. 在自定义字体场景下提高性能

在多个平台上保持字体一致的场景下，首先加载本地字体，当本地不存在该字体时，则加载.woff2文件

```css
@font-face {
  font-family: Roboto;
  font-style: normal;
  font-weight: 400;
  src:
    local('Roboto'),
    local('Roboto-Regular'),
    url(./Roboto.woff2) format('woff2');
}
```

## unicode-range

限制字体作用范围

```css
@font-face {
  font-family: Emoji;
  src:
    local('Apple Color Emoji'), local('Segoe UI Emoji'),
    local('Segoe UI Symbol'), local('Noto Color Emoji');
  unicode-range: U+1F000-1F644, U+203C-3299;
}
```

## woff与woff2字体

woff2字体与woff在大小上会缩小30%-50%

## font-display属性与自定义字体的加载渲染

浏览器在加载一个指定字体的文本时，首先将字体隐藏，后在字体加载完毕后再展示字体；如果加载时间超过3s，则加载失败用备用字体替代

```css
@font-face {
  font-family: MyFont;
  src: url(myfont.woff2) format('woff2');
}

body {
  font-family: MyFont;
}
```

font-display属性可以控制`字体加载和文本渲染之间的时间线关系`，来解决上述问题。

### 字体显示时间轴

- 字体阻塞周期
  - 字体未加载：任何试图使用它的元素都必须渲染`不可见的后备字体`
  - 字体加载：正常使用

- 字体交换周期
  - 字体未加载：任何尝试使用它的元素都必须呈现后备字体
  - 字体加载：正常使用

- 字体失败周期
  - 字体未加载：回退正常字体

:::info

总结一下：

1. 如果你的自定义字体是用于字体呈现，就使用optional，否则使用默认值。
2. 至于swap和fallback，如果对你而言自定义字体的效果很重要，同时你能忍受页面字体突然变化的问题，就可以使用下面的设置

```css
@font-face {
  font-family: MyFont;
  src: url(myfont.woff2) format('woff2');
  font-display: swap;
}
body {
  font-family: MyFont;
}
```

:::
