# 组件初始化 - mountComponent 到 setup 执行

## 1. 概念先行：为什么需要组件初始化？

### 生活类比：员工入职流程

想象你是一家公司的 HR，负责新员工入职：

**没有初始化流程（直接上岗）**：

```
新员工到岗 → 直接开始工作
问题：
- 没有工位（instance）
- 没有工具（props）
- 没有团队（slots）
- 不知道职责（setup）
结果：无法工作！
```

**有初始化流程（完整入职）**：

```
1. 创建档案 → createComponentInstance（建立员工档案）
2. 分配资源 → setupComponent（分配工位、工具、团队）
3. 岗前培训 → setupStatefulComponent（执行 setup 函数）
4. 确定职责 → handleSetupResult（根据培训结果分配角色）
5. 正式上岗 → finishComponentSetup（完成最后准备）
结果：员工可以高效工作！
```

### 核心问题

```typescript
// VNode 只是"招聘信息"
const vnode = {
  type: MyComponent,
  props: { name: 'Alice' },
  children: [/* slots */]
};

// 需要转化为"真实员工"
const instance = {
  uid: 1,
  props: { name: 'Alice' },
  setupState: { count: ref(0) },
  render: () => h('div', ...),
  // ... 120+ 个属性
};

// 问题：如何从 VNode 创建完整的运行时实例？
```

## 2. 最小实现：手写组件初始化

```javascript
// 简化的组件初始化流程
let uid = 0;

// 步骤 1: 创建组件实例
function createComponentInstance(vnode, parent) {
  const instance = {
    uid: uid++,
    vnode,
    type: vnode.type,
    parent,
    appContext: parent ? parent.appContext : vnode.appContext,
    root: null,

    // 响应式系统
    scope: { effects: [], stop() { /* ... */ } },

    // 状态数据
    props: {},
    attrs: {},
    slots: {},
    setupState: {},
    data: {},

    // 渲染相关
    proxy: null,
    render: null,

    // 缓存
    accessCache: null,

    // 生命周期
    isMounted: false,
  };

  // 设置 root 指针
  instance.root = parent ? parent.root : instance;

  return instance;
}

// 步骤 2: 初始化 Props 和 Slots
function setupComponent(instance) {
  const { props, children } = instance.vnode;

  // 初始化 Props
  initProps(instance, props);

  // 初始化 Slots
  initSlots(instance, children);

  // 执行 setup
  setupStatefulComponent(instance);
}

function initProps(instance, rawProps) {
  const props = {};
  const attrs = {};

  // 分离 props 和 attrs
  for (const key in rawProps) {
    if (isInPropsOptions(key, instance.type.props)) {
      props[key] = rawProps[key];
    } else {
      attrs[key] = rawProps[key];
    }
  }

  instance.props = reactive(props);
  instance.attrs = reactive(attrs);
}

function initSlots(instance, children) {
  if (typeof children === 'object') {
    instance.slots = children;
  } else {
    instance.slots = {};
  }
}

// 步骤 3: 执行 setup 函数
function setupStatefulComponent(instance) {
  const Component = instance.type;

  // 创建属性访问缓存
  instance.accessCache = {};

  // 创建 Render Proxy
  instance.proxy = new Proxy(instance, {
    get(target, key) {
      // 优先级：setupState > props > data
      if (key in target.setupState) return target.setupState[key];
      if (key in target.props) return target.props[key];
      if (key in target.data) return target.data[key];
    }
  });

  // 执行 setup
  if (Component.setup) {
    const setupContext = {
      attrs: instance.attrs,
      slots: instance.slots,
      emit: (event, ...args) => { /* ... */ }
    };

    const setupResult = Component.setup(instance.props, setupContext);

    // 处理返回值
    handleSetupResult(instance, setupResult);
  }

  finishComponentSetup(instance);
}

// 步骤 4: 处理 setup 返回值
function handleSetupResult(instance, setupResult) {
  if (typeof setupResult === 'function') {
    // 返回渲染函数
    instance.render = setupResult;
  } else if (typeof setupResult === 'object') {
    // 返回响应式对象
    instance.setupState = proxyRefs(setupResult);
  }
}

// 步骤 5: 完成初始化
function finishComponentSetup(instance) {
  const Component = instance.type;

  // 如果没有 render，使用组件的 render
  if (!instance.render) {
    instance.render = Component.render;
  }

  // 处理 Options API
  if (Component.data) {
    instance.data = reactive(Component.data.call(instance.proxy));
  }
}

// 测试
const MyComponent = {
  props: ['name'],
  setup(props) {
    const count = ref(0);
    return { count };
  },
  render() {
    return h('div', `${this.name}: ${this.count}`);
  }
};

const vnode = { type: MyComponent, props: { name: 'Alice' } };
const instance = createComponentInstance(vnode, null);
setupComponent(instance);

console.log('Instance:', instance);
console.log('Props:', instance.props); // { name: 'Alice' }
console.log('SetupState:', instance.setupState); // { count: ref(0) }
console.log('Render:', instance.render); // function
```

