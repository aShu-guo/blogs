# createVNode 不同调用场景对比

## 场景对比表

| 调用方式 | 来源 | Type 参数 | Props 处理 | 使用场景 |
|---------|------|---------|----------|---------|
| **编译器模板** | `<template>` | 字符串或组件引用 | 已规范化 | 99% 的应用 |
| **h() 函数** | 手写渲染函数 | 任意有效类型 | 需手动处理 | 函数式组件/render |
| **JSX 语法** | JSX 编译器 | 组件对象 | 编译器处理 | React 开发者 |
| **动态组件** | :is 指令 | 变量/ref | 规范化 | `<component :is>` |
| **特殊类型** | 框架 API | Fragment/Teleport/Suspense | 特殊规则 | 多根/传送门/异步 |

---

## 详细场景分析

### 场景 1: 编译器生成的模板

**模板代码：**
```vue
<template>
  <div class="container" :class="{ active: isActive }">
    <span :style="{ color: dynamicColor }">{{ message }}</span>
    <MyComponent :props="data" @event="handler" />
  </div>
</template>
```

**编译后：**
```javascript
import { createVNode as _createVNode, Fragment as _Fragment } from 'vue'

export function render(_ctx, _cache) {
  return _createVNode('div',
    {
      class: _normalizeClass(['container', {active: _ctx.isActive}])
    },
    [
      _createVNode('span',
        {style: {color: _ctx.dynamicColor}},
        _toDisplayString(_ctx.message),
        4  // PatchFlags.STYLE
      ),
      _createVNode(_ctx.MyComponent,
        {
          props: _ctx.data,
          onEvent: _ctx.handler
        },
        null,
        0  // patchFlag = 0（默认完整比对）
      )
    ],
    0  // patchFlag（容器 class 编译时优化）
  )
}
```

**执行流程：**
```
编译模板
  ↓
生成 _createVNode 调用
  ↓
_normalizeClass 已在编译时调用
  ↓
Props 已在编译时优化（提取静态部分）
  ↓
PatchFlags 已在编译时标记
  ↓
运行时只需执行规范化后的代码
```

**关键点：**
- 编译器已预处理 class/style
- 静态 class 被提升
- 动态部分被标记 PatchFlags
- 字符串常量被复用

---

### 场景 2: 手写 h() 函数

**代码：**
```javascript
import { h } from 'vue'

export default {
  data() {
    return {
      isActive: false,
      dynamicColor: 'red'
    }
  },
  render() {
    return h('div',
      {
        class: ['container', {active: this.isActive}],  // 需手动规范化
        style: {color: this.dynamicColor}
      },
      [
        h('span', 'Hello'),
        h(MyComponent, {props: this.data})
      ]
    )
  }
}
```

**执行流程：**
```
h('div', {...})
  ↓
_createVNode('div', {...})
  ↓
guardReactiveProps(props)  // 检查是否响应式
  ↓
normalizeClass(['container', {active}])  // 手动写的需要规范化
  ↓
normalizeStyle({color})
  ↓
createBaseVNode()
  ↓
返回 VNode
```

**关键点：**
- Props 不经过编译器优化
- 每次 render 都要规范化 class/style
- 性能不如模板（无 PatchFlags）
- 灵活性高

---

### 场景 3: 动态类型（:is）

**模板：**
```vue
<template>
  <component
    :is="currentComponent"
    :props="componentProps"
    @event="handler"
  />
</template>
```

**编译后：**
```javascript
_createVNode(_ctx.currentComponent,
  {
    props: _ctx.componentProps,
    onEvent: _ctx.handler
  }
)
```

**执行流程：**
```
_createVNode(type, props)
  ↓
type 是变量（运行时决定）
  ├─ 如果 type 是 null → Comment VNode
  ├─ 如果 type 是 VNode → cloneVNode()
  ├─ 如果 type 是函数 → FUNCTIONAL_COMPONENT
  └─ 如果 type 是对象 → STATEFUL_COMPONENT
  ↓
后续流程相同
```

**关键点：**
- Type 由运行时决定
- 类型检查发生在 createVNode 内
- 每次更新都要重新检查类型
- 性能略低于静态类型

---

### 场景 4: Fragment（多根节点）

**模板：**
```vue
<template>
  <div>Node 1</div>
  <div>Node 2</div>
  <div>Node 3</div>
</template>
```

**编译后：**
```javascript
_createVNode(_Fragment, null, [
  _createVNode('div', null, 'Node 1'),
  _createVNode('div', null, 'Node 2'),
  _createVNode('div', null, 'Node 3'),
])
```

**执行流程：**
```
_createVNode(Fragment, null, [...])
  ↓
type === Fragment（特殊类型）
  ↓
ShapeFlag = ShapeFlags.FRAGMENT (但初始为 0)
  ↓
children 规范化
  ↓
shapeFlag |= ShapeFlags.ARRAY_CHILDREN
  ↓
createBaseVNode(Fragment, null, [...], 0, null, 0)
```

**关键点：**
- Fragment 没有对应的 DOM 元素
- 子节点被直接插入父元素
- 性能优于 div 包装
- 可在循环中使用

---

### 场景 5: Teleport（传送门）

**模板：**
```vue
<template>
  <Teleport to="#modal">
    <div class="modal">
      <h1>Modal Title</h1>
      <p>Modal Content</p>
    </div>
  </Teleport>
</template>
```

