# createApp() - Vue 应用创建与配置

`createApp()` 是 Vue 3 中创建应用实例的入口函数。它返回一个 **App 对象**，提供了用于配置、注册全局插件、组件、指令等的 API，以及最终的挂载操作。

## 核心概念

### createApp 的作用

```
rootComponent + rootProps
  ↓
createApp()
  ↓
AppContext（应用上下文）
  ↓
App 对象（具有配置和生命周期 API）
  ↓
mount()（挂载到 DOM）
  ↓
完整的应用实例
```

### 为什么需要 createApp？

Vue 2 中全局配置会污染全局状态，Vue 3 通过 `createApp()` 实现了**应用隔离**：

```typescript
// Vue 2 问题：全局污染
Vue.component('MyComponent', {...})  // 所有应用都能访问

// Vue 3 解决：应用隔离
const app1 = createApp(App1)
const app2 = createApp(App2)

app1.component('MyComponent', MyComponent1)  // 仅 app1 可用
app2.component('MyComponent', MyComponent2)  // 仅 app2 可用
```

---

## 函数签名

```typescript
export function createApp<HostElement = Element>(
  rootComponent: ConcreteComponent,
  rootProps?: Data | null
): App<HostElement> {
  // ...
}

interface App<HostElement = Element> {
  // 配置
  config: AppConfig
  version: string

  // 挂载和卸载
  mount(rootContainer: HostElement | string, isHydrate?: boolean): ComponentPublicInstance
  unmount(): void

  // 全局注册
  component(name: string): Component | undefined
  component(name: string, component: Component): this
  directive(name: string): Directive | undefined
  directive(name: string, directive: Directive): this

  // 插件和 mixin
  use(plugin: Plugin, ...options: any[]): this
  mixin(mixin: ComponentOptions): this

  // 依赖注入
  provide<T>(key: InjectionKey<T> | string, value: T): this

  // 上下文执行
  runWithContext<T>(fn: () => T): T

  // 卸载回调
  onUnmount(cb: () => void): void
}
```

---

## createApp 内部结构

### 第 1 步：创建 AppContext

```typescript
// AppContext 是应用的核心上下文，存储所有全局配置
export interface AppContext {
  // 应用配置对象
  config: AppConfig

  // 应用实例（稍后设置）
  app: App

  // 已安装的混入
  mixins: ComponentOptions[]

  // 全局注册的组件
  components: Record<string, Component>

  // 全局注册的指令
  directives: Record<string, Directive>

  // 全局提供的依赖
  provides: Record<string | symbol, any>

  // 性能缓存（使用 WeakMap 避免内存泄漏）
  optionsCache: WeakMap<ComponentOptions, any>
  propsCache: WeakMap<ConcreteComponent, any>
  emitsCache: WeakMap<ConcreteComponent, any>
}

// 创建 AppContext
export function createAppContext(): AppContext {
  return {
    app: null as any,
    config: {
      // 是否为原生标签（用于自定义元素）
      isNativeTag: NO,

      // 是否启用性能监测
      performance: false,

      // 全局属性（可以在组件中通过 this.$x 访问）
      globalProperties: {},

      // 选项合并策略
      optionMergeStrategies: {},

      // 全局错误处理器
      errorHandler: undefined,

      // 全局警告处理器
      warnHandler: undefined,

      // 编译器选项
      compilerOptions: {},
    },
    mixins: [],
    components: {},
    directives: {},
    provides: Object.create(null),
    optionsCache: new WeakMap(),
    propsCache: new WeakMap(),
    emitsCache: new WeakMap(),
  }
}
```

**AppContext 的作用**：
- 存储所有全局级别的配置
- 使不同应用实例能互相隔离
- 被所有子组件共享和访问

### 第 2 步：初始化状态变量

```typescript
const installedPlugins = new WeakSet()  // 已安装的插件（使用 WeakSet 防止重复）
const pluginCleanupFns: Array<() => any> = []  // 插件清理函数
let isMounted = false  // 应用是否已挂载

// WeakSet vs Set 的对比
// WeakSet: 键只能是对象，允许垃圾回收
// Set: 键可以是任意值，阻止垃圾回收

// 这里使用 WeakSet 是因为：
// 1. plugin 总是对象
// 2. 允许插件对象被垃圾回收
// 3. 自动避免内存泄漏
```

