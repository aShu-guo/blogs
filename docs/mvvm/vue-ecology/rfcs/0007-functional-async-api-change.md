# 异步函数式API变更

## 概要

- 函数式组件必须写成纯函数形式
    - 移除`{ functional: true }`选项
    - 不再支持`<template functional>`
- 异步函数式组件必须通过指定的API创建

## 基本示例

```js
import {h} from 'vue'

const FunctionalComp = props => {
    return h('div', `Hello! ${props.name}`)
}
```

```js
import {defineAsyncComponent} from 'vue'

const AsyncComp = defineAsyncComponent(() => import('./Foo.vue'))
```

## 动机

### 简化函数式组件

在2.x中，函数式组件必须通过以下格式创建：

```js
const FunctionalComp = {
    functional: true,
    render(h) {
        return h('div', `Hello! ${props.name}`)
    }
}
```

这会有以下问题：

- 当组件不需要任何选项，仅需要render函数时，也必须传递`functional: true`
- 一些选项支持（`props`和`inject`），但是另外一些不支持（`components`
  ）。但是，用户经常认为所有的选项都会支持，因为目前的函数式组件看起来像普通有状态的组件（尤其是当他们在SFC中使用`<template functional>`
  时）

另外一方面的原因是，我们注意到用户使用函数式组件仅仅是因为它的性能。例如：在SFC中使用`<template functional>`
时，请求实现者在组件中支持更多有状态的选项。但是，我并不认为这是我们需要花时间研究的事情。

在v3中，有状态组件和无状态组件之间的性能差异将会变得更小，而且在一些用例中没有任何差别。因此，不再有仅仅为了性能而使用函数式组件的强烈动机，这也证明支持 `<template functional>`
的维护成本是不合理的。在v3中的函数式组件应该出于使用简单的目的去使用，而不是性能。

## 详细设计

在3.x中，我们有意仅仅通过纯函数支持函数式组件：

```js
import {h} from 'vue'

const FunctionalComp = (props, {slots, attrs, emit}) => {
    return h('div', `Hello! ${props.name}`)
}
```

- 移除`functional`选项，不再支持对象格式的`{ functional: true }`。
- SFCs不再支持`<template functional>`-如果你想要使用组件中的任意选项而不单是一个函数，那么请使用普通组件。
- 函数入参发生改变：
    - `h`现在通过全局导出
    - 函数接收两个参数：`props`和一个暴露出`slots`, `attrs`和`emit`属性的上下文对象。等价于有状态组件中的带`$`属性的等价物。

### 与旧语法之间的比较

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

### 可选的props声明

为了在简单用例中使用更加方便，在3.x中函数式组件中，props的声明不再是必须的：

```js
const Foo = props => h('div', props.msg)

```

```js
<Foo msg="hello!"/>

```

不再需要明确的（explicit）props声明，第一个参数`props`将会包含所有通过父组件传递的属性。

### 明确的props声明

需要明确的props声明时，可以将props与函数本身联系起来：

```js
const FunctionalComp = props => {
    return h('div', `Hello! ${props.name}`)
}

FunctionalComp.props = {
    name: String
}
```

### 异步组件创建

还在被讨论中（译者注：在本RFC实现的同时，也在讨论异步组件创建的PR，并且在翻译本文之前已经实现）。

## 缺点

- 迁移成本

## 可替代方案

N/A

## 采取的策略

- 对于函数式组件，可以提供逐个迁移的兼容模式。
- 使用`<template functional>`的SFC应该被转换为普通SFC。
