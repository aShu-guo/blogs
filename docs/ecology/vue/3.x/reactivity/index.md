# 响应式模块概览

## 什么是响应式？

响应式是 Vue 3 的核心特性，它使应用程序能够自动跟踪数据的变化，并在数据改变时自动更新 UI。Vue 3 通过 **Proxy** 和 **Effect
系统** 实现了一个强大且优雅的响应式系统。

## 模块架构

### 包信息

- **包名**: `@vue/reactivity`
- **位置**: `packages/reactivity/src/`
- **核心职责**: 为 JavaScript 对象添加响应能力，实现自动依赖追踪和更新通知

### 核心文件结构

```
packages/reactivity/src/
├── reactive.ts           # reactive() 函数实现
├── ref.ts               # ref() 函数实现
├── computed.ts          # computed() 函数实现
├── watch.ts             # watch() 和 watchEffect() 实现
├── effect.ts            # effect() 和 Dep 系统实现
├── baseHandlers.ts      # 普通对象的 Proxy handler
├── collectionHandlers.ts # Map/Set 的 Proxy handler
├── operators.ts         # 响应式操作符（过滤、映射等）
└── index.ts             # 公共 API 导出
```

## 核心概念

### 1. 响应式对象（Reactive Object）

通过 `reactive()` 或 `ref()` 创建的对象，能够自动追踪属性访问和修改。

```typescript
import { reactive, ref } from '@vue/reactivity'

// 深层响应式对象
const state = reactive({
  count: 0,
  user: { name: 'John' }
})

// 单一值响应式
const count = ref(0)
```

**特点**：

- 自动依赖收集（访问属性时记录）
- 自动触发更新（修改属性时通知）
- 深层响应式（嵌套对象也是响应式）

### 2. 副作用函数（Effect Function）

副作用函数是在响应式数据改变时自动执行的函数。最常见的副作用是 **render 函数**（用于渲染 UI）。

```typescript
import { reactive, effect } from '@vue/reactivity'

const state = reactive({ count: 0 })

// effect 会自动执行，并记录其访问的响应式属性
effect(() => {
  console.log(`Count is ${state.count}`)  // 自动执行此回调
})

state.count++  // 触发 effect，控制台输出：Count is 1
```

**执行流程**：

1. 首次执行 effect 回调
2. 在执行过程中，访问 `state.count` 会被追踪
3. `state.count` 将此 effect 注册为依赖
4. 当 `state.count` 修改时，effect 自动重新执行

### 3. 依赖收集和触发（Tracking and Triggering）

这是响应式系统的核心机制：

- **track**：记录哪些 effect 依赖于某个属性
- **trigger**：当属性改变时，通知依赖此属性的所有 effect

```typescript
// 全局依赖映射（简化表示）
const targetMap = new WeakMap()
// targetMap[对象] = {
//   属性1: [effect1, effect2],
//   属性2: [effect3]
// }

// 当访问属性时
get(target, key) {
  track(target, key)  // 记录：当前 effect 依赖此属性
  return target[key]
}

// 当修改属性时
set(target, key, value) {
  target[key] = value
  trigger(target, key)  // 通知：所有依赖此属性的 effect
}
```

### 4. Proxy vs 直接对象

Vue 3 使用 Proxy 代替原始对象的原因：

| 操作     | 直接对象                | Proxy |
|--------|---------------------|-------|
| 访问属性   | 无法追踪                | ✅ 可追踪 |
| 修改属性   | 无法追踪                | ✅ 可追踪 |
| 新增属性   | 无法追踪（Vue 2 需要 $set） | ✅ 可追踪 |
| 删除属性   | 无法追踪                | ✅ 可追踪 |
| 数组索引   | 无法追踪                | ✅ 可追踪 |
| in 操作符 | 无法追踪                | ✅ 可追踪 |

详见 [Proxy 详解](./1-1-proxy.md)。

## 核心 API

### reactive() - 对象响应式

```typescript
const state = reactive({
  count: 0,
  user: { name: 'John' }
})

// 深层响应式：嵌套对象也是响应式的
state.count++          // ✅ 响应
state.user.name = 'Jane'  // ✅ 响应
```

**特点**：

- 只适用于对象和数组
- 深层响应式（递归代理）
- 返回 Proxy 对象
- 同一对象总是返回同一 Proxy（通过 WeakMap 缓存）

