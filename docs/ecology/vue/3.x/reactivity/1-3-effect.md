# Effect 系统 - Vue 3 响应式依赖追踪核心

## 源代码位置

- **Effect 类和主函数**：`packages/reactivity/src/effect.ts` (572 lines) - effect 核心实现
- **Dep 和 Link 类**：`packages/reactivity/src/dep.ts` (398 lines) - 依赖集合和链接管理
- **EffectScope**：`packages/reactivity/src/effectScope.ts` (203 lines) - effect 作用域管理
- **依赖追踪 API**：track() 和 trigger() 函数

## 核心目的

Vue 的响应式系统需要解决一个关键问题：**当数据改变时，如何知道要更新哪些依赖它的代码？**

Effect 系统通过以下机制实现：
- 记录"哪些代码（effect）依赖了哪些数据（响应式属性）"
- 当数据改变时，自动通知所有依赖该数据的 effect 重新执行

## 第一部分：核心概念

### 1. Effect 是什么？

Effect（副作用）是一个**会自动追踪依赖的函数**。当 effect 执行时：
1. Vue 会记录它访问了哪些响应式属性
2. 当这些属性改变时，effect 会自动重新执行

```typescript
const count = reactive({ num: 0 })

// 这就是一个 effect
effect(() => {
  console.log('count:', count.num)  // 访问了响应式属性
})

// count.num 改变时，effect 自动重新执行，输出新值
count.num++  // → 输出：count: 1
```

### 2. 依赖（Dependency）是什么？

依赖是 **effect 和响应式属性之间的关系**：
- 如果 effect 在执行时访问了某个属性，就建立了一个依赖关系
- 这个关系存储在 `Dep` 对象中

```typescript
// 依赖关系示意图
响应式对象 obj
  ├─ 属性 'name'
  │   └─ Dep {
  │       subscribers: [effect1, effect2]  ← 依赖此属性的所有 effect
  │     }
  ├─ 属性 'age'
  │   └─ Dep {
  │       subscribers: [effect3]
  │     }
```

### 3. 全局依赖映射结构

Vue 使用一个全局的 **WeakMap** 来管理所有对象的依赖：

```typescript
// 文件：packages/reactivity/src/dep.ts

export const targetMap: WeakMap<object, KeyToDepMap> = new WeakMap()

// 结构：
// targetMap = {
//   对象1 → Map {
//     'property1' → Dep { subs: Link→Link→... },
//     'property2' → Dep { subs: Link→Link→... }
//   },
//   对象2 → Map {
//     'key' → Dep { subs: Link→Link→... }
//   }
// }
```

**为什么用 WeakMap？**
- WeakMap 的 key 是弱引用，当对象被垃圾回收时，对应的依赖映射也会自动清理
- 防止内存泄漏

**Dep 的订阅者使用双链表而非 Set：**
- 使用 Link 对象构成双链表（prevSub/nextSub）
- 更高效的添加/删除操作
- 支持反向迭代（onTrigger hooks 按原始顺序调用）

### 4. activeSub - 当前活跃的订阅者

Vue 使用全局变量 `activeSub` 来追踪当前正在执行的 effect：

```typescript
// 文件：packages/reactivity/src/effect.ts

export let activeSub: Subscriber | undefined

// Subscriber 接口（ReactiveEffect 实现此接口）
export interface Subscriber {
  deps?: Link           // 此 subscriber 的依赖列表（双链表）
  depsTail?: Link       // 依赖列表的尾部
  flags: EffectFlags    // 状态标志（位标志）
  next?: Subscriber     // 用于 batch 队列链接
  notify(): true | void // 被通知时调用
}
```

**activeSub 和 Subscriber 的设计：**
- `activeSub` 替代了旧版本的 `activeEffect`
- `Subscriber` 是一个接口，ReactiveEffect 和 ComputedRefImpl 都实现它
- 使用 `Link` 双链表而不是数组，提高了清理效率

---

## 第二部分：ReactiveEffect 类详解

### 源代码位置

`packages/reactivity/src/effect.ts:87-217`

### EffectFlags - 状态位标志

```typescript
// 文件：packages/reactivity/src/effect.ts

export enum EffectFlags {
  ACTIVE = 1 << 0,       // effect 是否激活（0: 已停止）
  RUNNING = 1 << 1,      // effect 是否正在运行
  TRACKING = 1 << 2,     // effect 是否应该追踪依赖
  NOTIFIED = 1 << 3,     // effect 已被加入 batch 队列
  DIRTY = 1 << 4,        // effect 的依赖已改变（用于 computed）
  ALLOW_RECURSE = 1 << 5,// 允许递归调用
  PAUSED = 1 << 6,       // effect 已暂停
  EVALUATED = 1 << 7,    // effect 已求值（用于 computed）
}
```

**为什么使用位标志？**
- 比 boolean 属性更节省内存
- 位操作速度很快
- 可以同时表示多个状态

### ReactiveEffect 类定义

