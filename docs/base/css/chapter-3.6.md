# 字符单元的中断与换行

介绍跟字符单元有关的CSS属性，它们决定了文本如何被`分割`、`换行`、`裁剪`、`对齐`、`计数`。这些属性大多涉及 排版、换行、间距，

默认规则：

- Space普通空格、Enter（回车）空格和Tab（制表符）空格这3种空格`无论怎样组合都会合并为单个普通空格`。
- 文字可以在CJK文本、普通空格和短横线连字符处换行，`连续英文单词`和`数字`不换行。

<div class="w-full bg-#3c3c3c">
这是一个tab：    。这是2个空格： 。这是一个回车：

</div>

:::info

1. 换行分为2种：

- 自动换行：文本长度超过容器宽度时，会触发自动换行
- 手动换行：换行符 或者 `<br>`

:::

## 与**空白/换行规则**相关

决定如何处理`空格space`、`回车enter`、`制表符tab`

### white-space

控制`空白符`、`换行符`的处理方式（是否合并、是否保留、是否允许换行）。

```text
white-space =
  normal        |
  pre           |
  nowrap        |
  pre-wrap      |
  break-spaces  |
  pre-line
```

- normal：`合并`连续空白符，换行符，自动换行

<pre>
<div class="w-full bg-#3c3c3c whitespace-normal">
这是2个tab：            。这是2个空格：  。这是2个回车：


全诗共六节，每节的前三句相同，辗转反复，余音袅袅。熟悉徐志摩家庭悲剧的人，或许可以从中捕捉到一些关于这段罗曼史的影子。但它始终也是模糊的<u>（这里有个br）</u><br>，被一股不知道往哪个方向吹的劲风冲淡了，

以至于欣赏者也同吟唱者一样，最终被这一股强大的旋律感染得醺醺然，陶陶然了。

</div>
</pre>

- nowrap：`合并`连续空白符，换行符，但阻止自动换行

<pre>
<div class="w-full bg-#3c3c3c whitespace-nowrap">
这是2个tab：            。这是2个空格：  。这是2个回车：


全诗共六节，每节的前三句相同，辗转反复，余音袅袅。熟悉徐志摩家庭悲剧的人，或许可以从中捕捉到一些关于这段罗曼史的影子。但它始终也是模糊的<u>
（这里有个br）</u><br>，被一股不知道往哪个方向吹的劲风冲淡了，

以至于欣赏者也同吟唱者一样，最终被这一股强大的旋律感染得醺醺然，陶陶然了。

</div>
</pre>

- pre：`保留`连续空白符，换行符，仅在遇到`<br>`、`换行符`元素后换行

<pre>
<div class="w-full bg-#3c3c3c whitespace-pre">
这是2个tab：            。这是2个空格：  。这是2个回车：


全诗共六节，每节的前三句相同，辗转反复，余音袅袅。熟悉徐志摩家庭悲剧的人，或许可以从中捕捉到一些关于这段罗曼史的影子。但它始终也是模糊的<u>
（这里有个br）</u><br>，被一股不知道往哪个方向吹的劲风冲淡了，

以至于欣赏者也同吟唱者一样，最终被这一股强大的旋律感染得醺醺然，陶陶然了。

</div>
</pre>

- pre-wrap：`保留`连续空白符，换行符，在遇到`<br>`、`换行符`元素后或超出盒子换行

<pre>
<div class="w-full bg-#3c3c3c whitespace-pre-wrap">
这是2个tab：            。这是2个空格：  。这是2个回车：


全诗共六节，每节的前三句相同，辗转反复，余音袅袅。熟悉徐志摩家庭悲剧的人，或许可以从中捕捉到一些关于这段罗曼史的影子。但它始终也是模糊的<u>
（这里有个br）</u><br>，被一股不知道往哪个方向吹的劲风冲淡了，

以至于欣赏者也同吟唱者一样，最终被这一股强大的旋律感染得醺醺然，陶陶然了。

</div>
</pre>

- pre-line：`合并`连续空白符，`保留`连续换行符，在遇到`<br>`、`换行符`元素后或超出盒子换行

<pre>
<div class="w-full bg-#3c3c3c whitespace-pre-line">
这是2个tab：            。这是2个空格：  。这是2个回车：


全诗共六节，每节的前三句相同，辗转反复，余音袅袅。熟悉徐志摩家庭悲剧的人，或许可以从中捕捉到一些关于这段罗曼史的影子。但它始终也是模糊的<u>
（这里有个br）</u><br>，被一股不知道往哪个方向吹的劲风冲淡了，

以至于欣赏者也同吟唱者一样，最终被这一股强大的旋律感染得醺醺然，陶陶然了。

</div>
</pre>

### overflow-wrap

别名 `word-wrap`

控制长单词是否允许被强制断开。

- 值：`normal`、`break-word`、`anywhere`。

- **`word-break`**
  控制在单词/字符边界的断行规则。
  - 值：`normal`、`break-all`（允许在任意字符间断开）、`keep-all`（禁止 CJK 内断行）。

- **`line-break`**
  针对 CJK 文本的换行优化。
  - 值：`auto`、`loose`、`normal`、`strict`。

- **`hyphens`**
  控制单词是否允许自动加连字符断行（西文场景常见）。
  - 值：`none`、`manual`、`auto`。

---

## 与**字符宽度/单元**相关

- **`letter-spacing`**
  控制字符间距（包括 CJK）。
- **`word-spacing`**
  控制单词/空格间距。
- **`text-indent`**
  首行缩进，可基于字符宽度设置（如 `2em` → 两个汉字宽度）。
- **`tab-size`**
  定义制表符（`\t`）显示的宽度（以空格个数计）。
- **`ch` 单位**（CSS 长度单位，不是属性）
  `1ch` 通常等于数字 `0` 的字形宽度，常用于基于字符数的布局（如输入框宽度）。

---

## 与**文本渲染/组合**相关

- **`text-transform`**
  控制字符大小写（uppercase/lowercase/capitalize）。
- **`text-combine-upright`**（竖排专用）
  把多个字符（如“2025”）合并在竖排中占一个文字宽度。
- **`text-orientation`**
  控制竖排文本中字符的方向（直立 vs 旋转）。
- **`text-rendering`**（非标准，SVG/浏览器支持）
  提示引擎在字符渲染时的优化方向。

---

## 与**Unicode/字符边界**相关

- **`unicode-bidi` + `direction`**
  控制双向文字（LTR/RTL 混排）的渲染方式。
- **`unicode-range`**（用于 `@font-face`）
  定义字体应用到哪些 Unicode 字符区间。
- **`line-clamp`（非标准，通常结合 `display: -webkit-box`）**
  按行数裁剪文本，和字符边界相关。

---

## 辅助属性（与字符显示强相关）

- **`text-overflow`**
  当文本溢出时显示省略号 `…` 或自定义标记。
- **`writing-mode`**
  定义文字排版方向（横排、竖排），影响字符排列方式。

---

✅ 小结：
和**字符单元**强相关的核心属性有：

- **空白/换行类**：`white-space`、`overflow-wrap`、`word-break`、`line-break`、`hyphens`
- **间距/缩进类**：`letter-spacing`、`word-spacing`、`text-indent`、`tab-size`、`ch` 单位
- **排版/组合类**：`text-transform`、`text-combine-upright`、`text-orientation`
- **Unicode/双向文字类**：`unicode-bidi`、`direction`、`unicode-range`