### 第 3 步：创建 App 对象

```typescript
const app: App = {
  // 内部属性
  _uid: uid++,                        // 唯一 ID
  _component: rootComponent,          // 根组件
  _props: rootProps,                  // 根 props
  _container: null,                   // 挂载容器（mount() 时设置）
  _context: context,                  // AppContext
  _instance: null,                    // 组件实例（mount() 后设置）

  // 版本号
  version: '3.5.x',

  // 配置的 getter/setter
  get config() {
    return context.config
  },
  set config(v) {
    if (__DEV__) {
      warn(`app.config cannot be replaced. Modify individual options instead.`)
    }
  },

  // 核心 API（详见下一部分）
  use,
  mixin,
  component,
  directive,
  mount,
  unmount,
  onUnmount,
  provide,
  runWithContext,
}

return app
```

---

## 核心 API 详解

### 1. use(plugin, ...options) - 安装插件

**用途**：为应用安装插件

**签名**：
```typescript
use(plugin: Plugin, ...options: any[]): this
```

**实现**：
```typescript
function use(this: App, plugin: Plugin, ...options: any[]) {
  // 1. 检查是否已安装
  if (installedPlugins.has(plugin)) {
    __DEV__ && warn(`Plugin has already been applied to target app.`)
    return this
  }

  // 2. 标记为已安装
  installedPlugins.add(plugin)

  // 3. 调用插件的 install 方法或函数
  if (plugin && isFunction(plugin.install)) {
    // 形式 1：plugin.install(app, ...options)
    plugin.install(this, ...options)
  } else if (isFunction(plugin)) {
    // 形式 2：plugin 本身是函数
    plugin(this, ...options)
  }

  return this  // 链式调用
}
```

**使用示例**：

```typescript
// 定义插件
const myPlugin = {
  install(app, options) {
    // 添加全局属性
    app.config.globalProperties.$myAPI = options.api

    // 添加全局组件
    app.component('MyGlobalComponent', MyGlobalComponent)

    // 添加全局指令
    app.directive('my-directive', {
      mounted(el, binding) {
        // ...
      }
    })

    // 注入依赖
    app.provide('MY_SERVICE', new MyService())

    // 注册全局混入
    app.mixin({
      created() {
        console.log('Component created')
      }
    })
  }
}

// 使用插件
app.use(myPlugin, {
  api: 'https://api.example.com'
})

// 链式调用
app
  .use(pinia)
  .use(router)
  .use(myPlugin, { config: {...} })
```

**插件生命周期**：
```
插件安装顺序 → install() 执行顺序保证
  ↓
每个插件的 install 只执行一次（通过 WeakSet 检查）
  ↓
支持链式调用
```

### 2. component(name, component?) - 注册全局组件

**用途**：注册或获取全局组件

**签名**：
```typescript
// 注册
component(name: string, component: Component): this

// 获取
component(name: string): Component | undefined
```

**实现**：
```typescript
function component(
  this: App,
  name: string,
  component?: Component
): any {
  // 1. 验证组件名（仅开发环境）
  if (__DEV__) {
    validateComponentName(name, context.config)
  }

  // 2. 如果没有传递 component，则为获取
  if (!component) {
    return context.components[name]
  }

  // 3. 警告重复注册（仅开发环境）
  if (__DEV__ && context.components[name]) {
    warn(
      `Component "${name}" has already been registered in target app. ` +
      `Overwrite previous registration.`
    )
  }

  // 4. 注册组件
  context.components[name] = component
  return this  // 链式调用
}
```

**使用示例**：

```typescript
// 注册全局组件
app.component('MyButton', {
  template: '<button>{{ $slots.default() }}</button>'
})

// 注册导入的组件
import GlobalButton from './components/GlobalButton.vue'
app.component('GlobalButton', GlobalButton)

// 获取已注册的组件
const Button = app.component('GlobalButton')

// 链式调用
app
  .component('Button', Button)
  .component('Modal', Modal)
  .component('Tooltip', Tooltip)

// 在模板中使用
// <template>
//   <GlobalButton />
//   <MyButton />
// </template>
```

