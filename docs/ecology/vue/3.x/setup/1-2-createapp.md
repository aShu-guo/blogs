# createApp() - 应用创建与隔离

## 1. 概念先行：为什么需要 createApp？

### 生活类比：公司分支机构

想象你是一家连锁企业的管理者：

**Vue 2 的问题（总部统一管理）**：
```
总部制定规则 → 所有分店必须遵守
- 总部说用红色 Logo → 所有分店都用红色
- 总部注册"会员卡"系统 → 所有分店共享
- 问题：无法针对不同地区定制！
```

**Vue 3 的解决方案（分店独立管理）**：
```
每个分店有自己的管理系统：
- 北京分店：红色 Logo + 本地会员系统
- 上海分店：蓝色 Logo + 独立会员系统
- 结果：各分店独立运营，互不干扰！
```

### 核心问题

```typescript
// Vue 2 的问题：全局污染
Vue.component('Button', ButtonV1);  // 所有应用都被影响
Vue.mixin({ created() { console.log('Global') } });  // 所有组件都执行

// Vue 3 的解决：应用隔离
const app1 = createApp(App1);
const app2 = createApp(App2);

app1.component('Button', ButtonV1);  // 只影响 app1
app2.component('Button', ButtonV2);  // 只影响 app2
```

## 2. 最小实现：手写 createApp

```javascript
// 简化的 createApp 实现
function createApp(rootComponent, rootProps = null) {
  // 1. 创建应用上下文
  const context = {
    config: {
      globalProperties: {},
      errorHandler: null,
    },
    components: {},
    directives: {},
    provides: {},
  };

  // 2. 创建 app 对象
  const app = {
    _context: context,
    _component: rootComponent,
    _props: rootProps,
    _container: null,
    _isMounted: false,

    // 注册全局组件
    component(name, component) {
      if (!component) {
        return context.components[name];
      }
      context.components[name] = component;
      return this;
    },

    // 注册全局指令
    directive(name, directive) {
      if (!directive) {
        return context.directives[name];
      }
      context.directives[name] = directive;
      return this;
    },

    // 提供全局依赖
    provide(key, value) {
      context.provides[key] = value;
      return this;
    },

    // 挂载应用
    mount(container) {
      if (this._isMounted) {
        console.warn('App already mounted');
        return;
      }

      // 创建根 VNode
      const vnode = {
        type: rootComponent,
        props: rootProps,
        appContext: context,
      };

      // 渲染到容器
      render(vnode, container);

      this._isMounted = true;
      this._container = container;

      return vnode.component.proxy;
    },

    // 卸载应用
    unmount() {
      if (this._isMounted) {
        render(null, this._container);
        this._isMounted = false;
      }
    },
  };

  return app;
}

// 测试
const app = createApp({
  setup() {
    return { count: 0 };
  },
  template: '<div>{{ count }}</div>',
});

app.component('MyButton', {
  template: '<button>Click</button>',
});

app.provide('theme', 'dark');

app.mount('#app');
```

## 3. 逐行解剖：Vue 3 的实现

### 3.1 createAppContext - 创建应用上下文

| 源码片段 | 逻辑拆解 |
|---------|---------|
| `app: null as any` | **延迟设置**：app 对象稍后才创建，先占位 |
| `config: { ... }` | **应用配置**：存储全局配置，如 errorHandler、globalProperties |
| `mixins: []` | **全局混入**：存储通过 app.mixin() 注册的混入 |
| `components: {}` | **全局组件**：存储通过 app.component() 注册的组件 |
| `directives: {}` | **全局指令**：存储通过 app.directive() 注册的指令 |
| `provides: Object.create(null)` | **依赖注入**：存储通过 app.provide() 提供的值 |
| `optionsCache: new WeakMap()` | **选项缓存**：缓存组件选项，WeakMap 自动 GC |
| `propsCache: new WeakMap()` | **Props 缓存**：缓存 props 定义，避免重复解析 |
| `emitsCache: new WeakMap()` | **Emits 缓存**：缓存 emits 定义，避免重复解析 |

