# mount() 和 render() - 应用挂载与渲染

## 1. 概念先行：从虚拟到真实

### 生活类比：建筑施工

想象你是一个建筑工程师：

**设计图纸（VNode）**：
```
- 平面图：房间布局、尺寸
- 立面图：外观设计
- 问题：只是纸上的设计，无法居住
```

**实际施工（mount + render）**：
```
1. mount()：选择施工地点，准备开工
2. render()：按照图纸开始施工
3. patch()：对比图纸和现场，决定如何施工
4. 结果：真实的建筑物，可以居住
```

### 核心问题

```typescript
// 创建应用（设计图纸）
const app = createApp({
  template: '<div>{{ count }}</div>',
  setup() {
    return { count: 0 };
  }
});

// 问题：此时只有配置，没有 DOM
console.log(document.querySelector('#app'));  // 空的

// mount：将应用挂载到 DOM（开始施工）
app.mount('#app');

// 结果：DOM 被创建
console.log(document.querySelector('#app'));  // <div>0</div>
```

## 2. 最小实现：手写 mount 和 render

```javascript
// 简化的 mount 和 render 实现
function mount(container) {
  if (this._isMounted) {
    console.warn('Already mounted');
    return;
  }

  // 1. 创建根 VNode
  const vnode = {
    type: this._component,
    props: this._props,
    appContext: this._context,
  };

  // 2. 渲染到容器
  render(vnode, container);

  // 3. 标记已挂载
  this._isMounted = true;
  this._container = container;
}

function render(vnode, container) {
  if (vnode === null) {
    // 卸载：清空容器
    if (container._vnode) {
      unmount(container._vnode);
    }
  } else {
    // 挂载或更新：调用 patch
    patch(container._vnode || null, vnode, container);
  }

  // 保存当前 VNode
  container._vnode = vnode;
}

function patch(oldVNode, newVNode, container) {
  // 1. 相同 VNode，跳过
  if (oldVNode === newVNode) return;

  // 2. 类型不同，卸载旧的
  if (oldVNode && !isSameType(oldVNode, newVNode)) {
    unmount(oldVNode);
    oldVNode = null;
  }

  // 3. 根据类型处理
  const { type } = newVNode;

  if (typeof type === 'string') {
    // HTML 元素
    processElement(oldVNode, newVNode, container);
  } else if (typeof type === 'object') {
    // 组件
    processComponent(oldVNode, newVNode, container);
  } else if (type === Text) {
    // 文本节点
    processText(oldVNode, newVNode, container);
  }
}

function processElement(oldVNode, newVNode, container) {
  if (oldVNode === null) {
    // 挂载元素
    const el = document.createElement(newVNode.type);
    newVNode.el = el;

    // 设置属性
    if (newVNode.props) {
      for (const key in newVNode.props) {
        el.setAttribute(key, newVNode.props[key]);
      }
    }

    // 处理子节点
    if (newVNode.children) {
      if (typeof newVNode.children === 'string') {
        el.textContent = newVNode.children;
      } else {
        newVNode.children.forEach(child => {
          patch(null, child, el);
        });
      }
    }

    container.appendChild(el);
  } else {
    // 更新元素
    const el = (newVNode.el = oldVNode.el);

    // 更新属性
    // 更新子节点
    // ...
  }
}

function processComponent(oldVNode, newVNode, container) {
  if (oldVNode === null) {
    // 挂载组件
    mountComponent(newVNode, container);
  } else {
    // 更新组件
    updateComponent(oldVNode, newVNode);
  }
}

// 测试
const app = {
  _component: {
    setup() {
      return { count: 0 };
    },
    render(ctx) {
      return {
        type: 'div',
        children: String(ctx.count),
      };
    },
  },
  _props: null,
  _context: {},
  _isMounted: false,
  mount,
};

app.mount(document.getElementById('app'));
```

## 3. 逐行解剖：Vue 3 的实现

### 3.1 mount - 挂载应用

| 源码片段 | 逻辑拆解 |
|---------|---------|
| `if (!isMounted)` | **挂载检查**：防止重复挂载 |
| `const vnode = createVNode(rootComponent, rootProps)` | **创建根 VNode**：将组件配置转换为 VNode |
| `vnode.appContext = context` | **关联上下文**：传递 AppContext 给 VNode |
| `if (namespace === true) namespace = 'svg'` | **命名空间处理**：SVG/MathML 需要特殊处理 |
| `if (isHydrate && hydrate)` | **SSR 激活**：服务端渲染时激活已有 HTML |
| `else render(vnode, rootContainer, namespace)` | **客户端渲染**：从零创建 DOM |
| `isMounted = true` | **标记已挂载**：防止重复挂载 |
| `app._container = rootContainer` | **保存容器**：用于 unmount |
| `(rootContainer as any).__vue_app__ = app` | **标记容器**：在容器上保存应用引用 |