**与局部注册的区别**：

```typescript
// 全局注册
app.component('MyComponent', MyComponent)
// 在所有组件中都可使用，不需导入

// 局部注册
export default {
  components: { MyComponent },
  template: '<MyComponent />'
}
// 仅在该组件中可用
```

### 3. directive(name, directive?) - 注册全局指令

**用途**：注册或获取全局指令

**签名**：
```typescript
// 注册
directive(name: string, directive: Directive): this

// 获取
directive(name: string): Directive | undefined
```

**实现**：
```typescript
function directive(
  this: App,
  name: string,
  directive?: Directive
): any {
  // 1. 验证指令名
  if (__DEV__) {
    validateDirectiveName(name)
  }

  // 2. 获取模式
  if (!directive) {
    return context.directives[name] as any
  }

  // 3. 警告重复注册
  if (__DEV__ && context.directives[name]) {
    warn(`Directive "${name}" has already been registered in target app.`)
  }

  // 4. 注册指令
  context.directives[name] = directive
  return this
}
```

**使用示例**：

```typescript
// 注册全局指令
app.directive('focus', {
  mounted(el) {
    el.focus()
  }
})

app.directive('click-outside', {
  mounted(el, binding) {
    el.clickOutsideEvent = function(event) {
      if (!(el === event.target || el.contains(event.target))) {
        binding.value(event)
      }
    }
    document.addEventListener('click', el.clickOutsideEvent)
  },
  unmounted(el) {
    document.removeEventListener('click', el.clickOutsideEvent)
  }
})

app.directive('highlight', {
  updated(el, binding) {
    el.style.backgroundColor = binding.value
  }
})

// 在模板中使用
// <input v-focus />
// <div v-click-outside="handleClickOutside"></div>
// <p v-highlight="'yellow'"></p>
```

### 4. mixin(mixin) - 注册全局混入

**用途**：为应用注册全局混入（所有组件都会继承）

**签名**：
```typescript
mixin(mixin: ComponentOptions): this
```

**实现**：
```typescript
function mixin(this: App, mixin: ComponentOptions): App {
  if (__FEATURE_OPTIONS_API__) {
    // 避免重复注册
    if (!context.mixins.includes(mixin)) {
      context.mixins.push(mixin)
    } else if (__DEV__) {
      warn(`Mixin has already been applied to target app`)
    }
  }
  return this
}
```

**使用示例**：

```typescript
// 定义全局混入
const globalMixin = {
  created() {
    console.log('Global mixin: component created')
  },
  methods: {
    $log(msg: string) {
      console.log(`[${this.$options.name || 'Component'}] ${msg}`)
    }
  }
}

// 应用全局混入
app.mixin(globalMixin)

// 现在所有组件都有 $log 方法
// export default {
//   created() {
//     this.$log('Hello')  // [ComponentName] Hello
//   }
// }
```

**⚠️ 全局混入的注意事项**：
- 会影响应用中的每个组件实例
- 应该谨慎使用，因为会增加内存开销
- 混入的 hook 会在组件 hook 之前执行
- 可能导致代码难以跟踪

### 5. provide(key, value) - 全局依赖注入

**用途**：提供全局级别的依赖注入

**签名**：
```typescript
provide<T>(key: InjectionKey<T> | string, value: T): this
```

**实现**：
```typescript
function provide(this: App, key: string | symbol, value: unknown): App {
  if (__DEV__ && (key as string | symbol) in context.provides) {
    warn(
      `App already provides property with key "${String(key)}". ` +
      `It will be overwritten with the new value.`
    )
  }

  context.provides[key as string | symbol] = value
  return this
}
```

**使用示例**：

```typescript
// 在应用级别提供依赖
app.provide('API_URL', process.env.VUE_APP_API_URL)
app.provide('DATABASE', new Database())
app.provide('theme', { color: 'blue' })

// 在任何组件中注入
export default {
  inject: ['API_URL', 'theme'],
  setup() {
    return {
      apiUrl: inject('API_URL'),
      database: inject('DATABASE'),
      theme: inject('theme')
    }
  }
}

// 使用 InjectionKey 实现类型安全
const ApiUrlKey = Symbol() as InjectionKey<string>
const ThemeKey = Symbol() as InjectionKey<{ color: string }>

app.provide(ApiUrlKey, 'https://api.example.com')
app.provide(ThemeKey, { color: 'blue' })

// 在组件中
export default {
  setup() {
    const apiUrl = inject(ApiUrlKey)  // 类型正确推导
    const theme = inject(ThemeKey)    // 类型正确推导
  }
}
```

