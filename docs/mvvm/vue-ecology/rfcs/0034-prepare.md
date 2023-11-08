# 准备篇

## 之前（v4之前）是如何使用内置组件：transition、router-view、component的？

`router-view`作为页面组件的占位，可以被`keep-alive`、`transition`包裹。

```vue

<template>
  <transition>
    <keep-alive>
      <router-view></router-view>
    </keep-alive>
  </transition>
</template>
```

## router-view

在vue-router v3之前，它是函数式组件，即无状态的。但是在函数式组件在vue3中变更：

- 移除`functional`选项，不再支持对象格式的`{ functional: true }`。
- SFCs不再支持`<template functional>`-如果你想要使用组件中的任意选项而不单是一个函数，那么请使用普通组件。
- 函数入参发生改变：
    - `h`现在通过全局导出
    - 函数接收两个参数：`props`和一个暴露出`slots`, `attrs`和`emit`属性的上下文对象。等价于有状态组件中的带`$`属性的等价物。

那么意味着vue3中的函数式组件是有状态的，而且有自己的依赖收集，这在vue2中不同。
