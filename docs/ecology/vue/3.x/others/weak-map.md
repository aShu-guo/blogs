# WeakMap

## 1. 概念先行：建立心智模型

### 生活类比：图书馆的借阅卡系统

想象一个图书馆的借阅卡系统：

**普通 Map（强引用）**：

- 图书馆为每个读者建立永久档案
- 即使读者已经搬走、不再来借书，档案仍然保留
- 档案柜越来越满，永远不会自动清理

**WeakMap（弱引用）**：

- 图书馆只在读者活跃时保留借阅记录
- 当读者不再来图书馆（没有其他地方记录这个人），记录自动消失
- 档案柜自动保持整洁，无需手动清理

### 核心直觉

```
WeakMap = 对象关联数据 + 自动垃圾回收
```

当对象不再被使用时，WeakMap 中的相关数据会自动清理，避免内存泄漏。

### 为什么 Vue 3 需要 WeakMap？

Vue 3 需要为原始对象缓存响应式代理：

```typescript
const obj = { count: 0 }
const proxy1 = reactive(obj)
const proxy2 = reactive(obj)  // 应该返回同一个 proxy1

// 问题：如何缓存 obj → proxy 的映射？
// 方案 1：使用 Map → 当 obj 不再使用时，Map 仍然持有引用，导致内存泄漏
// 方案 2：使用 WeakMap → 当 obj 不再使用时，自动清理缓存
```

## 2. 最小实现：手写"低配版"

以下是一个 40 行的简化实现，展示 WeakMap 在 Vue 3 响应式系统中的核心作用：

```typescript
// 缓存：原始对象 → 响应式代理
const reactiveMap = new WeakMap()

function reactive(target) {
  // 1. 检查缓存，避免重复创建代理
  const existingProxy = reactiveMap.get(target)
  if (existingProxy) {
    return existingProxy
  }

  // 2. 创建响应式代理
  const proxy = new Proxy(target, {
    get(target, key) {
      console.log(`访问 ${String(key)}`)
      return target[key]
    },
    set(target, key, value) {
      console.log(`设置 ${String(key)} = ${value}`)
      target[key] = value
      return true
    }
  })

  // 3. 缓存映射关系
  reactiveMap.set(target, proxy)

  return proxy
}

// 测试
let obj = { count: 0 }
const proxy1 = reactive(obj)
const proxy2 = reactive(obj)

console.log(proxy1 === proxy2)  // true，返回同一个代理

proxy1.count++  // 设置 count = 1

// 当 obj 不再使用时
obj = null
// WeakMap 会自动清理 obj → proxy 的映射
// 如果使用普通 Map，obj 永远不会被垃圾回收
```

**核心要点**：

- WeakMap 的键必须是对象（这里是 `target`）
- 当 `target` 不再被引用时，WeakMap 自动清理
- 这避免了因缓存导致的内存泄漏

## 3. 逐行解剖：Vue 3 的 WeakMap 使用

### Vue 3 源码中的 WeakMap

Vue 3 在 `reactivity` 模块中使用了多个 WeakMap：

| WeakMap 名称           | 键     | 值       | 作用                           |
|----------------------|-------|---------|------------------------------|
| `reactiveMap`        | 原始对象  | 响应式代理   | 缓存 `reactive()` 创建的代理        |
| `readonlyMap`        | 原始对象  | 只读代理    | 缓存 `readonly()` 创建的代理        |
| `shallowReactiveMap` | 原始对象  | 浅层响应式代理 | 缓存 `shallowReactive()` 创建的代理 |
| `targetMap`          | 响应式对象 | 依赖映射表   | 存储对象的依赖关系                    |

### 关键代码分析

```typescript
// packages/reactivity/src/reactive.ts

export const reactiveMap = new WeakMap<Target, any>()

export function reactive(target: object) {
  // 如果已经是只读代理，直接返回
  if (isReadonly(target)) {
    return target
  }

  return createReactiveObject(
    target,
    false,
    mutableHandlers,
    reactiveMap
  )
}

function createReactiveObject(
  target: Target,
  isReadonly: boolean,
  baseHandlers: ProxyHandler<any>,
  proxyMap: WeakMap<Target, any>
) {
  // 检查缓存
  const existingProxy = proxyMap.get(target)
  if (existingProxy) {
    return existingProxy
  }

  // 创建代理
  const proxy = new Proxy(target, baseHandlers)

  // 缓存映射
  proxyMap.set(target, proxy)

  return proxy
}
```

