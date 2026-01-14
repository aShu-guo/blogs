# Vue 3 运行时优化

## 1. 概念先行：建立心智模型

### 解决什么问题？

Vue 3 的运行时优化解决了前端框架的核心性能瓶颈：**如何在保证响应式的前提下，让组件更新更快、内存占用更少、用户体验更流畅？**

### 核心直觉：餐厅点餐系统

想象一个智能餐厅的点餐系统：

- **响应式优化（Proxy）**：服务员不再需要逐个检查每道菜的状态，而是在厨房安装了智能传感器，菜品一有变化就自动通知
- **Diff 算法优化**：服务员不会重新摆放整张桌子，只更换变化的菜品,并且记住了常客的座位号（key）
- **批量更新（Scheduler）**：多个顾客同时点餐时，服务员会收集所有订单后统一去厨房，而不是每个订单跑一次
- **缓存机制**：常点的菜品组合（computed）会提前准备好，不用每次重新计算
- **内存优化（WeakMap）**：顾客离开后，他们的订单记录会自动清理，不占用餐厅的档案柜

### 流程总览

```
用户操作
  ↓
响应式系统（Proxy 拦截）
  ↓
依赖收集（track）
  ↓
数据变更（trigger）
  ↓
调度器（Scheduler）批量收集
  ↓
Diff 算法（快速路径优化）
  ↓
DOM 更新（最小化操作）
  ↓
缓存更新（computed/accessCache）
```



## 2. 最小实现：手写"低配版"

以下是一个 50 行的运行时优化核心实现，展示了 Vue 3 的关键优化技术：

```javascript
// 运行时优化的核心机制
const targetMap = new WeakMap(); // 内存优化：自动垃圾回收
let activeEffect = null;
let shouldTrack = true;
const effectQueue = new Set(); // 批量更新队列
let isFlushing = false;

// 响应式优化：Proxy 拦截
function reactive(target) {
  return new Proxy(target, {
    get(target, key) {
      track(target, key); // 依赖收集
      return target[key];
    },
    set(target, key, value) {
      const oldValue = target[key];
      target[key] = value;
      if (oldValue !== value) {
        trigger(target, key); // 触发更新
      }
      return true;
    }
  });
}

// 依赖追踪优化
function track(target, key) {
  if (!activeEffect || !shouldTrack) return;

  let depsMap = targetMap.get(target);
  if (!depsMap) targetMap.set(target, (depsMap = new Map()));

  let dep = depsMap.get(key);
  if (!dep) depsMap.set(key, (dep = new Set()));

  dep.add(activeEffect);
}

// 批量更新优化
function trigger(target, key) {
  const depsMap = targetMap.get(target);
  if (!depsMap) return;

  const effects = depsMap.get(key);
  if (effects) {
    effects.forEach(effect => effectQueue.add(effect)); // 收集到队列
    queueFlush(); // 批量执行
  }
}

function queueFlush() {
  if (isFlushing) return;
  isFlushing = true;
  Promise.resolve().then(() => {
    effectQueue.forEach(effect => effect());
    effectQueue.clear();
    isFlushing = false;
  });
}

// 使用示例
const state = reactive({ count: 0, name: 'Vue' });

activeEffect = () => console.log('count:', state.count);
activeEffect(); // 初始执行并收集依赖

state.count++; // 触发批量更新
state.count++; // 合并到同一批次
// 输出：count: 2（只执行一次）
```

**核心优化点**：
1. WeakMap 自动内存管理
2. Proxy 精确拦截
3. 批量更新避免重复执行



## 3. 逐行解剖：关键路径分析

### 3.1 响应式系统优化

Vue 3 使用 Proxy 替代 Vue 2 的 Object.defineProperty，带来显著性能提升。

| 优化点 | Vue 2 (defineProperty) | Vue 3 (Proxy) | 性能提升 |
|--------|----------------------|--------------|---------|
| 属性拦截 | 需要递归遍历所有属性 | 懒代理，访问时才处理 | 初始化快 10x |
| 新增属性 | 需要 Vue.set() | 自动响应 | 开发体验提升 |
| 数组操作 | 重写 7 个数组方法 | 原生支持所有操作 | 代码量减少 |
| 深层对象 | 初始化时全部递归 | 访问时才递归（lazy） | 内存占用减少 50% |

**源码位置**：`packages/reactivity/src/reactive.ts`

```typescript
// 懒代理优化
function createReactiveObject(target, baseHandlers) {
  return new Proxy(target, baseHandlers);
}

// get trap 中的优化
function get(target, key, receiver) {
  // 优化 1：访问缓存
  if (key === ReactiveFlags.RAW) {
    return target;
  }

  track(target, TrackOpTypes.GET, key); // 依赖收集

  const res = Reflect.get(target, key, receiver);

  // 优化 2：懒递归
  if (isObject(res)) {
    return reactive(res); // 只在访问时才转为响应式
  }

  return res;
}
```

