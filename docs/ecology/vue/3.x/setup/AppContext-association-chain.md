# AppContext 关联链：应用级配置的传递机制

## 1. 概念先行：建立心智模型

### 核心问题

在 Vue 3 中，如何让整个组件树都能访问到全局注册的组件、指令、provide 值等应用级配置？

### 生活化类比

想象一个连锁酒店集团：

- **AppContext** = 集团总部的运营手册（包含品牌标准、服务规范、供应商名单）
- **App 实例** = 集团总部
- **根组件** = 旗舰店
- **子组件** = 各个分店

当旗舰店开业时（app.mount()），总部会把运营手册交给旗舰店经理（根 VNode）。之后每开一家分店（创建子组件），都会从上级店铺那里继承这本手册，确保所有分店都遵循统一的标准。

### 关联链路总览

```
createApp(RootComponent)
  ↓ 创建 AppContext（运营手册）
  └─ app._context = AppContext

app.mount(container)
  ↓ 创建根 VNode
  ↓ vnode.appContext = context  ← 关键关联
  ↓ render(vnode)
    ↓ 创建根组件实例
    ↓ instance.appContext = vnode.appContext
      ↓ 子组件继承父组件的 appContext
        ↓ 整个组件树共享同一个 AppContext
```

---

## 2. 最小实现：手写"低配版"

下面是一个 40 行的最小实现，展示 AppContext 的核心机制：

```javascript
// 创建应用上下文
function createAppContext() {
  return {
    app: null,
    config: { globalProperties: {} },
    components: {},
    directives: {},
    provides: Object.create(null)
  }
}

// 创建应用
function createApp(rootComponent) {
  const context = createAppContext()
  const app = {
    _context: context,
    _component: rootComponent,
    _container: null,

    mount(container) {
      // 创建根 VNode
      const vnode = { type: rootComponent, appContext: null }

      // 关键：关联 AppContext
      vnode.appContext = context

      // 渲染
      render(vnode, container)
      app._container = container
    }
  }

  context.app = app
  return app
}

// 渲染函数
function render(vnode, container) {
  const instance = createComponentInstance(vnode, null)
  container.innerHTML = `<div>Component mounted with AppContext</div>`
}

// 创建组件实例
function createComponentInstance(vnode, parent) {
  // 根组件从 vnode 获取，子组件从父组件继承
  const appContext = parent ? parent.appContext : vnode.appContext
  return { vnode, parent, appContext }
}

// 使用示例
const app = createApp({ name: 'App' })
app.mount(document.getElementById('app'))
```

**核心要点：**
- AppContext 在 `createApp` 时创建
- 在 `mount` 时通过 `vnode.appContext = context` 关联到根 VNode
- 子组件通过父组件继承，无需手动传递

---

## 3. 逐行解剖：Vue 3 源码关键路径

### 3.1 AppContext 的创建

| 源码位置 | 说明 |
|---------|------|
| `packages/runtime-core/src/apiCreateApp.ts:257` | `createAppAPI` 函数入口 |
| `const context = createAppContext()` | 创建应用上下文 |
| `context.app = app` | 双向关联：context ↔ app |

**AppContext 的结构：**

```typescript
export interface AppContext {
  app: App                              // 应用实例
  config: AppConfig                     // 全局配置
  mixins: ComponentOptions[]            // 全局混入
  components: Record<string, Component> // 全局组件
  directives: Record<string, Directive> // 全局指令
  provides: Record<string | symbol, any> // 全局 provide
  optionsCache: WeakMap<...>            // 选项缓存
  propsCache: WeakMap<...>              // props 缓存
  emitsCache: WeakMap<...>              // emits 缓存
}
```

### 3.2 关联到根 VNode

| 源码片段 | 逻辑拆解 |
|---------|---------|
| `const vnode = createVNode(rootComponent, rootProps)` | 创建根 VNode，此时 `appContext` 为 `null` |
| `vnode.appContext = context` | **关键一行**：将 AppContext 关联到根 VNode |
| `render(vnode, container)` | 将带有 AppContext 的 VNode 传给渲染器 |

**源码位置：** `packages/runtime-core/src/apiCreateApp.ts:372-375`

```typescript
mount(rootContainer: HostElement, isHydrate?: boolean, namespace?: boolean | ElementNamespace): any {
  if (!isMounted) {
    const vnode = app._ceVNode || createVNode(rootComponent, rootProps)
    vnode.appContext = context  // ← 核心关联

    if (isHydrate && hydrate) {
      hydrate(vnode as VNode<Node, Element>, rootContainer as any)
    } else {
      render(vnode, rootContainer, namespace)
    }

    isMounted = true
    app._container = rootContainer
    return getComponentPublicInstance(vnode.component!)
  }
}
```

### 3.3 传递到组件实例

| 源码片段 | 逻辑拆解 |
|---------|---------|
| `const appContext = (parent ? parent.appContext : vnode.appContext)` | **继承逻辑**：有父组件则从父组件继承，否则从 VNode 获取 |
| `\|\| emptyAppContext` | **兜底保护**：确保始终有 AppContext |
| `instance.appContext = appContext` | 保存到组件实例上 |

**源码位置：** `packages/runtime-core/src/component.ts:createComponentInstance`

```typescript
export function createComponentInstance(
  vnode: VNode,
  parent: ComponentInternalInstance | null,
  suspense: SuspenseBoundary | null
): ComponentInternalInstance {
  const type = vnode.type as ConcreteComponent

  // 继承 AppContext
  const appContext = (parent ? parent.appContext : vnode.appContext) || emptyAppContext

  const instance: ComponentInternalInstance = {
    uid: uid++,
    vnode,
    type,
    parent,
    appContext,  // 保存在实例上
    // ... 其他属性
  }

  return instance
}
```

