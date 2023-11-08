# 事件API变更

## 概览

移除`$on`、`$off`和`$once`实例方法。vue实例不再实现事件发送接口。

## 动机

vue1.x版本实现了与AngularJS类似的组件事件系统，用户可以使用`$dispatch`和`$broadcast`通过事件派发在组件树中的组件间通信。

在Vue2中，我们移除了`$dispatch`和`$broadcast`来支持由状态驱动的数据流（props/event）。

使用Vue2的API时，`$emit`
被用来触发在父组件（在template或者render函数中）中声明的事件处理器，但是也可以触发通过实例事件API关联起来的事件处理器（`$on`、`$off`
和`$once`
）。实际上这有点过载了：完整的事件API并不是典型的组件间数据流的一部分。它们很少被使用，而且并没有充分的理由将它们暴露在组件实例上。因此本RFC建议移除`$on`、`$off`
和`$once`。

## 采取的策略

在Vue2中，事件API更多的被当作事件总线来使用。可以使用实现了事件API的外部库来替换，例如：[mitt](https://github.com/developit/mitt)。

这些方法可以在兼容版本中继续支持。
