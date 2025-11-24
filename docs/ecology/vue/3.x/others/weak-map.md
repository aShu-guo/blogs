# WeakMap

## 规范定义

### 什么是 WeakMap？

WeakMap 是 JavaScript ES6 引入的一种数据结构，用于存储键值对。它与普通 Map 的主要区别在于**键必须是对象**，且这些键是**弱引用**的。

**官方定义**：
> WeakMap is similar to Map. Keys of WeakMaps are objects. WeakMap does not prevent its keys from being garbage collected.

**关键特性**：

```typescript
// 创建 WeakMap
const wm = new WeakMap()

// 键必须是对象
const obj = { id: 1 }
wm.set(obj, 'value')  // ✓ 对象作为键

wm.set('string', 'value')  // ✗ TypeError: Invalid value used as weak map key
wm.set(123, 'value')  // ✗ TypeError: Invalid value used as weak map key
```

### WeakMap 的 API

```typescript
// 有限的 API（比普通 Map 少）
const wm = new WeakMap()

// 添加
wm.set(key, value)

// 获取
wm.get(key)

// 检查
wm.has(key)

// 删除
wm.delete(key)

// ❌ 不提供以下方法
wm.size  // undefined
wm.keys()  // 不存在
wm.values()  // 不存在
wm.entries()  // 不存在
wm.forEach()  // 不存在
// 原因：键是弱引用，可能被垃圾回收，无法可靠地遍历
```

### 弱引用 vs 强引用

**普通 Map（强引用）**：

```typescript
const map = new Map()
let obj = { id: 1 }

map.set(obj, 'value')

// obj 被设置为 null
obj = null

// 但 obj 仍然被 map 强引用，不会被垃圾回收
console.log(map.size)  // 1
console.log(map.get({ id: 1 }))  // undefined（新对象）

for (const [key, value] of map) {
  console.log(key)  // 仍然能访问到原始对象
}
```

**WeakMap（弱引用）**：

```typescript
const wm = new WeakMap()
let obj = { id: 1 }

wm.set(obj, 'value')

// obj 被设置为 null
obj = null

// 没有其他引用指向该对象，垃圾回收器会回收它
// WeakMap 中的键也会被自动移除

// 无法验证是否被回收（因为无法遍历）
console.log(wm.has(obj))  // false（obj 现在是 null）
```

### 原理对比图

```
普通 Map：
┌──────────────────┐
│  Map             │
├──────────────────┤
│  ┌────────────┐  │
│  │ key: obj   │  │ ← 强引用
│  │ value      │  │
│  └────────────┘  │
└──────────────────┘
     ↓ (强引用)
   [Object]  ← 对象必须存活（即使没有其他引用）

WeakMap：
┌──────────────────┐
│  WeakMap         │
├──────────────────┤
│  ┌────────────┐  │
│  │ key: obj ~~│  │ ← 弱引用（虚线）
│  │ value      │  │
│  └────────────┘  │
└──────────────────┘
     ~~~ (弱引用)
   [Object]  ← 对象可被垃圾回收（如果没有其他引用）
```

## 与闭包的区别

### 闭包的内存特性

**闭包会保持对变量的强引用**：

```typescript
function createClosure() {
  const data = { id: 1, size: 1000 }  // 较大的对象

  return function() {
    return data.id
  }
}

const fn = createClosure()

// 即使只需要 data.id，整个 data 对象仍被闭包保持
// 内存占用：1000（对象大小）+ 额外开销
// 直到 fn 被垃圾回收，data 才会被释放
```

**问题**：

```typescript
// 场景：缓存 DOM 元素的相关信息
const elementCache = []

function trackElement(el) {
  const closure = () => {
    // 访问 el
    return el.id
  }
  elementCache.push(closure)
}

trackElement(document.getElementById('app'))
trackElement(document.getElementById('user'))

// 如果这些元素被从 DOM 中移除：
// - 闭包仍然强引用这些元素
// - 元素无法被垃圾回收（内存泄漏）

// 结果：即使元素不在 DOM 中，仍占用内存
```

### WeakMap 的优势

**WeakMap 不阻止对象被垃圾回收**：

```typescript
const elementCache = new WeakMap()

function trackElement(el) {
  elementCache.set(el, {
    id: el.id,
    metadata: {}
  })
}

trackElement(document.getElementById('app'))
trackElement(document.getElementById('user'))

// 如果元素被从 DOM 中移除：
// - WeakMap 不强引用该元素
// - 垃圾回收器可以回收该元素
// - WeakMap 中的相关数据也会自动清理

// 结果：无内存泄漏，自动清理
```

### 对比表

| 特性 | 闭包 | WeakMap |
|------|------|---------|
| **引用类型** | 强引用 | 弱引用 |
| **内存管理** | 手动管理 | 自动垃圾回收 |
| **键的类型** | 任意（通过作用域） | 仅对象 |
| **访问方式** | 作用域访问 | 通过 get/has/delete |
| **可遍历** | 不可遍历 | 不可遍历 |
| **内存安全** | 需注意泄漏风险 | 自动防止泄漏 |
| **适用场景** | 数据隐私、封装 | 对象关联、缓存 |

