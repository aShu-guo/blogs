# createVNode 完整指南

Vue 3 中最核心的虚拟 DOM 创建函数 `createVNode` 的完整文档索引。

## 文档导航

### [createVNode-flow.md](./createVNode-flow.md) - 完整流程分析
深入理解 createVNode 执行过程的详尽指南。

- 函数签名和参数说明
- 4 步完整流程解析
- 每一步的详细代码分析
- 4 种调用场景（编译模板/h()/动态组件/特殊类型）
- 优化机制（Block Tree、编译器标记、PatchFlags）

阅读时间：20-30 分钟 | 长度：~500 行

### [createVNode-quickref.md](./createVNode-quickref.md) - 快速参考
编码时快速查阅的参考卡片。

- 核心流程图（5 步）
- 关键决策树
- Props 处理细节速查
- VNode 对象结构
- ShapeFlags / PatchFlags 速查表
- 常见调用模式示例
- 性能技巧和最佳实践

阅读时间：5-10 分钟 | 长度：~300 行

### [createVNode-scenarios.md](./createVNode-scenarios.md) - 场景对比
不同使用场景的差异和权衡分析。

- 6 种场景对比表
- 编译器模板 vs 手写 h()
- 动态类型的运行时检查
- Fragment / Teleport / Suspense
- 类型识别流程对比
- 性能对比（表格）
- 实际使用建议

阅读时间：15-20 分钟 | 长度：~400 行

## 学习路径

### 快速上手（15 分钟）
1. [createVNode-quickref.md](./createVNode-quickref.md) - 核心流程部分
2. 查看关键决策树
3. 浏览常见调用模式

### 全面理解（1 小时）
1. [createVNode-quickref.md](./createVNode-quickref.md) - 完整阅读（10 分钟）
2. [createVNode-flow.md](./createVNode-flow.md) - 步骤 1-3（20 分钟）
3. [createVNode-scenarios.md](./createVNode-scenarios.md) - 场景 1-3（20 分钟）
4. 实践编写简单的 h() 函数（10 分钟）

### 精通深入（2-3 小时）
1. [createVNode-quickref.md](./createVNode-quickref.md) - 全部（10 分钟）
2. [createVNode-flow.md](./createVNode-flow.md) - 全部（30 分钟）
3. [createVNode-scenarios.md](./createVNode-scenarios.md) - 全部（20 分钟）
4. 深入理解优化机制部分（20 分钟）
5. 对标 Vue 源代码阅读（30 分钟）
6. 实践：用 h() 写出各种场景的组件（30 分钟）

## 核心概念速览

### 5 个关键概念

| 概念 | 作用 | 文档位置 |
|------|------|---------|
| **guardReactiveProps** | 克隆响应式对象避免副作用 | [flow.md](./createVNode-flow.md) 步骤 2 |
| **normalizeClass** | 统一 class 格式为字符串 | [flow.md](./createVNode-flow.md) 步骤 2.2 / [quickref.md](./createVNode-quickref.md) |
| **normalizeStyle** | 统一 style 格式为对象/字符串 | [flow.md](./createVNode-flow.md) 步骤 2.3 / [quickref.md](./createVNode-quickref.md) |
| **ShapeFlag** | 用位运算标记 VNode 类型 | [flow.md](./createVNode-flow.md) 步骤 3 / [quickref.md](./createVNode-quickref.md) |
| **PatchFlags** | 标记哪些属性需要更新 | [flow.md](./createVNode-flow.md) 步骤 3 / [quickref.md](./createVNode-quickref.md) |

### 4 个执行路径

| 路径 | 场景 | 性能 | 文档位置 |
|------|------|------|---------|
| **编译模板** | `<template>` | 最优 | [scenarios.md](./createVNode-scenarios.md) 场景 1 |
| **h() 函数** | 手写渲染 | 中等 | [scenarios.md](./createVNode-scenarios.md) 场景 2 |
| **动态类型** | `:is` 指令 | 中等 | [scenarios.md](./createVNode-scenarios.md) 场景 3 |
| **特殊类型** | Fragment/Teleport/Suspense | 可控 | [scenarios.md](./createVNode-scenarios.md) 场景 4-6 |

## 快速查询

### "我想知道 class 怎么被规范化的"
- [createVNode-quickref.md](./createVNode-quickref.md) - Props 处理细节
- [createVNode-flow.md](./createVNode-flow.md) - 步骤 2.2: class 处理

### "编译模板和 h() 的性能差异"
- [createVNode-scenarios.md](./createVNode-scenarios.md) - Props 处理的差异
- [createVNode-scenarios.md](./createVNode-scenarios.md) - 性能对比

### "我的组件为什么收到警告？"
- [createVNode-quickref.md](./createVNode-quickref.md) - 避免做的事
- [createVNode-flow.md](./createVNode-flow.md) - 步骤 3.1: 开发模式警告

