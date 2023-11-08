# 新的slot语法

## 概要

为作用域插槽引入新的语法：

- 用新的指令`v-slot`统一`slot`和`slot-scope`
- `v-slot`的简写可以统一作用域插槽和普通插槽的写法

## 基本示例

使用v-slot声明传递给`<foo>`作用域插槽的props

```html
<!-- 默认插槽 -->
<foo v-slot="{ msg }">
    {{msg}}
</foo>

<!-- 具名插槽 -->
<foo>
    <template v-slot:one="{ msg }">
        {{msg}}
    </template>
</foo>
```

## 动机

当我们第一次引入作用域插槽时，它很冗长，因为需要始终使用`<template slot-scope>`这种格式

```html

<foo>
    <template slot-scope="{ msg }">
        <div>{{ msg }}</div>
    </template>
</foo>
```

为了不让它太冗余，在2.5版本引入了`slot-scope`直接放置在html元素上

```html

<foo>
    <div slot-scope="{ msg }">
        {{ msg }}
    </div>
</foo>
```

这也就意味着将slot-scope放置在组件上可以正常使用

```html

<foo>
    <bar slot-scope="{ msg }">
        {{ msg }}
    </bar>
</foo>
```

然而上述这样使用会导致一个问题：`slot-scope`
放置的位置并不能清楚的反映出变量是哪个组件提供的。这里slot-scope被放置在bar组件上，但是`msg`变量其实是由foo组件的默认插槽提供的

而且在嵌套组件中会变的更加糟糕：

```html

<foo>
    <bar slot-scope="foo">
        <baz slot-scope="bar">
            <div slot-scope="baz">
                {{ foo }} {{ bar }} {{ baz }}
            </div>
        </baz>
    </bar>
</foo>
```

并不能立刻判断出是哪个组件提供了哪些变量。

有人建议应该允许`slot-scope`被放置在组件自身上来表示它默认插槽的作用域：

```html

<foo slot-scope="foo">
    {{ foo }}
</foo>
```

不幸的是，当组件被当作嵌套组件使用时，仍会产生歧义

```html

<parent>
    <foo slot-scope="foo"> <!-- 是由parent组件提供还是foo组件？ -->
        {{ foo }}
    </foo>
</parent>
```

这也是我认为在没有`template`的情况允许使用`slot-scope`是错误的。

### 为什么要使用一个新的指令替代`slot-scope`？

如果能回到过去，我可能会更改`slot-scope`的语义，但是不建议在现有`slot-scope`上更改：

1. 这将是一个重大的变化，这意味着我们将无法在2.x 中发布它

2. 即使在3.x
   中改变它，那么改变现有语法的语义也会对未来的学习者造成困惑，因为google搜索内容并非都是最新的。因此，我们需要引入一些新的东西来区别`slot-scope`

3. 在3.x 中，我们计划统一插槽类型，不再区分作用域插槽和非作用域插槽。slot可能不再接受props。有了这种概念上的统一，区分`slot`
   和`slot-scope`两种属性就变得没有必要了，如果能将语法也统一在一个结构下就更好了。

## 详细设计

介绍一个新指令：v-slot

- 它可以在插槽容器`<template>`上使用，来表示传递给组件的插槽，其中插槽名称可以通过**自定义参数**传递：

```html

<foo>
    <template v-slot:header>
        <div class="header"></div>
    </template>

    <template v-slot:body>
        <div class="body"></div>
    </template>

    <template v-slot:footer>
        <div class="footer"></div>
    </template>
</foo>
```

如果是接受props的作用域插槽，则可以使用指令的属性值声明接受的props，传递给`v-slot`的属性值与slot-scope中变量值工作方式相同，因此支持ES6解构：

```html

<foo>
    <template v-slot:header="{ msg }">
        <div class="header">
            Message from header slot: {{ msg }}
        </div>
    </template>
</foo>
```

- `v-slot`可以直接在组件上使用，不需要任何参数，来表示组件的默认插槽是作用域插槽，并且传递给默认插槽的props应该是作为其属性值中声明的变量使用：

```html

<foo v-slot="{ msg }">
    {{ msg }}
</foo>
```

## 比较：新语法与旧语法

让我们来回顾下这个提案是否可以实现我们的目标：

- 为作用域插槽（单个默认插槽）的最常见用法提供了简洁的语法：