```typescript
export class ReactiveEffect<T = any> implements Subscriber {
  // 依赖管理
  deps?: Link = undefined              // 此 effect 依赖的 Dep 列表（链表头）
  depsTail?: Link = undefined          // 依赖列表的尾部

  // 状态标志
  flags: EffectFlags = EffectFlags.ACTIVE | EffectFlags.TRACKING

  // 链接
  next?: Subscriber = undefined        // 用于 batch 队列

  // 生命周期回调
  cleanup?: () => void = undefined     // effect 清理函数
  onStop?: () => void                  // effect 停止时的回调

  // 调试回调
  onTrack?: (event: DebuggerEvent) => void
  onTrigger?: (event: DebuggerEvent) => void

  // 调度器
  scheduler?: EffectScheduler = undefined

  constructor(public fn: () => T) {
    // 如果有活跃的 EffectScope，将此 effect 加入
    if (activeEffectScope && activeEffectScope.active) {
      activeEffectScope.effects.push(this)
    }
  }

  // 执行 effect
  run(): T {
    if (!(this.flags & EffectFlags.ACTIVE)) {
      // 未激活时直接执行，不追踪
      return this.fn()
    }

    this.flags |= EffectFlags.RUNNING
    cleanupEffect(this)        // 执行清理函数
    prepareDeps(this)          // 准备依赖（将版本标记为 -1）
    const prevEffect = activeSub
    const prevShouldTrack = shouldTrack
    activeSub = this
    shouldTrack = true

    try {
      return this.fn()         // 执行用户函数
    } finally {
      cleanupDeps(this)        // 清理未使用的依赖
      activeSub = prevEffect
      shouldTrack = prevShouldTrack
      this.flags &= ~EffectFlags.RUNNING
    }
  }

  // 停止 effect
  stop(): void {
    if (this.flags & EffectFlags.ACTIVE) {
      // 从所有依赖中移除此 effect
      for (let link = this.deps; link; link = link.nextDep) {
        removeSub(link)
      }
      this.deps = this.depsTail = undefined
      cleanupEffect(this)
      this.onStop?.()
      this.flags &= ~EffectFlags.ACTIVE
    }
  }

  // 当被 trigger 时调用
  trigger(): void {
    if (this.flags & EffectFlags.PAUSED) {
      // 暂停状态，标记以待 resume 时执行
      pausedQueueEffects.add(this)
    } else if (this.scheduler) {
      // 有调度器，调用调度器
      this.scheduler()
    } else {
      // 直接执行（如果依赖已改变）
      this.runIfDirty()
    }
  }

  // 如果依赖改变了，执行 effect
  runIfDirty(): void {
    if (isDirty(this)) {
      this.run()
    }
  }

  // 暂停 effect 和子作用域的所有 effect
  pause(): void {
    this.flags |= EffectFlags.PAUSED
  }

  // 恢复 effect
  resume(): void {
    if (this.flags & EffectFlags.PAUSED) {
      this.flags &= ~EffectFlags.PAUSED
      if (pausedQueueEffects.has(this)) {
        pausedQueueEffects.delete(this)
        this.trigger()
      }
    }
  }

  // Subscriber 接口实现
  notify(): void {
    if (
      this.flags & EffectFlags.RUNNING &&
      !(this.flags & EffectFlags.ALLOW_RECURSE)
    ) {
      // 正在运行且不允许递归，忽略通知
      return
    }
    if (!(this.flags & EffectFlags.NOTIFIED)) {
      batch(this)  // 加入 batch 队列
    }
  }
}
```

### 关键方法说明

#### run() 方法核心逻辑

`run()` 是 effect 的主要执行方法，实现了依赖追踪和清理：

```typescript
run() {
  // 1. 检查激活状态
  if (!(this.flags & EffectFlags.ACTIVE)) {
    return this.fn()  // 未激活时直接执行，不追踪
  }

  // 2. 标记为运行状态
  this.flags |= EffectFlags.RUNNING

  // 3. 执行清理函数（如果有）
  cleanupEffect(this)

  // 4. 准备依赖：将所有旧依赖的版本标记为 -1
  //    这样可以在运行后识别哪些依赖未被使用
  prepareDeps(this)

  // 5. 保存当前上下文
  const prevEffect = activeSub
  const prevShouldTrack = shouldTrack
  activeSub = this
  shouldTrack = true

  try {
    // 6. 执行用户函数（此期间访问响应式属性会触发 track()）
    return this.fn()
  } finally {
    // 7. 清理未使用的依赖
    //    删除版本仍为 -1 的依赖（说明在本次运行中没有被访问）
    cleanupDeps(this)

    // 8. 恢复上下文
    activeSub = prevEffect
    shouldTrack = prevShouldTrack
    this.flags &= ~EffectFlags.RUNNING
  }
}
```

**prepareDeps 和 cleanupDeps 的作用：**

```typescript
// prepareDeps: 在运行前，标记所有旧依赖
function prepareDeps(sub: Subscriber) {
  for (let link = sub.deps; link; link = link.nextDep) {
    // 将版本设为 -1，表示"待验证"
    link.version = -1
  }
}

// cleanupDeps: 在运行后，删除未使用的依赖
function cleanupDeps(sub: Subscriber) {
  let head
  let tail = sub.depsTail
  let link = tail
  while (link) {
    const prev = link.prevDep
    if (link.version === -1) {
      // 版本仍为 -1，说明此次运行中没有被访问
      removeSub(link)    // 从 Dep 的订阅列表中移除
      removeDep(link)    // 从 effect 的依赖列表中移除
      if (link === tail) tail = prev
    } else {
      head = link
    }
    link = prev
  }
  sub.deps = head
  sub.depsTail = tail
}
```

#### notify() 方法 - Batch 机制

```typescript
notify(): void {
  // 如果正在运行且不允许递归，忽略通知
  if (
    this.flags & EffectFlags.RUNNING &&
    !(this.flags & EffectFlags.ALLOW_RECURSE)
  ) {
    return
  }

  // 标记为已通知，并加入 batch 队列
  if (!(this.flags & EffectFlags.NOTIFIED)) {
    batch(this)
  }
}
```

**Batch 机制的设计：**
- 当 trigger() 被调用时，不会立即执行 effect
- 而是通过 `batch(effect)` 将其加入队列
- 等待 `endBatch()` 时统一执行所有 effect
- 这样避免了频繁的重复执行

#### stop() 方法 - 清理资源

```typescript
stop(): void {
  if (this.flags & EffectFlags.ACTIVE) {
    // 从所有依赖的 Dep 中移除此 effect
    for (let link = this.deps; link; link = link.nextDep) {
      removeSub(link)
    }
    // 清空依赖列表
    this.deps = this.depsTail = undefined

    // 执行清理函数
    cleanupEffect(this)

    // 调用 onStop 回调
    this.onStop?.()

    // 标记为非活跃
    this.flags &= ~EffectFlags.ACTIVE
  }
}
```

#### pause() 和 resume() 方法 - 暂停控制