## Vue 3 中的使用场景

### 场景 1：DOM 元素和组件实例的关联

**问题**：

```typescript
// ❌ 使用普通 Map 会导致内存泄漏
const domToComponent = new Map()

function registerComponent(el, component) {
  domToComponent.set(el, component)
}

// 元素被移除时
el.remove()

// 但 Map 仍然强引用该元素，无法被垃圾回收
// 结论：内存泄漏
```

**解决方案**：

```typescript
// ✓ 使用 WeakMap
const domToComponent = new WeakMap()

function registerComponent(el, component) {
  domToComponent.set(el, component)
}

// 元素被移除时
el.remove()

// WeakMap 不强引用，元素可被垃圾回收
// 相关数据也自动清理
// 结论：无内存泄漏
```

### 场景 2：响应式对象和原始数据的映射

Vue 3 内部使用 WeakMap 来缓存响应式代理：

```typescript
// Vue 3 的实现（简化）
const reactiveMap = new WeakMap()  // 原始对象 → 响应式代理

function reactive(target) {
  // 检查是否已创建过代理
  if (reactiveMap.has(target)) {
    return reactiveMap.get(target)
  }

  // 创建代理
  const proxy = new Proxy(target, handler)

  // 缓存映射
  reactiveMap.set(target, proxy)

  return proxy
}

let data = { id: 1 }
const reactiveData = reactive(data)

// 当 data 被垃圾回收时
data = null

// WeakMap 也会自动清理相关缓存
// 优势：避免因代理缓存导致的内存泄漏
```

### 场景 3：私有属性的存储

```typescript
// ❌ 使用闭包或 Symbol（容易泄漏或污染）
const privateData = new Map()
let idCounter = 0

class Component {
  constructor() {
    const id = idCounter++
    privateData.set(id, {
      state: {},
      watchers: []
    })
  }
}

// 问题：手动清理很复杂，容易忘记

// ✓ 使用 WeakMap（自动清理）
const privateData = new WeakMap()

class Component {
  constructor() {
    privateData.set(this, {
      state: {},
      watchers: []
    })
  }

  getPrivate() {
    return privateData.get(this)
  }
}

// 当 Component 实例被垃圾回收时
// privateData 中的相关数据也自动清理
```

### 场景 4：缓存计算结果

```typescript
// 使用 WeakMap 缓存基于对象的计算结果

const computeCache = new WeakMap()

function getComputedValue(obj) {
  // 检查缓存
  if (computeCache.has(obj)) {
    console.log('from cache')
    return computeCache.get(obj)
  }

  // 执行昂贵的计算
  console.log('computing...')
  const result = expensiveCompute(obj)

  // 存储缓存
  computeCache.set(obj, result)

  return result
}

let data = { items: Array(1000) }
getComputedValue(data)  // 'computing...'
getComputedValue(data)  // 'from cache'

data = null  // 删除引用

// WeakMap 自动清理，无内存泄漏
```

## 实际应用示例

### 示例 1：Vue 组件的内部状态管理

```typescript
// 为组件实例存储内部状态，避免污染组件本身
const componentStates = new WeakMap()

function createComponentState(component) {
  const state = {
    mounted: false,
    observers: new Set(),
    computedCache: new Map()
  }

  componentStates.set(component, state)

  return state
}

function getComponentState(component) {
  return componentStates.get(component)
}

class Component {
  constructor() {
    createComponentState(this)
  }

  onMount() {
    const state = getComponentState(this)
    state.mounted = true
  }

  compute(key, fn) {
    const state = getComponentState(this)

    if (state.computedCache.has(key)) {
      return state.computedCache.get(key)
    }

    const result = fn()
    state.computedCache.set(key, result)
    return result
  }
}

// 使用
const comp = new Component()
comp.onMount()
const result = comp.compute('myKey', () => 'value')

// 当 comp 被垃圾回收时，componentStates 中的相关数据也自动清理
```

### 示例 2：DOM 元素和指令数据的关联

```typescript
// 为 DOM 元素关联指令的私有数据
const directiveState = new WeakMap()

const MyDirective = {
  mounted(el, binding) {
    // 为这个特定的元素存储指令状态
    directiveState.set(el, {
      value: binding.value,
      listeners: [],
      subscriptions: []
    })

    // 设置监听器等
    const state = directiveState.get(el)
    state.listeners.push(/* ... */)
  },

  updated(el, binding) {
    const state = directiveState.get(el)
    if (state) {
      state.value = binding.value
    }
  },

  unmounted(el) {
    // 不需要手动清理，WeakMap 会自动处理
    // 当元素被移除时，WeakMap 中的数据也自动清理
  }
}
```

### 示例 3：对象到元数据的映射