```typescript
mount(
  rootContainer: HostElement | string,
  isHydrate?: boolean,
  namespace?: ElementNamespace | boolean
): ComponentPublicInstance {
  if (!isMounted) {
    const vnode = createVNode(rootComponent, rootProps);
    vnode.appContext = context;

    if (namespace === true) {
      namespace = 'svg';
    } else if (namespace === false) {
      namespace = undefined;
    }

    if (isHydrate && hydrate) {
      hydrate(vnode as VNode<Node, Element>, rootContainer as any);
    } else {
      render(vnode, rootContainer, namespace);
    }

    isMounted = true;
    app._container = rootContainer;
    (rootContainer as any).__vue_app__ = app;

    if (__DEV__ || __FEATURE_PROD_DEVTOOLS__) {
      app._instance = vnode.component;
      devtoolsInitApp(app, version);
    }

    return getComponentPublicInstance(vnode.component!);
  } else if (__DEV__) {
    warn(`App has already been mounted.`);
  }
}
```

### 3.2 render - 渲染函数

| 源码片段 | 逻辑拆解 |
|---------|---------|
| `if (vnode == null)` | **卸载模式**：vnode 为 null 时卸载应用 |
| `if (container._vnode)` | **检查旧 VNode**：容器中是否有旧的 VNode |
| `unmount(container._vnode, ...)` | **卸载旧节点**：清理旧的 DOM 和组件 |
| `else patch(container._vnode \\|\\| null, vnode, ...)` | **挂载或更新**：调用 patch 进行 diff |
| `container._vnode = vnode` | **保存 VNode**：在容器上保存当前 VNode |
| `flushPostFlushCbs()` | **执行回调**：执行 mounted/updated 等钩子 |

```typescript
const render: RootRenderFunction = (vnode, container, namespace) => {
  if (vnode == null) {
    // 卸载模式
    if (container._vnode) {
      unmount(container._vnode, null, null, true);
    }
  } else {
    // 挂载或更新模式
    patch(
      container._vnode || null,  // 旧 VNode
      vnode,                      // 新 VNode
      container,
      null,
      null,
      null,
      namespace
    );
  }

  // 保存当前 VNode
  container._vnode = vnode;

  // 执行后置回调
  flushPostFlushCbs();
};
```

### 3.3 patch - 核心 diff 算法

| 源码片段 | 逻辑拆解 |
|---------|---------|
| `if (n1 === n2) return` | **相同引用**：完全相同的 VNode，跳过 |
| `if (n1 && !isSameVNodeType(n1, n2))` | **类型不同**：卸载旧节点，重新挂载 |
| `unmount(n1, ...)` | **卸载旧节点**：清理旧的 DOM 和组件 |
| `n1 = null` | **重置旧节点**：标记为挂载模式 |
| `const { type, shapeFlag } = n2` | **获取类型**：从新 VNode 获取类型信息 |
| `if (type === Text)` | **文本节点**：调用 processText |
| `else if (type === Fragment)` | **Fragment**：调用 processFragment |
| `else if (shapeFlag & ShapeFlags.ELEMENT)` | **HTML 元素**：调用 processElement |
| `else if (shapeFlag & ShapeFlags.COMPONENT)` | **组件**：调用 processComponent |

```typescript
const patch = (
  n1: VNode | null,        // 旧 VNode
  n2: VNode,               // 新 VNode
  container: Container,
  anchor: any = null,
  parentComponent: any = null,
  parentSuspense: any = null,
  namespace: string | null = null,
): void => {
  // 1. 相同 VNode，跳过
  if (n1 === n2) return;

  // 2. 类型不同，卸载旧的
  if (n1 && !isSameVNodeType(n1, n2)) {
    anchor = getNextHostNode(n1);
    unmount(n1, parentComponent, parentSuspense, true);
    n1 = null;
  }

  // 3. 根据类型处理
  const { type, shapeFlag } = n2;

  if (type === Text) {
    processText(n1, n2, container, anchor);
  } else if (type === Fragment) {
    processFragment(n1, n2, container, anchor, parentComponent, parentSuspense, namespace);
  } else if (shapeFlag & ShapeFlags.ELEMENT) {
    processElement(n1, n2, container, anchor, parentComponent, parentSuspense, namespace);
  } else if (shapeFlag & ShapeFlags.COMPONENT) {
    processComponent(n1, n2, container, anchor, parentComponent, parentSuspense, namespace);
  } else if (shapeFlag & ShapeFlags.TELEPORT) {
    (type as typeof TeleportImpl).process(...);
  } else if (shapeFlag & ShapeFlags.SUSPENSE) {
    (type as typeof SuspenseImpl).process(...);
  }
};
```