```typescript
pause(): void {
  this.flags |= EffectFlags.PAUSED  // 标记为暂停
}

resume(): void {
  if (this.flags & EffectFlags.PAUSED) {
    this.flags &= ~EffectFlags.PAUSED  // 取消暂停标记

    // 如果在暂停期间有待处理的更新，现在执行
    if (pausedQueueEffects.has(this)) {
      pausedQueueEffects.delete(this)
      this.trigger()
    }
  }
}
```

这允许暂时禁用 effect 的自动更新，直到 resume 时恢复。

#### trigger() 方法 - 触发更新

```typescript
trigger(): void {
  if (this.flags & EffectFlags.PAUSED) {
    // 暂停中，标记为待处理
    pausedQueueEffects.add(this)
  } else if (this.scheduler) {
    // 有自定义调度器，使用调度器
    this.scheduler()
  } else {
    // 直接执行（如果依赖已改变）
    this.runIfDirty()
  }
}
```

---

---

## 第三部分：Link 和 Dep - 依赖链接机制

### 源代码位置

`packages/reactivity/src/dep.ts:32-165`

### Link 类 - 连接 effect 和 Dep

```typescript
export class Link {
  // 版本号：用于判断此 link 是否在本次 effect 运行中被使用
  version: number

  // 双链表指针：连接同一 effect 的其他依赖
  nextDep?: Link   // 依赖列表中的下一个
  prevDep?: Link   // 依赖列表中的上一个

  // 双链表指针：连接同一 Dep 的其他 subscriber
  nextSub?: Link   // 订阅者列表中的下一个
  prevSub?: Link   // 订阅者列表中的上一个

  // 用于临时保存之前的 activeLink
  prevActiveLink?: Link

  constructor(
    public sub: Subscriber,  // 订阅者（effect）
    public dep: Dep,         // 依赖的属性
  ) {
    // 初始化版本为 dep 的当前版本
    this.version = dep.version
  }
}
```

**为什么用 Link 而不是简单的数组或 Set？**

1. **双向链接**：一个 Link 同时出现在两个链表中
   - 在 effect 的 deps 链表中
   - 在 Dep 的 subs 链表中
2. **高效的删除**：O(1) 时间复杂度删除 Link
3. **支持反向迭代**：Dep.subs 支持从尾部开始反向迭代（用于 onTrigger hooks）

### Dep 类 - 依赖集合

```typescript
export class Dep {
  // 版本号：每次 trigger 时递增，用于判断是否有更新
  version = 0

  // 当前活跃的 Link（优化快路径）
  activeLink?: Link = undefined

  // 订阅此 Dep 的 effect 列表（双链表，tail 指针）
  subs?: Link = undefined

  // DEV only：订阅列表的头指针（用于按顺序调用 onTrigger）
  subsHead?: Link

  // 所属的属性映射
  map?: KeyToDepMap = undefined
  key?: unknown = undefined

  // 订阅者计数（用于清理 Dep）
  sc: number = 0

  // 关联的 computed（如果此 Dep 来自 computed）
  readonly computed?: ComputedRefImpl | undefined

  // 追踪依赖
  track(debugInfo?: DebuggerEventExtraInfo): Link | undefined {
    if (!activeSub || !shouldTrack || activeSub === this.computed) {
      return
    }

    // 检查是否已经追踪过
    let link = this.activeLink
    if (link === undefined || link.sub !== activeSub) {
      // 创建新的 Link
      link = this.activeLink = new Link(activeSub, this)

      // 将 Link 加入 activeSub 的依赖列表（作为尾部）
      if (!activeSub.deps) {
        activeSub.deps = activeSub.depsTail = link
      } else {
        link.prevDep = activeSub.depsTail
        activeSub.depsTail!.nextDep = link
        activeSub.depsTail = link
      }

      // 将 Link 加入此 Dep 的订阅列表
      addSub(link)
    } else if (link.version === -1) {
      // 重用上次 run 时的 Link，只需同步版本
      link.version = this.version

      // 如果 Link 不在列表尾部，移动到尾部
      if (link.nextDep) {
        // ... 重新链接以保持访问顺序
      }
    }

    // 调试：记录 onTrack 事件
    if (__DEV__ && activeSub.onTrack) {
      activeSub.onTrack({ effect: activeSub, ...debugInfo })
    }

    return link
  }

  // 触发此 Dep 的所有订阅者
  trigger(debugInfo?: DebuggerEventExtraInfo): void {
    this.version++           // 递增版本号
    globalVersion++          // 递增全局版本
    this.notify(debugInfo)   // 通知所有订阅者
  }

  // 通知所有订阅者
  notify(debugInfo?: DebuggerEventExtraInfo): void {
    startBatch()  // 开始 batch 模式
    try {
      // DEV：按原始顺序调用 onTrigger
      if (__DEV__) {
        for (let head = this.subsHead; head; head = head.nextSub) {
          if (head.sub.onTrigger && !(head.sub.flags & EffectFlags.NOTIFIED)) {
            head.sub.onTrigger({ effect: head.sub, ...debugInfo })
          }
        }
      }

      // 从尾部开始反向迭代，通知所有订阅者
      for (let link = this.subs; link; link = link.prevSub) {
        if (link.sub.notify()) {
          // 如果是 computed，也通知其 Dep
          ;(link.sub as ComputedRefImpl).dep.notify()
        }
      }
    } finally {
      endBatch()  // 结束 batch 模式
    }
  }
}
```

---

## 第四部分：track() 和 trigger() 核心 API

### 源代码位置

`packages/reactivity/src/dep.ts:262-389`

### track() - 依赖追踪

```typescript
export function track(
  target: object,
  type: TrackOpTypes,  // GET, HAS, ITERATE 等
  key: unknown
): void {
  // 检查是否应该追踪且有活跃 subscriber
  if (shouldTrack && activeSub) {
    // 从 targetMap 获取或创建此对象的 depsMap
    let depsMap = targetMap.get(target)
    if (!depsMap) {
      targetMap.set(target, (depsMap = new Map()))
    }

    // 从 depsMap 获取或创建此属性的 Dep
    let dep = depsMap.get(key)
    if (!dep) {
      depsMap.set(key, (dep = new Dep()))
      dep.map = depsMap
      dep.key = key
    }

    // 追踪依赖
    if (__DEV__) {
      dep.track({ target, type, key })
    } else {
      dep.track()
    }
  }
}
```

