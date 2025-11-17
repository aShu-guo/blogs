# Vue 3 启动机制详解

从 `createApp()` 到 `mount()` 的完整流程和关键实现细节

## 目录
- [概述](#概述)
- [核心概念](#核心概念)
- [启动流程](#启动流程)
- [关键API详解](#关键api详解)
- [内部数据结构](#内部数据结构)
- [性能优化](#性能优化)

---


## 概述

Vue 3 的启动机制包含两个主要阶段：

1. **应用创建阶段** (`createApp`) - 初始化全局配置和上下文
2. **组件挂载阶段** (`mount`) - 创建组件实例并渲染到 DOM

```
┌─────────────────────────────────────────────────────┐
│              createApp(RootComponent)               │
│                                                     │
│  • 创建 AppContext (全局应用上下文)                    │
│  • 初始化配置对象                                     │
│  • 返回 App 实例 (含 use、mount、provide 等)      │
└──────────────────┬──────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────┐
│           app.mount(rootContainer)                  │
│                                                     │
│  • 创建根 VNode                                     │
│  • 调用 render() 函数                              │
│  • 触发 patch() 进行虚拟 DOM 比对                  │
└──────────────────┬──────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────┐
│         patch() → processComponent()                │
│                                                     │
│  • 判断是否为新组件                                │
│  • 调用 mountComponent()                           │
└──────────────────┬──────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────┐
│       mountComponent() 组件挂载流程                 │
│                                                     │
│  1️⃣  createComponentInstance()  - 创建实例         │
│  2️⃣  setupComponent()           - 初始化组件       │
│  3️⃣  setupStatefulComponent()  - 调用 setup()     │
│  4️⃣  setupRenderEffect()        - 建立响应式追踪  │
│  5️⃣  renderComponentRoot()     - 生成虚拟 DOM    │
│  6️⃣  patch() (subTree)         - 渲染子树        │
└──────────────────┬──────────────────────────────────┘
                   │
                   ▼
              ✅ 应用启动完成
```

---

## 核心概念

### AppContext (应用全局上下文)

应用上下文包含全局配置、插件、组件、指令等信息，所有组件都共享：

```typescript
interface AppContext {
  app: App
  config: AppConfig                    // 全局配置
  mixins: ComponentOptions[]           // 全局 mixins
  components: Record<string, Component> // 全局组件
  directives: Record<string, Directive> // 全局指令
  provides: Record<string | symbol, any> // provide() 注入
  optionsCache: WeakMap<Component, MergedComponentOptions>
  propsCache: WeakMap<Component, NormalizedPropsOptions>
  emitsCache: WeakMap<Component, ObjectEmitsOptions>
}
```

**作用**：
- 存储全局配置和状态
- 缓存组件选项、props、emits（使用 WeakMap 实现自动清理）
- 支持插件系统和 provide/inject

### VNode (虚拟节点)

虚拟 DOM 节点，是 Vue 描述 UI 的核心数据结构：

```typescript
interface VNode {
  type: VNodeTypes           // 组件类型或标签名
  props: Record<string, any> | null  // 属性
  children: VNodeArrayChildren // 子节点
  el: Element | null         // 关联的真实 DOM 节点
  appContext: AppContext | null // 应用上下文
  component: ComponentInternalInstance | null // 组件实例
  // ... 其他字段
}
```

### ComponentInternalInstance (组件内部实例)

组件的内部运行时实例，包含组件的所有运行时状态：

```typescript
interface ComponentInternalInstance {
  // 基础属性
  uid: number                    // 唯一标识
  vnode: VNode                  // 关联的 VNode
  type: ConcreteComponent       // 组件定义
  parent: ComponentInternalInstance | null // 父组件
  root: ComponentInternalInstance         // 根组件
  appContext: AppContext                  // 应用上下文

  // 响应式相关
  scope: EffectScope           // 效果作用域
  effect: ReactiveEffect | null // 更新效果
  update: () => void           // 更新函数（响应式追踪）

  // 状态管理
  data: Data                   // data() 返回的数据
  props: Data                  // 规范化后的 props
  attrs: Data                  // 其他属性
  slots: Slots                 // 插槽
  setupState: Data             // setup() 返回的数据

  // 生命周期钩子
  bc: LifecycleHook | null    // beforeCreate
  c: LifecycleHook | null     // created
  bm: LifecycleHook | null    // beforeMount
  m: LifecycleHook | null     // mounted
  bu: LifecycleHook | null    // beforeUpdate
  u: LifecycleHook | null     // updated
  um: LifecycleHook | null    // unmounted
  // ... 其他钩子

  // 标志状态
  isMounted: boolean           // 是否已挂载
  isUnmounted: boolean         // 是否已卸载
}
```

---

## 启动流程

### 阶段 1: createApp() - 应用创建

**入口**: 完整构建版本

**关键代码**: 应用创建和初始化逻辑

#### 1.1 创建应用上下文

```typescript
// 第 1 步：创建 AppContext
const context = createAppContext() // 行 267

// AppContext 包含：
// - config: 全局配置对象
// - components/directives: 全局注册表
// - mixins: 全局 mixins 数组
// - provides: provide 注入对象
// - optionsCache/propsCache/emitsCache: WeakMap 缓存
```

**为什么使用 WeakMap？**
- 自动垃圾回收：当组件被销毁时，缓存也会被自动清理
- 防止内存泄漏：不会阻止组件被回收
- 性能优化：快速查找且不占用内存空间

#### 1.2 创建 App 对象

```typescript
// 第 2 步：定义 app 对象 (行 273-479)
const app: App = {
  _uid: uid++,              // 应用唯一 ID
  _component: rootComponent, // 根组件
  _props: rootProps,        // 根组件 props
  _container: null,         // 挂载容器（mount 时赋值）
  _context: context,        // 应用上下文
  _instance: null,          // 根组件实例（mount 时赋值）

  // ... 各种 API 方法
}
```

#### 1.3 App API 详解

**use(plugin, ...options)** - 安装插件
```typescript
use(plugin: Plugin, ...options: any[]) {
  if (installedPlugins.has(plugin)) {
    warn('Plugin has already been applied')
    return app
  }

  installedPlugins.add(plugin)

  // 调用插件的 install 方法
  if (isFunction(plugin.install)) {
    plugin.install(app, ...options)
  } else if (isFunction(plugin)) {
    plugin(app, ...options)
  }
  return app
}
```

**component(name, component?)** - 全局组件注册
```typescript
component(name: string, component?: Component) {
  if (!component) {
    // 获取已注册组件
    return context.components[name]
  }
  // 注册新组件
  context.components[name] = component
  return app
}
```

**provide(key, value)** - 全局注入
```typescript
provide(key, value) {
  context.provides[key as string | symbol] = value
  return app
}
```

---

### 阶段 2: app.mount() - 组件挂载

#### 2.1 挂载入口

```typescript
mount(rootContainer: HostElement, isHydrate?: boolean, namespace?: ElementNamespace) {
  if (!isMounted) {
    // 第 1 步：创建根 VNode
    const vnode = app._ceVNode || createVNode(rootComponent, rootProps)
    // 行 372

    // 第 2 步：附加应用上下文到 VNode
    vnode.appContext = context
    // 行 375

    // 第 3 步：调用渲染函数
    if (isHydrate && hydrate) {
      // SSR 水合模式
      hydrate(vnode as VNode<Node, Element>, rootContainer as any)
    } else {
      // 正常渲染模式
      render(vnode, rootContainer, namespace)
      // 行 398
    }

    isMounted = true
    app._container = rootContainer
    ;(rootContainer as any).__vue_app__ = app // 标记容器
  }
}
```

#### 2.2 render() 函数

```typescript
// render 函数由 createRenderer() 返回
// 调用流程：render() → patch()
render(vnode, container, namespace)
  └─→ patch(null, vnode, container, anchor, parentComponent, parentSuspense, namespace)
      └─→ processComponent(vnode, ...) // 处理组件类型
          └─→ mountComponent(...) // 首次挂载
```

---

### 阶段 3: createComponentInstance - 实例创建

#### 3.1 创建组件实例

```typescript
export function createComponentInstance(
  vnode: VNode,
  parent: ComponentInternalInstance | null,
  suspense: SuspenseBoundary | null,
): ComponentInternalInstance {
  const type = vnode.type as ConcreteComponent

  // 继承父组件的应用上下文
  const appContext =
    (parent ? parent.appContext : vnode.appContext) || emptyAppContext

  const instance: ComponentInternalInstance = {
    uid: uid++,
    vnode,
    type,
    parent,
    appContext,
    root: null!, // 稍后设置

    // 响应式相关
    scope: new EffectScope(true /* detached */), // 行 629
    effect: null!,
    update: null!,

    // 状态（初始化为 EMPTY_OBJ）
    data: EMPTY_OBJ,
    props: EMPTY_OBJ,
    attrs: EMPTY_OBJ,
    slots: EMPTY_OBJ,
    setupState: EMPTY_OBJ,

    // 缓存和代理
    accessCache: null!,         // 属性访问缓存
    renderCache: [],            // 渲染缓存

    // Props 和 Emits 规范化
    propsOptions: normalizePropsOptions(type, appContext), // 行 646
    emitsOptions: normalizeEmitsOptions(type, appContext), // 行 647

    // 生命周期钩子（初始化为 null）
    bm: null, m: null, bu: null, u: null, um: null, // ...

    // 状态标志
    isMounted: false,
    isUnmounted: false,
  }

  // 设置 emit 方法
  instance.emit = emit.bind(null, instance) // 行 701

  // 设置根指向
  instance.root = parent ? parent.root : instance // 行 700

  return instance
}
```

**为什么创建 EffectScope？**
- 每个组件有独立的响应式作用域
- 当组件卸载时，可以一次性清理所有副作用
- 防止副作用泄漏到其他组件

---

### 阶段 4: setupComponent - 组件初始化

#### 4.1 初始化 Props 和 Slots

```typescript
export function setupComponent(
  instance: ComponentInternalInstance,
  isSSR = false,
  optimized = false,
): Promise<void> | undefined {
  const { props, children } = instance.vnode
  const isStateful = isStatefulComponent(instance)

  // 第 1 步：初始化 props
  initProps(instance, props, isStateful, isSSR)
  // 行 811

  // 第 2 步：初始化 slots（插槽）
  initSlots(instance, children, optimized || isSSR)
  // 行 812

  // 第 3 步：如果是有状态组件，调用 setupStatefulComponent
  const setupResult = isStateful
    ? setupStatefulComponent(instance, isSSR)
    : undefined

  return setupResult
}
```

---

### 阶段 5: setupStatefulComponent - 调用 setup()

#### 5.1 创建 Render Proxy（渲染代理）

```typescript
// 行 853-855
instance.accessCache = Object.create(null) // 属性访问缓存
instance.proxy = new Proxy(instance.ctx, PublicInstanceProxyHandlers)
```

**accessCache 的作用**：
缓存属性查找结果，避免重复执行 proxy handlers。例如：
```
第 1 次访问 this.message → 查找 → 缓存结果
第 2 次访问 this.message → 直接返回缓存 → 性能提升
```

#### 5.2 调用 setup() 函数

```typescript
// 行 860-877
const { setup } = Component
if (setup) {
  pauseTracking() // 暂停响应式追踪（设置阶段）

  // 根据参数个数判断是否需要 context
  const setupContext = (instance.setupContext =
    setup.length > 1 ? createSetupContext(instance) : null)

  // 设置当前实例
  const reset = setCurrentInstance(instance)

  // 调用 setup 函数
  const setupResult = callWithErrorHandling(
    setup,
    instance,
    ErrorCodes.SETUP_FUNCTION,
    [
      __DEV__ ? shallowReadonly(instance.props) : instance.props,
      setupContext, // 第二个参数：{ attrs, slots, emit, expose }
    ],
  )

  resetTracking() // 恢复响应式追踪
  reset() // 恢复前一个实例
}
```

#### 5.3 createSetupContext - 创建 Setup 参数

```typescript
export function createSetupContext(
  instance: ComponentInternalInstance,
): SetupContext {
  const expose: SetupContext['expose'] = (exposed) => {
    instance.exposed = exposed || {}
  }

  return {
    // 在开发模式下使用 getters（防止测试库覆盖）
    get attrs() {
      return new Proxy(instance.attrs, attrsProxyHandlers)
    },
    get slots() {
      return getSlotsProxy(instance)
    },
    get emit() {
      return (event: string, ...args: any[]) =>
        instance.emit(event, ...args)
    },
    expose, // 用于暴露公共属性
  }
}
```

#### 5.4 处理 setup() 返回值

```typescript
export function handleSetupResult(
  instance: ComponentInternalInstance,
  setupResult: unknown,
  isSSR: boolean,
): void {
  if (isFunction(setupResult)) {
    // setup 返回函数 → 作为 render 函数
    instance.render = setupResult as InternalRenderFunction
  } else if (isObject(setupResult)) {
    // setup 返回对象 → 作为响应式数据
    // 使用 proxyRefs 自动解包 ref
    instance.setupState = proxyRefs(setupResult)
  } else if (__DEV__ && setupResult !== undefined) {
    warn(`setup() should return an object. Received: ${typeof setupResult}`)
  }

  finishComponentSetup(instance, isSSR)
}
```

**proxyRefs 的作用**：
```typescript
// setup 返回的 ref 在模板中自动解包
const count = ref(0)
return { count }

// 在模板中可以直接使用：
// {{ count }} 而不需要 {{ count.value }}
```

---

### 阶段 6: setupRenderEffect - 建立响应式追踪

这是最关键的步骤！建立了响应式系统和更新机制。

#### 6.1 创建 ReactiveEffect

```typescript
const setupRenderEffect: SetupRenderEffectFn = (
  instance,
  initialVNode,
  container,
  anchor,
  parentSuspense,
  namespace,
  optimized,
) => {
  // 组件更新函数
  const componentUpdateFn = () => {
    if (!instance.isMounted) {
      // ======== 挂载逻辑 ========
    } else {
      // ======== 更新逻辑 ========
    }
  }

  // 创建响应式效果对象
  const effect = (instance.effect = new ReactiveEffect(
    componentUpdateFn,
    () => queueJob(instance.update), // 调度器
    instance.scope,
  ))

  // 将更新函数存储在实例上
  instance.update = effect.run.bind(effect)

  // 第一次渲染
  effect.run()
}
```

**ReactiveEffect 如何工作：**

1. **依赖收集**：当 render 函数执行时，访问响应式数据会触发 getter，从而收集依赖
2. **依赖追踪**：通过 `Track` 函数记录"响应式数据 ↔ 组件"的关系
3. **变化通知**：当响应式数据改变时，触发 setter，通知所有依赖的 effect
4. **自动更新**：执行 `instance.update()`，重新渲染组件

```
响应式数据改变
    ↓
触发 Proxy setter
    ↓
通知所有依赖的 ReactiveEffect
    ↓
将更新加入调度队列（微任务）
    ↓
批量执行待处理的更新
```

#### 6.2 首次渲染逻辑

```typescript
const componentUpdateFn = () => {
  if (!instance.isMounted) {
    // =============== 挂载阶段 ===============

    // 1. 调用 beforeMount 钩子
    if (instance.bm) {
      invokeArrayFns(instance.bm)
    }

    // 2. 调用 onVnodeBeforeMount 钩子
    if (vnodeHook = props && props.onVnodeBeforeMount) {
      invokeVNodeHook(vnodeHook, parent, initialVNode)
    }

    // 3. 生成虚拟 DOM 子树
    const subTree = (instance.subTree = renderComponentRoot(instance))

    // 4. 递归 patch 子树（实际渲染到 DOM）
    patch(
      null,
      subTree,
      container,
      anchor,
      instance,
      parentSuspense,
      namespace,
    )

    // 5. 关联虚拟 DOM 节点到真实 DOM
    initialVNode.el = subTree.el

    // 6. 调用 mounted 钩子（异步）
    if (instance.m) {
      queuePostRenderEffect(instance.m, parentSuspense)
    }

    // 7. 调用 onVnodeMounted 钩子（异步）
    if (vnodeHook = props && props.onVnodeMounted) {
      queuePostRenderEffect(
        () => invokeVNodeHook(vnodeHook!, parent, initialVNode),
        parentSuspense,
      )
    }

    instance.isMounted = true
  } else {
    // =============== 更新阶段 ===============
    // ... 更新逻辑
  }
}
```

---

## 关键API详解

### 1. initProps - Props 初始化

```typescript
// props 的规范化过程：
// 1. 解析 Component.props 定义
// 2. 从 VNode.props 中提取对应的 props
// 3. 应用默认值
// 4. 验证 props 类型（开发模式）
// 5. 创建响应式 props 对象
```

### 2. initSlots - 插槽初始化

```typescript
// slots 的规范化过程：
// 1. 遍历 VNode.children
// 2. 提取具名插槽
// 3. 创建插槽函数（延迟求值）
// 4. 存储到 instance.slots
```

### 3. renderComponentRoot - 生成虚拟 DOM

```typescript
// 调用组件的 render 函数生成虚拟 DOM
export function renderComponentRoot(instance: ComponentInternalInstance): VNode {
  const {
    type: Component,
    vnode,
    proxy,
    withProxy,
    props,
    slots,
    attrs,
    emit,
    expose,
    render,
    renderCache,
    data,
    setupState,
    ctx,
  } = instance

  let result
  const renderProxy = withProxy || proxy

  // 调用 render 函数
  result = render.call(renderProxy, renderProxy)

  return result
}
```

### 4. patch - 虚拟 DOM 比对与更新

```typescript
const patch = (
  n1: VNode | null,        // 旧 VNode（首次为 null）
  n2: VNode,               // 新 VNode
  container: RendererElement,
  anchor: RendererElement | null = null,
  parentComponent: ComponentInternalInstance | null = null,
  parentSuspense: SuspenseBoundary | null = null,
  namespace: ElementNamespace | null = null,
): void => {
  // 根据 VNode 类型分派处理
  if (n1 === n2) return // 相同节点，跳过

  if (n1 && !isSameVNodeType(n1, n2)) {
    // 节点类型不同，卸载旧节点
    anchor = getNextHostNode(n1)
    unmount(n1, parentComponent, parentSuspense, true)
    n1 = null
  }

  const { type, ref, shapeFlag } = n2

  switch (type) {
    case Text:
      processText(n1, n2, container, anchor)
      break
    case Comment:
      processCommentNode(n1, n2, container, anchor)
      break
    case Fragment:
      processFragment(n1, n2, container, anchor, parentComponent, parentSuspense, namespace, optimized)
      break
    default:
      if (shapeFlag & ShapeFlags.ELEMENT) {
        // 处理 HTML 元素
        processElement(n1, n2, container, anchor, parentComponent, parentSuspense, namespace, optimized)
      } else if (shapeFlag & ShapeFlags.COMPONENT) {
        // 处理组件
        processComponent(n1, n2, container, anchor, parentComponent, parentSuspense, namespace, optimized)
      } else if (shapeFlag & ShapeFlags.TELEPORT) {
        // 处理 Teleport
        ;(type as typeof TeleportImpl).process(n1, n2, container, anchor, parentComponent, parentSuspense, namespace, optimized, internals)
      } else if (__FEATURE_SUSPENSE__ && shapeFlag & ShapeFlags.SUSPENSE) {
        // 处理 Suspense
        ;(type as typeof SuspenseImpl).process(n1, n2, container, anchor, parentComponent, parentSuspense, namespace, optimized, internals)
      }
  }
}
```

---

## 内部数据结构

### 1. AppConfig - 全局配置

```typescript
interface AppConfig {
  // 全局属性
  globalProperties: Record<string, any>

  // 错误处理
  errorHandler?: (err: unknown, instance: ComponentPublicInstance | null, info: string) => void
  warnHandler?: (msg: string, instance: ComponentPublicInstance | null, trace: string) => void

  // 编译器选项（完整构建）
  compilerOptions?: CompilerOptions

  // 性能监测
  performance?: boolean

  // 定制 isNativeTag
  isNativeTag?: (tag: string) => boolean

  // 选项合并策略
  optionMergeStrategies?: Record<string, (parentValue: any, childValue: any) => any>
}
```

### 2. ShapeFlags - VNode 形状标志

```typescript
// 用于快速判断 VNode 类型，避免多次类型检查
const ShapeFlags = {
  ELEMENT: 1,                    // HTML 元素
  FUNCTIONAL_COMPONENT: 1 << 1,  // 函数组件
  STATEFUL_COMPONENT: 1 << 2,    // 有状态组件
  TEXT_CHILDREN: 1 << 3,         // 文本子节点
  ARRAY_CHILDREN: 1 << 4,        // 数组子节点
  SLOTS_CHILDREN: 1 << 5,        // 插槽子节点
  TELEPORT: 1 << 6,              // Teleport 组件
  SUSPENSE: 1 << 7,              // Suspense 组件
  COMPONENT_SHOULD_KEEP_ALIVE: 1 << 8,   // KeepAlive
  COMPONENT_KEPT_ALIVE: 1 << 9,          // 被 KeepAlive 保留
}

// 使用位运算判断：
if (vnode.shapeFlag & ShapeFlags.COMPONENT) {
  // 是组件
}
```

### 3. PatchFlags - 优化标志

```typescript
// 标记虚拟 DOM 的哪些部分需要更新，加速 diff
const PatchFlags = {
  TEXT: 1,              // 文本内容变化
  CLASS: 1 << 1,        // class 变化
  STYLE: 1 << 2,        // style 变化
  PROPS: 1 << 3,        // props 变化
  FULL_PROPS: 1 << 4,   // 需要完整比对 props
  HYDRATE_EVENTS: 1 << 5, // SSR 水合时需要绑定事件
  STABLE_FRAGMENT: 1 << 6, // Fragment 稳定
  KEYED_FRAGMENT: 1 << 7,  // Fragment 有 key
  UNKEYED_FRAGMENT: 1 << 8, // Fragment 无 key
  NEED_PATCH: 1 << 9,      // 需要完整 patch
  DYNAMIC_SLOTS: 1 << 10,   // 插槽可能变化
}
```

---

## 性能优化

### 1. WeakMap 缓存

```typescript
// apiCreateApp.ts 行 240-242
optionsCache: new WeakMap(),  // 缓存组件选项规范化结果
propsCache: new WeakMap(),    // 缓存 props 规范化结果
emitsCache: new WeakMap(),    // 缓存 emits 规范化结果
```

**优势**：
- 组件被回收时，缓存自动清理
- 避免内存泄漏
- 快速查找（O(1)）

### 2. accessCache - 属性访问缓存

```typescript
// component.ts 行 853
instance.accessCache = Object.create(null)
```

当访问 `this.message` 时：
```
render 函数执行
  ↓
访问 this.message
  ↓
Proxy handler 拦截
  ↓
accessCache 中查找
  ├─ 找到 → 返回缓存值
  └─ 未找到 → 执行查找逻辑 → 缓存结果
```

### 3. 响应式追踪的暂停/恢复

```typescript
// component.ts 行 862, 876
pauseTracking()     // 调用 setup 前暂停追踪
// ... setup 函数执行
resetTracking()     // setup 后恢复追踪
```

**原因**：setup 函数中的同步代码不应该建立响应式依赖，只有在 render 时才需要。

### 4. 批量更新调度

```typescript
// 不是立即更新，而是加入队列
const update = () => {
  queueJob(instance.update)  // 加入微任务队列
}

// 相同的数据改变多次 → 只执行一次更新
count.value++
count.value++
count.value++
// 只会触发一次组件更新！
```

### 5. Fragment 优化

```typescript
// 处理 <template> 和 <Suspense> 等多根组件
// 使用 Fragment 包裹而不是额外的 div
```

### 6. PatchFlags 标记

编译器生成的代码会标记哪些节点可能变化：

```typescript
// 编译前：
// <div :id="id" class="static">{{ message }}</div>

// 编译后（带 PatchFlag）：
_createVNode('div',
  {
    id: id,
    class: 'static'
  },
  message,
  PatchFlags.TEXT    // ← 只有文本可能变化
)
```

在更新时，只检查标记为变化的属性。

---

## 总结

Vue 3 的启动机制遵循以下流程：

```
1. createApp(Component)
   ↓
2. app.mount(container)
   ↓
3. render() → patch()
   ↓
4. mountComponent()
   ├─ createComponentInstance()  [创建实例]
   ├─ setupComponent()           [初始化 props/slots]
   ├─ setupStatefulComponent()  [调用 setup()]
   ├─ handleSetupResult()       [处理返回值]
   ├─ finishComponentSetup()    [完成初始化]
   └─ setupRenderEffect()       [建立响应式！]
      ├─ renderComponentRoot()  [生成虚拟 DOM]
      └─ patch(subTree)         [渲染到 DOM]
```

**关键特点**：

- **单向数据流**：Props 从父到子
- **响应式追踪**：通过 Proxy 和 ReactiveEffect 实现自动更新
- **微任务调度**：批量处理更新，提高性能
- **生命周期钩子**：在特定时刻执行用户代码
- **模块化设计**：renderer 可以自定义（支持 SSR、VR 等）

---

## 相关文件速查

| 功能 | 文件 | 关键函数 |
|------|------|--------|
| 应用创建 | `apiCreateApp.ts` | `createApp()`, `createAppContext()` |
| 组件初始化 | `component.ts` | `createComponentInstance()`, `setupComponent()` |
| 虚拟 DOM | `vnode.ts` | `createVNode()`, `isVNode()` |
| 渲染引擎 | `renderer.ts` | `render()`, `patch()`, `mountComponent()` |
| Props 处理 | `componentProps.ts` | `initProps()`, `normalizePropsOptions()` |
| 插槽处理 | `componentSlots.ts` | `initSlots()`, `resolveSlots()` |
| 响应式 | `@vue/reactivity` | `ref()`, `reactive()`, `effect()` |
| 编译器 | `@vue/compiler-dom` | `compile()`, `compileToFunction()` |
