# 自定义指令的api变更

## 概要

- 重新设计自定义指令以便更好的与组件生命周期保持一致。
- 在组件上使用自定义指令应遵循在[属性透传行为](https://github.com/vuejs/rfcs/pull/26)
  讨论中的规则。子组件可以通过`v-bind="$attrs"`控制它的行为。

## 基础用例

### 之前

```js
const MyDirective = {
    bind(el, binding, vnode, prevVnode) {
    },
    inserted() {
    },
    update() {
    },
    componentUpdated() {
    },
    unbind() {
    }
}
```

### 之后

```js
const MyDirective = {
    beforeMount(el, binding, vnode, prevVnode) {
    },
    mounted() {
    },
    beforeUpdate() {
    },
    updated() {
    },
    beforeUnmount() {
    }, // new
    unmounted() {
    }
}
```

## 动机

使自定义指令hook的名字与组件声明周期保持一致。

## 详细设计

### Hook重命名

经过多次调整，现存的hook将会被重命名以更好的与组件声明周期相映射。传递给hook的参数保持不变。

- **新的**`created` hook（在props未应用在DOM节点上调用）
- `bind`变更为`beforeMount`（在props应用在DOM节点上后调用）
- `inserted`变更为`mounted`（在子节点插入到DOM节点上后，并且DOM节点自身已经插入到父元素上时调用）
- **新的**`beforeUpdate` hook（在元素自身更新之前调用）
- 移除`update`，使用`updated`替代
- `componentUpdated`变更为`updated`（在元素自身和它的子节点更新后调用）
- **新的**`beforeUnmounted` hook
- `unbind`变更为`unmounted`

### 在组件上使用

在3.0中，随着代码片段的支持，组件可以潜在的拥有多个根节点。当在多根节点的组件上使用自定义指令时会造成一个问题。

为了解释在3.0版本自定义指令在组件上如何工作的细节，我们需要首先理解自定义指令在3.0中如何编译。例如一个这样的指令：

```vue

<div v-foo="bar"></div>

```

将会大概编译为：

```js
const vFoo = resolveDirective('foo')

return withDirectives(h('div'), [
    [vFoo, bar]
])
```

这里的`vFoo`将会是用户写的指令对象，它包含像`mounted`和`updated`那样的hook。

`widthDirectives`
返回一个包裹用户hook和作为vnode生命周期注入的hook的VNode的拷贝（参考[render函数API变更](./0008-render-function-api-change.md)
的RFC获取更多细节）。

```js
{
    onVnodeMounted(vnode)
    {
        // call vFoo.mounted(...)
    }
}
```

结果，自定义指令将会全部包含并作为VNode数据的一部分。当在组件上使用自定义指令时，这些`onVnodeXXX`
hook将会作为额外的props传递给这个组件，并且体现在`this.$attrs`上。

这也意味着可以在模版中像这样直接hook到元素的生命周期，当自定义指令过于复杂时，这会很方便：

```vue

<div @vnodeMounted="myHook"/>

```

这和RFC#26中讨论的关于属性透传的行为保持一致。因此，组件上自定义指令的规则将会和其他额外属性一致：完全由子组件决定在何处以及如何使用它。当子组件在内部元素上使用`v-bind="$attrs"`
时，这也会应用所有自定义指令到它上面。

## 缺点

N/A

## 可选的方案

N/A

## 采取的策略

- 重命名应该很容易在兼容构建中得到支持
- 模板代码也应该更直观
- 对于在组件上使用的自定义指令，在[属性透传行为](https://github.com/vuejs/rfcs/pull/26)中讨论的在未使用的$attrs上的警告信息也应该适用。

## 未解决的问题

N/A