**调用时机**：Proxy get trap 或其他访问操作

```typescript
// 在 baseHandlers.ts 中
const get = (target, key, receiver) => {
  const result = Reflect.get(target, key, receiver)
  track(target, TrackOpTypes.GET, key)  // ← 记录访问
  return result
}
```

### trigger() - 依赖触发

```typescript
export function trigger(
  target: object,
  type: TriggerOpTypes,      // SET, ADD, DELETE, CLEAR
  key?: unknown,
  newValue?: unknown,
  oldValue?: unknown,
  oldTarget?: Map<any, any> | Set<any>,
): void {
  const depsMap = targetMap.get(target)
  if (!depsMap) {
    globalVersion++  // 即使没有依赖，也要递增全局版本
    return
  }

  // 辅助函数：执行 Dep 的 trigger
  const run = (dep: Dep | undefined) => {
    if (dep) {
      if (__DEV__) {
        dep.trigger({ target, type, key, newValue, oldValue, oldTarget })
      } else {
        dep.trigger()
      }
    }
  }

  startBatch()  // 开始 batch 模式

  try {
    if (type === TriggerOpTypes.CLEAR) {
      // 清除集合，触发所有 Dep
      depsMap.forEach(run)
    } else {
      const targetIsArray = isArray(target)
      const isArrayIndex = targetIsArray && isIntegerKey(key)

      // 特殊处理：修改数组 length
      if (targetIsArray && key === 'length') {
        const newLength = Number(newValue)
        depsMap.forEach((dep, key) => {
          // 触发 length 依赖 + 迭代依赖 + 超出范围索引的依赖
          if (
            key === 'length' ||
            key === ARRAY_ITERATE_KEY ||
            (!isSymbol(key) && key >= newLength)
          ) {
            run(dep)
          }
        })
      } else {
        // 普通属性修改
        if (key !== void 0 || depsMap.has(void 0)) {
          run(depsMap.get(key))  // 触发该属性的依赖
        }

        // 数组索引修改，也要触发迭代依赖
        if (isArrayIndex) {
          run(depsMap.get(ARRAY_ITERATE_KEY))
        }

        // 根据操作类型，可能需要触发迭代依赖
        switch (type) {
          case TriggerOpTypes.ADD:
            if (!targetIsArray) {
              run(depsMap.get(ITERATE_KEY))
              if (isMap(target)) {
                run(depsMap.get(MAP_KEY_ITERATE_KEY))
              }
            } else if (isArrayIndex) {
              run(depsMap.get('length'))
            }
            break
          case TriggerOpTypes.DELETE:
            if (!targetIsArray) {
              run(depsMap.get(ITERATE_KEY))
              if (isMap(target)) {
                run(depsMap.get(MAP_KEY_ITERATE_KEY))
              }
            }
            break
          case TriggerOpTypes.SET:
            if (isMap(target)) {
              run(depsMap.get(ITERATE_KEY))
            }
            break
        }
      }
    }
  } finally {
    endBatch()  // 结束 batch 模式
  }
}
```

**调用时机**：Proxy set trap 或其他修改操作

```typescript
// 在 baseHandlers.ts 中
const set = (target, key, value, receiver) => {
  const result = Reflect.set(target, key, value, receiver)
  trigger(target, TriggerOpTypes.SET, key, value, oldValue)  // ← 通知依赖
  return result
}
```

### globalVersion - 全局版本号

```typescript
// 文件：packages/reactivity/src/dep.ts

export let globalVersion = 0

// 每次 trigger 时递增
// 这是一个快速检查机制，用于 computed 判断是否需要重新计算
// computed 缓存自己的 globalVersion，如果当前 globalVersion 相同，
// 说明没有任何响应式数据改变，可以直接返回缓存
```

---

---

## 第五部分：Batch 机制 - 效率优化

### 源代码位置

`packages/reactivity/src/effect.ts:236-299`

### Batch 的工作原理

当响应式数据频繁改变时，batch 机制确保 effect 不会被频繁触发：

```typescript
let batchDepth = 0           // batch 深度计数器
let batchedSub: Subscriber | undefined    // 待执行的普通 effect 队列
let batchedComputed: Subscriber | undefined // 待执行的 computed 队列

// 开始 batch 模式
export function startBatch(): void {
  batchDepth++
}

// 结束 batch 模式，执行所有待处理的 effect
export function endBatch(): void {
  if (--batchDepth > 0) {
    return  // 嵌套的 batch，继续等待
  }

  // 处理 computed（优先级高）
  if (batchedComputed) {
    let e: Subscriber | undefined = batchedComputed
    batchedComputed = undefined
    while (e) {
      const next: Subscriber | undefined = e.next
      e.next = undefined
      e.flags &= ~EffectFlags.NOTIFIED
      e = next
    }
  }

  // 处理普通 effect
  let error: unknown
  while (batchedSub) {
    let e: Subscriber | undefined = batchedSub
    batchedSub = undefined
    while (e) {
      const next: Subscriber | undefined = e.next
      e.next = undefined
      e.flags &= ~EffectFlags.NOTIFIED
      if (e.flags & EffectFlags.ACTIVE) {
        try {
          ;(e as ReactiveEffect).trigger()  // 执行 effect
        } catch (err) {
          if (!error) error = err
        }
      }
      e = next
    }
  }

  if (error) throw error
}

// 将 subscriber 加入 batch 队列
export function batch(sub: Subscriber, isComputed = false): void {
  sub.flags |= EffectFlags.NOTIFIED
  if (isComputed) {
    sub.next = batchedComputed
    batchedComputed = sub
    return
  }
  sub.next = batchedSub
  batchedSub = sub
}
```

### 工作流程示例