## 3. 逐行解剖：Vue 3 的实现

### 3.1 createComponentInstance - 创建组件实例

| 源码片段                                                                                      | 逻辑拆解                                          |
|-------------------------------------------------------------------------------------------|-----------------------------------------------|
| `const type = vnode.type as ConcreteComponent`                                            | **提取组件定义**：从 VNode 获取组件对象                     |
| `const appContext = (parent ? parent.appContext : vnode.appContext) \|\| emptyAppContext` | **AppContext 继承**：子组件从父组件继承，根组件从 VNode 获取     |
| `const instance: ComponentInternalInstance = { uid: uid++, ... }`                         | **创建实例对象**：初始化 120+ 个属性                       |
| `scope: new EffectScope(true)`                                                            | **隔离作用域**：detached=true 表示独立的响应式作用域，组件卸载时批量清理 |
| `props: EMPTY_OBJ`                                                                        | **延迟初始化**：使用共享的空对象，减少内存分配                     |
| `accessCache: null!`                                                                      | **属性访问缓存**：首次访问后缓存查找路径，后续访问 10+ 倍快            |
| `propsOptions: normalizePropsOptions(type, appContext)`                                   | **Props 定义缓存**：使用 WeakMap 缓存，避免重复规范化          |
| `provides: parent ? parent.provides : Object.create(appContext.provides)`                 | **Provides 链式继承**：子组件继承父组件，根组件继承 appContext   |
| `instance.root = parent ? parent.root : instance`                                         | **Root 指针**：所有组件都指向根组件实例                      |
| `instance.emit = emit.bind(null, instance)`                                               | **绑定 emit**：预绑定 instance，调用时自动传递              |

```typescript
export function createComponentInstance(
  vnode: VNode,
  parent: ComponentInternalInstance | null,
  suspense: SuspenseBoundary | null,
): ComponentInternalInstance {
  const type = vnode.type as ConcreteComponent;

  // AppContext 树形继承
  const appContext = (parent ? parent.appContext : vnode.appContext) || emptyAppContext;

  const instance: ComponentInternalInstance = {
    uid: uid++,
    vnode,
    type,
    parent,
    appContext,
    root: null!,

    // 响应式系统
    scope: new EffectScope(true /* detached */),
    effect: null!,
    update: null!,

    // 状态数据
    props: EMPTY_OBJ,
    attrs: EMPTY_OBJ,
    slots: EMPTY_OBJ,
    setupState: EMPTY_OBJ,
    data: EMPTY_OBJ,

    // 渲染相关
    proxy: null,
    render: null,

    // 缓存优化
    accessCache: null!,
    propsOptions: normalizePropsOptions(type, appContext),

    // Provide/Inject
    provides: parent ? parent.provides : Object.create(appContext.provides),

    // 生命周期
    isMounted: false,
    // ... 其他属性
  };

  instance.root = parent ? parent.root : instance;
  instance.emit = emit.bind(null, instance);

  return instance;
}
```