```typescript
export function createAppContext(): AppContext {
  return {
    app: null as any,
    config: {
      isNativeTag: NO,
      performance: false,
      globalProperties: {},
      optionMergeStrategies: {},
      errorHandler: undefined,
      warnHandler: undefined,
      compilerOptions: {},
    },
    mixins: [],
    components: {},
    directives: {},
    provides: Object.create(null),
    optionsCache: new WeakMap(),
    propsCache: new WeakMap(),
    emitsCache: new WeakMap(),
  };
}
```

### 3.2 createApp - 创建应用实例

| 源码片段 | 逻辑拆解 |
|---------|---------|
| `const context = createAppContext()` | **创建上下文**：每个应用有独立的上下文 |
| `const installedPlugins = new WeakSet()` | **插件去重**：使用 WeakSet 防止重复安装 |
| `let isMounted = false` | **挂载标志**：防止重复挂载 |
| `const app: App = { ... }` | **创建 app 对象**：包含所有 API 方法 |
| `context.app = app` | **双向引用**：context 和 app 互相引用 |

```typescript
export function createApp(
  rootComponent: ConcreteComponent,
  rootProps?: Data | null
): App {
  const context = createAppContext();
  const installedPlugins = new WeakSet();
  const pluginCleanupFns: Array<() => any> = [];
  let isMounted = false;

  const app: App = {
    _uid: uid++,
    _component: rootComponent,
    _props: rootProps,
    _container: null,
    _context: context,
    _instance: null,

    version,

    get config() {
      return context.config;
    },

    set config(v) {
      if (__DEV__) {
        warn(`app.config cannot be replaced.`);
      }
    },

    use(plugin, ...options) {
      // 详见 3.3
    },

    mixin(mixin) {
      // 详见 3.4
    },

    component(name, component) {
      // 详见 3.5
    },

    directive(name, directive) {
      // 详见 3.6
    },

    mount(rootContainer, isHydrate, namespace) {
      // 详见 3.7
    },

    unmount() {
      // 详见 3.8
    },

    provide(key, value) {
      // 详见 3.9
    },

    runWithContext(fn) {
      // 详见 3.10
    },
  };

  context.app = app;
  return app;
}
```

### 3.3 use - 安装插件

| 源码片段 | 逻辑拆解 |
|---------|---------|
| `if (installedPlugins.has(plugin))` | **去重检查**：防止重复安装同一个插件 |
| `installedPlugins.add(plugin)` | **标记已安装**：使用 WeakSet 存储 |
| `if (plugin && isFunction(plugin.install))` | **对象插件**：调用 plugin.install(app, ...options) |
| `else if (isFunction(plugin))` | **函数插件**：直接调用 plugin(app, ...options) |
| `return this` | **链式调用**：支持 app.use().use() |

```typescript
use(plugin: Plugin, ...options: any[]) {
  if (installedPlugins.has(plugin)) {
    __DEV__ && warn(`Plugin has already been applied.`);
    return this;
  }

  installedPlugins.add(plugin);

  if (plugin && isFunction(plugin.install)) {
    plugin.install(this, ...options);
  } else if (isFunction(plugin)) {
    plugin(this, ...options);
  }

  return this;
}
```

### 3.4 component - 注册全局组件

| 源码片段 | 逻辑拆解 |
|---------|---------|
| `validateComponentName(name, context.config)` | **名称验证**：检查组件名是否合法（仅开发环境） |
| `if (!component)` | **获取模式**：没有第二个参数时，返回已注册的组件 |
| `context.components[name] = component` | **注册组件**：存储到 context.components |
| `return this` | **链式调用**：支持连续注册 |

```typescript
component(name: string, component?: Component): any {
  if (__DEV__) {
    validateComponentName(name, context.config);
  }

  if (!component) {
    return context.components[name];
  }

  if (__DEV__ && context.components[name]) {
    warn(`Component "${name}" has already been registered.`);
  }

  context.components[name] = component;
  return this;
}
```