| 源码片段                                             | 逻辑拆解                                     |
|--------------------------------------------------|------------------------------------------|
| `const reactiveMap = new WeakMap<Target, any>()` | **全局缓存**：使用 WeakMap 存储所有响应式代理，键是原始对象     |
| `const existingProxy = proxyMap.get(target)`     | **缓存查询**：检查是否已为该对象创建过代理                  |
| `if (existingProxy) return existingProxy`        | **避免重复**：同一对象多次调用 `reactive()` 返回同一代理    |
| `proxyMap.set(target, proxy)`                    | **缓存存储**：将新创建的代理存入 WeakMap               |
| 使用 WeakMap 而非 Map                                | **自动清理**：当 `target` 不再被引用时，缓存自动清理，防止内存泄漏 |

### 依赖收集中的 WeakMap

```typescript
// packages/reactivity/src/effect.ts

type Dep = Set<ReactiveEffect>
type KeyToDepMap = Map<any, Dep>
const targetMap = new WeakMap<any, KeyToDepMap>()

export function track(target: object, key: unknown) {
  if (!activeEffect) return

  // 获取对象的依赖映射表
  let depsMap = targetMap.get(target)
  if (!depsMap) {
    targetMap.set(target, (depsMap = new Map()))
  }

  // 获取属性的依赖集合
  let dep = depsMap.get(key)
  if (!dep) {
    depsMap.set(key, (dep = new Set()))
  }

  // 添加依赖
  dep.add(activeEffect)
}
```

| 源码片段                                                | 逻辑拆解                          |
|-----------------------------------------------------|-------------------------------|
| `const targetMap = new WeakMap<any, KeyToDepMap>()` | **依赖存储**：为每个响应式对象存储其依赖关系      |
| `let depsMap = targetMap.get(target)`               | **查找依赖表**：获取该对象的所有属性依赖        |
| `targetMap.set(target, (depsMap = new Map()))`      | **初始化**：首次访问时创建依赖映射表          |
| 使用 WeakMap 作为外层容器                                   | **自动清理**：当响应式对象被销毁时，其依赖关系自动清理 |

## 4. 细节补充：边界与性能优化

### WeakMap vs Map 的内存对比

```typescript
// 场景：缓存 10000 个对象的计算结果

// 使用 Map（强引用）
const mapCache = new Map()
for (let i = 0; i < 10000; i++) {
  const obj = { id: i, data: new Array(1000).fill(i) }
  mapCache.set(obj, computeResult(obj))
}
// 问题：即使这些对象不再使用，Map 仍然持有引用
// 内存占用：~80MB（对象 + 计算结果）

// 使用 WeakMap（弱引用）
const weakMapCache = new WeakMap()
for (let i = 0; i < 10000; i++) {
  let obj = { id: i, data: new Array(1000).fill(i) }
  weakMapCache.set(obj, computeResult(obj))
  obj = null  // 释放引用
}
// 优势：对象不再使用时，自动被垃圾回收
// 内存占用：~0MB（已被回收）
```

### 边界情况处理

#### 1. 键必须是对象

```typescript
const wm = new WeakMap()

// ✓ 正确
wm.set({}, 'value')
wm.set([], 'value')
wm.set(function() {
}, 'value')

// ✗ 错误
wm.set('string', 'value')  // TypeError
wm.set(123, 'value')       // TypeError
wm.set(Symbol(), 'value')  // TypeError
wm.set(null, 'value')      // TypeError
```

#### 2. 不可遍历

```typescript
const wm = new WeakMap()
wm.set({}, 'value')

// ✗ 不支持
wm.size           // undefined
wm.keys()         // TypeError
wm.values()       // TypeError
wm.entries()      // TypeError
wm.forEach()      // TypeError
for (const [k, v] of wm) {
}  // TypeError

// 原因：键是弱引用，可能随时被垃圾回收，无法可靠遍历
```

#### 3. Vue 3 中的防御性检查

```typescript
function createReactiveObject(
  target: Target,
  isReadonly: boolean,
  baseHandlers: ProxyHandler<any>,
  proxyMap: WeakMap<Target, any>
) {
  // 边界 1：非对象类型直接返回
  if (!isObject(target)) {
    return target
  }

  // 边界 2：已经是代理对象，直接返回
  if (target[ReactiveFlags.RAW]) {
    return target
  }

  // 边界 3：检查缓存
  const existingProxy = proxyMap.get(target)
  if (existingProxy) {
    return existingProxy
  }

  // 边界 4：不可扩展的对象不代理
  if (!Object.isExtensible(target)) {
    return target
  }

  const proxy = new Proxy(target, baseHandlers)
  proxyMap.set(target, proxy)
  return proxy
}
```

