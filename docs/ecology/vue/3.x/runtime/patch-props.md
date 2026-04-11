# Patch Props

这一页后面会专门拆属性更新流程，重点不是“有哪些 props”，而是运行时怎么高效判断哪些属性需要改。

## 会重点整理什么

- class、style、事件、DOM props 的更新分支
- PatchFlag 对属性更新的影响
- 全量 diff 和定向更新的成本差异

## 先关联阅读

- [Transform Bind](../compiler/2-2.1-transform-bind.md)
- [Patch](./patch.md)