### 3.5 mount - 挂载应用

| 源码片段 | 逻辑拆解 |
|---------|---------|
| `if (!isMounted)` | **挂载检查**：防止重复挂载 |
| `const vnode = createVNode(rootComponent, rootProps)` | **创建根 VNode**：将组件转换为 VNode |
| `vnode.appContext = context` | **关联上下文**：将 AppContext 传递给 VNode |
| `if (isHydrate && hydrate)` | **SSR 激活**：服务端渲染时使用 hydrate |
| `else render(vnode, rootContainer)` | **客户端渲染**：从零创建 DOM |
| `isMounted = true` | **标记已挂载**：防止重复挂载 |
| `app._container = rootContainer` | **保存容器**：用于 unmount |
| `return getComponentPublicInstance(vnode.component!)` | **返回实例**：返回组件的公共实例 |

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

### 3.6 unmount - 卸载应用

| 源码片段 | 逻辑拆解 |
|---------|---------|
| `if (isMounted)` | **挂载检查**：只有已挂载的应用才能卸载 |
| `callWithAsyncErrorHandling(pluginCleanupFns, ...)` | **插件清理**：执行所有插件的清理函数 |
| `render(null, app._container)` | **清除 DOM**：渲染 null 会删除所有 DOM |
| `app._instance = null` | **清理引用**：释放组件实例引用 |
| `delete (app._container as any).__vue_app__` | **移除标记**：删除容器上的应用引用 |

```typescript
unmount() {
  if (isMounted) {
    callWithAsyncErrorHandling(
      pluginCleanupFns,
      app._instance,
      ErrorCodes.APP_UNMOUNT_CLEANUP
    );

    render(null, app._container);

    if (__DEV__ || __FEATURE_PROD_DEVTOOLS__) {
      app._instance = null;
      devtoolsUnmountApp(app);
    }

    delete (app._container as any).__vue_app__;
  }
}
```

## 4. 细节补充：边界与优化

### 4.1 边界情况 1：重复挂载

```typescript
const app = createApp(App);
app.mount('#app');
app.mount('#app2');  // 警告：App has already been mounted

// 解决方案：使用工厂函数
function createMyApp() {
  return createApp(App);
}

const app1 = createMyApp();
const app2 = createMyApp();
app1.mount('#app1');
app2.mount('#app2');  // 正确
```

### 4.2 边界情况 2：重复注册组件

```typescript
app.component('Button', ButtonV1);
app.component('Button', ButtonV2);  // 开发环境警告，生产环境覆盖

// 最佳实践：使用不同的名称
app.component('ButtonV1', ButtonV1);
app.component('ButtonV2', ButtonV2);
```

### 4.3 边界情况 3：插件重复安装

```typescript
const myPlugin = { install(app) { ... } };

app.use(myPlugin);
app.use(myPlugin);  // 警告：Plugin has already been applied

// WeakSet 自动去重，第二次调用不会执行 install
```

### 4.4 性能优化 1：WeakMap 缓存

```typescript
// AppContext 中的缓存
optionsCache: new WeakMap();
propsCache: new WeakMap();
emitsCache: new WeakMap();

// 优势：
// 1. 自动垃圾回收：组件销毁时，缓存自动清除
// 2. O(1) 查询：无需遍历
// 3. 防止内存泄漏：不需要手动清理
```

**对比 Map**：
```typescript
// 使用 Map（错误）
const cache = new Map();
cache.set(component, options);
// 问题：即使 component 不再使用，Map 仍持有引用，导致内存泄漏

// 使用 WeakMap（正确）
const cache = new WeakMap();
cache.set(component, options);
// 优势：component 不再使用时，会被 GC，缓存自动清除
```

### 4.5 性能优化 2：WeakSet 插件去重