```typescript
// 为任意对象关联元数据，不污染对象本身
const metadata = new WeakMap()

function setMetadata(obj, key, value) {
  if (!metadata.has(obj)) {
    metadata.set(obj, new Map())
  }
  metadata.get(obj).set(key, value)
}

function getMetadata(obj, key) {
  return metadata.get(obj)?.get(key)
}

// 使用
const user = { name: 'Alice' }
setMetadata(user, 'role', 'admin')
setMetadata(user, 'lastLogin', Date.now())

console.log(getMetadata(user, 'role'))  // 'admin'
console.log(user)  // { name: 'Alice' }（未被污染）

// 当 user 被垃圾回收时，元数据也自动清理
```

## WeakMap vs WeakSet

### WeakSet 简介

WeakSet 类似于 WeakMap，但只存储值（没有键值对）：

```typescript
const ws = new WeakSet()

// 只能添加对象
const obj1 = { id: 1 }
const obj2 = { id: 2 }

ws.add(obj1)
ws.add(obj2)

// API
ws.has(obj1)     // true
ws.delete(obj1)  // true
ws.has(obj1)     // false

// 不支持
ws.size      // undefined
ws.keys()    // 不存在
ws.values()  // 不存在
ws.forEach() // 不存在
```

### 使用场景

```typescript
// WeakSet：跟踪对象集合（如已处理的对象）
const processedObjects = new WeakSet()

function process(obj) {
  if (processedObjects.has(obj)) {
    return  // 已处理过，跳过
  }

  // 处理对象
  doSomething(obj)

  // 标记为已处理
  processedObjects.add(obj)
}

// 好处：当对象被垃圾回收时，自动从集合中移除
```

## 性能考虑

### 优势

```typescript
// 1. 自动内存管理
// 不需要手动追踪和清理，减少内存泄漏的风险

// 2. 哈希表性能
// WeakMap 使用对象引用作为键，比字符串键更快

// 3. 隐私保护
// 用于存储私有数据，对象本身不被污染
```

### 劣势

```typescript
// 1. 不可遍历
// 无法获取所有键，限制了某些用途

// 2. 不可检测垃圾回收
// 无法确定何时对象被回收，给 debug 增加难度

// 3. 只支持对象键
// 基本类型无法使用
```

## 常见错误

### 错误 1：期望可遍历

```typescript
// ❌ 错误
const wm = new WeakMap()
const obj = { id: 1 }
wm.set(obj, 'value')

for (const [key, value] of wm) {  // TypeError: wm is not iterable
  console.log(key, value)
}

// ✓ 正确
const map = new Map()
map.set(obj, 'value')
for (const [key, value] of map) {
  console.log(key, value)
}
```

### 错误 2：使用基本类型作为键

```typescript
// ❌ 错误
const wm = new WeakMap()
wm.set('string', 'value')  // TypeError
wm.set(123, 'value')  // TypeError
wm.set(Symbol('key'), 'value')  // TypeError

// ✓ 正确
wm.set({}, 'value')  // 对象
wm.set([], 'value')  // 数组（也是对象）
wm.set(function() {}, 'value')  // 函数（也是对象）
```

### 错误 3：依赖 WeakMap 的 size 属性

```typescript
// ❌ 错误
const wm = new WeakMap()
console.log(wm.size)  // undefined

// ✓ 正确做法（如果需要追踪数量）
const wm = new WeakMap()
const tracker = new Map()  // 使用普通 Map 追踪

wm.set(obj, data)
tracker.set(obj, true)

console.log(tracker.size)  // 可以获取数量
```

## 最佳实践

### 1. 用于对象元数据存储

```typescript
// ✓ 好的做法
const objectMetadata = new WeakMap()

function addMetadata(obj, meta) {
  objectMetadata.set(obj, meta)
}
```

### 2. 用于缓存关联的计算结果

```typescript
// ✓ 好的做法
const resultCache = new WeakMap()

function cachedCompute(input) {
  if (resultCache.has(input)) {
    return resultCache.get(input)
  }
  const result = expensiveOperation(input)
  resultCache.set(input, result)
  return result
}
```

### 3. 用于私有属性实现

```typescript
// ✓ 好的做法
const private = new WeakMap()

class MyClass {
  constructor() {
    private.set(this, {
      internalState: {}
    })
  }

  getInternal() {
    return private.get(this)
  }
}
```

### 4. 避免过度设计

```typescript
// ❌ 过度使用
const everything = new WeakMap()
everything.set(obj1, data1)
everything.set(obj2, data2)
// 不如直接定义属性清晰

// ✓ 适度使用
// 只在需要避免污染对象或自动清理时使用
```

## 总结

| 特性 | Map | WeakMap |
|------|-----|---------|
| **键** | 任意 | 仅对象 |
| **引用强度** | 强 | 弱 |
| **可遍历** | 是 | 否 |
| **大小属性** | 有 | 无 |
| **用途** | 通用存储 | 对象关联、缓存、隐私 |
| **内存管理** | 手动 | 自动 |

**何时使用 WeakMap**：

- 需要为对象关联元数据
- 需要缓存基于对象的计算结果
- 需要存储私有数据而不污染对象
- 需要避免内存泄漏的缓存机制
- 需要自动清理不再使用的对象相关数据

**何时不使用 WeakMap**：

- 需要遍历所有键值
- 需要检查集合大小
- 键可能是基本类型
- 需要手动控制何时清理数据