### 3.4 processComponent - 处理组件

| 源码片段 | 逻辑拆解 |
|---------|---------|
| `n2.slotScopeIds = slotScopeIds` | **插槽作用域**：传递插槽作用域 ID |
| `if (n1 == null)` | **挂载模式**：旧 VNode 为 null |
| `if (n2.shapeFlag & ShapeFlags.COMPONENT_KEPT_ALIVE)` | **KeepAlive 组件**：激活缓存的组件 |
| `(parentComponent!.ctx as KeepAliveContext).activate(...)` | **激活组件**：调用 KeepAlive 的 activate |
| `else mountComponent(...)` | **挂载组件**：创建组件实例并挂载 |
| `else updateComponent(n1, n2, optimized)` | **更新模式**：更新已有组件 |

```typescript
const processComponent = (
  n1: VNode | null,
  n2: VNode,
  container: Container,
  anchor: any = null,
  parentComponent: any = null,
  parentSuspense: any = null,
  namespace: string | null = null,
  optimized: boolean = false,
) => {
  n2.slotScopeIds = slotScopeIds;

  if (n1 == null) {
    // 挂载模式
    if (n2.shapeFlag & ShapeFlags.COMPONENT_KEPT_ALIVE) {
      // KeepAlive 组件
      (parentComponent!.ctx as KeepAliveContext).activate(
        n2,
        container,
        anchor,
        namespace,
        optimized
      );
    } else {
      // 普通组件
      mountComponent(
        n2,
        container,
        anchor,
        parentComponent,
        parentSuspense,
        namespace,
        optimized
      );
    }
  } else {
    // 更新模式
    updateComponent(n1, n2, optimized);
  }
};
```

## 4. 细节补充：边界与优化

### 4.1 边界情况 1：重复挂载

```typescript
const app = createApp(App);
app.mount('#app');
app.mount('#app2');  // 警告：App has already been mounted

// 原因：isMounted 标志防止重复挂载
// 解决方案：使用工厂函数创建多个应用实例
```

### 4.2 边界情况 2：容器不存在

```typescript
const app = createApp(App);
app.mount('#non-existent');  // 错误：容器不存在

// Vue 3 会在 mount 前检查容器
if (typeof rootContainer === 'string') {
  const container = document.querySelector(rootContainer);
  if (!container) {
    __DEV__ && warn(`Failed to mount app: mount target selector "${rootContainer}" returned null.`);
    return;
  }
  rootContainer = container;
}
```

### 4.3 边界情况 3：SSR Hydration

```typescript
// 服务端渲染的 HTML
<div id="app" data-server-rendered="true">
  <div>0</div>
</div>

// 客户端激活
const app = createApp(App);
app.mount('#app', true);  // isHydrate = true

// hydrate 会：
// 1. 复用已有的 DOM
// 2. 绑定事件监听器
// 3. 建立响应式系统
```

### 4.4 性能优化 1：ShapeFlags 位运算

```typescript
// 使用位运算判断类型
const ShapeFlags = {
  ELEMENT: 1,                    // 0001
  FUNCTIONAL_COMPONENT: 1 << 1,  // 0010
  STATEFUL_COMPONENT: 1 << 2,    // 0100
  TEXT_CHILDREN: 1 << 3,         // 1000
  ARRAY_CHILDREN: 1 << 4,        // 10000
};

// 判断是否为组件
if (shapeFlag & ShapeFlags.COMPONENT) {
  // 比 typeof 或 instanceof 快
}

// 判断是否有数组子节点
if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
  // O(1) 判断
}
```

**优势**：
- O(1) 判断：位运算比类型检查快
- 组合类型：可以同时标记多个特征
- 内存效率：一个数字存储多个布尔值

### 4.5 性能优化 2：容器缓存 VNode