### 性能优化

#### 1. 哈希查找性能

```typescript
// WeakMap 使用对象引用作为键，查找时间复杂度 O(1)
const wm = new WeakMap()
const obj = { id: 1 }

wm.set(obj, 'value')
wm.get(obj)  // O(1) 直接通过对象引用查找

// 对比：使用对象属性存储
obj.__reactiveProxy = proxy  // 污染对象
```

#### 2. Vue 3 的多层缓存策略

```typescript
// 第一层：WeakMap 缓存代理对象
const reactiveMap = new WeakMap()

// 第二层：WeakMap 缓存依赖关系
const targetMap = new WeakMap()

// 第三层：Map 缓存属性依赖
type KeyToDepMap = Map<any, Dep>

// 优势：
// - WeakMap 自动清理不再使用的对象
// - Map 提供高效的属性查找
// - 分层设计平衡了性能和内存管理
```

## 5. 总结与延伸

### 一句话总结

WeakMap 是 Vue 3 响应式系统的"自动清洁工"，它为对象缓存代理和依赖关系，并在对象不再使用时自动清理，防止内存泄漏。

### 面试考点

#### Q1: WeakMap 和 Map 的区别是什么？

**答案**：

- **键的类型**：WeakMap 只接受对象作为键，Map 接受任意类型
- **引用强度**：WeakMap 是弱引用，Map 是强引用
- **垃圾回收**：WeakMap 的键可被垃圾回收，Map 的键不会
- **可遍历性**：WeakMap 不可遍历（无 `size`、`keys()`、`forEach()` 等），Map 可遍历
- **使用场景**：WeakMap 用于对象元数据、缓存，Map 用于通用键值存储

#### Q2: Vue 3 为什么使用 WeakMap 而不是 Map？

**答案**：

1. **防止内存泄漏**：当组件销毁时，原始对象不再被引用，WeakMap 自动清理缓存的代理对象
2. **自动垃圾回收**：不需要手动清理缓存，减少内存管理负担
3. **对象关联**：响应式系统需要为对象关联代理和依赖，WeakMap 是天然的对象→数据映射工具

#### Q3: 如果用 Map 代替 WeakMap 会有什么问题？

**答案**：

```typescript
// 使用 Map
const reactiveMap = new Map()

function reactive(target) {
  let proxy = reactiveMap.get(target)
  if (!proxy) {
    proxy = new Proxy(target, handlers)
    reactiveMap.set(target, proxy)
  }
  return proxy
}

// 问题：
let obj = { count: 0 }
const proxy = reactive(obj)

obj = null  // 尝试释放 obj

// Map 仍然持有 obj 的强引用
// obj 和 proxy 都无法被垃圾回收
// 导致内存泄漏

// 解决方案：必须手动清理
reactiveMap.delete(obj)  // 但如何知道何时清理？
```

#### Q4: WeakMap 的实际应用场景有哪些？

**答案**：

1. **对象元数据存储**：为对象关联额外信息而不污染对象本身
2. **缓存计算结果**：缓存基于对象的计算结果，对象销毁时自动清理
3. **私有属性实现**：存储类的私有数据
4. **DOM 元素关联**：为 DOM 元素关联数据，元素移除时自动清理

### 延伸阅读

- **下一章节**：[Vue 3 响应式系统 - Proxy 与 Reflect](/ecology/vue/3.x/reactivity/proxy-reflect)
- **相关主题**：
    - [依赖收集与触发](/ecology/vue/3.x/reactivity/effect)
    - [响应式 API 设计](/ecology/vue/3.x/reactivity/api-design)
    - [内存管理与性能优化](/ecology/vue/3.x/performance/memory)

### 实践建议

1. **何时使用 WeakMap**：
    - 需要为对象关联数据且不想污染对象
    - 需要自动清理不再使用的对象相关数据
    - 实现对象级别的缓存

2. **何时不使用 WeakMap**：
    - 需要遍历所有键值对
    - 需要获取集合大小
    - 键可能是基本类型
    - 需要手动控制清理时机