```html

<foo v-slot="{ msg }">{{ msg }}</foo>
```

- 传递给slot的作用域变量与组件之间的关系更加清晰：

让我们再看一下使用当前语法的（`slot-scope`）的深层嵌套用例 - 注意`<foo>`提供的作用域变量是如何声明在`<bar>`上的，`<bar>`
提供的作用域变量是如何声明在`<baz>`上的...

```html

<foo>
    <bar slot-scope="foo">
        <baz slot-scope="bar">
            <div slot-scope="baz">
                {{ foo }} {{ bar }} {{ baz }}
            </div>
        </baz>
    </bar>
</foo>
```

这是使用新语法情况下的等价用例：

```html

<foo v-slot="foo">
    <bar v-slot="bar">
        <baz v-slot="baz">
            {{ foo }} {{ bar }} {{ baz }}
        </baz>
    </bar>
</foo>
```

注意：组件提供的作用域变量仍然声明在它自身上。新语法清楚的表示了是哪个组件提供了作用域变量。

## 更多的用例比较

### 带有文本的默认插槽

```html
<!-- old -->
<foo>
    <template slot-scope="{ msg }">
        {{ msg }}
    </template>
</foo>

<!-- new -->
<foo v-slot="{ msg }">
    {{ msg }}
</foo>
```

### 带有html元素的默认插槽

```html
<!-- old -->
<foo>
    <div slot-scope="{ msg }">
        {{ msg }}
    </div>
</foo>

<!-- new -->
<foo v-slot="{ msg }">
    <div>
        {{ msg }}
    </div>
</foo>
```

### 内嵌的默认插槽

```html
<!-- old -->
<foo>
    <bar slot-scope="foo">
        <baz slot-scope="bar">
            <template slot-scope="baz">
                {{ foo }} {{ bar }} {{ baz }}
            </template>
        </baz>
    </bar>
</foo>

<!-- new -->
<foo v-slot="foo">
    <bar v-slot="bar">
        <baz v-slot="baz">
            {{ foo }} {{ bar }} {{ baz }}
        </baz>
    </bar>
</foo>
```

### 具名插槽

```html
<!-- old -->
<foo>
    <template slot="one" slot-scope="{ msg }">
        text slot: {{ msg }}
    </template>

    <div slot="two" slot-scope="{ msg }">
        element slot: {{ msg }}
    </div>
</foo>

<!-- new -->
<foo>
    <template v-slot:one="{ msg }">
        text slot: {{ msg }}
    </template>

    <template v-slot:two="{ msg }">
        <div>
            element slot: {{ msg }}
        </div>
    </template>
</foo>
```

### 内嵌的、具名插槽和默认插槽混合使用

```html
<!-- old -->
<foo>
    <bar slot="one" slot-scope="one">
        <div slot-scope="bar">
            {{ one }} {{ bar }}
        </div>
    </bar>

    <bar slot="two" slot-scope="two">
        <div slot-scope="bar">
            {{ two }} {{ bar }}
        </div>
    </bar>
</foo>

<!-- new -->
<foo>
    <template v-slot:one="one">
        <bar v-slot="bar">
            <div>{{ one }} {{ bar }}</div>
        </bar>
    </template>

    <template v-slot:two="two">
        <bar v-slot="bar">
            <div>{{ two }} {{ bar }}</div>
        </bar>
    </template>
</foo>
```

## 缺点

- 引入新语法会造成当前生态中与之相关的学习材料过时，新用户在阅读了现存的教程之后，发现新语法时会感到困惑。
    - 我们需要良好的文档更新帮助解决这个问题

- 默认作用域插槽`v-slot="{msg}"`并没有准确的表达`msg`是从哪里而来的

## 采取的策略

这个改变完全是向后兼容的，因此我们可以在一个小版本中发布它（计划在2.6版本）

`slot-scope`将会变成软废弃的（soft-deprecated）：将会在文档中标记为废除，并且鼓励用户使用或者转换为新语法，但是我们不会bug
you，因为对于每个人来说，迁移到最新版本并不是最高优先级。

我们计划在3.0版本最终移除`slot-scope`
，并且只支持新语法。为了更平滑的迁移到的3.0版本，我们将会在下个2.x版本中当用户使用`slot-scope`时抛出废弃信息。

由于这是一个定义明确的语法更改，我们可能会提供一个迁移工具，可以自动的将您的template转换为新语法