### 3.2 setupComponent - Props 和 Slots 初始化

| 源码片段                                                  | 逻辑拆解                                      |
|-------------------------------------------------------|-------------------------------------------|
| `const { props, children } = instance.vnode`          | **提取 VNode 数据**：获取父组件传入的 props 和 children |
| `const isStateful = isStatefulComponent(instance)`    | **判断组件类型**：有状态组件（有 setup/data）vs 函数式组件    |
| `initProps(instance, props, isStateful, isSSR)`       | **初始化 Props**：分离 props 和 attrs，应用默认值，响应式化 |
| `initSlots(instance, children, optimized \|\| isSSR)` | **初始化 Slots**：规范化插槽为函数形式                  |
| `setupStatefulComponent(instance, isSSR)`             | **执行 setup**：仅针对有状态组件，函数式组件跳过             |

```typescript
export function setupComponent(
  instance: ComponentInternalInstance,
  isSSR = false,
  optimized = false,
): Promise<void> | undefined {
  const { props, children } = instance.vnode;
  const isStateful = isStatefulComponent(instance);

  // 步骤 1: 初始化 Props
  initProps(instance, props, isStateful, isSSR);

  // 步骤 2: 初始化 Slots
  initSlots(instance, children, optimized || isSSR);

  // 步骤 3: 执行 setup（仅有状态组件）
  const setupResult = isStateful
    ? setupStatefulComponent(instance, isSSR)
    : undefined;

  return setupResult;
}
```

### 3.3 initProps - Props 初始化

| 源码片段                                             | 逻辑拆解                                 |
|--------------------------------------------------|--------------------------------------|
| `const props: Data = {}; const attrs: Data = {}` | **创建容器**：分别存储 props 和 attrs          |
| `for (const key in rawProps)`                    | **遍历原始 props**：处理父组件传入的所有属性          |
| `if (isInPropsOptions(key, propsOptions))`       | **判断是否声明**：检查属性是否在组件 props 选项中声明     |
| `props[key] = value`                             | **分配到 props**：声明的属性放入 props          |
| `attrs[key] = value`                             | **分配到 attrs**：未声明的属性放入 attrs（$attrs） |
| `setFullProps(instance, props, rawProps, attrs)` | **应用默认值**：为缺失的 props 应用默认值           |
| `instance.props = reactive(props)`               | **响应式化 props**：包装为响应式对象              |
| `instance.attrs = reactive(attrs)`               | **响应式化 attrs**：包装为响应式对象              |

### 3.4 initSlots - Slots 初始化

| 源码片段                                                        | 逻辑拆解                   |
|-------------------------------------------------------------|------------------------|
| `if (instance.vnode.shapeFlag & ShapeFlags.SLOTS_CHILDREN)` | **快速判断**：使用位运算检查是否有插槽  |
| `const slots: Record<string, Slot> = Object.create(null)`   | **创建无原型对象**：避免原型链污染    |
| `for (const key in children)`                               | **遍历插槽**：处理所有命名插槽      |
| `slots[key] = normalizeSlot(children[key])`                 | **规范化插槽**：确保所有插槽都是函数形式 |
| `instance.slots = slots`                                    | **保存插槽**：存储到实例         |

### 3.5 setupStatefulComponent - Setup 函数执行

