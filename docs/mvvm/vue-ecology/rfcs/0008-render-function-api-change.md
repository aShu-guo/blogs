# 变更render函数的API

## 概要

- `h`现在是通过全局导出，而不再以参数的形式存在。
- 变更render函数中的参数，并且在有状态组件以及函数式组件中保持一致。
- VNodes的props结构扁平化。

## 基础用例

```js
// 全局导出 `h`
import {h} from 'vue'

export default {
    render() {
        return h(
            'div',
            // 扁平化
            {
                id: 'app',
                onClick() {
                    console.log('hello')
                }
            },
            [
                h('span', 'child')
            ]
        )
    }
}
```

## 动机

在2.x，VNodes是指定上下文的 - 意味着创建的每个VNodes都会与创建它的组件实例绑定（"上下文"
）。这样做是因为我们需要支持以下用例（`createElement`被简写为了`h`）:

```js
// 基于字符串寻找组件
h('some-component')

h('div', {
    directives: [
        {
            name: 'foo', // 基于字符串寻找指令
            // ...
        }
    ]
})
```

为了寻找本地或者全局注册的组件或者指令，我们需要知道拥有这个VNode的组件实例。这也是2.x将`h`
作为参数传递的原因，被传递到render函数中的参数`h`是预先绑定到组件实例上的柯里化版本（就像`this.$createElement`一样）。

但是这造成了诸多不变，例如：当拆分render函数的逻辑到多个函数中时，需要将`h`也传递过去：

```js
function renderSomething(h) {
    return h('div')
}

export default {
    render(h) {
        return renderSomething(h)
    }
}
```

当使用JSX时，这会变得很臃肿，因为h被隐式的使用而且并不会出现在用户侧的代码中。我们的JSX插件必须自动注入h来缓解这种情况，但是逻辑是复杂的而且脆弱。

在3.0中我们发现了一种可以使VNode上下文无关的方法。将可以使用全局导出的h函数在任意地方创建VNode，因此在需要使用的文件仅需要导入一次。

---

另一个与2.x渲染函数API相关的问题是内置的VNode数据结构：

```js
h('div', {
    class: ['foo', 'bar'],
    style: {}
    attrs: {id: 'foo'},
    domProps: {innerHTML: ''},
    on: {click: foo}
})
```

