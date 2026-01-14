# createVNode 快速参考

## 核心流程

```
_createVNode(type, props, children, ...)
  ↓
1. 类型检查 → 特殊处理（Comment/cloneVNode/解包/兼容性转换）
  ↓
2. Props 规范化 → guardReactiveProps + normalizeClass/Style
  ↓
3. ShapeFlag 编码 → 确定节点类型（ELEMENT/COMPONENT/...）
  ↓
4. 创建 VNode → createBaseVNode(...)
  ↓
5. 追踪到块树 → 如果有 patchFlag 或是组件，加入 currentBlock
```

## 类型决策树

### type 参数

```
type 是什么？
├─ null/undefined → Comment VNode
├─ VNode 对象 → cloneVNode (mergeRef)
├─ ClassComponent → 解包 __vccOpts
├─ 字符串 ('div') → ShapeFlags.ELEMENT
├─ 函数 → ShapeFlags.FUNCTIONAL_COMPONENT
└─ 对象 {setup/render} → ShapeFlags.STATEFUL_COMPONENT
```

### props 参数

```
props 是什么？
├─ null → 跳过处理
├─ 普通对象 → 直接使用
├─ Proxy/响应式 → guardReactiveProps() 克隆
├─ class 字段
│  ├─ 字符串 → 保持不变
│  ├─ 对象/数组 → normalizeClass() → 字符串
│  └─ 例: {active: true} → "active"
└─ style 字段
   ├─ 字符串 → 保持不变
   ├─ 对象/数组 → normalizeStyle() → 对象/字符串
   └─ 例: {color:'red'} → {color:'red'}
```

### children 参数

```
children 是什么？
├─ 字符串 → ShapeFlags.TEXT_CHILDREN
├─ 数组 → ShapeFlags.ARRAY_CHILDREN
└─ 对象 → ShapeFlags.SLOTS_CHILDREN
```

## Props 处理

### 响应式保护（guardReactiveProps）

```javascript
const proxy = reactive({class: {active: true}})
const cloned = extend({}, proxy)  // 克隆为普通对象

// 克隆时触发：GET handler（读取属性）
// 修改时不触发：SET handler（已是普通对象）
```

**作用：** 避免修改响应式对象时触发 setter，导致意外的响应式副作用。

### class 规范化

```javascript
{ class: 'active' }
  → 'active'（保持）

{ class: ['active', 'disabled'] }
  → 'active disabled'（拼接）

{ class: {active: true, disabled: false} }
  → 'active'（过滤真值）

{ class: [[{active: true}], 'disabled'] }
  → 'active disabled'（递归处理）
```

**返回值：** 总是返回字符串

### style 规范化

```javascript
{ style: 'color: red' }
  → 'color: red'（保持）

{ style: {color: 'red', fontSize: '14px'} }
  → {color: 'red', fontSize: '14px'}（保持）

{ style: [{color: 'red'}, {fontSize: '14px'}] }
  → {color: 'red', fontSize: '14px'}（合并）
```

## VNode 对象结构

```javascript
{
  // 核心标识
  __v_isVNode: true,
  __v_skip: true,

  // 描述信息
  type: Component | string,
  props: Record<string, any> | null,
  key: string | number | null,
  ref: VNodeRef,

  // 子元素
  children: VNodeChild[],

  // 类型标记
  shapeFlag: number,        // 元素/组件/文本/数组等
  patchFlag: number,        // 需要更新哪些属性
  dynamicProps: string[],   // 哪些 prop 动态变化

  // 运行时状态（初始化为 null）
  el: Element | null,                    // 真实 DOM
  anchor: Element | null,                // 锚点节点
  component: ComponentInternalInstance | null,
  suspense: SuspenseBoundary | null,

  // 其他
  ctx: RenderContext,
  scopeId: string | null,
  slotScopeIds: string[] | null,
  dynamicChildren: VNode[] | null,
}
```

## ShapeFlags 位标志

```javascript
ELEMENT                        = 1    // 0b1
FUNCTIONAL_COMPONENT           = 2    // 0b10
STATEFUL_COMPONENT             = 4    // 0b100
TEXT_CHILDREN                  = 8    // 0b1000
ARRAY_CHILDREN                 = 16   // 0b10000
SLOTS_CHILDREN                 = 32   // 0b100000
TELEPORT                       = 64   // 0b1000000
SUSPENSE                       = 128  // 0b10000000
COMPONENT_SHOULD_KEEP_ALIVE    = 256
COMPONENT_KEPT_ALIVE           = 512
```

**使用方式：**

