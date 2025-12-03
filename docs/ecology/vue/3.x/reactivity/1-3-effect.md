# Effect 系统 - Vue 3 响应式依赖追踪核心

## 核心目的

Vue 的响应式系统需要解决一个关键问题：**当数据改变时，如何知道要更新哪些依赖它的代码？**

Effect 系统通过以下机制实现：

- 记录"哪些代码（effect）依赖了哪些数据（响应式属性）"
- 当数据改变时，自动通知所有依赖该数据的 effect 重新执行

## 文档结构

本章节将 Effect 系统分为 **8 个详细专题**，从核心概念到实现细节：

### 第一部分：[核心概念](./1-3.1-effect-concepts.md)

- **Effect 是什么？** - 会自动追踪依赖的函数
- **依赖（Dependency）** - effect 和响应式属性之间的关系
- **全局依赖映射结构** - WeakMap<object, Map<key, Dep>>
- **activeSub** - 当前活跃的订阅者追踪

**源代码位置**：
- Effect 类：`packages/reactivity/src/effect.ts` (572 lines)
- Dep 和 Link 类：`packages/reactivity/src/dep.ts` (398 lines)
- EffectScope：`packages/reactivity/src/effectScope.ts` (203 lines)

### 第二部分：[ReactiveEffect 类详解](./1-3.2-effect-reactive-effect.md)

- **EffectFlags** - 8 个状态位标志（位标志系统）
- **ReactiveEffect 类** - effect 的核心实现
- **run() 方法** - effect 执行和依赖追踪
- **stop() 方法** - 资源清理
- **notify() 方法** - Batch 机制
- **pause()/resume() 方法** - 暂停控制

### 第三部分：[Link 和 Dep - 依赖链接机制](./1-3.3-effect-link-dep.md)

- **Link 类** - 连接 effect 和 Dep 的双链表节点
- **Dep 类** - 依赖集合（存储订阅者）
- **双链表优势** - O(1) 删除、支持反向迭代
- **Link.version** - 版本号机制
- **globalVersion** - 全局版本号优化

### 第四部分：[track() 和 trigger() 核心 API](./1-3.4-effect-track-trigger.md)

- **track() 函数** - 依赖追踪（属性访问时调用）
- **trigger() 函数** - 依赖触发（属性修改时调用）
- **完整流程** - 数据访问和修改的全过程
- **快速路径优化** - activeLink 缓存
- **版本号比较** - 高效的清理机制

### 第五部分：[Batch 机制（效率优化）](./1-3.5-effect-batch.md)

- **Batch 工作原理** - 延迟执行 effect
- **batchDepth 计数器** - 支持嵌套 batch
- **NOTIFIED 标志** - 去重机制
- **Computed 优先级** - computed 先于 effect 执行
- **与 Promise.then 的关系** - 微任务与去重

### 第六部分：[清理机制（Dependencies Cleanup）](./1-3.6-effect-cleanup.md)

- **问题场景** - 条件分支改变导致的依赖混乱
- **prepareDeps** - 标记旧依赖为 -1
- **cleanupDeps** - 删除未使用的依赖
- **完整流程** - 依赖清理的全过程
- **版本号机制** - 简洁高效的清理方案

### 第七部分：[Scheduler（调度器）](./1-3.7-effect-scheduler.md)

- **什么是调度器** - 控制 effect 执行时机
- **基础用法** - effect 选项和签名
- **使用场景** - 批处理、防抖、组件更新
- **执行流程** - trigger → scheduler → run
- **与 Batch 的关系** - 用户控制 vs 内部机制

### 第八部分：[EffectScope（作用域管理）](./1-3.8-effect-scope.md)

- **什么是 EffectScope** - 管理一组相关的 effect
- **分离 vs 非分离模式** - 作用域独立性
- **自动注册机制** - effect 自动加入 scope
- **pause()/resume()** - 批量暂停/恢复
- **stop() 优化** - O(1) 删除
- **onScopeDispose** - 清理函数注册