这个结构继承自[Snabbdom](https://github.com/snabbdom/snabbdom/blob/master/README-zh_CN.md)
，Vue2.x中的虚拟DOM实现原理是便是基于此。这样设计的原因是模块化复杂的diff逻辑：一个单独的模块（例如`class`模块）处理`class`
属性。处理每个绑定的逻辑也更加明确。

但是，随着时间的推移，我们主要到相对于扁平化的结构，目前内置的结构存在很多问题：

- 需要写很多冗余的代码
- `class`和`style`在特殊用例中与预期有点不一致
- 更多的内存占用（存储更多的对象）
- diff更慢（每个内置的对象都需要迭代循环）
- 对于拷贝、合并、传递更复杂而且花销更大
- 使用JSX时，需要需要特殊的规则和隐式转换

在3.0中，我们决定通过扁平化的VNode数据结构来解决这些问题。

## 详细设计

### 全局导出`h`函数

`h`已经被全局导出：

```js
import {h} from 'vue'

export default {
    render() {
        return h('div')
    }
}
```

### 改变render函数的入参

不再使用`h`
作为参数，意味着render函数不再需要接收任何参数。实际上，在3.0中，render函数经常作为整合template编译出多个render产物来使用。在用户侧，建议在`setup()`
函数中返回出render。

```js
import {h, reactive} from 'vue'

export default {
    setup(props, {slots, attrs, emit}) {
        const state = reactive({
            count: 0
        })

        function increment() {
            state.count++
        }

        // return the render function
        return () => {
            return h('div', {
                onClick: increment
            }, state.count)
        }
    }
}
```

从`setup()`中返回的render函数自然的与响应式状态以及在当前作用域中声明的函数联系在一起，因此传递给setup的参数：

- `props`和`attrs`需要与`this.$props`和`this.$attrs`保持一致。
- `slots`需要与`this.$slots`保持一致。
- `emit`需要与`this.$emit`保持一致。

这里的`props`、`slots`、`attrs`都是通过代理的，因此当它们在render函数中使用时会指向最新的值。

更多的`setup()`原理，见[组合式API RFC](https://vuejs.org/guide/extras/composition-api-faq.html)

### 改变函数式组件参数

需要注意的是，函数式组件的render函数也应该有相同的入参，这将会在有状态组件以及函数式组件中保持一致：

```js
const FunctionalComp = (props, {slots, attrs, emit}) => {
    // ...
}
```

新的参数列表需要完全具备可替换当前函数式组件参数的能力：

- `props`和`slots`值与旧语法保持一；
- `data`和`children`不再是必须的（使用props和slot即可）；
- `listeners`将会被包含在`attrs`中；
- `injections`将会被新API`inject`替换（组合式API的一部分）：

```js
import {inject} from 'vue'
import {themeSymbol} from './ThemeProvider'

const FunctionalComp = props => {
    const theme = inject(themeSymbol)
    return h('div', `Using theme ${theme}`)
}
```

- 将会移除`parent`的访问权限。这是一些内部用例的逃生舱 - 在用户侧，props和injections应该是首选。

### 扁平化的VNode props格式

```js
// before
const props = {
    class: ['foo', 'bar'],
    style: {color: 'red'},
    attrs: {id: 'foo'},
    domProps: {innerHTML: ''},
    on: {click: foo},
    key: 'foo'
}

// after
const props = {
    class: ['foo', 'bar'],
    style: {color: 'red'},
    id: 'foo',
    innerHTML: '',
    onClick: foo,
    key: 'foo'
}
```

在扁平结构中，VNode将使用以下规则处理props：

- `key`和`ref`被保留
- `class`和`style`的API与2.x保持一致
- 以`on`开头的props会被当作`v-on`绑定处理，`on`之后的所有字符串都会被转换为小写的事件名来处理。
- 另外的：
    - 如果key是DOM节点上的属性，那么将会被设置到DOM上；
    - 否则将会被设置为组件实例上的属性。

### 特别"保留"的props

有两个全局保留的props：

- `key`
- `ref`

另外，你可以使用保留的`onVnodeXXX`前缀钩子hook到组件的生命周期：

```js
h('div', {
    onVnodeMounted(vnode) {
        /* ... */
    },
    onVnodeUpdated(vnode, prevVnode) {
        /* ... */
    }
})
```

这些hook与自定义指令的构建方式类似。因为它们以 on 开头，所以它们也可以在模板中用 v-on 声明：

```vue

<template>
  <div @vnodeMounted="() => { }"></div>
</template>
```

---

由于扁平化的结构，组件上的`this.$attrs`包含所有没有在组件中显式声明的属性，包含：`class`、`style`、`onXXX`
监听器以及`vnodeXXX`hook。这将会简化写wrapper组件的方式 - 只需要将`this.$attrs`传递到`v-bind="$attrs"`
。

（译者注：在之前的代码中，写wrapper组件时需要区分`listeners`和`attrs`，通过`v-on`和`v-bind`
传递对象的方式来传递多个监听器或者props。简单来说，在组件上声明的`props`以及`emits`事件不会存在`$attrs`上，表明`props`
以及`emits`
被当前组件消费了，再简单来说相当于过滤了已经声明的属性，没有声明的属性继续往下传递。但是在此次更改之后，用户只需要将`$attrs`
传递给`v-bind`即可）

### 上下文无关的VNode

使用上下文无关的VNode，我们不再需要字符串ID（例如：`h('some-component')`）在全局注册的组件中隐式的搜索。跟搜索指令类似。相反，我们需要使用导出的API：

```js
import {h, resolveComponent, resolveDirective, withDirectives} from 'vue'

export default {
    render() {
        const comp = resolveComponent('some-global-comp')
        const fooDir = resolveDirective('foo')
        const barDir = resolveDirective('bar')

        // <some-global-comp v-foo="x" v-bar="y" />
        return withDirectives(
            h(comp),
            [fooDir, this.x],
            [barDir, this.y]
        )
    }
}
```

这将主要用于编译产物，因为手写render函数可以直接使用导出组件和指令的值。

## 缺点

### 依赖Vue核心库

`h`需要全局导出使用意味着任何包含了Vue组件的库都必须包含`import { h } from 'vue'`(
也会在template的编译产物render函数中隐式的包含)。这会造成一些负担，因为这要求库作者需要合理的配置来在产物中拆分Vue：

- Vue不应该被打包进库中；
- 对于ES模块构建，应该保留导出的API并最终交给打包器处理；
- 对于UMD/browser构建，应该先尝试`Vue.h`然后再降级`require`处理。

这是React的常见做法，而且也可能存在webpack、rollup中。一些Vue的库也是如此做的。我们仅需要提供合适的文档以及工具支持。

## 可选的方案

N/A

## 采取的策略

- 对于使用template的用户，这并不会对他们造成影响。
- 对于使用JSX的用户影响也很小，但是我们需要重写JSX插件。
- 对于直接手写render函数的用户，更改为`h`将会是主要迁移成本。应该只会有很小的一部分用户，但是我们也要提供合适的迁移途径。
    - 尽可能提供一个兼容插件为render函数打补丁来暴露出在2.x版本兼容的参数，并且提供支持逐个迁移render函数的兼容模式。
    - 尽可能提供自动覆盖调用新VNode数据格式的`h`的模版代码，因为这个过程是重复机械的。
- 使用上下文的函数式组件用户，可能需要手动迁移，但是会提供类似的适配器。

## 没有解决的问题

使用扁平的VNode数据结构，每个属性的处理方式变得更加隐蔽。这也会造成一些小问题 -
例如，如何显式设置一个不存在的DOM属性，或者如何在自定义元素上监听一个首字母大写的事件？

我们可能需要通过前缀来支持显式的绑定：

```js
h('div', {
    'attr:id': 'foo',
    'prop:__someCustomProperty__': { /*... */},
    'on:SomeEvent': e => { /* ... */
    }
})
```

这相当于2.x处理attrs、domProps的方式进行嵌套。但是，这需要我们对每个属性执行额外的检查，导致为了非常小众的用例而产生一定的性能成本。我们可能需要寻找一个更合适的方法来处理这个问题。

译者注：

第二个没有解决的问题示例：

```js
// v2.x
h('div', {
  on: {
    click: foo,
    Click: bar
  }
})
// 但是在v3中无法区分
h('div', {
  onClick: foo
})
```



