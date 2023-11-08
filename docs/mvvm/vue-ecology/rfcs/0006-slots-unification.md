# 统一slot

## 概要

统一普通slot以及作用域slot，在Vue3中都作为slot存在。

## 动机

- 存在普通插槽和作用域插槽两种形式的原因是：作用域插槽是后来新增的，并且在Vue2.x中是不同的实现方式。但是，在技术上是没必要区分的。统一这两种形式可以简化slot相关的概念。
- 使用render函数构建的组件库作者不再需要同时处理`$slots`和`$slotScoped`。
- 将所有slot编译成函数对于大型组件树来说是可以提高性能的。

引用2.6版本的公告：
> 普通插槽会在父组件的渲染生命周期中渲染。当slot中的依赖发生改变时，父组件和子组件都会重新渲染。
> 从另一方面来说，作用域插槽会被编译进函数中并且在子组件的渲染生命周期中渲染。这意味着，
> 作用域插槽中的数据依赖都是由子组件收集，可以更加精准的更新。在2.6中，我们引入了一种优化方式：进一步确保父组件中的依赖发生改变时只影响他自己，如果子组件作为作用域插槽使用，那么则不会触发重新渲染。

## 详细设计

设计两个部分：

- 语法统一（在2.6中作为`v-slot`发布）
- 实现上统一：编译slot成函数。
    - `this.$slots`将slot作为函数暴露出去；
    - 移除`this.$scopedSlots`
    - 在2.x中，所有使用`v-slot`指令的slot在内部都会编译成函数。`this.$scopedSlots`也会代理到普通slot上并且将插槽作为函数暴露出。

## 在render函数中使用

现存render函数的使用方式都会得到支持。当传递子节点到父组件时，VNodes和函数都会支持的。

```js
h(Comp, [
    h('div', this.msg)
])

// 等价于:
h(Comp, () => [
    h('div', this.msg)
])
```

在`Comp`内部，这两种用例中`this.$slots.default`都是函数类型，并且返回相同的VNodes。但是，第二种用例的性能更好，因为this.msg只会注册到在子组件的依赖中。

具名插槽的使用方式发生了改变--不再需要特别指定`slot`属性在节点上，只需要作为第3个参数传递即可

```js
// 2.x
h(Comp, [
    h('div', {slot: 'foo'}, this.foo),
    h('div', {slot: 'bar'}, this.bar)
])

// 3.0
// Note the `null` is required to avoid the slots object being mistaken
// for props.
h(Comp, null, {
    foo: () => h('div', this.foo),
    bar: () => h('div', this.bar)
})
```

### 进一步的优化

需要注意的是当父组件更新时，`Comp`经常被迫更新。对于render函数，因为没有编译步骤，Vue并没有足够的信息判断`slots`是否已经更改。

编译template时，可以通过检查`v-slot`后编译为函数，但是在render函数中并不能自动的判断出。我们也可以在 JSX babel
插件中执行类似的优化。但是对于直接写render函数的用户来说，他们需要在性能敏感的用例中手动优化。

标注slot在父组件更新时，不会触发子组件更新：

```js
h(Comp, null, {
    $stable: true,
    foo: () => h('div', this.foo),
    bar: () => h('div', this.bar)
})
```

## 采取的策略

这个变更中重要的部分已经在2.6版本中发布。遗留下来没做的事情是将`this.$scopedSlots`
从API中移除。在实践上，2.6中的`this.$scopedSlots`工作原理类似3.0中的`this.$slots`，因此迁移可以分为两部：

1. 在2.x代码库中使用`this.$scopedSlots`
2. 在3.x版本中使用`this.$slots`全局替换`this.$scopedSlots`
