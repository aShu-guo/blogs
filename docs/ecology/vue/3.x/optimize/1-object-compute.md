# 对象透传

## 问题描述

在 Vue 3 中，有两种方式向子组件传递包含动态变量的对象：

**方式 1：直接内联对象**
```vue
<MyChild :foo="{ name: dynamicVar }" />
```

**方式 2：通过 computed 返回对象**
```vue
<script setup>
const foo = computed(() => ({ name: dynamicVar }))
</script>

<template>
  <MyChild :foo />
</template>
```

**问题**：这两种方式在响应式行为上是否完全一致？

## 核心原理分析

### 方式 1：直接内联对象（`:foo="{ name: dynamicVar }"`）

**编译后的代码**：

```javascript
// 原始模板
<MyChild :foo="{ name: dynamicVar }" />

// ↓↓↓ 编译为

(_openBlock(), _createBlock(_component_MyChild, {
  foo: { name: _ctx.dynamicVar }  // ← 每次都创建新对象！
}))
```

**关键特点**：

1. **每次都创建新对象**：模板每次重新渲染，都会创建一个新的 `{ name: dynamicVar }` 对象
2. **引用地址变化**：虽然对象内容相同，但内存引用地址不同
3. **不稳定的对象标识**：`Object.is()` 比较结果为 `false`

```typescript
// 伪代码展示
render() {
  return <MyChild foo={{ name: dynamicVar }} />
  // 每次都是：
  // foo: { name: "value1" } → 新对象 1
  // foo: { name: "value1" } → 新对象 2（引用不同）
  // foo: { name: "value1" } → 新对象 3（引用不同）
}
```

### 方式 2：通过 computed 返回对象（`const foo = computed(...)`）

**代码**：

```typescript
const foo = computed(() => ({ name: dynamicVar }))

// 使用：
<MyChild :foo />
```

**关键特点**：

1. **缓存机制**：computed 内置了依赖项追踪和结果缓存
2. **依赖项变化才更新**：只有当 `dynamicVar` 改变时，才会重新执行计算函数
3. **稳定的对象标识**：在依赖项不变的情况下，返回相同的对象引用

```typescript
// computed 的工作原理
const foo = computed(() => {
  console.log('重新计算');
  return { name: dynamicVar };
});

// 伪代码展示依赖项变化时的行为
dynamicVar = "value1"
foo.value  // → { name: "value1" } 对象 A
foo.value  // → 同样的对象 A（缓存）
foo.value  // → 同样的对象 A（缓存）

dynamicVar = "value2"  // 依赖项改变
foo.value  // → { name: "value2" } 对象 B（新计算）
foo.value  // → 同样的对象 B（缓存）
```

## 响应式行为差异

### 场景 1：子组件 props 比较

**子组件定义**：

```vue
<script setup>
const props = defineProps({
  foo: Object
})

// 监听 props 变化
watch(() => props.foo, (newVal, oldVal) => {
  console.log('props.foo 变化了')
  console.log('引用是否相同:', newVal === oldVal)
}, { deep: true })

// 或使用 watchEffect
watchEffect(() => {
  console.log('props.foo:', props.foo)
})
</script>
```

**方式 1 的表现**：

```javascript
// 模板：<MyChild :foo="{ name: dynamicVar }" />

// 父组件渲染 1
dynamicVar = "Alice"
// 创建对象 1: { name: "Alice" }
// 子组件接收到新 props，对象引用改变 ✓

// 父组件渲染 2（仅触发重新渲染，dynamicVar 未改变）
dynamicVar = "Alice"  // 未改变
// 创建对象 2: { name: "Alice" }  ← 新对象！
// 子组件接收到新 props，对象引用改变 ✓
// watch 触发（虽然内容相同，但引用不同）

// 结论：即使 dynamicVar 未改变，只要父组件重新渲染，子组件也会接收新的对象引用
```

**方式 2 的表现**：

```javascript
// computed: foo = computed(() => ({ name: dynamicVar }))

// 父组件渲染 1
dynamicVar = "Alice"
foo.value  // → { name: "Alice" } 对象 1
// 子组件接收对象 1，对象引用改变 ✓

// 父组件渲染 2（仅触发重新渲染，dynamicVar 未改变）
dynamicVar = "Alice"  // 未改变
foo.value  // → 同样的对象 1（缓存！）
// 子组件接收相同对象，对象引用不变
// watch 不触发（引用相同）

// 结论：只要 dynamicVar 未改变，子组件接收的对象引用保持不变
```