### 3.2 Diff 算法优化

Vue 3 的 Diff 算法包含多个快速路径（Fast Path），避免不必要的比较。

| 优化策略 | 触发条件 | 时间复杂度 | 适用场景 |
|---------|---------|-----------|---------|
| 快速路径 1 | 新旧节点完全相同 | O(1) | 静态内容 |
| 快速路径 2 | 只有文本子节点 | O(1) | 纯文本更新 |
| 快速路径 3 | 单一动态子节点 | O(1) | v-if/v-for 单项 |
| 前序对比 | 头部节点相同 | O(n) | 列表头部插入 |
| 后序对比 | 尾部节点相同 | O(n) | 列表尾部插入 |
| 最长递增子序列 | 中间乱序 | O(n log n) | 复杂列表重排 |

**源码位置**：`packages/runtime-core/src/renderer.ts:1650`

```typescript
// patchChildren 的快速路径
function patchChildren(n1, n2, container) {
  const c1 = n1.children;
  const c2 = n2.children;

  // 快速路径 1：文本节点
  if (typeof c2 === 'string') {
    if (c1 !== c2) {
      hostSetElementText(container, c2);
    }
    return;
  }

  // 快速路径 2：新节点为空
  if (c2 === null) {
    unmountChildren(c1);
    return;
  }

  // 完整 Diff（使用最长递增子序列优化）
  patchKeyedChildren(c1, c2, container);
}
```

### 3.3 组件更新优化

Vue 3 使用调度器（Scheduler）实现批量更新和优先级调度。

| 机制 | 作用 | 实现方式 | 性能收益 |
|------|------|---------|---------|
| 批量更新 | 合并同步修改 | 微任务队列 | 减少 90% 重复渲染 |
| 去重机制 | 同一组件只更新一次 | Set + id 标记 | 避免重复计算 |
| 优先级调度 | 用户交互优先 | pre/sync/post 队列 | 提升响应速度 |
| 递归保护 | 防止无限循环 | 深度计数器 | 避免栈溢出 |

**源码位置**：`packages/runtime-core/src/scheduler.ts`

```typescript
const queue: SchedulerJob[] = []; // 更新队列
let isFlushing = false;
let isFlushPending = false;

// 批量更新核心
export function queueJob(job: SchedulerJob) {
  // 优化 1：去重
  if (!queue.includes(job)) {
    queue.push(job);
  }
  queueFlush();
}

function queueFlush() {
  if (!isFlushing && !isFlushPending) {
    isFlushPending = true;
    // 优化 2：微任务批量执行
    Promise.resolve().then(flushJobs);
  }
}

function flushJobs() {
  isFlushPending = false;
  isFlushing = true;

  // 优化 3：按 id 排序（父组件先于子组件）
  queue.sort((a, b) => a.id - b.id);

  for (let i = 0; i < queue.length; i++) {
    const job = queue[i];
    job();
  }

  queue.length = 0;
  isFlushing = false;
}
```

### 3.4 内存优化

Vue 3 使用 WeakMap 和对象池技术优化内存占用。

| 技术 | 用途 | 内存收益 | 源码位置 |
|------|------|---------|---------|
| WeakMap | 存储响应式映射 | 自动 GC，无泄漏 | `reactivity/src/dep.ts` |
| 对象池 | 复用 VNode 对象 | 减少 30% 分配 | `runtime-core/src/vnode.ts` |
| 位标志 | 压缩状态存储 | 节省 80% 空间 | `shared/src/patchFlags.ts` |
| 浅响应 | 只代理顶层 | 减少 50% 代理对象 | `reactivity/src/reactive.ts` |

```typescript
// WeakMap 优化：自动垃圾回收
export const targetMap = new WeakMap<object, KeyToDepMap>();

// 对象池优化：复用 VNode
const vnodePool: VNode[] = [];

function createVNode(type, props, children) {
  const vnode = vnodePool.pop() || { /* 新对象 */ };
  vnode.type = type;
  vnode.props = props;
  vnode.children = children;
  return vnode;
}

function recycleVNode(vnode: VNode) {
  // 清理引用
  vnode.type = null;
  vnode.props = null;
  vnode.children = null;
  vnodePool.push(vnode);
}
```

### 3.5 缓存机制

Vue 3 实现了多层缓存策略，避免重复计算。

| 缓存类型 | 缓存内容 | 失效条件 | 命中率 |
|---------|---------|---------|--------|
| accessCache | 组件属性访问路径 | 属性删除/新增 | 95%+ |
| computed cache | 计算属性结果 | 依赖变化 | 80%+ |
| 事件缓存 | 事件处理函数 | 从不失效 | 100% |
| 静态提升 | 静态 VNode | 从不失效 | 100% |