### 6. mount(rootContainer, isHydrate?, namespace?) - 挂载应用

**用途**：将应用挂载到 DOM 容器

**签名**：
```typescript
mount(
  rootContainer: HostElement | string,
  isHydrate?: boolean,
  namespace?: boolean | ElementNamespace
): ComponentPublicInstance
```

**实现**：
```typescript
function mount(
  this: App,
  rootContainer: HostElement | string,
  isHydrate?: boolean,
  namespace?: ElementNamespace | boolean
): ComponentPublicInstance {
  if (!isMounted) {
    // 1. 创建根 VNode
    const vnode = createVNode(rootComponent, rootProps)
    vnode.appContext = context

    // 2. 处理命名空间（用于 SVG、MathML）
    if (namespace === true) {
      namespace = 'svg'
    } else if (namespace === false) {
      namespace = undefined
    }

    // 3. 执行 hydrate 或 render
    if (isHydrate && hydrate) {
      // SSR hydration：激活服务端渲染的 HTML
      hydrate(vnode as VNode<Node, Element>, rootContainer as any)
    } else {
      // 普通渲染：从零创建 DOM
      render(vnode, rootContainer, namespace)
    }

    // 4. 标记为已挂载
    isMounted = true
    app._container = rootContainer
    (rootContainer as any).__vue_app__ = app

    // 5. 初始化开发工具
    if (__DEV__ || __FEATURE_PROD_DEVTOOLS__) {
      app._instance = vnode.component
      devtoolsInitApp(app, version)
    }

    // 6. 返回组件公共实例
    return getComponentPublicInstance(vnode.component!)
  } else if (__DEV__) {
    warn(
      `App has already been mounted.\n` +
      `If you want to remount the same app, move your app creation logic ` +
      `into a factory function and create fresh app instances for each mount.`
    )
  }
}
```

**使用示例**：

```typescript
// 基础挂载
const app = createApp(App)
app.mount('#app')

// 字符串选择器
app.mount('body')

// DOM 元素
const container = document.getElementById('app')
app.mount(container)

// SSR hydration
app.mount('#app', true)

// 命名空间（SVG）
app.mount('#svg-container', false, 'svg')
```

### 7. unmount() - 卸载应用

**用途**：卸载应用，清理所有资源

**签名**：
```typescript
unmount(): void
```

**实现**：
```typescript
function unmount(this: App): void {
  if (isMounted) {
    // 1. 执行插件清理函数
    callWithAsyncErrorHandling(
      pluginCleanupFns,
      app._instance,
      ErrorCodes.APP_UNMOUNT_CLEANUP
    )

    // 2. 渲染空 VNode（清除所有 DOM）
    render(null, app._container)

    // 3. 清理内部状态
    if (__DEV__ || __FEATURE_PROD_DEVTOOLS__) {
      app._instance = null
      devtoolsUnmountApp(app)
    }

    // 4. 移除应用引用
    delete (app._container as any).__vue_app__
  }
}
```

**使用示例**：

```typescript
const app = createApp(App)
app.mount('#app')

// 稍后卸载应用
app.unmount()

// 清理后可以重新创建
const app2 = createApp(App2)
app2.mount('#app')
```

### 8. onUnmount(cb) - 注册卸载回调

**用途**：在应用卸载时执行回调

**签名**：
```typescript
onUnmount(cb: () => void): void
```

**使用示例**：

```typescript
const app = createApp(App)

// 在卸载时执行清理
app.onUnmount(() => {
  console.log('App is unmounting')
  // 清理资源
})

app.mount('#app')
```

### 9. runWithContext(fn) - 在应用上下文中运行函数

**用途**：在特定的应用上下文中执行代码（用于 `inject()` 等依赖查询）

**签名**：
```typescript
runWithContext<T>(fn: () => T): T
```