**vs ref()**：

| 方面   | reactive | ref      |
|------|----------|----------|
| 值类型  | 仅对象      | 任意       |
| 访问方式 | 直接       | `.value` |
| 简单状态 | ❌ 不太合适   | ✅ 推荐     |
| 复杂对象 | ✅ 推荐     | ❌ 需解包    |

### ref() - 值响应式

```typescript
const count = ref(0)
const message = ref('Hello')
const data = ref({ name: 'John' })

// 访问和修改需要 .value
console.log(count.value)  // 0
count.value++             // 1

// 在模板中自动解包（不需要 .value）
// <div>{{ count }}</div>
```

**特点**：

- 可用于任意值（包括基本类型）
- 访问时需要 `.value`
- 嵌套对象自动转为 reactive
- 在 reactive 对象中自动解包

### computed() - 计算属性

```typescript
import { ref, computed } from '@vue/reactivity'

const count = ref(1)
const doubled = computed(() => count.value * 2)

console.log(doubled.value)  // 2
count.value++
console.log(doubled.value)  // 4

// computed 也支持 getter + setter
const fullName = computed(
  () => `${first.value} ${last.value}`,
  (value) => {
    [first.value, last.value] = value.split(' ')
  }
)
```

**特点**：

- 缓存计算结果（依赖未改变时不重新计算）
- 延迟计算（依赖改变时不立即计算，访问时才计算）
- 自动追踪依赖
- 支持 getter/setter

### watch() - 侦听数据变化

```typescript
import { ref, watch } from '@vue/reactivity'

const count = ref(0)
const state = reactive({ foo: 'bar' })

// 侦听单个 ref
watch(() => count.value, (newVal, oldVal) => {
  console.log(`count changed from ${oldVal} to ${newVal}`)
})

// 侦听对象属性
watch(() => state.foo, (newVal) => {
  console.log(`foo is now ${newVal}`)
})

// 侦听多个源
watch([() => count.value, () => state.foo], ([newCount, newFoo]) => {
  console.log(`count: ${newCount}, foo: ${newFoo}`)
})

// 深层侦听
watch(() => state, (newVal) => {
  console.log('state changed')
}, { deep: true })
```

**特点**：

- 需要传入 getter 函数（响应式源）
- 支持多源侦听
- 支持立即执行（`{ immediate: true }`）
- 支持深层侦听（`{ deep: true }`）

### watchEffect() - 自动依赖追踪

```typescript
import { ref, watchEffect } from '@vue/reactivity'

const count = ref(0)
const name = ref('')

watchEffect(() => {
  // 自动追踪访问的响应式属性
  console.log(`${name.value}: ${count.value}`)
})

// count 或 name 变化时，自动执行
count.value++
name.value = 'updated'
```

**特点**：

- 无需指定依赖源（自动追踪）
- 类似 effect()，但返回停止函数
- 更简洁，适合简单侦听

### effect() - 底层 API

```typescript
import { reactive, effect } from '@vue/reactivity'

const state = reactive({ count: 0 })

const stop = effect(() => {
  console.log(`effect runs: ${state.count}`)
})

state.count++  // 触发 effect

stop()  // 停止 effect，后续改变不再触发
state.count++  // 不输出任何内容
```

**特点**：

- watch 和 watchEffect 都基于 effect 实现
- 可手动停止
- 可配置调度器（scheduler）
- 最低层的响应式 API

## 工作原理

### 完整流程

```
1. 创建响应式对象
   ↓
   const state = reactive({ count: 0 })
   ↓
   创建 Proxy，关联 Dep 系统

2. 注册副作用
   ↓
   effect(() => { console.log(state.count) })
   ↓
   首次执行：访问 state.count
   ↓
   track() 记录：state.count 被此 effect 依赖

3. 修改数据
   ↓
   state.count = 1
   ↓
   Proxy set trap 拦截
   ↓
   trigger() 通知：所有依赖 state.count 的 effect

4. 自动更新
   ↓
   重新执行注册的 effect
   ↓
   输出：1
```

### 依赖图结构

```
响应式对象（state）
  ├─ 属性 foo
  │   └─ Dep（依赖集合）
  │       ├─ effect1
  │       ├─ effect2
  │       └─ effect3
  │
  └─ 属性 bar
      └─ Dep（依赖集合）
          ├─ effect1
          └─ effect4
```

