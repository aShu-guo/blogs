# 对象计算优化

## 1. 概念先行：建立心智模型

### 解决什么问题

在 Vue 3 中向子组件传递对象时，每次父组件重新渲染都会创建新的对象引用，即使对象内容完全相同。这会导致子组件不必要的更新，影响性能。

### 核心直觉

**对象计算优化 = 缓存机制 + 依赖追踪 + 引用稳定**

就像图书馆的借书卡系统：
- **无优化**：每次借书都重新办一张新卡（即使信息相同）
- **有优化**：只有个人信息变化时才换新卡，否则复用旧卡

### 流程总览

```
父组件渲染
    ↓
检查依赖项是否变化
    ↓
├─ 变化 → 重新计算 → 返回新对象 → 子组件更新
└─ 未变化 → 返回缓存对象 → 子组件不更新
```

---

## 2. 最小实现：手写"低配版"

以下是一个 40 行的 computed 缓存实现，展示核心优化原理：

```javascript
// 简化版 computed 实现
function createComputed(getter) {
  let cache = null;
  let dirty = true;
  const deps = new Set();

  // 依赖收集
  function track(dep) {
    deps.add(dep);
    dep.subscribe(() => {
      dirty = true; // 依赖变化时标记为脏
    });
  }

  return {
    get value() {
      if (dirty) {
        cache = getter(); // 重新计算
        dirty = false;
      }
      return cache; // 返回缓存
    }
  };
}

// 使用示例
const name = reactive('Alice');
const obj = createComputed(() => ({ name: name.value }));

console.log(obj.value); // { name: 'Alice' } - 对象 A
console.log(obj.value); // 同一个对象 A（缓存）
console.log(obj.value === obj.value); // true

name.value = 'Bob'; // 依赖变化
console.log(obj.value); // { name: 'Bob' } - 新对象 B
console.log(obj.value); // 同一个对象 B（缓存）
```

**核心机制**：
1. `dirty` 标记控制是否需要重新计算
2. 依赖项变化时设置 `dirty = true`
3. 访问 `value` 时检查 `dirty`，决定返回缓存还是重新计算

---

## 3. 逐行解剖：关键路径分析

### Vue 3 的 computed 实现

| 源码片段 | 逻辑拆解 |
|---------|---------|
| `class ComputedRefImpl` | computed 的核心类，管理缓存和依赖 |
| `this._dirty = true` | 脏标记：true 表示需要重新计算 |
| `this._value = undefined` | 缓存值：存储上次计算结果 |
| `this.effect = new ReactiveEffect(getter)` | 创建响应式副作用，追踪依赖项 |
| `if (this._dirty)` | 检查是否需要重新计算 |
| `this._value = this.effect.run()` | 执行计算函数，更新缓存 |
| `this._dirty = false` | 标记为干净，下次直接返回缓存 |
| `return this._value` | 返回缓存值（引用稳定） |

### 模板编译差异

**方式 1：内联对象**
```javascript
// 模板：<MyChild :foo="{ name: dynamicVar }" />
// 编译后
render() {
  return h(MyChild, {
    foo: { name: ctx.dynamicVar } // 每次都创建新对象
  });
}
```

**方式 2：computed**
```javascript
// 模板：<MyChild :foo="foo" />
// setup
const foo = computed(() => ({ name: dynamicVar.value }));

// 编译后
render() {
  return h(MyChild, {
    foo: ctx.foo // 返回缓存的对象引用
  });
}
```

### 依赖追踪流程

| 步骤 | 操作 | 说明 |
|-----|------|------|
| 1 | 首次访问 `computed.value` | 执行 getter，收集依赖 |
| 2 | 依赖项（如 `dynamicVar`）变化 | 触发 `trigger()` |
| 3 | 调用 `computed.effect.scheduler()` | 设置 `_dirty = true` |
| 4 | 下次访问 `computed.value` | 检测到 `_dirty`，重新计算 |
| 5 | 返回新值，设置 `_dirty = false` | 缓存新结果 |

---

## 4. 细节补充：边界与性能优化

### 边界情况处理

**1. 循环引用**
```javascript
const a = computed(() => ({ b: b.value }));
const b = computed(() => ({ a: a.value }));
// Vue 会检测并抛出警告：Maximum recursive updates exceeded
```

**2. 异步依赖**
```javascript
const data = computed(async () => {
  return await fetchData(); // ❌ computed 不支持异步
});
// 解决方案：使用 watchEffect + ref
const data = ref(null);
watchEffect(async () => {
  data.value = await fetchData();
});
```

**3. 深层对象变化**
```javascript
const obj = computed(() => ({
  nested: { value: count.value }
}));
// obj.value 引用稳定，但 obj.value.nested 每次都是新对象
// 如需深层缓存，需手动处理
```

### 性能优化技巧

**1. 避免在 computed 中创建大对象**
```javascript
// ❌ 不推荐
const config = computed(() => ({
  ...heavyComputation(), // 每次依赖变化都重新计算
  extra: someValue.value
}));

// ✅ 推荐：拆分 computed
const base = computed(() => heavyComputation());
const config = computed(() => ({
  ...base.value,
  extra: someValue.value
}));
```

**2. 使用 shallowRef 优化嵌套对象**
```javascript
const data = shallowRef({ nested: { value: 1 } });
// 只追踪第一层，避免深层响应式开销
```

**3. 条件计算**
```javascript
const result = computed(() => {
  if (!enabled.value) return null; // 提前返回
  return expensiveOperation(); // 仅在需要时计算
});
```

---

## 5. 总结与延伸：连接知识点

### 一句话总结

**Vue 3 的 computed 通过"脏标记 + 缓存"机制，确保只在依赖项变化时重新计算，返回稳定的对象引用，避免子组件不必要的更新。**

### 面试考点

**Q1：为什么 `<MyChild :foo="{ name: x }" />` 会导致性能问题？**
- 每次父组件渲染都创建新对象，引用地址变化
- 子组件的 `watch` 和 `watchEffect` 会被触发
- 即使内容相同，子组件也会重新渲染

**Q2：computed 和 watch 的区别？**
- `computed`：有缓存，返回值，适合派生状态
- `watch`：无缓存，执行副作用，适合响应数据变化

**Q3：如何判断是否需要使用 computed？**
- 对象创建逻辑复杂
- 需要在多处使用同一对象
- 子组件对 props 变化敏感
- 追求性能优化

**Q4：computed 的缓存失效时机？**
- 依赖的响应式数据变化
- 手动触发（通过 `effect.scheduler`）
- 组件卸载时清理

### 延伸阅读

- **响应式系统**：了解 `track()` 和 `trigger()` 的实现原理
- **组件更新机制**：Vue 3 的 diff 算法如何比较 props
- **性能优化**：`shallowRef`、`shallowReactive` 的使用场景
- **编译优化**：模板编译时的静态提升和缓存策略

### 实战建议

| 场景 | 推荐方案 | 原因 |
|-----|---------|------|
| 简单对象 | 内联对象 | 代码简洁，性能影响小 |
| 复杂计算 | computed | 避免重复计算 |
| 多处使用 | computed | 引用稳定，便于维护 |
| 子组件监听 | computed | 避免不必要的触发 |
| 频繁变化 | 内联对象 | computed 缓存无意义 |