### 场景 2：对比表格

| 维度 | 方式 1（内联对象） | 方式 2（computed） |
|------|------------------|------------------|
| **创建时机** | 每次模板渲染 | 仅在依赖项变化时 |
| **对象引用** | 每次都是新引用 | 依赖项不变时相同引用 |
| **props 更新触发** | 每次重新渲染都触发 | 仅当对象内容改变时触发 |
| **watchEffect** | 每次都执行 | 仅依赖项改变时执行 |
| **性能影响** | 子组件可能不必要地重新渲染 | 更高效，避免不必要的渲染 |
| **内存占用** | 创建多个相同对象 | 对象复用，内存更优 |

## 完整示例对比

### 完整示例：任务列表

**父组件定义**：

```vue
<script setup>
import { ref, computed } from 'vue'
import MyChild from './MyChild.vue'

const dynamicVar = ref('初始值')

// 方式 2：使用 computed
const foo = computed(() => ({
  name: dynamicVar.value
}))

// 追踪重新渲染次数
let renderCount = 0
</script>

<template>
  <div>
    <p>渲染次数: {{ renderCount }}</p>

    <!-- 方式 1：直接内联 -->
    <h3>方式 1：直接内联对象</h3>
    <MyChild
      :foo="{ name: dynamicVar }"
      label="直接内联"
      @render="() => console.log('方式1渲染')"
    />

    <!-- 方式 2：computed -->
    <h3>方式 2：computed</h3>
    <MyChild
      :foo="foo"
      label="computed"
      @render="() => console.log('方式2渲染')"
    />

    <button @click="dynamicVar = '新值'">更新 dynamicVar</button>
    <button @click="renderCount++">手动触发重新渲染</button>
  </div>
</template>

<script>
export default {
  setup() {
    return {
      renderCount: ref(0)
    }
  }
}
</script>
```

**子组件定义**：

```vue
<script setup>
import { watch, watchEffect, defineProps } from 'vue'

const props = defineProps({
  foo: Object,
  label: String
})

// 监听 foo 对象的变化
watch(() => props.foo, (newVal, oldVal) => {
  console.log(`[${props.label}] foo 对象引用改变`)
  console.log('新对象:', newVal)
  console.log('旧对象:', oldVal)
  console.log('引用相同?', newVal === oldVal)
}, { deep: false })  // 注意：deep: false 只比较引用

// 监听 foo.name 的变化
watch(() => props.foo?.name, (newVal, oldVal) => {
  console.log(`[${props.label}] foo.name 改变: ${oldVal} → ${newVal}`)
})

// watchEffect 跟踪所有依赖
let effectCount = 0
watchEffect(() => {
  effectCount++
  console.log(`[${props.label}] watchEffect 执行次数: ${effectCount}`)
  console.log('当前 foo.name:', props.foo?.name)
})

// 组件生命周期
console.log(`[${props.label}] 组件创建`)
</script>

<template>
  <div class="child">
    <h4>{{ label }}</h4>
    <p>foo: {{ foo }}</p>
    <p>foo.name: {{ foo?.name }}</p>
  </div>
</template>

<style scoped>
.child {
  border: 1px solid #ccc;
  padding: 10px;
  margin: 10px 0;
}
</style>
```

**执行流程分析**：