| 源码片段                                                                          | 逻辑拆解                                   |
|-------------------------------------------------------------------------------|----------------------------------------|
| `instance.accessCache = Object.create(null)`                                  | **创建访问缓存**：加速属性访问，首次后 10+ 倍快           |
| `instance.proxy = new Proxy(instance.ctx, PublicInstanceProxyHandlers)`       | **创建 Render Proxy**：统一模板中的 this 访问     |
| `pauseTracking()`                                                             | **暂停依赖追踪**：setup 只执行一次，不需要追踪           |
| `const setupContext = setup.length > 1 ? createSetupContext(instance) : null` | **创建 context**：仅当 setup 有 2 个参数时创建     |
| `const setupResult = callWithErrorHandling(setup, ...)`                       | **执行 setup**：错误处理包装，传入 props 和 context |
| `resetTracking()`                                                             | **恢复依赖追踪**：render 函数需要完整的追踪功能          |
| `handleSetupResult(instance, setupResult, isSSR)`                             | **处理返回值**：根据类型设置 render 或 setupState   |

```typescript
function setupStatefulComponent(
  instance: ComponentInternalInstance,
  isSSR: boolean,
): Promise<void> | undefined {
  const Component = instance.type as ComponentOptions;

  // 阶段 1: 创建 accessCache
  instance.accessCache = Object.create(null);

  // 阶段 2: 创建 Render Proxy
  instance.proxy = new Proxy(instance.ctx, PublicInstanceProxyHandlers);

  const { setup } = Component;
  if (setup) {
    // 阶段 3: 暂停依赖追踪
    pauseTracking();

    // 阶段 4: 创建 SetupContext
    const setupContext = setup.length > 1 ? createSetupContext(instance) : null;

    // 阶段 5: 执行 setup
    const reset = setCurrentInstance(instance);
    const setupResult = callWithErrorHandling(
      setup,
      instance,
      ErrorCodes.SETUP_FUNCTION,
      [__DEV__ ? shallowReadonly(instance.props) : instance.props, setupContext],
    );
    resetTracking();
    reset();

    // 阶段 6: 处理返回值
    return handleSetupResult(instance, setupResult, isSSR);
  } else {
    finishComponentSetup(instance, isSSR);
  }
}
```

### 3.6 handleSetupResult - 返回值处理

| 源码片段                                           | 逻辑拆解                            |
|------------------------------------------------|---------------------------------|
| `if (isFunction(setupResult))`                 | **判断是否函数**：setup 返回渲染函数         |
| `instance.render = setupResult`                | **设置 render**：直接作为组件的渲染函数       |
| `else if (isObject(setupResult))`              | **判断是否对象**：setup 返回响应式对象        |
| `instance.setupState = proxyRefs(setupResult)` | **自动解包 ref**：模板中无需 .value       |
| `finishComponentSetup(instance, isSSR)`        | **完成初始化**：处理 Options API，调用生命周期 |

```typescript
export function handleSetupResult(
  instance: ComponentInternalInstance,
  setupResult: unknown,
  isSSR: boolean,
): void {
  // 路径 1: 返回渲染函数
  if (isFunction(setupResult)) {
    instance.render = setupResult as InternalRenderFunction;
  }
  // 路径 2: 返回响应式对象
  else if (isObject(setupResult)) {
    instance.setupState = proxyRefs(setupResult);
  }
  // 路径 3: 其他类型（DEV 警告）
  else if (__DEV__ && setupResult !== undefined) {
    warn(`setup() should return an object. Received: ${typeof setupResult}`);
  }

  finishComponentSetup(instance, isSSR);
}
```

### 3.7 finishComponentSetup - 完成初始化

| 源码片段                                          | 逻辑拆解                                        |
|-----------------------------------------------|---------------------------------------------|
| `if (!instance.render && Component.template)` | **编译模板**：如果没有 render 且有 template，编译为 render |
| `if (Component.data)`                         | **初始化 data**：调用 data 函数，响应式化返回值             |
| `if (Component.computed)`                     | **初始化 computed**：创建计算属性                     |
| `if (Component.methods)`                      | **初始化 methods**：绑定方法到实例                     |
| `if (Component.watch)`                        | **初始化 watch**：创建侦听器                         |

## 4. 细节补充：边界与优化

### 4.1 边界情况 1：根组件 vs 子组件