```javascript
// 判断是否为组件
if (vnode.shapeFlag & ShapeFlags.COMPONENT) {
  // 是组件（函数或状态组件）
}

// 判断是否有数组子节点
if (vnode.shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
  // 有数组子节点
}
```

## PatchFlags 优化标记

```javascript
TEXT             = 1              // 文本内容变化
CLASS            = 1 << 1    = 2  // class 变化
STYLE            = 1 << 2    = 4  // style 变化
PROPS            = 1 << 3    = 8  // props 变化
FULL_PROPS       = 1 << 4    = 16 // 完整 props 比对
HYDRATE_EVENTS   = 1 << 5    = 32 // SSR 事件
STABLE_FRAGMENT  = 1 << 6    = 64 // 稳定 Fragment
KEYED_FRAGMENT   = 1 << 7    = 128
UNKEYED_FRAGMENT = 1 << 8    = 256
NEED_PATCH       = 1 << 9    = 512
DYNAMIC_SLOTS    = 1 << 10   = 1024
```

**作用：** 编译器标记需要更新的内容，patch 算法据此优化比对，性能提升约 30-50%。

## 常见调用模式

### 编译器生成

```javascript
// 模板：<div :class="active ? 'active' : ''" @click="handle">
// 编译后：
_createVNode('div',
  {
    class: _normalizeClass(_ctx.active ? 'active' : ''),
    onClick: _ctx.handle
  },
  null,
  PatchFlags.CLASS,  // 只有 class 可能变化
  ['class']          // 动态属性列表
)
```

### 手写 h() 函数

```javascript
h('div', {class: 'container'}, [
  h('span', 'Hello')
])
```

### 动态类型

```javascript
const type = ref(MyComponent)
h(type.value, props)
```

### 多根节点

```javascript
h(Fragment, null, [
  h('div', '1'),
  h('div', '2'),
  h('div', '3'),
])
```

## 函数调用链

```
createVNode()
  ├─→ _createVNode()（PROD）
  └─→ createVNodeWithArgsTransform()（DEV）

_createVNode()
  ├─→ guardReactiveProps()
  ├─→ normalizeClass()
  ├─→ normalizeStyle()
  └─→ createBaseVNode()

createBaseVNode()
  ├─→ normalizeChildren()
  ├─→ 追踪到块树
  └─→ 返回 VNode

VNode 后续流程
  ├─→ patch()（首次挂载或更新）
  ├─→ mount()（挂载到 DOM）
  └─→ unmount()（卸载时清理）
```

## 性能优化

### 最佳实践

```javascript
// 1. 静态节点提升
const staticNode = h('div', 'Static')
// 多次 render 复用同一对象

// 2. 使用 patchFlag 优化
h('div', {...}, null, PatchFlags.TEXT)
// 告诉 patch 算法只需检查文本

// 3. 避免 class 频繁变化
// 不好：h('div', {class: computedValue})
// 好：h('div', {class: isFinal ? 'active' : ''})

// 4. 标记组件为 raw（不是响应式）
markRaw(SomeComponent)
h(SomeComponent, props)  // 避免警告
```

### 避免的做法

```javascript
// 1. 不要将组件包装为 reactive
const comp = reactive(MyComponent)  // ❌ 警告
h(comp, props)

// 2. 不要创建响应式 props 对象
const props = reactive({})
h('div', props)  // ✓ 会被 guardReactiveProps 克隆

// 3. 避免深层嵌套的 class/style
// 不好：{class: [['a'], [['b']]]}
// 好：{class: ['a', 'b']}
```

## 调试技巧

```javascript
// 查看 VNode 内容
console.log(vnode)

// 检查 ShapeFlag
console.log(vnode.shapeFlag & ShapeFlags.COMPONENT)

// 检查 PatchFlag
console.log(vnode.patchFlag)

// 查看 props
console.log(vnode.props)

// 在开发模式查看警告
// 控制台会显示关于响应式组件等的警告
```

## 常见问题

**Q: 为什么要 guardReactiveProps？**
A: 避免修改响应式对象时触发 setter，导致意外的响应式副作用。

**Q: normalizeClass 返回什么？**
A: 总是返回字符串，即使输入是对象或数组。

**Q: PatchFlags 对性能影响多大？**
A: 大约提升 30-50%，取决于模板的动态属性数量。

**Q: 可以跳过 createVNode 直接创建 VNode 对象吗？**
A: 不建议，缺少必要的规范化和优化。

**Q: Block tree 是什么？**
A: 编译器优化，快速找到需要更新的节点，避免完整树遍历。