当 `state.foo` 改变时，Dep 中的 `[effect1, effect2, effect3]` 都会被触发。

## 常见模式

### 模式 1：组件响应式状态

```typescript
// 使用 reactive 管理复杂状态
const state = reactive({
  todos: [],
  filters: { completed: false, priority: 'all' },
  ui: { showModal: false, loading: false }
})

// 在模板中直接使用
// <div>{{ state.todos.length }} todos</div>
```

### 模式 2：computed 派生状态

```typescript
const state = reactive({ todos: [] })

// 计算已完成的 todos
const completedCount = computed(() =>
  state.todos.filter(t => t.done).length
)

// 不要这样做（冗余的追踪）
const completedCount2 = () =>
  state.todos.filter(t => t.done).length
```

计算属性会缓存结果，避免重复计算。

### 模式 3：watch 响应数据变化

```typescript
const count = ref(0)
const doubled = computed(() => count.value * 2)

// 当依赖改变时执行某个操作
watch(
  () => doubled.value,
  (newVal) => {
    // 发送网络请求、保存数据等
    console.log('send to server:', newVal)
  }
)
```

### 模式 4：effect 批处理

```typescript
import { effect, ref, startBatch, endBatch } from '@vue/reactivity'

const a = ref(1)
const b = ref(2)

effect(() => {
  console.log(`a=${a.value}, b=${b.value}`)
})

// 不使用批处理：effect 执行 2 次
a.value = 10
b.value = 20

// 使用批处理：effect 只执行 1 次
startBatch()
a.value = 10
b.value = 20
endBatch()
```

## 性能考虑

### 1. 避免过度代理

```typescript
// ❌ 不好：代理大对象会有开销
const largeData = reactive({
  items: Array(1000000).fill(0)
})

// ✅ 好：使用 shallowReactive
const largeData = shallowReactive({
  items: Array(1000000).fill(0)
})
```

### 2. 缓存计算结果

```typescript
// ❌ 不好：每次访问都重新计算
const filtered = () => state.items.filter(i => i.active)

// ✅ 好：使用 computed 缓存
const filtered = computed(() => state.items.filter(i => i.active))
```

### 3. 批处理更新

```typescript
import { startBatch, endBatch } from '@vue/reactivity'

// ❌ 不好：触发多次更新
for (let i = 0; i < 1000; i++) {
  state.items[i] = newValue
}

// ✅ 好：批处理（仅触发一次更新）
startBatch()
for (let i = 0; i < 1000; i++) {
  state.items[i] = newValue
}
endBatch()
```

### 4. 使用 markRaw 跳过代理

```typescript
import { reactive, markRaw } from '@vue/reactivity'

// DOM 节点、大型库实例等不需要代理化
const dom = markRaw(document.getElementById('app'))
const state = reactive({ dom })

state.dom.textContent = 'hello'  // 不触发响应式更新
```

## API 快速参考

| API                    | 用途        | 返回值         |
|------------------------|-----------|-------------|
| `reactive(obj)`        | 创建深层响应式对象 | Proxy       |
| `ref(value)`           | 创建响应式引用   | RefImpl     |
| `shallowReactive(obj)` | 创建浅层响应式对象 | Proxy       |
| `shallowRef(value)`    | 创建浅层响应式引用 | RefImpl     |
| `readonly(obj)`        | 创建只读代理    | Proxy       |
| `computed(fn)`         | 创建计算属性    | ComputedRef |
| `watch(source, cb)`    | 侦听响应式源    | 停止函数        |
| `watchEffect(fn)`      | 自动依赖追踪侦听  | 停止函数        |
| `effect(fn)`           | 注册副作用     | 停止函数        |
| `isReactive(obj)`      | 检查是否为响应式  | boolean     |
| `isReadonly(obj)`      | 检查是否为只读   | boolean     |
| `isRef(obj)`           | 检查是否为 ref | boolean     |
| `toRaw(obj)`           | 获取原始对象    | any         |
| `toRef(obj, key)`      | 将属性转为 ref | Ref         |
| `unref(ref)`           | 获取 ref 的值 | any         |

## 学习路径

### 初级：理解基础概念