### 3.4 AppContext 的使用场景

| 使用场景 | 访问路径 | 说明 |
|---------|---------|------|
| 解析全局组件 | `instance.appContext.components[name]` | 查找全局注册的组件 |
| 解析全局指令 | `instance.appContext.directives[name]` | 查找全局注册的指令 |
| 依赖注入 | `instance.appContext.provides[key]` | 查找应用级 provide 值 |
| 全局配置 | `instance.appContext.config` | 访问 errorHandler、warnHandler 等 |
| 选项缓存 | `instance.appContext.optionsCache` | 缓存规范化后的组件选项 |

---

## 4. 细节补充：边界与性能优化

### 4.1 WeakMap 缓存机制

**为什么使用 WeakMap？**

```typescript
export interface AppContext {
  optionsCache: WeakMap<ComponentOptions, NormalizedPropsOptions>
  propsCache: WeakMap<ConcreteComponent, NormalizedPropsOptions>
  emitsCache: WeakMap<ConcreteComponent, ObjectEmitsOptions | null>
}
```

| 优势 | 说明 |
|-----|------|
| **自动垃圾回收** | 当组件对象被销毁时，缓存自动清理，防止内存泄漏 |
| **O(1) 查找** | 直接通过组件对象作为 key 查找，无需遍历 |
| **隔离性** | 不同应用实例的缓存互不干扰 |

### 4.2 emptyAppContext 兜底

```typescript
export const emptyAppContext = createAppContext()
```

**作用：**
- 防止 `appContext` 为 `null` 导致的运行时错误
- 为测试环境提供默认上下文
- 确保组件始终能访问到 `appContext.config` 等属性

### 4.3 多应用实例隔离

```javascript
const app1 = createApp(App1)
const app2 = createApp(App2)

app1.component('MyButton', Button1)  // 只在 app1 中注册
app2.component('MyButton', Button2)  // 只在 app2 中注册

app1.mount('#app1')  // app1 的组件树使用 Button1
app2.mount('#app2')  // app2 的组件树使用 Button2
```

**隔离机制：**
- 每个 app 有独立的 AppContext
- 根 VNode 关联各自的 AppContext
- 子组件继承时不会跨应用

### 4.4 SSR 场景的特殊处理

在服务端渲染时，AppContext 的关联方式相同，但需要注意：

```typescript
// 每个请求创建独立的 app 实例
app.get('*', (req, res) => {
  const app = createSSRApp(App)
  const html = await renderToString(app)
  res.send(html)
})
```

**关键点：**
- 每个请求都有独立的 AppContext，避免状态污染
- 客户端水合时，会重新创建 AppContext 并关联

### 4.5 自定义元素（Custom Elements）的特殊路径

```typescript
const vnode = app._ceVNode || createVNode(rootComponent, rootProps)
```

**说明：**
- `app._ceVNode` 用于自定义元素场景
- 自定义元素可能需要复用同一个 VNode
- 普通场景下 `_ceVNode` 为 `undefined`，走正常流程

---

## 5. 总结与延伸

### 一句话总结

**AppContext 通过 `vnode.appContext = context` 关联到根 VNode，然后通过组件实例的父子继承机制传递到整个组件树，实现应用级配置的全局共享。**

### 核心设计亮点

1. **简洁高效**：只需一行赋值代码，时间复杂度 O(1)
2. **自动传播**：子组件自动继承，无需手动传递
3. **内存安全**：使用 WeakMap 缓存，防止内存泄漏
4. **多应用隔离**：每个应用实例有独立的 AppContext

### 面试考点

**Q1: AppContext 是在什么时候创建的？**
- 在 `createApp(rootComponent)` 调用时创建
- 通过 `createAppContext()` 函数初始化

**Q2: AppContext 如何关联到根组件？**
- 在 `app.mount()` 时，通过 `vnode.appContext = context` 关联到根 VNode
- 在创建根组件实例时，从 `vnode.appContext` 获取

**Q3: 子组件如何获取 AppContext？**
- 通过 `createComponentInstance` 函数中的继承逻辑
- 优先从父组件的 `parent.appContext` 获取
- 如果没有父组件（根组件），则从 `vnode.appContext` 获取

**Q4: 为什么使用 WeakMap 而不是 Map？**
- WeakMap 的 key 是弱引用，当组件对象被销毁时，缓存会自动清理
- 防止内存泄漏，特别是在长时间运行的应用中

**Q5: 多个 Vue 应用实例如何隔离？**
- 每个应用实例有独立的 AppContext
- 全局注册的组件、指令、provide 值都存储在各自的 AppContext 中
- 不同应用的组件树不会共享配置

### 延伸阅读

- **依赖注入系统**：AppContext 的 `provides` 如何与组件级 `provide/inject` 配合工作
- **组件解析机制**：如何通过 AppContext 查找全局组件和局部组件
- **插件系统**：`app.use(plugin)` 如何利用 AppContext 注册全局功能
- **应用配置**：`app.config` 的各项配置如何通过 AppContext 传递到组件

### 关键源码位置

| 文件 | 关键函数/代码 |
|-----|-------------|
| `packages/runtime-core/src/apiCreateApp.ts` | `createAppContext()`, `mount()` 方法 |
| `packages/runtime-core/src/component.ts` | `createComponentInstance()` |
| `packages/runtime-core/src/apiCreateApp.ts:375` | `vnode.appContext = context` |
