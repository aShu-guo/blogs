# 调度器：Scheduler

这一页后面会承接 `setupRenderEffect`，单独拆开讲 Vue 3 是怎么把“数据变化”转换成“异步批量更新”的。

## 这一章会重点展开什么

- `queueJob` 为什么能去重
- 为什么组件更新不是同步立刻执行
- `nextTick` 和调度队列是什么关系

## 先关联阅读

- [setupRenderEffect](./1-5-render-effect.md)
- [effect 调度与批处理](../reactivity/1-3.7-effect-scheduler.md)
- [批量更新](../reactivity/1-3.5-effect-batch.md)