**实现**：
```typescript
function runWithContext<T>(this: App, fn: () => T): T {
  const lastApp = currentApp
  currentApp = this  // 设置当前应用
  try {
    return fn()     // 在此上下文中执行
  } finally {
    currentApp = lastApp  // 恢复
  }
}
```

**使用示例**：

```typescript
const app = createApp(App)
app.provide('API_URL', 'https://api.example.com')

// 在应用上下文中执行
app.runWithContext(() => {
  const url = inject('API_URL')
  console.log(url)  // 'https://api.example.com'
})

// 在应用外执行 inject 会失败
// inject('API_URL')  // undefined
```

---

## 完整工作流程示例

```typescript
// 1. 创建应用
const app = createApp(App, {
  title: 'My App',
  theme: 'dark'
})

// 2. 安装插件
app.use(pinia)
app.use(router)
app.use(myCustomPlugin, { config: {...} })

// 3. 注册全局组件
app.component('GlobalButton', GlobalButton)
app.component('GlobalModal', GlobalModal)
app.component('GlobalTooltip', GlobalTooltip)

// 4. 注册全局指令
app.directive('focus', {
  mounted(el) { el.focus() }
})

app.directive('click-outside', {
  mounted(el, binding) {
    el.clickOutsideEvent = (event) => {
      if (!(el === event.target || el.contains(event.target))) {
        binding.value(event)
      }
    }
    document.addEventListener('click', el.clickOutsideEvent)
  },
  unmounted(el) {
    document.removeEventListener('click', el.clickOutsideEvent)
  }
})

// 5. 配置错误处理
app.config.errorHandler = (err, instance, info) => {
  console.error('Error:', err)
  console.error('Component:', instance)
  console.error('Info:', info)
}

// 6. 添加全局属性
app.config.globalProperties.$http = axios
app.config.globalProperties.$utils = {
  format: (val) => val.toUpperCase()
}

// 7. 注册全局混入
app.mixin({
  created() {
    this.$log = (msg) => console.log(`[App] ${msg}`)
  }
})

// 8. 提供全局依赖
app.provide('API_URL', process.env.VUE_APP_API_URL)
app.provide('theme', { primary: '#3498db' })
app.provide('i18n', i18n)

// 9. 挂载应用
const instance = app.mount('#app')

// 10. 后续可以卸载
// app.unmount()
```

---

## AppContext 内部结构详解

### 为什么使用 WeakMap 和 WeakSet？

```typescript
// WeakMap 的优势
optionsCache: new WeakMap()

// 对比 Map
// ❌ Map 会保持对 key 的强引用
//   如果 key 对象本该被垃圾回收，Map 会阻止
//   导致内存泄漏

// ✅ WeakMap 使用弱引用
//   当 key 对象不再被其他引用时，会被自动垃圾回收
//   WeakMap 中的条目也会被清除

// 实现细节
const optionsCache = new WeakMap()

// 当组件对象被垃圾回收时
component = null
// ↓
// WeakMap 中的条目也被自动清除
// ↓
// 内存被释放
```

### AppConfig 配置详解

```typescript
export interface AppConfig {
  // 1. 特性检测
  isNativeTag?: (tag: string) => boolean

  // 2. 性能监测
  performance?: boolean

  // 3. 全局属性（通过 this.$x 访问）
  globalProperties?: Record<string, any>

  // 4. 选项合并策略
  optionMergeStrategies?: Record<string, Function>

  // 5. 错误处理
  errorHandler?: (
    err: unknown,
    instance: ComponentPublicInstance | null,
    info: string
  ) => void

  // 6. 警告处理
  warnHandler?: (
    message: string,
    instance: ComponentPublicInstance | null,
    trace: string
  ) => void

  // 7. 编译器选项
  compilerOptions?: RuntimeCompilerOptions
}
```

**配置示例**：

```typescript
// 1. 自定义原生标签检测
app.config.isNativeTag = (tag) => {
  return ['my-element', 'my-custom'].includes(tag)
}

// 2. 启用性能监测
app.config.performance = true

// 3. 全局属性
app.config.globalProperties.$api = axios
app.config.globalProperties.$constants = {
  MAX_SIZE: 1000,
  TIMEOUT: 5000
}

// 4. 错误处理
app.config.errorHandler = (err, instance, info) => {
  if (process.env.NODE_ENV === 'production') {
    // 上报到错误追踪服务
    errorReporter.report({ err, info })
  } else {
    console.error(err)
  }
}

// 5. 警告处理
app.config.warnHandler = (msg, instance, trace) => {
  console.warn(`[Vue warn]: ${msg}`)
  if (trace) console.warn(trace)
}
```