**源码位置**：`packages/runtime-core/src/componentPublicInstance.ts`

```typescript
// accessCache 优化：缓存属性访问路径
export const PublicInstanceProxyHandlers = {
  get({ _: instance }, key) {
    const { ctx, setupState, data, props, accessCache } = instance;

    // 优化 1：检查缓存
    let normalizedProps;
    if (accessCache![key] !== undefined) {
      // 快速路径：直接从缓存的位置读取
      switch (accessCache![key]) {
        case AccessTypes.SETUP:
          return setupState[key];
        case AccessTypes.DATA:
          return data[key];
        case AccessTypes.CONTEXT:
          return ctx[key];
        case AccessTypes.PROPS:
          return props![key];
      }
    }

    // 慢速路径：查找并缓存
    if (setupState !== EMPTY_OBJ && hasOwn(setupState, key)) {
      accessCache![key] = AccessTypes.SETUP;
      return setupState[key];
    }
    // ... 其他查找逻辑
  }
};

// computed 缓存优化
export class ComputedRefImpl<T> {
  private _value!: T;
  private _dirty = true; // 脏标记

  get value() {
    // 优化 2：只在脏时重新计算
    if (this._dirty) {
      this._value = this.effect.run();
      this._dirty = false;
    }
    return this._value;
  }
}
```

### 3.6 事件处理优化

Vue 3 缓存事件处理函数，避免每次渲染创建新函数。

```typescript
// 编译器生成的优化代码
function render() {
  return h('button', {
    // 优化：缓存事件处理器
    onClick: _cache[0] || (_cache[0] = ($event) => handleClick($event))
  });
}

// 对比：未优化版本（每次渲染创建新函数）
function renderUnoptimized() {
  return h('button', {
    onClick: ($event) => handleClick($event) // 每次都是新函数
  });
}
```

### 3.7 Fragment 和 Teleport 优化

| 特性 | 优化点 | 性能提升 |
|------|--------|---------|
| Fragment | 避免额外 DOM 包裹 | 减少 DOM 节点数 |
| 多根节点 | 直接渲染数组 | 无需 wrapper |
| Teleport | 异步挂载优化 | 不阻塞主渲染 |

```typescript
// Fragment 优化：直接处理子节点数组
function mountChildren(children, container) {
  for (let i = 0; i < children.length; i++) {
    patch(null, children[i], container);
  }
}

// Teleport 优化：延迟挂载
function mountTeleport(vnode, container) {
  const target = querySelector(vnode.props.to);
  const placeholder = createComment('teleport');
  insert(placeholder, container);

  // 异步挂载到目标位置
  queuePostFlushCb(() => {
    mountChildren(vnode.children, target);
  });
}
```



## 4. 细节补充：边界与性能优化

### 4.1 边界情况处理

| 场景 | 问题 | 解决方案 |
|------|------|---------|
| 循环引用 | 无限递归 | 使用 Set 记录访问路径 |
| 深层嵌套 | 栈溢出 | 深度限制 + 警告 |
| 大数组 | 性能下降 | 虚拟滚动 + 分片渲染 |
| 频繁更新 | 卡顿 | 防抖 + 节流 |
| 内存泄漏 | WeakMap 失效 | 手动清理 + onUnmounted |

```typescript
// 循环引用检测
const seen = new WeakSet();

function traverse(value) {
  if (!isObject(value)) return value;

  if (seen.has(value)) {
    console.warn('Circular reference detected');
    return value;
  }

  seen.add(value);

  for (const key in value) {
    traverse(value[key]);
  }

  seen.delete(value);
  return value;
}

// 深度限制
const MAX_DEPTH = 10;

function reactive(target, depth = 0) {
  if (depth > MAX_DEPTH) {
    console.warn('Max reactive depth exceeded');
    return target;
  }

  return new Proxy(target, {
    get(target, key) {
      const res = Reflect.get(target, key);
      if (isObject(res)) {
        return reactive(res, depth + 1);
      }
      return res;
    }
  });
}
```

### 4.2 性能优化技巧

**位运算优化**：

```typescript
// 使用位标志压缩状态
export const enum PatchFlags {
  TEXT = 1,              // 0001
  CLASS = 1 << 1,        // 0010
  STYLE = 1 << 2,        // 0100
  PROPS = 1 << 3,        // 1000
  FULL_PROPS = 1 << 4,   // 10000
}

// 快速检查
if (vnode.patchFlag & PatchFlags.TEXT) {
  // 只更新文本
}

// 快速组合
const dynamicFlags = PatchFlags.TEXT | PatchFlags.CLASS;
```