```typescript
// 根组件
const rootInstance = createComponentInstance(vnode, null);
// appContext 从 vnode.appContext 获取（app.mount 时设置）
// root 指向自己
// provides 从 appContext.provides 继承

// 子组件
const childInstance = createComponentInstance(childVNode, parentInstance);
// appContext 从 parent.appContext 继承
// root 指向 parent.root
// provides 从 parent.provides 继承
```

### 4.2 边界情况 2：函数式组件

```typescript
const FunctionalComponent = (props) => h('div', props.message);

// 函数式组件跳过 setup
const instance = createComponentInstance(vnode, parent);
setupComponent(instance);
// isStateful = false，跳过 setupStatefulComponent
```

### 4.3 边界情况 3：setup 返回 Promise（异步组件）

```typescript
setup() {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({ count: ref(0) });
    }, 1000);
  });
}

// Vue 3 处理
if (isPromise(setupResult)) {
  instance.asyncDep = setupResult;
  // 等待 Promise resolve 后再处理
}
```

### 4.4 边界情况 4：Props 默认值

```typescript
// 组件定义
props: {
  name: { type: String, default: 'Guest' },
  age: { type: Number, default: () => 18 }
}

// 父组件传入
<MyComponent />

// initProps 处理
// name 缺失 → 应用默认值 'Guest'
// age 缺失 → 调用默认值函数 () => 18
```

### 4.5 边界情况 5：Slots 规范化

```typescript
// 场景 1: 函数形式（已规范化）
slots: {
  default: () => [h('div', 'content')]
}

// 场景 2: 数组形式（需要规范化）
slots: {
  default: [h('div', 'content')]
}
// normalizeSlot 包装为 () => [h('div', 'content')]

// 场景 3: 单个 VNode（需要规范化）
slots: {
  default: h('div', 'content')
}
// normalizeSlot 包装为 () => [h('div', 'content')]
```

### 4.6 性能优化 1：EMPTY_OBJ 共享

```typescript
// 不推荐：每个实例创建新对象
props: {},
attrs: {},
slots: {}

// 推荐：共享空对象常量
const EMPTY_OBJ = Object.freeze({});
props: EMPTY_OBJ,
attrs: EMPTY_OBJ,
slots: EMPTY_OBJ

// 优势：减少内存分配，GC 压力更小
```

### 4.7 性能优化 2：accessCache 加速

```typescript
// 第一次访问 this.message
PublicInstanceProxyHandlers.get(target, 'message') {
  // 检查 setupState → 找到！
  accessCache['message'] = AccessTypes.SETUP;
  return target.setupState.message;
}

// 第二次及以后访问 this.message
PublicInstanceProxyHandlers.get(target, 'message') {
  // 直接查缓存 → accessCache['message'] === AccessTypes.SETUP
  return target.setupState.message; // 跳过所有判断
}

// 性能提升：10+ 倍快速访问
```

### 4.8 性能优化 3：EffectScope 隔离

```typescript
// 每个组件有独立的 EffectScope
scope: new EffectScope(true /* detached */)

// setup 中创建的 effect 自动注册到 scope
setup() {
  const count = ref(0);
  watchEffect(() => console.log(count.value));
  // watchEffect 的 effect 自动注册到 instance.scope
}

// 组件卸载时批量清理
unmount(instance) {
  instance.scope.stop(); // 一次性停止所有 effect
}

// 优势：防止内存泄漏，清理效率高
```

### 4.9 性能优化 4：propsOptions 缓存

```typescript
// 使用 WeakMap 缓存 props 定义
const propsCache = new WeakMap();

function normalizePropsOptions(comp, appContext) {
  const cached = propsCache.get(comp);
  if (cached) return cached;

  // 规范化 props 定义
  const normalized = /* ... */;
  propsCache.set(comp, normalized);
  return normalized;
}

// 优势：同一组件多次创建实例时，props 定义只规范化一次
```

### 4.10 常见陷阱 1：在 setup 中修改 props

