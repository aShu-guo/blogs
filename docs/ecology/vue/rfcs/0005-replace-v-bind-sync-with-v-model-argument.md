# 用v-model参数替换v-bind sync修饰符

## 概要

移除`v-bind`的`sync`修饰符，并用`v-model`替换

## 基本示例

而不是：

```vue

<MyComponent v-bind:title.sync="title"/>
```

应该是：

```vue

<MyComponent v-model:title="title"/>
```

## 动机

`v-bind.sync`在Vue2中造成了相当多的困惑，因为用户希望像`v-bind`那样使用它：

将`v-bind.sync`视为具有额外行为的普通绑定是错误的，因为这与双向绑定有本质上的不同。`.sync`
修饰符的工作原理像v-model，它是Vue中另外一个支持双向绑定的语法糖。`sync`与`v-model`主要的不同是前者支持双向绑定多个变量。

这不仅让我思考：既然告诉用户不要像`v-bind`那样思考`v-bind.sync`，又告诉用户它的原理像`v-model`
，那么为什么不使它成为`v-model`的一部分呢？

## 详细设计

注意：虽然这不是提案的异步，但是`v-model`的实现细节可能会在Vue3中改变，使透明包裹组件更容易实现。当你看到`modelValue`
属性和`update:modelValue`事件时，应该意识到这是支持表单元素上特殊行为的占位符。这并不在该RFC中。

### 在一个元素上

```vue
<input v-model="xxx">

<!-- 是下面的简写 -->

<input
    :model-value="xxx"
    @update:model-value="newValue => { xxx = newValue }"
>
```

```vue
<input v-model:aaa="xxx">
```

需要注意的是在当前版本使用`v-bind:aaa.sync="xxx"`并不会抛出一个编译时异常。

### 在一个组件上

```vue

<MyComponent v-model="xxx"/>

<!-- 是下面的简写 -->

<MyComponent
    :model-value="xxx"
    @update:model-value="newValue => { xxx = newValue }"
/>
```

```vue

<MyComponent v-model:aaa="xxx"/>

<!-- 是下面的简写 -->

<MyComponent
    :aaa="xxx"
    @update:aaa="newValue => { xxx = newValue }"
/>
```

### 复制`v-bind.sync="xxx"`传递对象的行为

其他两个带参数的指令是`v-bind`和`v-on`，它们都支持传递对象给无参数版本，但是`v-model`
的无参数版本已经作为`v-model:model-value="xxx"`的简写。我认为有以下几种方案：

1. 改变`v-model="xxx"`的行为（不再作为简写），强制要求用户通过`v-model:model-value="xxx"`
   支持旧的行为。这可以与`v-bind`和`v-on`的行为保持一致，但是也会造成另外一个重大改变，而且也会使经常使用的场景变得冗余和复杂。
2. 为`v-model`新增一个修饰符（例如：`.spread`）。这是影响较小的变更，但是与另外两个指令的无参数版本传递对象的行为不一致，会隐式的造成困惑并且提高框架的复杂度。
3. 监听传入的值，如果是对象则改变对应的行为。这也是影响较小的变更，但是可以与另外两个指令的行为保持一致，因为与`v-bind="{ ...xxx }"`具有相同的效果。
4. 简化并且不允许传递对象到`v-model`。这可以避免上面提议中的问题，但是缺点是让一些用户更难迁移到Vue3（尽管可能是很小的一部分）。从`v-bind.sync`
   中受益的Templates或者JSX变得编写和维护起来更加乏味（使用 createElement/h 强制重构渲染函数）。

并没有一个最好的观点，但是我更支持观点2，我也很想听听可能错过的其他解决方案。

## 缺点

除了重大变更造成的不可避免的痛苦外，我认为这个语法造成痛苦相对较小 - 部分原因是`.sync`并没有被广泛使用，也正因如此迁移起来相对容易。

## 采取的策略

作为一个重大变更，这只能在Vue3发布。然而，我认为我们可以做一些事件来使迁移更加容易：

- 当检测到v-bind上的`.sync`修饰符时抛出一个警告，链接到迁移指南。
- 使用一个新的迁移助手，我们应该尽可能的检测并且自动覆盖100%的`v-bind.sync`使用场景。

这些结合起来，学习以及迁移涉及到`.sync`的大型代码库应该只会花费几分钟。