```
arr.push(1)          // trigger 1
arr.push(2)          // trigger 2
arr.push(3)          // trigger 3

每个 trigger 都会调用 startBatch/endBatch：

trigger 1:
  startBatch()  (batchDepth = 1)
  Dep.notify() → effect.notify() → batch(effect)
  endBatch()    (batchDepth = 0) → 执行所有 batched effect
  effect.run()

trigger 2:
  startBatch()  (batchDepth = 1)
  Dep.notify() → effect.notify() → batch(effect)
  endBatch()    (batchDepth = 0) → 执行所有 batched effect
  effect.run()

trigger 3:
  startBatch()  (batchDepth = 1)
  Dep.notify() → effect.notify() → batch(effect)
  endBatch()    (batchDepth = 0) → 执行所有 batched effect
  effect.run()

虽然 trigger 3 次，但 effect 也执行 3 次...
原因：每个 trigger 都完成了一个 batch 周期

但如果把多个操作放在一个函数中：

effect(() => {
  arr.push(1)
  arr.push(2)
  arr.push(3)
})

此时：
  Dep.notify() calls startBatch()
    trigger 1 → batch(effect)
    trigger 2 → batch(effect)（重复，但标记为已 notify）
    trigger 3 → batch(effect)（重复，但标记为已 notify）
  finally endBatch()
    effect.run() 只执行一次！
```

### 源代码位置

`packages/reactivity/src/effect.ts:225-270`

### 基础用法

```typescript
import { effect, reactive } from 'vue'

// 形式 1：简单的 effect
effect(() => {
  console.log(count.value)
})

// 形式 2：带选项的 effect
effect(
  () => {
    console.log(count.value)
  },
  {
    scheduler: (fn) => {
      // 自定义调度逻辑
    },
    scope: effectScope  // effect 作用域
  }
)
```

### effect 函数签名

```typescript
export function effect<T>(
  fn: () => T,
  options?: ReactiveEffectOptions
): ReactiveEffectRunner {
  // 如果已经是 ReactiveEffect，直接获取函数
  if ((fn as ReactiveEffectRunner).effect instanceof ReactiveEffect) {
    fn = (fn as ReactiveEffectRunner).effect.fn
  }

  // 创建 ReactiveEffect 对象
  const _effect = new ReactiveEffect(fn, options?.scheduler, options?.scope)

  // 第一次执行
  if (!options?.lazy) {
    _effect.run()
  }

  // 返回运行函数
  const runner = _effect.run.bind(_effect) as ReactiveEffectRunner
  runner.effect = _effect
  return runner
}

// ReactiveEffectRunner 的类型
interface ReactiveEffectRunner<T = any> {
  (): T
  effect: ReactiveEffect
  stop: () => void
}
```

### 选项详解

```typescript
interface ReactiveEffectOptions {
  // 是否延迟执行（默认 false，创建时立即执行）
  lazy?: boolean

  // 自定义调度器
  scheduler?: (run: () => void) => void

  // effect 所属的作用域
  scope?: EffectScope

  // 是否允许递归调用
  allowRecurse?: boolean

  // effect 的优先级
  priority?: number
}
```

### 完整示例

```typescript
// 示例 1：基础响应式
const count = ref(0)

effect(() => {
  console.log('count:', count.value)
})

count.value++  // → 输出：count: 1

// 示例 2：延迟执行
const runner = effect(
  () => {
    console.log('lazy effect')
  },
  { lazy: true }
)

// effect 不会立即执行
runner()  // → 现在执行，输出：lazy effect

// 示例 3：自定义调度器
const count = ref(0)

effect(
  () => {
    console.log('update:', count.value)
  },
  {
    scheduler(run) {
      // 在下一个微任务中执行
      Promise.resolve().then(run)
    }
  }
)

count.value = 1
count.value = 2
count.value = 3
// ← 虽然改变了 3 次，但 effect 只会在下一个微任务中执行一次

// 示例 4：停止 effect
const runner = effect(() => {
  console.log(count.value)
})

runner.stop()  // ← 停止 effect
count.value = 10  // ← effect 不会执行
```

---

## 第五部分：依赖清理机制

### 问题场景

```typescript
const show = ref(true)
const message = ref('Hello')

effect(() => {
  if (show.value) {
    console.log(message.value)  // ← 有时访问
  }
})

// 初始状态：effect 依赖 show 和 message
// targetMap = {
//   show → { 'value' → Dep { [effect] } },
//   message → { 'value' → Dep { [effect] } }
// }

show.value = false
// 现在 effect 不会访问 message，但 message 的 Dep 仍然记录了 effect
// 如果不清理，修改 message 时 effect 仍会触发（错误！）
```

### 解决方案：cleanupEffect

```typescript
function cleanupEffect(effect: ReactiveEffect) {
  const { deps } = effect

  // 遍历此 effect 所有的依赖
  for (let i = 0; i < deps.length; i++) {
    // 从每个 Dep 的订阅者集合中移除此 effect
    deps[i].subscribers.delete(effect)
  }

  // 清空 effect 的依赖列表
  deps.length = 0
}
```

**执行时机**：

```typescript
// effect.run() 中
run() {
  if (!this.active) return this.fn()

  try {
    this.parent = activeEffect
    activeEffect = this
    shouldTrack = true

    // ← 在执行新的 effect 前，清理旧的依赖
    trackOpBit = 1 << ++effectTrackDepth
    if (trackOpBit === 0) {
      trackOpBit = 1
      effectTrackDepth = 0
    }

    return this.fn()  // ← 执行时会建立新的依赖
  } finally {
    trackOpBit = 1 << --effectTrackDepth
    activeEffect = this.parent
    shouldTrack = lastShouldTrack
    this.parent = undefined
  }
}
```

**工作流程**：

```
effect 第一次执行：
  ├─ 清理旧依赖（deps = []，没有）
  ├─ 执行函数，访问 show 和 message
  ├─ track() 建立依赖：deps = [show.Dep, message.Dep]
  └─ effect 完成

show.value = false（effect 再次执行）：
  ├─ 清理旧依赖：从 show.Dep 和 message.Dep 中移除此 effect
  ├─ deps = []
  ├─ 执行函数，只访问 show（message 不再访问）
  ├─ track() 建立新依赖：deps = [show.Dep]
  └─ effect 完成

现在：
  ├─ show.Dep.subscribers 包含此 effect
  └─ message.Dep.subscribers 不包含此 effect

修改 message：
  └─ message.Dep 的订阅者不包含此 effect，所以不会触发 ✓
```