```
初始化：
┌─────────────────────────────────────┐
│ 方式 1（直接内联）                   │
├─────────────────────────────────────┤
│ watch foo: 触发一次（初始化）       │
│ watchEffect: 执行一次（初始化）     │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ 方式 2（computed）                   │
├─────────────────────────────────────┤
│ watch foo: 触发一次（初始化）       │
│ watchEffect: 执行一次（初始化）     │
└─────────────────────────────────────┘

---

点击 "更新 dynamicVar"：
┌─────────────────────────────────────────────────────┐
│ 方式 1（直接内联）                                   │
├─────────────────────────────────────────────────────┤
│ ① 父组件重新渲染                                    │
│ ② 创建新对象 { name: '新值' }                       │
│ ③ 子组件 props.foo 引用改变                         │
│ ④ watch 触发（新对象 ≠ 旧对象）                    │
│ ⑤ watchEffect 执行（依赖改变）                      │
│ ⑥ 子组件必须重新渲染                                │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│ 方式 2（computed）                                   │
├─────────────────────────────────────────────────────┤
│ ① 父组件重新渲染                                    │
│ ② computed 检测依赖项 dynamicVar 改变               │
│ ③ computed 重新执行，返回新对象 { name: '新值' }    │
│ ④ 子组件 props.foo 引用改变                         │
│ ⑤ watch 触发（新对象 ≠ 旧对象）                    │
│ ⑥ watchEffect 执行（依赖改变）                      │
│ ⑦ 子组件必须重新渲染                                │
│ ✓ 行为与方式 1 相同                                  │
└─────────────────────────────────────────────────────┘

---

点击 "手动触发重新渲染"（dynamicVar 未改变）：
┌─────────────────────────────────────────────────────┐
│ 方式 1（直接内联）                                   │
├─────────────────────────────────────────────────────┤
│ ① 父组件重新渲染                                    │
│ ② 创建新对象 { name: '新值' }                       │
│ ③ 子组件 props.foo 引用改变 ← 新的对象引用！        │
│ ④ watch 触发（新对象 ≠ 旧对象）❌ 不必要的触发      │
│ ⑤ watchEffect 执行 ❌ 不必要的执行                   │
│ ⑥ 子组件不必要地重新渲染 ❌ 性能浪费                │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│ 方式 2（computed）                                   │
├─────────────────────────────────────────────────────┤
│ ① 父组件重新渲染                                    │
│ ② computed 检测依赖项 dynamicVar（未改变）          │
│ ③ computed 返回缓存的对象（相同引用）✓              │
│ ④ 子组件 props.foo 引用不变                         │
│ ⑤ watch 不触发（新对象 === 旧对象）                │
│ ⑥ watchEffect 不执行（依赖未改变）                 │
│ ⑦ 子组件不重新渲染 ✓ 高效！                         │
└─────────────────────────────────────────────────────┘
```

## 深入技术分析

### Vue 3 的编译优化

**模板编译过程**：

```typescript
// 原始模板
<MyChild :foo="{ name: dynamicVar }" />

// 编译后（简化）
const Parent = {
  setup() {
    const dynamicVar = ref('value');

    return () => (
      _createVNode(
        MyChild,
        {
          foo: { name: dynamicVar.value }  // ← 不稳定的表达式
        }
      )
    );
  }
};

// 关键点：{ name: dynamicVar.value } 被标记为不稳定表达式
// 每次调用都会重新计算
```

**Patch 过程**：

```typescript
// Vue 3 的 diff 算法

// 第一次渲染
const vnode1 = {
  props: {
    foo: { name: "value1" }  // 对象 A
  }
};

// 第二次渲染（父组件重新渲染，但 dynamicVar 未改变）
const vnode2 = {
  props: {
    foo: { name: "value1" }  // 对象 B（引用不同！）
  }
};

// Patch 比较
if (vnode1.props.foo !== vnode2.props.foo) {  // true（不同对象）
  // 更新 props
  child.props.foo = vnode2.props.foo;
}
```

### computed 的依赖项追踪

**computed 内部机制**：

```typescript
const foo = computed(() => {
  // 这个计算函数在依赖项改变时才会重新执行
  return { name: dynamicVar.value };
});

// 内部实现原理（简化）
class ComputedRefImpl {
  constructor(getter) {
    this.getter = getter;
    this._value = undefined;
    this._dirty = true;  // 标记是否需要重新计算

    // 创建依赖项追踪
    effect(() => {
      this._dirty = true;  // 依赖项改变时标记为脏
    }, { lazy: true });
  }

  get value() {
    if (this._dirty) {
      this._value = this.getter();  // 重新执行
      this._dirty = false;
    }
    return this._value;  // 返回缓存值
  }
}
```

**依赖项变化流程**：

```
dynamicVar 改变
    ↓
computed 依赖项追踪触发
    ↓
标记 _dirty = true
    ↓
下次访问 foo.value 时
    ↓
重新执行计算函数
    ↓
生成新对象
    ↓
更新缓存
```

## 实际性能对比

### 测试场景