### "如何优化渲染性能？"
- [createVNode-quickref.md](./createVNode-quickref.md) - 性能技巧
- [createVNode-flow.md](./createVNode-flow.md) - 优化机制

### "我需要用 h() 写复杂组件"
- [createVNode-scenarios.md](./createVNode-scenarios.md) - 场景 2: 手写 h() 函数
- [createVNode-quickref.md](./createVNode-quickref.md) - 常见调用模式

## 实践练习

### 练习 1: 编写简单的组件
```javascript
// 用 h() 写出一个带 class 的 div
import { h } from 'vue'

export default () => h('div', {
  class: {active: true}
}, 'Hello')

// 预期：class 被自动规范化为 "active"
```

### 练习 2: 理解 Props 规范化
```javascript
// 尝试这些 Props，理解发生了什么
h('div', {
  class: {a: true, b: false},
  style: {color: 'red'}
})

// 思考：guardReactiveProps 会克隆吗？
//      normalizeClass 返回什么？
//      style 怎么处理？
```

### 练习 3: 对比编译模板和 h()
```vue
<!-- 写一个简单的模板 -->
<template>
  <div :class="active ? 'active' : ''">{{ msg }}</div>
</template>

<!-- 编译后用什么方式调用 _createVNode？-->
<!-- 如果用 h() 怎么写？有什么区别？-->
```

### 练习 4: 识别 ShapeFlag
```javascript
// 判断以下 VNode 的 ShapeFlag
const v1 = h('div')        // ELEMENT
const v2 = h(MyComponent)  // STATEFUL_COMPONENT
const v3 = h(Fragment)     // ?
const v4 = h(Teleport)     // TELEPORT

// 检查：if (v2.shapeFlag & ShapeFlags.COMPONENT)
```

## 常见问题

**Q: guardReactiveProps 的作用是什么？**
→ [flow.md](./createVNode-flow.md) 步骤 2.1

**Q: normalizeClass 返回什么？**
→ [flow.md](./createVNode-flow.md) 步骤 2.2 + [quickref.md](./createVNode-quickref.md) Props 处理细节

**Q: 编译模板比 h() 快多少？**
→ [scenarios.md](./createVNode-scenarios.md) 性能对比

**Q: 什么时候应该用 h() 而不是模板？**
→ [scenarios.md](./createVNode-scenarios.md) 实际使用建议

**Q: 为什么组件被 reactive 包装会有警告？**
→ [flow.md](./createVNode-flow.md) 步骤 3.1 + [quickref.md](./createVNode-quickref.md) 避免做的事

**Q: Block Tree 是什么？**
→ [flow.md](./createVNode-flow.md) 优化机制 + [quickref.md](./createVNode-quickref.md)

**Q: PatchFlags 对性能的影响有多大？**
→ [flow.md](./createVNode-flow.md) 步骤 3 + [quickref.md](./createVNode-quickref.md)

## 本质总结

createVNode 是 Vue 虚拟 DOM 系统的核心工厂函数：

```
输入:  type（什么） + props（属性） + children（内容）
处理:  • 类型检查和标准化
       • props 规范化（class/style）
       • 响应式保护（克隆）
       • ShapeFlag 编码
       • Block 树追踪
输出:  VNode 对象
作用:  为 patch 算法服务
```

理解 createVNode 等于理解：
- Vue 虚拟 DOM 的组织方式
- 为什么模板比手写 h() 快
- 编译器的重要性和优化
- 如何写出高性能的组件
- 开发中常见的性能陷阱

## 源代码参考

本文档基于 Vue 3 源代码以下位置：

```
packages/runtime-core/src/vnode.ts
  - createVNode (第 543-644 行)
  - _createVNode (第 547-644 行)
  - createBaseVNode (第 455-539 行)
  - guardReactiveProps (第 646-651 行)
  - cloneVNode (第 653-720 行)

packages/shared/src/normalizeProp.ts
  - normalizeClass (第 63-82 行)
  - normalizeStyle (第 5-25 行)
  - normalizeProps (第 84-96 行)
```

## 文档统计

```
总篇幅：    ~1400 行
总字数：    ~25,000 字
覆盖范围：  源码级别分析 + 实战指导
代码示例：  50+ 个
图表/流程图：20+ 个
实践建议：  30+ 个
```

## 相关资源

- [Vue 3 官方文档](https://vuejs.org/)
- [Vue 3 源代码](https://github.com/vuejs/core)
- [编译器文档](https://vue-macros.sxzz.moe/)
- [性能优化](https://vuejs.org/guide/best-practices/performance.html)

---

**最后更新：** 2024年11月
**文档版本：** 1.0
**涵盖 Vue 版本：** 3.x