1. **理解 Proxy 的作用** → [Proxy 详解](./1-1-proxy.md)
    - Proxy 如何拦截属性访问和修改
    - 为什么需要 Proxy（vs Object.defineProperty）
    - WeakMap 缓存原理

2. **掌握 reactive() 和 ref()**
    - 何时使用 reactive（复杂对象）
    - 何时使用 ref（简单值或需要整体替换）
    - 自动解包的工作原理

3. **理解 effect 和依赖收集**
    - 副作用如何注册和执行
    - track() 和 trigger() 的机制
    - 依赖映射结构

### 中级：掌握常用 API

4. **深入 computed()**
    - 缓存和延迟计算
    - vs 普通函数的性能差异
    - getter/setter 模式

5. **精通 watch()**
    - 单源和多源侦听
    - 深层侦听的开销
    - vs watchEffect 的选择

6. **理解 ref 自动解包**
    - reactive 对象中的 ref 自动解包
    - 数组中的 ref 不解包的原因
    - 模板中的自动解包

### 高级：性能优化和调试

7. **性能优化**
    - 使用 shallowReactive 处理大对象
    - 使用 markRaw 跳过代理化
    - 批处理更新的时机

8. **常见陷阱**
    - 直接解构失去响应性
    - 修改原始对象不触发更新
    - Symbol 属性的特殊处理

9. **高级调试和监控**
    - 使用 Vue DevTools
    - 手动追踪依赖图
    - 性能分析工具

## 与其他模块的关系

### 与编译器（Compiler）的关系

```
模板代码
  ↓
编译器：解析模板，生成 render 函数
  ↓
render 函数包含对响应式对象的访问
  ↓
响应式系统：自动收集 render 依赖
  ↓
当数据改变时：trigger 通知 render 重新执行
```

### 与渲染器（Renderer）的关系

```
响应式系统
  ↓
effect 注册：render 函数作为副作用
  ↓
首次执行 render：生成 VNode
  ↓
挂载到 DOM
  ↓
数据改变 → trigger → 重新执行 render
  ↓
对比新旧 VNode（patch）→ 更新 DOM
```

## 常见问题

**Q: reactive() 和 ref() 应该如何选择？**

A:

- 使用 `ref()`：简单值（count、message）或需要整体替换（user = new User()）
- 使用 `reactive()`：复杂对象结构（state.user.profile.settings）
- 混合使用：最常见的做法

**Q: computed() 和普通函数有什么区别？**

A:

- computed 会缓存结果，依赖不变时不重新计算
- 普通函数每次调用都会重新计算
- 复杂计算应使用 computed，简单表达式可用函数

**Q: watch() 和 watchEffect() 有什么区别？**

A:

- watch：需指定源，可访问新旧值
- watchEffect：自动追踪依赖，无法访问旧值
- 简单侦听用 watchEffect，需要旧值用 watch

**Q: 为什么数组中的 Ref 不自动解包？**

A: 防止混淆。解构数组时应获得 Ref 本身，而非解包后的值：

```typescript
const arr = reactive([ref(0)])
const [ref0] = arr  // ref0 应该是 Ref，不应被解包
```

**Q: 如何在响应式系统之外修改数据？**

A: 使用 `toRaw()` 获取原始对象，但这样修改不会触发更新：

```typescript
const raw = toRaw(state)
raw.count++  // 修改了，但不响应
```

## 相关文件

- [Proxy 详解](./1-1-proxy.md) - 代理机制的完整分析
- [ref 实现](./1-2-ref.md)（待创建）
- [computed 实现](./1-3-computed.md)（待创建）
- [watch 实现](./1-4-watch.md)（待创建）
- [effect 系统](./1-5-effect.md)（待创建）

## 总结

Vue 3 的响应式系统通过 **Proxy + Effect** 的组合，实现了一个强大而优雅的自动依赖追踪和更新通知机制。它是 Vue 3
的核心，驱动了整个框架的响应能力。

关键要点：

- ✅ Proxy 拦截所有操作（新增属性、删除属性等）
- ✅ track() 自动收集依赖
- ✅ trigger() 自动触发更新
- ✅ 深层响应式（嵌套对象也响应）
- ✅ 灵活的 API（reactive、ref、computed、watch、effect）
- ✅ 优秀的性能（缓存、延迟计算、批处理）
