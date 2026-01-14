# 渲染器：从 VNode 到真实 DOM

## 1. 概念先行：建立心智模型

### 渲染器是什么？

想象你是一个**建筑工人**，手里拿着一张**建筑图纸**（VNode），你的任务是根据图纸在工地上**盖房子**（真实 DOM）。

- **图纸（VNode）**：描述了房子的结构，但它只是纸上的信息，不是真实的房子
- **工人（Renderer）**：负责把图纸变成真实的建筑
- **工地（DOM 树）**：最终呈现给用户的真实页面

但这里有个关键问题：**如果图纸改了怎么办？**

- 笨办法：把整栋房子拆了重建（性能差）
- 聪明办法：**对比新旧图纸，只修改变化的部分**（Patch 算法）

这就是 Vue 3 渲染器的核心思想：**最小化 DOM 操作，最大化性能**。

### 核心流程

```
VNode（虚拟节点）
    ↓
Renderer（渲染器）
    ↓
Patch（对比算法）
    ↓
DOM Operations（真实 DOM 操作）
```

---

## 2. 最小实现：手写"低配版"渲染器

下面是一个 40 行的极简渲染器，展示核心逻辑：

```javascript
// 创建渲染器
function createRenderer() {
  // 挂载元素
  function mountElement(vnode, container) {
    const el = document.createElement(vnode.type);

    // 处理 props
    if (vnode.props) {
      for (const key in vnode.props) {
        el.setAttribute(key, vnode.props[key]);
      }
    }

    // 处理 children
    if (typeof vnode.children === 'string') {
      el.textContent = vnode.children;
    } else if (Array.isArray(vnode.children)) {
      vnode.children.forEach(child => {
        mountElement(child, el);
      });
    }

    container.appendChild(el);
  }

  // Patch 算法（简化版）
  function patch(n1, n2, container) {
    if (!n1) {
      // 首次挂载
      mountElement(n2, container);
    } else {
      // 更新逻辑（这里省略，后面详解）
    }
  }

  // 渲染函数
  function render(vnode, container) {
    if (vnode) {
      patch(container._vnode, vnode, container);
      container._vnode = vnode;
    }
  }

  return { render };
}

// 使用示例
const renderer = createRenderer();
const vnode = {
  type: 'div',
  props: { id: 'app' },
  children: 'Hello Vue!'
};
renderer.render(vnode, document.body);
```

**试一试**：把上面的代码复制到浏览器控制台，你会看到页面上出现 `<div id="app">Hello Vue!</div>`。

虽然真实的 Vue 3 源码有数千行，但**骨架就是这段代码**。

---

## 3. 逐行解剖：Vue 3 渲染器核心路径

### 3.1 渲染器的创建：`createRenderer`

Vue 3 的渲染器是**平台无关**的，通过传入不同的 DOM 操作函数，可以渲染到不同平台（浏览器、Canvas、小程序等）。

| 源码片段 | 逻辑拆解 |
|---------|---------|
| `function createRenderer(options)` | **平台抽象**：接收 `createElement`、`insert`、`patchProp` 等操作函数 |
| `const { insert, remove, patchProp } = options` | **解构操作**：提取平台相关的 DOM 操作方法 |
| `return { render, hydrate }` | **返回渲染函数**：`render` 用于客户端渲染，`hydrate` 用于 SSR |

### 3.2 挂载元素：`mountElement`

| 源码片段 | 逻辑拆解 |
|---------|---------|
| `const el = vnode.el = hostCreateElement(vnode.type)` | **创建元素**：调用平台的 `createElement`，并将真实 DOM 存到 `vnode.el` |
| `if (shapeFlag & ShapeFlags.TEXT_CHILDREN)` | **位运算优化**：用位运算快速判断子节点类型（文本/数组） |
| `hostPatchProp(el, key, null, props[key])` | **设置属性**：调用平台的 `patchProp` 处理 class、style、事件等 |
| `hostInsert(el, container, anchor)` | **插入 DOM**：将元素插入到容器中，`anchor` 用于指定插入位置 |

**为什么用位运算？**
Vue 3 用 `ShapeFlags` 枚举来标记 VNode 类型（元素、组件、文本等），位运算比字符串比较快 10 倍以上。

```javascript
// ShapeFlags 定义
export const enum ShapeFlags {
  ELEMENT = 1,                // 0001
  STATEFUL_COMPONENT = 1 << 2, // 0100
  TEXT_CHILDREN = 1 << 3,      // 1000
  ARRAY_CHILDREN = 1 << 4      // 10000
}

// 判断是否为元素节点
if (vnode.shapeFlag & ShapeFlags.ELEMENT) { /* ... */ }
```

### 3.3 Patch 算法：新旧 VNode 对比

Patch 是渲染器的核心，负责**最小化 DOM 操作**。

| 源码片段 | 逻辑拆解 |
|---------|---------|
| `if (n1 == null)` | **首次挂载**：旧节点不存在，直接调用 `mountElement` |
| `else if (n1.type !== n2.type)` | **类型不同**：直接卸载旧节点，挂载新节点（无法复用） |
| `else { patchElement(n1, n2) }` | **类型相同**：进入元素更新逻辑，复用 DOM 节点 |

**关键优化**：Vue 3 会尽可能**复用旧的 DOM 节点**，只更新变化的属性和子节点。

### 3.4 更新元素：`patchElement`