```vue
<script setup>
import { ref, computed, reactive } from 'vue'
import MyChild from './MyChild.vue'

const dynamicVar = ref('value')
const foo = computed(() => ({ name: dynamicVar.value }))

// 追踪子组件更新
let childUpdateCount1 = 0
let childUpdateCount2 = 0

const handleChildUpdate1 = () => childUpdateCount1++
const handleChildUpdate2 = () => childUpdateCount2++
</script>

<template>
  <div>
    <p>方式1子组件更新次数: {{ childUpdateCount1 }}</p>
    <p>方式2子组件更新次数: {{ childUpdateCount2 }}</p>

    <MyChild
      :foo="{ name: dynamicVar }"
      @update="handleChildUpdate1"
    />

    <MyChild
      :foo="foo"
      @update="handleChildUpdate2"
    />

    <button @click="dynamicVar = 'new'">改变值</button>
    <button @click="forceUpdate">强制更新（值不变）</button>
  </div>
</template>

<script>
import { getCurrentInstance } from 'vue'

export default {
  setup() {
    const instance = getCurrentInstance()
    const forceUpdate = () => {
      instance?.proxy?.$forceUpdate?.()
    }
    return { forceUpdate }
  }
}
</script>
```

**测试结果**：

| 操作 | 方式 1 子组件更新 | 方式 2 子组件更新 |
|------|-----------------|-----------------|
| 初始化 | 1 次 | 1 次 |
| 改变 dynamicVar | 2 次（总） | 2 次（总） |
| 强制更新（值不变） | 3 次（总）❌ | 2 次（总）✓ |
| 强制更新多次 | N 次（总） | 2 次（总） |

## 何时选择哪种方式

### 使用内联对象（方式 1）的场景

```vue
<!-- ✅ 对象结构简单，不需要复杂逻辑 -->
<MyChild :foo="{ name: user.name, age: user.age }" />

<!-- ✅ 子组件不会对 props 变化做特殊处理 -->
<MyChild :foo="{ id: item.id }" />

<!-- ✅ 对象内容经常改变 -->
<MyChild :foo="{ count: counter.value }" />
```

### 使用 computed（方式 2）的场景

```vue
<!-- ✅ 对象需要复杂计算 -->
<script setup>
const config = computed(() => {
  return {
    theme: isDark.value ? 'dark' : 'light',
    language: getLang(),
    format: formatOptions.value
  }
})
</script>
<MyChild :config="config" />

<!-- ✅ 对象创建开销大，需要缓存 -->
<script setup>
const largeData = computed(() => {
  // 复杂的数据处理
  return processData(sourceData.value)
})
</script>
<MyChild :data="largeData" />

<!-- ✅ 子组件监听 props 变化，需要避免不必要的触发 -->
<script setup>
const options = computed(() => ({
  mode: mode.value
}))
</script>
<MyChild :options="options" />

<!-- ✅ 多层嵌套，子组件可能再次传给孙组件 -->
<MyChild :config="config" />

<!-- ✅ 需要在模板中多次使用同一对象 -->
<template>
  <MyChild :foo="config" />
  <MyChild2 :foo="config" />
  <MyChild3 :foo="config" />
</template>
```

## 总结

### 两种方式的关键差异

| 特性 | 内联对象 | computed |
|------|---------|---------|
| **对象创建** | 每次重新渲染都创建 | 仅依赖项改变时创建 |
| **引用稳定性** | 不稳定（每次新引用） | 稳定（依赖不变时相同引用） |
| **子组件更新** | 父重新渲染 → 子必更新 | 仅对象内容改变时子更新 |
| **适用场景** | 简单、轻量的对象 | 复杂计算、大对象、需要缓存 |
| **性能影响** | 可能产生不必要的渲染 | 更高效，避免不必要的更新 |
| **代码可读性** | 简洁直观 | 需要额外的 computed 定义 |

### 最佳实践建议

1. **默认使用内联对象**：简单情况下，直接写对象更简洁
2. **在以下情况使用 computed**：
   - 对象创建逻辑复杂
   - 需要在多个地方使用同一对象
   - 子组件对 props 变化敏感（如监听或计算依赖）
   - 追求性能优化，避免不必要的更新

3. **使用 reactive 的替代方案**：
   ```typescript
   // 如果对象需要双向绑定或频繁更新
   const foo = reactive({ name: dynamicVar.value })
   // 但需要手动同步 dynamicVar 变化
   watch(() => dynamicVar.value, (val) => {
     foo.name = val
   })
   ```

4. **对于简单引用类型，优先考虑原始值**：
   ```typescript
   // 避免传递对象
   <MyChild :name="user.name" :age="user.age" />

   // 而不是
   <MyChild :user="{ name: user.name, age: user.age }" />
   ```
