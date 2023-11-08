# 准备篇

## 什么是代码片段（Fragments）？

代码片段在Vue中指多节点的元素，例如：

```vue

<div>hello</div>
<div>world</div>
<div>你好呀</div>
```

这在一些用例中很有用（例如table的固定元素结构），而且template结构可以更加灵活的构建。由于Fragments可以支持用户返回多节点的元素，那么组织template时可以将组织逻辑拆分成多个节点，并不需要像v2.x中在外再包裹一层。

## 为什么不建议在组件上使用自定义指令？

在v3中，添加了对代码片段的支持，而且自定义指令也在最终的render函数中成为了props的一部分，那么意味着自定义指令包含在`$attrs`
中。

如果在一个包含多个根节点的组件上使用了自定义指令，而在所有的根节点上都没有使用`$attrs`显式传递，Vue并不知道应该将指令传递给谁。

```vue
<!-- hello.vue -->
<template>
  <foo></foo>
  <bar></bar>
</template>
```

```vue

<Hello v-auth="auth"></Hello>
```

除非在多根节点子组件上显式声明`v-bind="$attrs"`。**如果没有显式声明时，自定义指令将会被忽略并且抛出一个警告信息。**