```typescript
setup(props) {
  // ❌ 错误：直接修改 props
  props.name = 'Bob';
  // DEV 模式：props 是 shallowReadonly，会警告
  // PROD 模式：可能导致父子组件状态不一致

  // ✓ 正确：使用本地状态
  const localName = ref(props.name);
  localName.value = 'Bob';
}
```

### 4.11 常见陷阱 2：setup 返回 VNode

```typescript
setup() {
  // ❌ 错误：返回 VNode
  return h('div', 'Hello');
  // 应该返回渲染函数
}

// ✓ 正确
setup() {
  return () => h('div', 'Hello');
}
```

### 4.12 常见陷阱 3：忘记 proxyRefs

```typescript
// 没有 proxyRefs
setup() {
  const count = ref(0);
  return { count };
}
// 模板中必须 {{ count.value }} ❌

// 有 proxyRefs（Vue 3 自动处理）
instance.setupState = proxyRefs({ count: ref(0) });
// 模板中可以 {{ count }} ✓
```

## 5. 总结与延伸

### 一句话总结

**组件初始化是将 VNode"招聘信息"转化为完整"员工档案"的过程，通过 createComponentInstance 创建实例、setupComponent
分配资源、setupStatefulComponent 执行培训，最终建立响应式系统和渲染能力。**

### 核心要点

1. **createComponentInstance**：创建 120+ 属性的实例对象，建立 AppContext 继承、EffectScope 隔离、Provides 链式继承
2. **setupComponent**：初始化 Props（分离 props/attrs）和 Slots（规范化为函数）
3. **setupStatefulComponent**：创建 Render Proxy、执行 setup 函数、暂停/恢复依赖追踪
4. **handleSetupResult**：根据返回值类型设置 render 或 setupState，proxyRefs 自动解包 ref
5. **finishComponentSetup**：处理 Options API（data/computed/methods/watch），调用生命周期钩子

### 面试考点

**Q1：组件初始化的完整流程是什么？**

A：流程分为 5 个步骤：

1. **createComponentInstance**：创建实例对象，初始化 120+ 属性
2. **setupComponent**：初始化 Props 和 Slots
3. **setupStatefulComponent**：创建 Render Proxy，执行 setup 函数
4. **handleSetupResult**：处理 setup 返回值（render 或 setupState）
5. **finishComponentSetup**：处理 Options API，调用生命周期钩子

**Q2：AppContext 如何在组件树中传递？**

A：传递方式：

1. **根组件**：从 `vnode.appContext` 获取（app.mount 时设置）
2. **子组件**：从 `parent.appContext` 继承
3. **效果**：整个组件树共享同一个 AppContext
4. **优势**：全局配置（components/directives/provides）自动传递

**Q3：为什么 setup 执行时要暂停依赖追踪？**

A：原因：

1. **setup 只执行一次**：不需要追踪数据访问
2. **避免误追踪**：setup 中访问的数据不应该绑定到响应式系统
3. **render 才需要追踪**：只有 render 函数中的数据访问才需要追踪
4. **性能优化**：减少不必要的依赖收集

**Q4：proxyRefs 的作用是什么？**

A：作用：

1. **自动解包 ref**：模板中访问 ref 无需 .value
2. **GET 操作**：`proxy.count` → `setupResult.count.value`（如果是 ref）
3. **SET 操作**：`proxy.count = 5` → `setupResult.count.value = 5`
4. **优势**：简化模板语法，提升开发体验

### 延伸阅读

- **下一章**：[Props 系统](./1-3.1-props.md) - 深入理解 Props 的规范化、验证和更新
- **相关章节**：[Render Effect](./1-5-render-effect.md) - 了解初始化后如何建立响应式渲染
- **实践建议**：在浏览器控制台运行最小实现，观察组件初始化的每个步骤

### 练习题

1. 实现一个支持 Props 和 Slots 的简化版 createComponentInstance
2. 实现 proxyRefs，支持自动解包 ref
3. 对比有无 accessCache 的性能差异（访问 1000 次属性）
