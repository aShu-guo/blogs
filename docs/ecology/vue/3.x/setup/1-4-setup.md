# setup() - Vue 3 组件的入口函数

## 1. 概念先行：建立心智模型

### setup() 是什么？

想象你在开一家餐厅。在餐厅正式营业（组件渲染）之前，你需要做一系列准备工作：

- **准备食材**（定义响应式数据）
- **培训员工**（定义方法）
- **布置餐桌**（设置计算属性）
- **安装监控**（注册生命周期钩子）

`setup()` 就是这个"开业前的准备阶段"。它在组件实例创建后、模板渲染前执行，是 Composition API 的核心入口。

### 核心直觉

```
setup() = 组件的"准备车间"
输入：props（父组件传来的配置）+ context（工具箱）
输出：模板需要的数据和方法
```

### 执行时机

```mermaid
sequenceDiagram
    participant Parent as 父组件
    participant Create as 创建实例
    participant Setup as setup()
    participant Render as 渲染模板

    Parent->>Create: 创建组件实例
    Create->>Create: 初始化 props
    Create->>Create: 初始化 slots
    Create->>Setup: 执行 setup()
    Setup-->>Create: 返回数据/函数
    Create->>Render: 渲染组件
```

## 2. 最小实现：手写"低配版"

下面是一个 40 行的简化版 setup 执行器，展示核心逻辑：

```javascript
// 简化版 setup 执行器
function executeSetup(component, props) {
  const { setup } = component;

  if (!setup) return;

  // 1. 创建 context（仅当 setup 需要第二个参数时）
  const context = setup.length > 1 ? {
    attrs: component.attrs,
    slots: component.slots,
    emit: (event, ...args) => component.emit(event, ...args),
    expose: (exposed) => { component.exposed = exposed; }
  } : null;

  // 2. 设置当前实例（让 getCurrentInstance 能获取到）
  currentInstance = component;

  // 3. 暂停依赖收集（setup 中的 ref 访问不应触发依赖）
  pauseTracking();

  // 4. 执行 setup
  const setupResult = setup(props, context);

  // 5. 恢复依赖收集
  resetTracking();
  currentInstance = null;

  // 6. 处理返回值
  if (typeof setupResult === 'function') {
    // 返回函数 -> 作为 render 函数
    component.render = setupResult;
  } else if (typeof setupResult === 'object') {
    // 返回对象 -> 自动解包 ref（proxyRefs）
    component.setupState = proxyRefs(setupResult);
  }
}

// 自动解包 ref 的代理
function proxyRefs(objectWithRefs) {
  return new Proxy(objectWithRefs, {
    get(target, key) {
      const val = target[key];
      return val && val.__v_isRef ? val.value : val;
    }
  });
}
```

**运行示例**：

```javascript
const component = {
  props: { count: 0 },
  setup(props, { emit }) {
    const doubled = computed(() => props.count * 2);
    const increment = () => emit('update', props.count + 1);
    return { doubled, increment };
  }
};

executeSetup(component, { count: 5 });
console.log(component.setupState.doubled); // 10（自动解包）
```

## 3. 逐行解剖：关键路径分析

### 3.1 setup() 的参数

| 参数        | 类型                | 说明       | 注意事项                      |
|-----------|-------------------|----------|---------------------------|
| `props`   | `Readonly<Props>` | 父组件传入的属性 | 只读代理，修改会警告                |
| `context` | `SetupContext`    | 上下文对象    | 仅当 `setup.length > 1` 时创建 |

#### Props 的处理流程

```typescript
// 源码：packages/runtime-core/src/component.ts
function setupStatefulComponent(instance) {
  const Component = instance.type;
  const { setup } = Component;

  if (setup) {
    // 关键：根据 setup 函数的参数个数决定是否创建 context
    const setupContext = setup.length > 1
      ? createSetupContext(instance)
      : null;

    // 在开发环境，props 会被包装为 shallowReadonly
    const setupResult = callWithErrorHandling(
      setup,
      instance,
      ErrorCodes.SETUP_FUNCTION,
      [
        __DEV__ ? shallowReadonly(instance.props) : instance.props,
        setupContext
      ]
    );

    handleSetupResult(instance, setupResult);
  }
}
```

**为什么要检查 `setup.length`？**