| 源码片段 | 逻辑拆解 |
|---------|---------|
| `const el = (n2.el = n1.el)` | **复用 DOM**：新 VNode 直接引用旧 VNode 的真实 DOM |
| `patchProps(el, n1.props, n2.props)` | **更新属性**：对比新旧 props，只更新变化的部分 |
| `patchChildren(n1, n2, el)` | **更新子节点**：这是最复杂的部分，涉及 Diff 算法 |

### 3.5 子节点更新：`patchChildren`

子节点有三种情况：文本、数组、空。Vue 3 用一个 9 宫格矩阵处理所有组合：

| 旧 \ 新 | 文本 | 数组 | 空 |
|--------|------|------|-----|
| **文本** | 更新文本 | 清空文本 + 挂载数组 | 清空文本 |
| **数组** | 卸载数组 + 设置文本 | **Diff 算法** | 卸载数组 |
| **空** | 设置文本 | 挂载数组 | 无操作 |

**最复杂的情况**：新旧都是数组，需要用 Diff 算法找出最小操作。

### 3.6 组件渲染：`mountComponent`

组件的渲染流程：

| 源码片段 | 逻辑拆解 |
|---------|---------|
| `const instance = createComponentInstance(vnode)` | **创建实例**：初始化组件实例，包含 props、slots、emit 等 |
| `setupComponent(instance)` | **执行 setup**：调用组件的 `setup` 函数，处理响应式数据 |
| `setupRenderEffect(instance)` | **建立渲染副作用**：用 `effect` 包裹渲染函数，实现响应式更新 |

**关键点**：`setupRenderEffect` 会创建一个响应式副作用，当组件依赖的数据变化时，自动触发重新渲染。

```javascript
function setupRenderEffect(instance, container) {
  instance.update = effect(() => {
    if (!instance.isMounted) {
      // 首次挂载
      const subTree = instance.render();
      patch(null, subTree, container);
      instance.isMounted = true;
    } else {
      // 更新
      const prevTree = instance.subTree;
      const nextTree = instance.render();
      patch(prevTree, nextTree, container);
      instance.subTree = nextTree;
    }
  });
}
```

### 3.7 与响应式系统的联动

渲染器通过 `effect` 与响应式系统连接：

1. **依赖收集**：渲染函数执行时，访问响应式数据，触发 `track`
2. **触发更新**：数据变化时，触发 `trigger`，调度器执行 `instance.update`
3. **重新渲染**：`update` 函数重新执行渲染函数，生成新 VNode，进入 Patch 流程

```
响应式数据变化
    ↓
trigger 触发依赖
    ↓
调度器执行 instance.update
    ↓
重新执行 render 函数
    ↓
生成新 VNode
    ↓
Patch 算法对比
    ↓
最小化 DOM 更新
```

---

## 4. 细节补充：边界与性能优化

### 4.1 异常处理

| 场景 | 处理方式 |
|------|---------|
| VNode 为 `null` | 卸载旧节点，不挂载新节点 |
| 子节点为空数组 | 跳过子节点处理 |
| Props 为 `null` | 跳过属性设置 |

### 4.2 性能优化

| 优化点 | 实现方式 |
|--------|---------|
| **静态提升** | 编译时将静态节点提升到渲染函数外，避免重复创建 |
| **事件缓存** | 缓存事件处理函数，避免每次渲染都创建新函数 |
| **Block Tree** | 将动态节点收集到数组中，Diff 时只对比动态节点 |
| **PatchFlags** | 标记节点的动态部分（文本、class、style 等），精准更新 |

**示例：PatchFlags**

```javascript
// 编译后的 VNode
const vnode = {
  type: 'div',
  children: [
    { type: 'span', children: 'static' }, // 静态节点
    { type: 'span', children: ctx.msg, patchFlag: 1 } // 动态文本
  ],
  dynamicChildren: [
    { type: 'span', children: ctx.msg, patchFlag: 1 }
  ]
}

// Patch 时只对比 dynamicChildren
if (vnode.dynamicChildren) {
  patchBlockChildren(vnode.dynamicChildren);
} else {
  patchChildren(vnode.children);
}
```

### 4.3 边界情况

**循环引用**：Vue 3 用 `Set` 存储已处理的 VNode，避免无限递归。

**Fragment**：多根节点组件返回 Fragment，渲染器会遍历其子节点逐个挂载。

**Teleport**：将子节点渲染到指定的 DOM 节点，而不是父容器。

---

## 5. 总结与延伸

### 一句话总结

**渲染器是 Vue 3 的"建筑工人"，通过 Patch 算法对比新旧 VNode，最小化 DOM 操作，并通过响应式系统实现自动更新。**

### 面试考点

1. **渲染器的作用是什么？**
   将 VNode 转换为真实 DOM，并通过 Patch 算法实现高效更新。

2. **Patch 算法的核心思想是什么？**
   对比新旧 VNode，找出差异，只更新变化的部分，最小化 DOM 操作。

3. **Vue 3 如何实现响应式更新？**
   通过 `effect` 包裹渲染函数，依赖的数据变化时自动触发重新渲染。

4. **为什么 Vue 3 的渲染器是平台无关的？**
   通过传入不同的 DOM 操作函数（`createElement`、`insert` 等），可以渲染到不同平台。

5. **什么是 PatchFlags 和 Block Tree？**
   编译时优化，标记动态节点，Diff 时只对比动态部分，跳过静态节点。

### 延伸阅读

- **下一章**：Diff 算法详解（双端对比、最长递增子序列）
- **相关章节**：响应式系统（effect、track、trigger）
- **进阶话题**：编译优化（静态提升、事件缓存、Block Tree）