**对象复用**：

```typescript
// 复用临时对象
const tempObj = {};

function merge(a, b) {
  // 清空复用
  for (const key in tempObj) {
    delete tempObj[key];
  }

  Object.assign(tempObj, a, b);
  return tempObj;
}
```

**惰性初始化**：

```typescript
// 延迟创建昂贵对象
class Component {
  private _computed?: ComputedCache;

  get computed() {
    return this._computed || (this._computed = new ComputedCache());
  }
}
```

### 4.3 调试与监控

```typescript
// 性能监控
if (__DEV__) {
  const start = performance.now();
  patch(n1, n2, container);
  const end = performance.now();

  if (end - start > 16) {
    console.warn(`Slow patch: ${end - start}ms`);
  }
}

// 依赖追踪调试
export function trackEffect(effect, dep, debuggerEventExtraInfo) {
  if (__DEV__) {
    effect.onTrack?.({
      effect,
      target: debuggerEventExtraInfo.target,
      type: debuggerEventExtraInfo.type,
      key: debuggerEventExtraInfo.key
    });
  }
  dep.add(effect);
}
```



## 5. 总结与延伸

### 一句话总结

Vue 3 的运行时优化通过 **Proxy 精确拦截 + 批量调度 + 多层缓存 + 智能 Diff**，实现了比 Vue 2 快 2-3 倍的渲染性能和 50% 的内存占用减少。

### 核心优化策略

1. **响应式优化**：Proxy 懒代理 + WeakMap 自动 GC
2. **更新优化**：批量调度 + 去重机制 + 优先级队列
3. **Diff 优化**：快速路径 + 最长递增子序列
4. **缓存优化**：accessCache + computed cache + 事件缓存
5. **内存优化**：对象池 + 位标志 + 浅响应

### 面试考点

**Q1：Vue 3 为什么比 Vue 2 快？**

A：主要有 5 个方面：
1. Proxy 替代 defineProperty，懒代理减少初始化开销
2. 编译器优化：静态提升、事件缓存、PatchFlag 标记
3. Diff 算法优化：快速路径 + 最长递增子序列
4. 批量更新：调度器合并同步修改
5. 内存优化：WeakMap + 对象池

**Q2：Vue 3 的批量更新是如何实现的？**

A：通过调度器（Scheduler）实现：
1. 数据变化时，将更新任务加入队列（queueJob）
2. 使用 Set 去重，同一组件只保留一个任务
3. 通过 Promise.resolve() 在微任务中批量执行
4. 按组件 id 排序，确保父组件先于子组件更新

**Q3：computed 的缓存机制是如何工作的？**

A：使用脏标记（dirty flag）实现：
1. 初始状态：_dirty = true
2. 访问 .value 时：如果 _dirty 为 true，执行计算并缓存结果，设置 _dirty = false
3. 依赖变化时：触发 notify()，设置 _dirty = true
4. 下次访问时：重新计算

**Q4：Vue 3 如何避免内存泄漏？**

A：多种机制：
1. WeakMap 存储响应式映射，对象被 GC 时自动清理
2. onUnmounted 钩子清理副作用
3. stop() 方法手动停止 effect
4. 组件卸载时清理所有依赖关系

**Q5：什么时候应该使用 shallowReactive？**

A：适用场景：
1. 大型对象，只需要顶层响应式
2. 深层属性不会变化
3. 性能敏感场景
4. 第三方库对象（避免深度代理）

### 延伸阅读

- **编译器优化**：静态提升、PatchFlag、Block Tree（见 `compiler/optimize.md`）
- **响应式系统**：Effect 系统、依赖追踪（见 `reactivity/effect-concepts.md`）
- **调度器详解**：优先级队列、递归保护（见 `runtime-core/scheduler.md`）
- **虚拟 DOM**：VNode 结构、Diff 算法（见 `runtime-core/vnode.md`）

### 性能优化建议

1. **合理使用响应式**：
   - 大型列表使用 shallowRef
   - 静态数据使用 markRaw
   - 只读数据使用 readonly

2. **优化组件更新**：
   - 使用 v-once 标记静态内容
   - 使用 v-memo 缓存子树
   - 合理拆分组件粒度

3. **减少不必要的计算**：
   - 使用 computed 替代 method
   - 避免在模板中使用复杂表达式
   - 使用 watchEffect 替代多个 watch

4. **内存管理**：
   - 及时清理大型数据
   - 使用 WeakMap/WeakSet 存储临时映射
   - 避免闭包捕获大对象

5. **列表渲染优化**：
   - 始终使用 key
   - 使用虚拟滚动处理长列表
   - 避免在 v-for 中使用 v-if