---

## 第六部分：effect 的调度器

### 什么是调度器？

调度器是一个自定义的函数，用来控制 **什么时候执行** effect 的回调，而不是 **立即执行**。

```typescript
interface EffectScheduler {
  (run: () => void): void
}
```

### 使用场景

**场景 1：批处理**

```typescript
const count = ref(0)
const jobs: (() => void)[] = []

effect(
  () => {
    console.log(count.value)
  },
  {
    scheduler(run) {
      // 将 effect 加入队列，而不是立即执行
      jobs.push(run)
    }
  }
)

count.value = 1
count.value = 2
count.value = 3
// effect 没有立即执行，而是被加入了 jobs 队列

// 现在一起执行所有任务
jobs.forEach(job => job())
// → 输出：3（只执行一次，获得最终值）
```

**场景 2：防抖（Vue 3 组件更新机制）**

```typescript
const count = ref(0)

effect(
  () => {
    console.log('update:', count.value)
  },
  {
    scheduler(run) {
      // 在下一个微任务中执行
      Promise.resolve().then(run)
    }
  }
)

count.value = 1
count.value = 2
count.value = 3
// effect 被安排在微任务队列中

// 微任务执行时
// → 输出：update: 3（只执行一次）
```

**场景 3：Vue 组件更新**

Vue 组件的更新就是通过调度器实现的：

```typescript
// packages/runtime-core/src/renderer.ts 中

const effect = new ReactiveEffect(
  () => {
    instance.update()  // 组件更新函数
  },
  (run) => {
    // 调度器：将更新推送到队列中
    queueJob(run)  // 在下一个 tick 执行
  }
)
```

### 完整工作流程

```
1. count.value = 1
   ↓ trigger() 被调用
   ↓ 获取 effect 的调度器
   ↓ scheduler(effect.run) 被调用
   ↓ effect.run 被推入队列，不立即执行

2. count.value = 2
   ↓ trigger() 被调用
   ↓ scheduler(effect.run) 被调用
   ↓ effect.run 又被推入队列

3. count.value = 3
   ↓ 同上

4. 当前宏任务完成，微任务执行
   ↓ 队列中有 3 个 effect.run
   ↓ 但由于 effect 的去重机制，可能只执行一次
   ↓ effect 拿到最终值 3，执行一次更新
```

---

## 第六部分：EffectScope - effect 作用域管理

### 什么是 EffectScope？

EffectScope 用于管理一组相关的 effect，支持：
- 创建 effect 时自动注册到 scope
- 一次性启动/暂停/恢复所有 effect
- 卸载时一次性清理所有资源

### 源代码位置

`packages/reactivity/src/effectScope.ts:6-162`

### EffectScope 类定义

```typescript
export class EffectScope {
  // 作用域状态
  private _active = true           // 是否激活
  private _isPaused = false        // 是否暂停

  // effect 管理
  effects: ReactiveEffect[] = []   // 此作用域中的所有 effect
  cleanups: (() => void)[] = []    // 清理函数列表

  // 作用域层级管理
  parent: EffectScope | undefined  // 父作用域
  scopes: EffectScope[] | undefined // 子作用域
  private index: number | undefined // 在父作用域中的索引

  // 跟踪嵌套 on() 调用
  private _on = 0
  prevScope: EffectScope | undefined

  constructor(public detached = false) {
    // 如果非分离模式，记录父作用域
    this.parent = activeEffectScope
    if (!detached && activeEffectScope) {
      this.index = (activeEffectScope.scopes ||= []).push(this) - 1
    }
  }

  // 获取活跃状态
  get active(): boolean {
    return this._active
  }

  // 在 scope 中执行函数
  run<T>(fn: () => T): T | undefined {
    if (this._active) {
      const currentEffectScope = activeEffectScope
      try {
        activeEffectScope = this  // 设置为活跃作用域
        return fn()               // 执行函数
      } finally {
        activeEffectScope = currentEffectScope
      }
    } else if (__DEV__) {
      warn(`cannot run an inactive effect scope.`)
    }
  }

  // 暂停此作用域和所有子作用域的 effect
  pause(): void {
    if (this._active) {
      this._isPaused = true
      // 暂停所有子作用域
      if (this.scopes) {
        for (let i = 0; i < this.scopes.length; i++) {
          this.scopes[i].pause()
        }
      }
      // 暂停所有 effect
      for (let i = 0; i < this.effects.length; i++) {
        this.effects[i].pause()
      }
    }
  }

  // 恢复此作用域和所有子作用域的 effect
  resume(): void {
    if (this._active) {
      if (this._isPaused) {
        this._isPaused = false
        // 恢复所有子作用域
        if (this.scopes) {
          for (let i = 0; i < this.scopes.length; i++) {
            this.scopes[i].resume()
          }
        }
        // 恢复所有 effect
        for (let i = 0; i < this.effects.length; i++) {
          this.effects[i].resume()
        }
      }
    }
  }

  // 内部使用：在嵌套 scope 中启用
  on(): void {
    if (++this._on === 1) {
      this.prevScope = activeEffectScope
      activeEffectScope = this
    }
  }

  // 内部使用：恢复之前的 scope
  off(): void {
    if (this._on > 0 && --this._on === 0) {
      activeEffectScope = this.prevScope
      this.prevScope = undefined
    }
  }

  // 停止此作用域及所有子作用域的所有 effect
  stop(fromParent?: boolean): void {
    if (this._active) {
      this._active = false

      // 停止所有 effect
      for (let i = 0; i < this.effects.length; i++) {
        this.effects[i].stop()
      }
      this.effects.length = 0

      // 执行所有清理函数
      for (let i = 0; i < this.cleanups.length; i++) {
        this.cleanups[i]()
      }
      this.cleanups.length = 0

      // 停止所有子作用域
      if (this.scopes) {
        for (let i = 0; i < this.scopes.length; i++) {
          this.scopes[i].stop(true)
        }
        this.scopes.length = 0
      }

      // 从父作用域中移除（优化：O(1) 移除）
      if (!this.detached && this.parent && !fromParent) {
        const last = this.parent.scopes!.pop()
        if (last && last !== this) {
          this.parent.scopes![this.index!] = last
          last.index = this.index!
        }
      }
      this.parent = undefined
    }
  }
}

// 全局活跃的 effect scope
export let activeEffectScope: EffectScope | undefined

// 创建 effect scope
export function effectScope(detached?: boolean): EffectScope {
  return new EffectScope(detached)
}

// 获取当前活跃的 scope
export function getCurrentScope(): EffectScope | undefined {
  return activeEffectScope
}

// 在当前 scope 中注册清理函数
export function onScopeDispose(fn: () => void, failSilently = false): void {
  if (activeEffectScope) {
    activeEffectScope.cleanups.push(fn)
  } else if (__DEV__ && !failSilently) {
    warn(`onScopeDispose() is called when there is no active effect scope`)
  }
}
```

