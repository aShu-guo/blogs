# Patch

这一页后面会专门讲运行时 diff 主流程，也就是新旧 VNode 如何进入 patch 分发。

## 这里最终会展开的内容

- `patch` 如何按 VNode 类型分流
- 元素、组件、Fragment、Text 的处理差异
- 为什么编译阶段打的标记会影响运行时 patch 成本

## 先关联阅读

- [Transform If](../compiler/2-2.1-transform-if.md)
- [Transform Memo](../compiler/2-2.1-transform-memo.md)
- [setupRenderEffect](../setup/1-5-render-effect.md)