---

## 应用隔离 vs 全局状态

### 应用隔离的重要性

```typescript
// 问题场景：多个应用在同一个页面
const app1 = createApp(App1)
const app2 = createApp(App2)

// ✅ 应用隔离的优势
app1.component('Button', ButtonV1)  // 仅 app1 使用 ButtonV1
app2.component('Button', ButtonV2)  // 仅 app2 使用 ButtonV2

app1.provide('theme', 'light')      // app1 的主题
app2.provide('theme', 'dark')       // app2 的主题

// 这在以下场景中很重要：
// 1. 微前端：多个独立的应用
// 2. 动态应用加载/卸载
// 3. 应用版本迁移测试
// 4. 第三方小部件集成
```

---

## 性能优化

### 1. 插件安装缓存

```typescript
// WeakSet 提供 O(1) 的查询性能
if (installedPlugins.has(plugin)) {
  // O(1) 检查，比数组的 O(n) 高效
  return
}
```

### 2. 组件/指令名称验证

```typescript
// 仅在开发环境验证（生产环境跳过）
if (__DEV__) {
  validateComponentName(name, context.config)
}

// 减少生产环境开销
```

### 3. 缓存配置

```typescript
// 使用 WeakMap 缓存组件选项
// 避免重复解析相同的组件配置
optionsCache: new WeakMap()

// 当组件不再被使用时，缓存自动清除
// 无需手动管理
```

---

## 常见用法模式

### 模式 1：工厂函数创建应用

```typescript
// ✅ 好的做法：支持多个应用实例
function createMyApp(config) {
  const app = createApp(App, config)

  // 配置通用设置
  app.use(pinia)
  app.use(router)

  return app
}

// 创建多个独立的应用
const app1 = createMyApp({ env: 'production' })
const app2 = createMyApp({ env: 'staging' })

app1.mount('#app1')
app2.mount('#app2')
```

### 模式 2：插件工厂

```typescript
// 创建可配置的插件
function createMyPlugin(options = {}) {
  return {
    install(app, pluginOptions) {
      const config = { ...options, ...pluginOptions }

      app.provide('MY_CONFIG', config)

      // 返回清理函数（可选）
      return () => {
        console.log('Plugin cleanup')
      }
    }
  }
}

app.use(createMyPlugin({ apiUrl: 'https://api.example.com' }))
```

### 模式 3：条件配置

```typescript
// 根据环境配置应用
const app = createApp(App)

if (process.env.NODE_ENV === 'development') {
  app.config.errorHandler = (err) => console.error(err)
  app.use(devtools)
} else {
  app.config.errorHandler = (err) => reportError(err)
}

if (process.env.VUE_APP_ANALYTICS) {
  app.use(analyticsPlugin)
}

app.mount('#app')
```

---

## 总结

| 功能 | 用途 | 返回值 |
|------|------|--------|
| **createApp(root, props)** | 创建应用实例 | App 对象 |
| **app.use(plugin)** | 安装插件 | App 对象（链式） |
| **app.component(name)** | 注册/获取全局组件 | App 对象 / Component |
| **app.directive(name)** | 注册/获取全局指令 | App 对象 / Directive |
| **app.mixin(mixin)** | 注册全局混入 | App 对象 |
| **app.provide(key, value)** | 提供全局依赖 | App 对象 |
| **app.mount(container)** | 挂载应用 | ComponentPublicInstance |
| **app.unmount()** | 卸载应用 | void |
| **app.runWithContext(fn)** | 在应用上下文运行 | 函数返回值 |
| **app.config** | 应用配置对象 | AppConfig |

**设计哲学**：createApp 通过返回一个富有表现力的对象，使应用配置变得**直观**、**链式**、**隔离**。这种设计比 Vue 2 的全局 API 更清晰、更易维护，并且天然支持多应用共存。