```typescript
// 使用 WeakSet
const installedPlugins = new WeakSet();

// 优势：
// 1. O(1) 查询：has() 操作是 O(1)
// 2. 自动 GC：插件对象不再使用时会被回收
// 3. 内存效率：不存储额外信息

// 对比 Set
const installedPlugins = new Set();
// 问题：即使插件不再使用，Set 仍持有引用
```

### 4.6 性能优化 3：链式调用

```typescript
// 支持链式调用
app
  .use(pinia)
  .use(router)
  .component('Button', Button)
  .directive('focus', focusDirective)
  .provide('theme', 'dark')
  .mount('#app');

// 实现方式：所有方法都返回 this
component(name, component) {
  // ...
  return this;  // ← 关键
}
```

### 4.7 常见陷阱 1：config 不能替换

```typescript
const app = createApp(App);

// 错误：尝试替换整个 config
app.config = { ... };  // 警告：app.config cannot be replaced

// 正确：修改 config 的属性
app.config.errorHandler = (err) => { ... };
app.config.globalProperties.$api = axios;
```

### 4.8 常见陷阱 2：在 mount 前访问实例

```typescript
const app = createApp(App);

// 错误：mount 前没有实例
console.log(app._instance);  // null

app.mount('#app');

// 正确：mount 后才有实例
console.log(app._instance);  // ComponentInternalInstance
```

## 5. 总结与延伸

### 一句话总结

**createApp 通过创建独立的 AppContext，实现了应用级别的隔离，解决了 Vue 2 全局 API 的污染问题，支持多应用共存。**

### 核心要点

1. **AppContext**：每个应用有独立的上下文，存储全局配置和注册
2. **应用隔离**：不同应用的组件、指令、插件互不影响
3. **WeakMap/WeakSet**：使用弱引用实现自动 GC，防止内存泄漏
4. **链式调用**：所有配置方法返回 this，支持链式调用
5. **挂载保护**：防止重复挂载，确保应用状态正确

### 面试考点

**Q1：Vue 3 的 createApp 相比 Vue 2 有什么优势？**

A：主要优势：
1. **应用隔离**：每个应用有独立的全局配置，不会互相污染
2. **多应用共存**：可以在同一页面创建多个独立的 Vue 应用
3. **Tree-shaking 友好**：全局 API 变成实例方法，未使用的功能可以被移除
4. **TypeScript 支持**：更好的类型推导

**Q2：为什么 AppContext 使用 WeakMap 而不是 Map？**

A：原因：
1. **自动 GC**：组件对象不再使用时，WeakMap 中的条目会自动清除
2. **防止内存泄漏**：Map 会持有强引用，阻止组件被垃圾回收
3. **性能**：WeakMap 的查询是 O(1)，与 Map 相同
4. **适用场景**：缓存的 key 总是对象，适合使用 WeakMap

**Q3：createApp 的 mount 方法做了什么？**

A：主要步骤：
1. **创建根 VNode**：调用 createVNode(rootComponent, rootProps)
2. **关联上下文**：vnode.appContext = context
3. **渲染**：调用 render(vnode, container) 或 hydrate(vnode, container)
4. **标记挂载**：isMounted = true，防止重复挂载
5. **返回实例**：返回组件的公共实例

**Q4：如何在同一页面创建多个 Vue 应用？**

A：使用工厂函数：
```typescript
function createMyApp(config) {
  const app = createApp(App, config);
  // 配置通用设置
  app.use(pinia);
  return app;
}

const app1 = createMyApp({ theme: 'light' });
const app2 = createMyApp({ theme: 'dark' });

app1.mount('#app1');
app2.mount('#app2');
```

### 延伸阅读

- **下一章**：[mount() 和 render](./1-2-mount.md) - 了解应用挂载和渲染流程
- **相关章节**：[组件初始化](./1-3-component-init.md) - 理解组件实例的创建
- **实践建议**：在浏览器控制台运行最小实现，观察应用隔离的效果

### 练习题

1. 实现一个支持插件系统的简化版 createApp
2. 对比 WeakMap 和 Map 在缓存场景下的内存使用
3. 实现一个微前端系统，使用多个 Vue 应用