### 分离 vs 非分离模式

```typescript
// 非分离模式（默认）
const scope1 = effectScope()  // 自动成为当前 scope 的子 scope
scope1.run(() => {
  const runner = effect(() => { ... })
  // effect 自动注册到 scope1
})

// 分离模式
const scope2 = effectScope(true)  // 独立的 scope，不属于任何父 scope
scope2.run(() => {
  const runner = effect(() => { ... })
  // effect 自动注册到 scope2
})

scope2.stop()  // 只停止 scope2 的 effect，不影响其他 scope
```

### 实际应用场景

**场景：Vue 组件生命周期**

```typescript
// 模拟 Vue 组件
class Component {
  scope: EffectScope

  constructor() {
    this.scope = new EffectScope()
  }

  setup() {
    this.scope.run(() => {
      // setup 中创建的所有 effect 和 computed 都会自动注册到 scope
      const count = ref(0)

      effect(() => {
        console.log('count:', count.value)
      })

      const doubled = computed(() => count.value * 2)

      // 注册清理函数
      onScopeDispose(() => {
        // 组件卸载时执行
        console.log('cleanup')
      })

      return { count, doubled }
    })
  }

  pause() {
    // 暂停所有 effect（不执行，但保持追踪）
    this.scope.pause()
  }

  resume() {
    // 恢复所有 effect
    this.scope.resume()
  }

  unmount() {
    // 卸载组件时，一次性停止所有 effect
    // 包括：
    //   - 所有自动创建的 effect
    //   - 所有 computed
    //   - 所有子 scope 及其 effect
    //   - 所有清理函数
    this.scope.stop()
  }
}
```

---

## 第七部分：onEffectCleanup - Effect 清理机制

### 源代码位置

`packages/reactivity/src/effect.ts:537-571`

### 清理函数机制

Vue 3 提供了 `onEffectCleanup` API，让用户能在 effect 执行前自动执行清理逻辑：

```typescript
// 注册 effect 清理函数
export function onEffectCleanup(
  fn: () => void,
  failSilently = false
): void {
  if (activeSub instanceof ReactiveEffect) {
    activeSub.cleanup = fn  // 保存清理函数到当前 effect
  } else if (__DEV__ && !failSilently) {
    warn(
      `onEffectCleanup() was called when there was no active effect` +
        ` to associate with.`,
    )
  }
}

// 执行清理函数
function cleanupEffect(e: ReactiveEffect) {
  const { cleanup } = e
  e.cleanup = undefined
  if (cleanup) {
    // 在没有 active effect 的上下文中执行清理
    const prevSub = activeSub
    activeSub = undefined
    try {
      cleanup()      // 执行清理函数
    } finally {
      activeSub = prevSub
    }
  }
}
```

### 执行流程

```typescript
effect(() => {
  console.log('effect running')

  // 注册清理函数
  onEffectCleanup(() => {
    console.log('cleaning up')
  })
})

// 首次执行：
// → effect running
// → 清理函数被保存，但不执行

// 修改响应式数据，effect 再次执行：
// → 执行前一次的清理函数：cleaning up
// → 清空 cleanup 函数引用
// → effect running
// → 新的清理函数被保存

// 调用 stop：
// → 执行清理函数：cleaning up
// → 清空 cleanup 函数引用
// → effect 被停止
```

### 实际应用场景

**场景：异步操作的清理**

```typescript
const query = ref('')

effect(() => {
  const controller = new AbortController()

  // 注册清理：取消前一次的请求
  onEffectCleanup(() => {
    controller.abort()
  })

  // 发送新请求
  fetch(`/api/search?q=${query.value}`, {
    signal: controller.signal
  })
    .then(res => res.json())
    .then(data => {
      console.log('results:', data)
    })
})

query.value = 'vue'
// → 发送请求 1

setTimeout(() => {
  query.value = 'react'
  // → 清理：取消请求 1
  // → 发送请求 2
}, 100)
```

**场景：事件监听的清理**

```typescript
const element = ref<HTMLElement | null>(null)

effect(() => {
  if (!element.value) return

  const handler = () => console.log('clicked')
  element.value.addEventListener('click', handler)

  // 注册清理：移除事件监听
  onEffectCleanup(() => {
    element.value?.removeEventListener('click', handler)
  })
})
```

---

## 第九部分：完整的执行流程示例

### 场景：修改响应式属性触发 effect

```typescript
const obj = reactive({ count: 0 })

// step 1: 创建 effect
const runner = effect(() => {
  console.log('value:', obj.count)
})

console.log('--- 初始执行完成 ---')

// step 2: 修改属性
obj.count = 1

console.log('--- 修改完成 ---')
```

### 详细执行流程