**编译后：**
```javascript
_createVNode(Teleport,
  {to: '#modal'},
  [
    _createVNode('div',
      {class: 'modal'},
      [
        _createVNode('h1', null, 'Modal Title'),
        _createVNode('p', null, 'Modal Content')
      ]
    )
  ]
)
```

**执行流程：**
```
_createVNode(Teleport, {to: '#modal'}, [...])
  ↓
type = Teleport（特殊类型）
  ↓
ShapeFlag = ShapeFlags.TELEPORT
  ↓
Props = {to: '#modal'}
  ↓
Children = modal 内容
  ↓
VNode.type.process() 处理 Teleport
  ↓
内容被插入到 '#modal' 元素而不是当前位置
```

**关键点：**
- Teleport 将内容传送到 DOM 的其他位置
- Props.to 指定目标位置
- Children 是被传送的内容
- 常用于模态框、弹窗

---

### 场景 6: Suspense（异步）

**模板：**
```vue
<template>
  <Suspense>
    <template #default>
      <AsyncComponent />
    </template>
    <template #fallback>
      <div>Loading...</div>
    </template>
  </Suspense>
</template>
```

**编译后：**
```javascript
_createVNode(Suspense, null, {
  default: () => [_createVNode(AsyncComponent)],
  fallback: () => [_createVNode('div', null, 'Loading...')]
})
```

**执行流程：**
```
_createVNode(Suspense, null, {default, fallback})
  ↓
type = Suspense（特殊类型）
  ↓
ShapeFlag = ShapeFlags.SUSPENSE
  ↓
children = {default, fallback}（插槽形式）
  ↓
ShapeFlag |= ShapeFlags.SLOTS_CHILDREN
  ↓
Suspense.normalize() 处理插槽
  ↓
AsyncComponent 加载时显示 fallback
  ↓
加载完成后显示 default
```

**关键点：**
- Suspense 包装异步组件
- 支持 fallback 加载状态
- Children 以插槽对象形式传递
- 用于代码分割和 Lazy Load

---

## Props 处理的差异

### 编译器模板 vs 手写 h()

**编译器模板（优化）：**
```javascript
// 静态部分提升
const _hoisted_class = 'container'

// 动态部分编译时分析
return _createVNode('div', {
  class: _normalizeClass([_hoisted_class, {active: isActive}])
})
```

**手写 h()（实时处理）：**
```javascript
return h('div', {
  class: ['container', {active: this.isActive}]
})
// 每次 render 都要 normalizeClass
```

**性能对比：**
```
编译器模板：
  - 静态 class 提升（创建一次）
  - 编译时优化 PatchFlags
  - 性能：最优

手写 h()：
  - 每次都规范化
  - 无 PatchFlags 优化
  - 性能：较差（但代码灵活）
```

---

## 类型识别流程对比

```
┌─────────────────────────────────────┐
│ _createVNode(type, props, ...)      │
└────────────┬────────────────────────┘
             │
    ┌────────v────────┐
    │ 判断 type 类型 │
    └────────┬────────┘
             │
    ┌────────┴─────────────────────┐
    │                              │
    v                              v
┌─────────────┐         ┌──────────────────┐
│  type 为    │         │  type 为        │
│ 字符串/     │         │ 函数/对象/      │
│ Fragment    │         │ 特殊类型        │
└─────────────┘         └──────────────────┘
    │                            │
    │ ShapeFlags.              │ ShapeFlags.
    │ ELEMENT                  │ COMPONENT/
    │                          │ TELEPORT/
    │                          │ SUSPENSE
    │
    v ← createBaseVNode 处理所有类型 →

┌───────────────────────────────────┐
│ 返回 VNode 对象                  │
└───────────────────────────────────┘
```

---

## 性能对比

```
操作 | 编译模板 | 手写h() | 动态类型 | 特殊类型
----|--------|--------|--------|--------
类型检查 | O(0)* | O(1) | O(1) | O(1)
Props规范化 | O(0)* | O(n) | O(n) | O(n)
Children处理 | O(m) | O(m) | O(m) | O(m)
Block追踪 | O(1) | O(1) | O(1) | O(1)
总耗时 | 最快 | 中等 | 中等 | 中等

*编译时完成，运行时不需要
```

---

## 实际使用建议

| 场景 | 推荐方式 | 理由 |
|------|---------|------|
| 大多数应用 | 编译模板 | 性能最优，自动优化 |
| 函数式组件 | h() 函数 | 逻辑可编程性强 |
| 渲染函数库 | h() 函数 | 公共 API，便于分享 |
| 动态组件列表 | :is + 编译 | 结合两者优势 |
| 复杂条件渲染 | h() 或 v-if | 代码清晰度 |
| 高性能场景 | 编译模板 | 充分利用优化 |

---

## 调试建议

```javascript
// 1. 查看编译后的代码
import { compile } from '@vue/compiler-dom'
const { code } = compile(`<div class="test">Hello</div>`)
console.log(code)

// 2. 打印 VNode 对象
console.log(vnode)

// 3. 检查 Props 是否被规范化
console.log('props.class:', vnode.props.class)
console.log('props.style:', vnode.props.style)

// 4. 检查 ShapeFlag
console.log('ShapeFlag:', vnode.shapeFlag.toString(2))

// 5. 检查 PatchFlag
console.log('PatchFlag:', vnode.patchFlag)
```
