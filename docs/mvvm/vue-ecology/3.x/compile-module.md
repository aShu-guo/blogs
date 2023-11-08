# compile-module

## template -> render

## render函数

render函数是template编译后的产物，其中引用了响应式对象，你可以使用Vue官方提供的[template-explorer](https://template-explorer.vuejs.org/)
编译模板

### 何时去写

一般开发业务组件时，并不建议写render，更建议直接写template

- 功能性组件，需要灵活的获取slot或作用域slot的内容，将它们打包或者其他处理，例如
    - 布局组件
    - 递归组件



## 编译时做了哪些优化？

- 将永远静态（即没有依赖任何变量的DOM）提升到最上级，当模板更新时会直接复用可以复用的DOM（新旧VNode是否严格相等）而非整体重新编译。
    - 编译器提供标记，标记哪些VNode是动态的，例如：`/* PROPS */`，渲染器才可以知道
    - 实现原理是[Block机制](./block)
- 缓存事件handler
    - 在vue2中并没有此项优化，由于handler可能是行内`()=>foo()`、`foo()`，如此在父组件重新渲染时，子组件也会重新渲染
    - 在react中提供了`useMemo`以及`useCallback`来缓存事件handler，但是由于Vue使用Template语法，所以它在内部帮用户处理了
        - 解析js的难度远大于解析template
        - 在比较新旧节点时，需要严格比较每行是否发生变化，导致React会导致许多没有变动的子组件仍会重复渲染。

### 如何实现的？

我们知道在Vue中通过`VNode`以及`diff`提高性能，其中`VNode`是用来描述`DOM`节点的对象，`diff`是用于比较新旧`VNode`的优化算法。

在Vue2中通过`Observer`、`Dep`、`Watch`
3个组成部分实现了依赖收集，在响应式`data`发生变化时，重新执行`render`函数生成新的`VNode`，后通过`diff`
算法将新VNode与旧VNode进行比较，从而可以进行局部的更新，但是每次都需要做全量的比较。

在Vue3中在编译阶段，对需要track的地方添加patchFlag，例如：`props`、`dynamic style`、`dynamic class`
等。通过分析`template`，将静态的`VNode`提升而且在执行`diff`比较时，通过之前编译阶段添加的`patchFlag`以及`shapeFlag`
判断是否需要diff，如此当state发生变化时，可以局部的diff、局部的更新。在一些极端条件下，性能相对于Vue2可以提升一个数量级。更多的源码分析可以参考[patchFlag与Block](./block.md)