```javascript
// 场景 1：不需要 context
setup(props) {
  // setup.length === 1，不创建 context 对象（性能优化）
}

// 场景 2：需要 context
setup(props, { emit, slots }) {
  // setup.length === 2，创建完整的 context
}
```

#### SetupContext 的结构

```typescript
interface SetupContext {
  attrs: Record<string, any>;    // 非 prop 的属性
  slots: Slots;                  // 插槽内容
  emit: EmitFn;                  // 触发事件
  expose: (exposed?: Record<string, any>) => void;  // 暴露公共属性
}
```

### 3.2 依赖收集的暂停与恢复

| 源码片段                             | 逻辑拆解                                           |
|----------------------------------|------------------------------------------------|
| `pauseTracking()`                | **暂停收集**：setup 中访问 ref 不应建立依赖关系，因为 setup 只执行一次 |
| `const setupResult = setup(...)` | **执行用户代码**：此时访问 `count.value` 不会触发依赖收集         |
| `resetTracking()`                | **恢复收集**：后续 render 函数中的访问才需要收集依赖               |

**为什么要暂停？**

```javascript
// 错误示例（如果不暂停）
setup() {
  const count = ref(0);
  console.log(count.value);  // 如果收集依赖，会把 setup 本身当作 effect
  return { count };
}
// 问题：setup 只执行一次，不应该被当作响应式副作用
```

### 3.3 返回值的三种形态

```typescript
function handleSetupResult(instance, setupResult) {
  if (typeof setupResult === 'function') {
    // 形态 1：返回渲染函数
    instance.render = setupResult;
  }
  else if (typeof setupResult === 'object' && setupResult !== null) {
    // 形态 2：返回状态对象
    instance.setupState = proxyRefs(setupResult);
  }
  // 形态 3：返回 Promise（异步组件）
  else if (isPromise(setupResult)) {
    instance.asyncDep = setupResult;
  }

  finishComponentSetup(instance);
}
```

#### 形态对比表

| 返回类型       | 用途             | 处理方式                  | 示例                                   |
|------------|----------------|-----------------------|--------------------------------------|
| `Object`   | 暴露数据和方法给模板     | `proxyRefs()` 自动解包    | `return { count, increment }`        |
| `Function` | 直接作为 render 函数 | 赋值给 `instance.render` | `return () => h('div', count.value)` |
| `Promise`  | 异步数据加载         | 配合 `<Suspense>` 使用    | `return fetch('/api').then(...)`     |

## 4. 细节补充：边界与性能优化

### 4.1 为什么 Props 是只读的？

```typescript
// 开发环境的保护机制
setup(props) {
  props.count = 100;  // ❌ 警告：Set operation on key "count" failed
}
```

**原因**：

1. **单向数据流**：子组件不应直接修改 props，应通过 `emit` 通知父组件
2. **调试友好**：违反规则时立即报错，而非静默失败

### 4.2 Context 的按需创建

```javascript
// 性能优化：避免不必要的对象创建
const setupContext = setup.length > 1 ? createSetupContext(instance) : null;
```

**测试**：

```javascript
// 场景 1：不创建 context（节省内存）
setup(props) {
  return { data: props.value * 2 };
}

// 场景 2：创建 context
setup(props, ctx) {
  ctx.emit('update');
  return {};
}
```

### 4.3 getCurrentInstance 的作用域限制

```typescript
let currentInstance = null;

export function getCurrentInstance() {
  return currentInstance;
}

function setupStatefulComponent(instance) {
  currentInstance = instance;  // 设置
  const setupResult = setup(...);
  currentInstance = null;      // 清除
}
```

**为什么要清除？**

```javascript
// 错误用法
let savedInstance;
setup() {
  savedInstance = getCurrentInstance();  // ✅ setup 内可以获取
}

setTimeout(() => {
  console.log(savedInstance);  // ⚠️ 可以访问，但不推荐
  getCurrentInstance();        // ❌ 返回 null（已清除）
}, 1000);
```

### 4.4 proxyRefs 的自动解包