## 关键概念速查表

| 概念 | 作用 | 源代码 |
|-----|-----|--------|
| **Effect** | 自动追踪依赖的函数 | effect.ts:87-217 |
| **Dep** | 存储依赖此属性的所有 effect | dep.ts:165-398 |
| **Link** | 连接 effect 和 Dep 的双链表节点 | dep.ts:32-165 |
| **activeSub** | 当前正在执行的 effect | effect.ts:全局 |
| **EffectFlags** | 8 个状态位标志 | effect.ts:枚举 |
| **track()** | 依赖追踪 API | dep.ts:262-299 |
| **trigger()** | 依赖触发 API | dep.ts:300-389 |
| **batch()** | 批处理入队 | effect.ts:236-299 |
| **Scheduler** | 自定义执行时机 | effect.ts:选项 |
| **EffectScope** | 管理一组 effect | effectScope.ts:6-162 |

## 8 个核心机制

1. **全局依赖映射（targetMap）** - WeakMap 结构管理所有对象的依赖
2. **Link 双链表** - 高效的依赖关系表示和 O(1) 删除
3. **activeSub + Subscriber 接口** - 统一追踪当前 effect
4. **EffectFlags 位标志** - 内存高效的状态管理
5. **版本号机制** - 简洁的依赖清理（prepareDeps/cleanupDeps）
6. **Batch 去重** - NOTIFIED 标志避免重复执行
7. **Scheduler 调度器** - 用户控制 effect 执行时机
8. **EffectScope 作用域** - 批量管理相关的 effect

## 完整执行流程示例

```typescript
const obj = reactive({ count: 0 });

// 创建 effect
const runner = effect(() => {
  console.log('value:', obj.count);
});
// → 输出：value: 0

// 修改属性
obj.count = 1;

// 执行流程：
// 1. obj.count = 1 触发 Proxy set trap
// 2. trigger(obj, 'SET', 'count') 调用
// 3. 从 targetMap 获取 obj.count 的 Dep
// 4. Dep.trigger() 递增版本号，调用 Dep.notify()
// 5. Dep.notify() 遍历 Dep.subs（订阅者列表）
// 6. effect.notify() 检查 NOTIFIED 标志，调用 batch(effect)
// 7. endBatch() 执行队列中的 effect
// 8. effect.run() 执行，重新追踪依赖
// → 输出：value: 1
```

## 性能特点

- **依赖追踪**：O(1) 创建 Link，O(1) 访问快速路径
- **依赖清理**：O(n) 扫描旧依赖，n 通常很小（< 10）
- **批处理**：避免频繁触发，支持嵌套 batch
- **版本号**：简单整数比较，快速判断是否更新
- **WeakMap**：自动垃圾回收，防止内存泄漏

## 推荐阅读顺序

1. **快速了解**：从 [核心概念](./1-3.1-effect-concepts.md) 开始
2. **实现细节**：深入 [ReactiveEffect](./1-3.2-effect-reactive-effect.md) 和 [Link/Dep](./1-3.3-effect-link-dep.md)
3. **核心 API**：学习 [track/trigger](./1-3.4-effect-track-trigger.md)
4. **优化机制**：了解 [Batch](./1-3.5-effect-batch.md) 和 [Cleanup](./1-3.6-effect-cleanup.md)
5. **高级特性**：掌握 [Scheduler](./1-3.7-effect-scheduler.md) 和 [EffectScope](./1-3.8-effect-scope.md)

## 总结

Vue 3 的 Effect 系统是响应式系统的核心。通过：
- 精巧的 Link 双链表设计实现高效的依赖管理
- EffectFlags 位标志简化状态表示
- Batch 机制避免频繁重复执行
- Scheduler 让用户可以控制执行时机
- EffectScope 支持批量管理相关 effect

这些设计使得 Vue 能够在保证响应式正确性的同时，维持极高的性能。