```typescript
// 在容器上缓存当前 VNode
container._vnode = vnode;

// 优势：
// 1. 下次 render 时可以对比
// 2. unmount 时可以清理
// 3. 避免额外的查找开销
```

### 4.6 性能优化 3：isSameVNodeType 快速判断

```typescript
function isSameVNodeType(n1: VNode, n2: VNode): boolean {
  return n1.type === n2.type && n1.key === n2.key;
}

// 快速判断两个 VNode 是否相同类型
// 避免不必要的 diff
```

### 4.7 常见陷阱 1：忘记保存容器引用

```typescript
const app = createApp(App);
const container = document.getElementById('app');
app.mount(container);

// 错误：清空容器
container.innerHTML = '';

// 问题：Vue 失去了对 DOM 的控制
// 解决方案：使用 app.unmount() 而不是直接操作 DOM
```

### 4.8 常见陷阱 2：在 mount 前访问 DOM

```typescript
const app = createApp({
  setup() {
    // 错误：此时 DOM 还未创建
    const el = document.querySelector('.my-element');
    console.log(el);  // null
  }
});

app.mount('#app');

// 正确：在 onMounted 中访问 DOM
const app = createApp({
  setup() {
    onMounted(() => {
      const el = document.querySelector('.my-element');
      console.log(el);  // 正确的元素
    });
  }
});
```

## 5. 总结与延伸

### 一句话总结

**mount 通过创建根 VNode 并调用 render，render 通过 patch 算法对比新旧 VNode，最终将虚拟 DOM 转换为真实 DOM。**

### 核心要点

1. **mount**：创建根 VNode，关联 AppContext，调用 render
2. **render**：判断挂载或卸载，调用 patch 或 unmount
3. **patch**：对比新旧 VNode，根据类型调用不同的 process 函数
4. **processComponent**：处理组件的挂载和更新
5. **ShapeFlags**：使用位运算快速判断 VNode 类型

### 完整流程

```
app.mount('#app')
  ↓
createVNode(rootComponent, rootProps)
  ↓
vnode.appContext = context
  ↓
render(vnode, container)
  ↓
patch(null, vnode, container)
  ↓
processComponent(null, vnode, container)
  ↓
mountComponent(vnode, container)
  ↓
createComponentInstance()
  ↓
setupComponent()
  ↓
setupRenderEffect()
  ↓
renderComponentRoot()
  ↓
patch(subTree)
  ↓
DOM 创建完成
```

### 面试考点

**Q1：mount 方法做了什么？**

A：主要步骤：
1. **检查挂载状态**：防止重复挂载
2. **创建根 VNode**：调用 createVNode(rootComponent, rootProps)
3. **关联上下文**：vnode.appContext = context
4. **调用 render**：render(vnode, container) 或 hydrate(vnode, container)
5. **标记已挂载**：isMounted = true
6. **保存引用**：app._container = container

**Q2：render 和 patch 的区别是什么？**

A：区别：
1. **render**：入口函数，判断挂载或卸载，调用 patch 或 unmount
2. **patch**：核心 diff 算法，对比新旧 VNode，决定如何更新 DOM
3. **关系**：render 是 patch 的包装器，处理边界情况

**Q3：为什么使用 ShapeFlags 而不是 typeof？**

A：优势：
1. **性能**：位运算比类型检查快
2. **组合**：可以同时标记多个特征（如 ELEMENT | TEXT_CHILDREN）
3. **统一**：所有类型判断使用相同的方式
4. **编译优化**：编译器可以在编译时确定 ShapeFlags

**Q4：SSR Hydration 和普通 render 的区别？**

A：区别：
1. **普通 render**：从零创建 DOM，调用 createElement、appendChild
2. **Hydration**：复用服务端渲染的 HTML，只绑定事件和建立响应式
3. **性能**：Hydration 更快，因为 DOM 已经存在
4. **使用场景**：SSR 应用使用 Hydration，CSR 应用使用普通 render

### 延伸阅读

- **下一章**：[组件初始化](./1-3-component-init.md) - 了解 mountComponent 的详细过程
- **相关章节**：[createApp()](./1-2-createapp.md) - 理解应用创建
- **实践建议**：在浏览器控制台运行最小实现，观察 mount 和 render 的过程

### 练习题

1. 实现一个简化版的 patch 函数，支持元素和文本节点
2. 对比 ShapeFlags 和 typeof 的性能差异
3. 实现一个简单的 SSR Hydration 机制
