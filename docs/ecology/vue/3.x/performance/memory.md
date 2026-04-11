# 内存管理与性能优化

这一页后面会单独整理 Vue 3 源码里和内存管理相关的几个关键点。

## 我更关心的几个问题

- WeakMap / Map / Set 在源码里分别承担什么角色
- effect、dep、scope 生命周期结束后如何清理
- 长生命周期页面里哪些地方最容易形成引用残留

## 先关联阅读

- [WeakMap](../others/weak-map.md)
- [effect cleanup](../reactivity/1-3.6-effect-cleanup.md)
- [effect scope](../reactivity/1-3.8-effect-scope.md)