```
========== STEP 1: 创建和执行 effect ==========

effect(() => { console.log('value:', obj.count) })
  ↓
1. 创建 ReactiveEffect 对象
   new ReactiveEffect(() => { ... })

2. 调用 effect.run()
   activeEffect = 这个 effect
   shouldTrack = true
   deps = []

3. 执行回调函数 () => console.log('value:', obj.count)
   ↓
4. 访问 obj.count
   ↓ Proxy get trap
   track(obj, 'GET', 'count')

5. track() 内部：
   ├─ 检查 shouldTrack && activeEffect → true
   ├─ 从 targetMap 获取或创建 obj 的依赖映射
   ├─ 从映射中获取或创建 'count' 的 Dep
   │  Dep = new Dep()
   │  Dep.subscribers = Set []
   │
   ├─ dep.track()：
   │  Dep.subscribers.add(activeEffect)
   │  activeEffect.deps.push(dep)
   │
   └─ 现在：
      activeEffect.deps = [count.Dep]
      count.Dep.subscribers = Set [activeEffect]

6. 回调执行完，输出：value: 0

7. activeEffect = undefined

targetMap 状态：
{
  obj → {
    'count' → Dep {
      subscribers: Set [ReactiveEffect]
    }
  }
}

输出：value: 0


========== STEP 2: 修改属性 ==========

obj.count = 1
  ↓ Proxy set trap
  trigger(obj, TriggerOpTypes.SET, 'count', 1, 0)

1. trigger() 内部：
   ├─ 从 targetMap 获取 obj 的依赖映射
   ├─ 获取 'count' 的 Dep
   │  Dep.subscribers = Set [ReactiveEffect]
   │
   └─ 调用 triggerEffects(dep)

2. triggerEffects() 内部：
   ├─ 遍历 Dep.subscribers 中的所有 effect
   │  这里只有一个：ReactiveEffect
   │
   ├─ 检查 effect.scheduler 是否存在
   │  没有，所以直接调用 effect.run()
   │
   ├─ effect.run() 执行（第二次）：
   │  activeEffect = effect
   │  deps = []  （清除旧依赖）
   │
   │  执行回调函数：() => console.log('value:', obj.count)
   │  │
   │  ├─ 访问 obj.count
   │  ├─ track(obj, 'GET', 'count')
   │  ├─ 再次建立依赖
   │  │  activeEffect.deps = [count.Dep]
   │  │  count.Dep.subscribers = Set [activeEffect]
   │  │
   │  └─ 输出：value: 1
   │
   └─ effect.run() 完成

输出：value: 1


========== 最终结果 ==========

控制台输出：
value: 0
--- 初始执行完成 ---
value: 1
--- 修改完成 ---
```

---

## 第九部分：常见问题

### Q1: 为什么需要依赖清理？

**A**: 当 effect 的执行分支改变时，需要清理不再访问的依赖，否则修改这些属性时会错误地触发 effect。

```typescript
const show = ref(true)
const msg = ref('hello')

effect(() => {
  if (show.value) {
    console.log(msg.value)  // 分支 1
  } else {
    console.log('hidden')   // 分支 2
  }
})

// 如果不清理依赖，show 改为 false 时：
// ├─ 分支改变为 分支 2
// ├─ 修改 msg 不应该触发 effect
// └─ 但 msg.Dep 仍然记录了 effect，会错误地触发
```

### Q2: 为什么要用 activeEffect 栈？

**A**: 处理嵌套 effect 时，需要知道当前是哪个 effect 在执行。

```typescript
effect(() => {           // effect1
  console.log(a.value)   // a 依赖 effect1

  effect(() => {         // effect2
    console.log(b.value) // b 依赖 effect2
  })
})

// 如果没有栈，访问 b 时无法区分是 effect1 还是 effect2 在访问
```

### Q3: 如何避免无限循环？

**A**: trigger() 中检查 effect !== activeEffect，防止自己触发自己。

```typescript
effect(() => {
  count.value++  // ← 修改会触发 trigger，进而触发此 effect
})

// 如果没有检查，会导致：
// count.value++
//   ↓ trigger
//   ↓ effect 重新执行
//   ↓ count.value++ (再次)
//   ↓ 无限循环！
```

### Q4: WeakMap 相比 Map 有什么优势？

**A**: WeakMap 使用弱引用，对象被垃圾回收时，其依赖映射也会自动清理，防止内存泄漏。

```typescript
let obj = reactive({ count: 0 })
effect(() => console.log(obj.count))

// 现在 targetMap 中有 obj 的依赖映射

obj = null  // ← 对象被垃圾回收

// 由于 targetMap 是 WeakMap，且 obj 已无其他引用
// obj 和它的依赖映射会被自动回收 ✓
```

---

## 第十部分：性能优化考虑

### 1. 依赖精确性

```typescript
// ❌ 不好：修改任何属性都会触发 effect
effect(() => {
  const obj = reactive({...})  // 访问整个对象
})

// ✅ 好：只依赖需要的属性
effect(() => {
  console.log(obj.count)  // 只访问 count
})
```

### 2. 避免过度追踪

```typescript
// ❌ 不好：在 effect 外访问
const name = obj.name
effect(() => {
  console.log(name)  // 不会追踪 obj.name 的变化
})

// ✅ 好：在 effect 内访问
effect(() => {
  console.log(obj.name)  // 会追踪 obj.name 的变化
})
```

### 3. 使用调度器降低频率

```typescript
// ❌ 不好：频繁触发更新
effect(() => {
  update()  // 可能被触发多次
})

// ✅ 好：使用调度器防抖
effect(
  () => {
    update()
  },
  {
    scheduler(run) {
      Promise.resolve().then(run)  // 只执行一次
    }
  }
)
```

---

## 总结

| 概念 | 作用 |
|------|------|
| **Effect** | 自动追踪依赖的函数 |
| **Dep** | 存储依赖此属性的所有 effect |
| **track()** | 在属性访问时记录依赖关系 |
| **trigger()** | 在属性修改时通知依赖的 effect |
| **ReactiveEffect** | 包装 effect 的类，管理依赖和生命周期 |
| **activeEffect** | 当前正在执行的 effect |
| **EffectScope** | 管理一组相关的 effect |
| **Scheduler** | 自定义 effect 执行时机的函数 |

Vue 的 effect 系统通过精巧的依赖追踪机制，实现了自动的响应式更新，无需手动指定哪些 effect 需要更新，大大简化了应用开发。