```javascript
// 源码：packages/reactivity/src/ref.ts
export function proxyRefs(objectWithRefs) {
  return new Proxy(objectWithRefs, {
    get(target, key, receiver) {
      const res = Reflect.get(target, key, receiver);
      return unref(res);  // 自动 .value
    },
    set(target, key, value, receiver) {
      const oldValue = target[key];
      if (isRef(oldValue) && !isRef(value)) {
        oldValue.value = value;  // 自动赋值给 .value
        return true;
      }
      return Reflect.set(target, key, value, receiver);
    }
  });
}
```

**效果**：

```javascript
setup() {
  const count = ref(0);
  return { count };
}

// 模板中
{{ count }}  // 自动解包，等价于 count.value
```

## 5. 总结与延伸

### 一句话总结

> `setup()` 是 Vue 3 组件的"准备车间"，在渲染前执行一次，接收 props 和 context，返回模板所需的响应式状态和方法，通过暂停依赖收集和自动解包
> ref 来优化性能和开发体验。

### 与 Options API 的对比

| 特性               | Options API                    | Composition API (setup)  |
|------------------|--------------------------------|--------------------------|
| **代码组织**         | 按选项类型分散（data/methods/computed） | 按逻辑功能聚合                  |
| **类型推导**         | TypeScript 支持较弱                | 完美支持类型推导                 |
| **代码复用**         | Mixins（命名冲突）                   | Composables（清晰来源）        |
| **this 指向**      | 需要理解 this 绑定                   | 无 this，使用闭包              |
| **Tree-shaking** | 无法按需引入                         | 按需引入（如 `ref`、`computed`） |

### 面试高频考点

**Q1: setup 中为什么不能使用 this？**

A: setup 执行时组件实例尚未完全创建，且 Composition API 设计理念是通过闭包而非 this 来访问状态。需要实例时使用
`getCurrentInstance()`。

**Q2: setup 的执行时机是什么？**

A: 在 `beforeCreate` 和 `created` 之间，具体流程是：

1. 创建组件实例
2. 初始化 props
3. 初始化 slots
4. **执行 setup()**
5. 处理 setup 返回值
6. 设置渲染副作用

**Q3: setup 返回的 ref 为什么在模板中不需要 .value？**

A: Vue 通过 `proxyRefs()` 对 setup 返回的对象进行代理，自动解包顶层的 ref。但嵌套对象中的 ref 仍需手动 `.value`。

**Q4: 如何在 setup 中使用生命周期钩子？**

A: 使用 Composition API 提供的钩子函数：

```javascript
import { onMounted, onUnmounted } from 'vue';

setup() {
  onMounted(() => {
    console.log('组件已挂载');
  });

  onUnmounted(() => {
    console.log('组件将卸载');
  });
}
```

**Q5: setup 可以是 async 函数吗？**

A: 可以，但需要配合 `<Suspense>` 使用：

```javascript
async setup() {
  const data = await fetch('/api/data').then(r => r.json());
  return { data };
}
```

### 延伸阅读

- [组件初始化流程](./1-3-component-init.md) - 了解 setup 在整个初始化流程中的位置
- [渲染副作用](./1-5-render-effect.md) - setup 返回值如何驱动组件更新
- [响应式系统](../reactivity/1-1-reactive.md) - 深入理解 ref 和 reactive 的实现原理
- [Composition API 最佳实践](./composables.md) - 如何编写可复用的组合式函数

### 实战建议

1. **优先使用 Composition API**：除非维护老项目，否则新项目推荐使用 setup
2. **按逻辑组织代码**：将相关的状态、计算属性、方法放在一起
3. **提取可复用逻辑**：超过 20 行的逻辑考虑提取为 composable 函数
4. **避免过度优化**：不需要 context 时就不要声明第二个参数
5. **善用 TypeScript**：setup 的类型推导比 Options API 强大得多

```typescript
// 推荐的 setup 组织方式
setup(props, { emit }) {
  // 1. 响应式状态
  const count = ref(0);
  const user = reactive({ name: 'Alice' });

  // 2. 计算属性
  const doubled = computed(() => count.value * 2);

  // 3. 方法
  const increment = () => {
    count.value++;
    emit('update', count.value);
  };

  // 4. 生命周期
  onMounted(() => {
    console.log('mounted');
  });

  // 5. 侦听器
  watch(count, (newVal) => {
    console.log('count changed:', newVal);
  });

  // 6. 暴露给模板
  return {
    count,
    doubled,
    increment
  };
}
```
