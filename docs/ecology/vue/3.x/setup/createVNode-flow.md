# createVNode 调用逻辑梳理

## 1. 概念先行：建立心智模型

### createVNode 是什么？

想象你在建造一座房子。在真正动工之前，建筑师会先画出**设计图纸**——标注房间布局、材料规格、装修风格。createVNode 就是 Vue 3 的"设计图纸绘制员"，它的工作是：

- **接收原材料**：组件类型（div、MyComponent）、属性（class、style）、子元素
- **质检与加工**：检查材料是否合格，把不规范的格式统一处理
- **生成图纸**：输出一个标准化的 VNode 对象（虚拟 DOM 节点）

### 核心直觉

```
createVNode = 质检员 + 加工厂 + 图纸打印机
```

- **质检员**：检查 type 是否为空、是否已经是 VNode、是否是类组件
- **加工厂**：把 class 对象转成字符串、把 style 数组合并成对象、克隆响应式对象
- **图纸打印机**：生成标准化的 VNode 对象，标记类型（ShapeFlag）和更新提示（PatchFlag）

### 流程总览

```
用户调用 createVNode(type, props, children)
    ↓
[步骤1] 类型检查：null? VNode? ClassComponent?
    ↓
[步骤2] Props 规范化：class、style、响应式保护
    ↓
[步骤3] ShapeFlag 编码：元素？组件？Teleport？
    ↓
[步骤4] 创建 VNode：调用 createBaseVNode，规范化 children，追踪到块树
    ↓
返回标准化的 VNode 对象
```

---

## 2. 最小实现：手写"低配版"

下面是一个 40 行的简化版 createVNode，去掉了所有边界处理和优化，只保留核心逻辑：

```javascript
// 简化版 createVNode（可直接在控制台运行）
function createVNode(type, props = null, children = null) {
  // 步骤1: 类型检查
  if (!type) {
    type = Comment  // 空类型转为注释节点
  }

  // 步骤2: Props 规范化
  if (props) {
    // 克隆响应式对象
    if (isProxy(props)) {
      props = { ...props }
    }

    // 规范化 class
    if (props.class && typeof props.class !== 'string') {
      props.class = normalizeClass(props.class)
    }

    // 规范化 style
    if (props.style && typeof props.style === 'object') {
      props.style = normalizeStyle(props.style)
    }
  }

  // 步骤3: 计算 ShapeFlag
  const shapeFlag = typeof type === 'string'
    ? 1  // ELEMENT
    : typeof type === 'function'
      ? 2  // FUNCTIONAL_COMPONENT
      : 4  // STATEFUL_COMPONENT

  // 步骤4: 创建 VNode 对象
  const vnode = {
    type,
    props,
    children,
    shapeFlag,
    el: null,  // 真实 DOM 节点（渲染时填充）
    key: props?.key ?? null,
  }

  // 规范化 children 类型
  if (children) {
    vnode.shapeFlag |= typeof children === 'string' ? 8 : 16  // TEXT_CHILDREN : ARRAY_CHILDREN
  }

  return vnode
}

// 辅助函数
function normalizeClass(value) {
  if (typeof value === 'string') return value
  if (Array.isArray(value)) return value.filter(Boolean).join(' ')
  if (typeof value === 'object') {
    return Object.keys(value).filter(k => value[k]).join(' ')
  }
  return ''
}

function normalizeStyle(value) {
  if (Array.isArray(value)) {
    return value.reduce((acc, item) => ({ ...acc, ...item }), {})
  }
  return value
}

// 测试
const vnode = createVNode('div', {
  class: { active: true, disabled: false },
  style: [{ color: 'red' }, { fontSize: '14px' }]
}, 'Hello')

console.log(vnode)
// 输出：
// {
//   type: 'div',
//   props: { class: 'active', style: { color: 'red', fontSize: '14px' } },
//   children: 'Hello',
//   shapeFlag: 9,  // ELEMENT(1) | TEXT_CHILDREN(8)
//   el: null,
//   key: null
// }
```

**关键点**：
- 真实源码有 200+ 行，但核心逻辑就是这 40 行
- 生产环境会处理更多边界情况（VNode 克隆、兼容性、开发警告等）
- ShapeFlag 使用位运算，可以同时标记多个特征（如"元素 + 文本子节点"）

---

## 3. 逐行解剖：关键路径分析

### 3.1 类型检查与标准化

| 源码片段 | 逻辑拆解 |
|---------|---------|
| `if (!type \|\| type === NULL_DYNAMIC_COMPONENT)` | **空类型防护**：动态组件可能为 null，转为 Comment 节点避免崩溃 |
| `type = Comment` | **降级处理**：注释节点不会渲染任何内容，但保持 VNode 树结构完整 |
| `if (isVNode(type))` | **递归情况**：`<component :is="vnode" />` 时，type 本身是 VNode |
| `return cloneVNode(type, props, true)` | **克隆 + 合并**：复用原 VNode，合并新 props，设置 `mergeRef: true` 支持多 ref |
| `if (isClassComponent(type))` | **类组件解包**：Vue 3 内部统一使用对象组件，类组件需要提取 `__vccOpts` |
| `type = type.__vccOpts` | **兼容处理**：类组件的选项对象存储在 `__vccOpts` 属性中 |

**为什么需要克隆 VNode？**
```javascript
// 场景：动态组件复用
const cachedVNode = createVNode(MyComponent, { id: 1 })

// 后续渲染时传入不同 props
createVNode(cachedVNode, { id: 2 })
// → 克隆原 VNode，避免修改缓存的对象
```

### 3.2 Props 规范化

| 源码片段 | 逻辑拆解 |
|---------|---------|
| `props = guardReactiveProps(props)` | **响应式保护**：克隆 Proxy 对象为普通对象，避免触发不必要的 setter |
| `if (klass && !isString(klass))` | **class 规范化**：只处理非字符串类型（对象、数组），字符串直接使用 |
| `props.class = normalizeClass(klass)` | **统一格式**：对象 `{ active: true }` 和数组 `['active']` 都转为字符串 `'active'` |
| `if (isProxy(style) && !isArray(style))` | **嵌套响应式**：style 对象内部可能也是响应式的，需要再次克隆 |
| `props.style = normalizeStyle(style)` | **合并样式**：数组形式的 style 合并为单个对象 |

**为什么要克隆响应式对象？**
```javascript
const state = reactive({ class: { active: true } })

// 错误：直接修改会触发响应式更新
createVNode('div', state)  // 内部会修改 state.class

// 正确：克隆后修改不影响原对象
const props = { ...state }
props.class = 'active'  // 不会触发 state 的更新
```

**normalizeClass 详解**：
```javascript
// 输入：{ active: true, disabled: false }
// 输出：'active'

// 输入：['btn', { primary: true }]
// 输出：'btn primary'

// 输入：'static-class'
// 输出：'static-class'（不处理）
```

**normalizeStyle 详解**：
```javascript
// 输入：[{ color: 'red' }, { fontSize: '14px' }]
// 输出：{ color: 'red', fontSize: '14px' }

// 输入：'color: red; font-size: 14px'
// 输出：'color: red; font-size: 14px'（不处理）
```

### 3.3 ShapeFlag 编码

| 源码片段 | 逻辑拆解 |
|---------|---------|
| `isString(type) ? ShapeFlags.ELEMENT` | **HTML 元素**：'div'、'span' 等原生标签 |
| `isSuspense(type) ? ShapeFlags.SUSPENSE` | **Suspense 组件**：异步组件包装器 |
| `isTeleport(type) ? ShapeFlags.TELEPORT` | **Teleport 组件**：传送门（渲染到其他 DOM 位置） |
| `isObject(type) ? ShapeFlags.STATEFUL_COMPONENT` | **有状态组件**：对象形式的组件（有 data、methods） |
| `isFunction(type) ? ShapeFlags.FUNCTIONAL_COMPONENT` | **函数组件**：纯函数，接收 props 返回 VNode |

**ShapeFlags 位运算表**：
```javascript
const ShapeFlags = {
  ELEMENT: 1,                    // 0000001
  FUNCTIONAL_COMPONENT: 2,       // 0000010
  STATEFUL_COMPONENT: 4,         // 0000100
  TEXT_CHILDREN: 8,              // 0001000
  ARRAY_CHILDREN: 16,            // 0010000
  SLOTS_CHILDREN: 32,            // 0100000
  TELEPORT: 64,                  // 1000000
  SUSPENSE: 128,                 // 10000000
}

// 组合使用（位或运算）
const shapeFlag = ShapeFlags.ELEMENT | ShapeFlags.TEXT_CHILDREN  // 9 (0001001)

// 判断类型（位与运算）
if (shapeFlag & ShapeFlags.ELEMENT) {
  // 是元素节点
}
```

**为什么用位运算？**
- **性能**：位运算比 `instanceof` 或多个 `typeof` 快 10 倍
- **空间**：一个数字可以存储多个布尔标志
- **灵活**：可以同时标记"元素 + 数组子节点"

### 3.4 创建 VNode 对象

| 源码片段 | 逻辑拆解 |
|---------|---------|
| `__v_isVNode: true` | **类型标记**：用于 `isVNode()` 快速判断 |
| `__v_skip: true` | **跳过响应式**：VNode 对象不应该被 `reactive()` 包装 |
| `key: props && normalizeKey(props)` | **提取 key**：从 props 中提取 key 属性（用于列表 diff） |
| `ref: props && normalizeRef(props)` | **提取 ref**：支持字符串 ref、函数 ref、对象 ref |
| `el: null` | **真实 DOM**：渲染时会填充为实际的 DOM 节点 |
| `component: null` | **组件实例**：组件 VNode 渲染时会创建组件实例 |
| `dynamicChildren: null` | **动态子节点**：Block Tree 优化，只追踪动态节点 |

**children 规范化**：
```javascript
if (needFullChildrenNormalization) {
  normalizeChildren(vnode, children)
} else if (children) {
  // 编译器优化：已知 children 类型，直接标记
  vnode.shapeFlag |= isString(children)
    ? ShapeFlags.TEXT_CHILDREN
    : ShapeFlags.ARRAY_CHILDREN
}
```

**Block Tree 追踪**：
```javascript
// 只追踪有 patchFlag 的节点（动态节点）
if (
  isBlockTreeEnabled > 0 &&
  !isBlockNode &&
  currentBlock &&
  vnode.patchFlag > 0
) {
  currentBlock.push(vnode)  // 添加到当前块的动态节点列表
}
```

---

## 4. 细节补充：边界与性能优化

### 4.1 边界情况处理

**情况1：响应式组件对象**
```javascript
// 错误用法
const MyComponent = reactive({ render() { ... } })
createVNode(MyComponent)

// Vue 会警告并自动修复
// "Vue received a Component that was made a reactive object..."
// 内部会调用 toRaw(type) 解包
```

**情况2：循环引用的 VNode**
```javascript
const vnode = createVNode('div')
vnode.children = [vnode]  // 循环引用

// cloneVNode 时会设置 patchFlag = BAIL
// 表示需要完整 diff，不能使用优化路径
```

**情况3：null children**
```javascript
createVNode('div', null, null)
// children 为 null 时，shapeFlag 不会添加 TEXT_CHILDREN 或 ARRAY_CHILDREN
// 渲染时会跳过 children 处理
```

### 4.2 性能优化技巧

**优化1：静态提升**
```javascript
// 编译器会把静态节点提升到渲染函数外
const _hoisted_1 = createVNode('div', null, 'Static')

function render() {
  return createVNode('div', null, [
    _hoisted_1,  // 复用同一个 VNode
    createVNode('span', null, dynamicText)
  ])
}
```

**优化2：PatchFlag 标记**
```javascript
// 编译器分析出只有 id 是动态的
createVNode('div', {
  id: dynamicId,
  class: 'static'
}, null, 8 /* PROPS */, ['id'])

// 更新时只需要比对 id，跳过 class
```

**优化3：Block Tree**
```javascript
// 模板
<div>
  <span>Static</span>
  <span>{{ dynamic }}</span>
</div>

// 编译后
const block = (openBlock(), createBlock('div', null, [
  _hoisted_1,  // 静态节点
  createVNode('span', null, dynamic, 1 /* TEXT */)
]))

// block.dynamicChildren = [第二个 span]
// 更新时只 diff dynamicChildren，跳过静态节点
```

### 4.3 内存优化

**WeakMap 缓存**：
```javascript
// Vue 内部使用 WeakMap 缓存组件的 VNode
const vnodeCache = new WeakMap()

function getCachedVNode(component) {
  return vnodeCache.get(component)
}

// 组件销毁时，WeakMap 会自动释放内存
```

**对象池复用**：
```javascript
// 频繁创建的小对象（如 VNode）可以使用对象池
const vnodePool = []

function createVNode(...args) {
  const vnode = vnodePool.pop() || {}
  // 初始化 vnode...
  return vnode
}

function recycleVNode(vnode) {
  // 清空属性
  vnode.type = null
  vnode.props = null
  vnodePool.push(vnode)
}
```

---

## 5. 总结与延伸

### 一句话总结

**createVNode 是 Vue 3 的"质检加工厂"，负责把各种格式的输入（type、props、children）标准化为统一的 VNode 对象，并通过 ShapeFlag 和 PatchFlag 标记类型和更新提示，为后续的 diff 和渲染提供优化依据。**

### 面试考点

**Q1：createVNode 和 h() 有什么区别？**
```javascript
// h() 是 createVNode 的用户友好封装
export function h(type, propsOrChildren, children) {
  // 参数重载处理
  if (arguments.length === 2) {
    if (isObject(propsOrChildren) && !isArray(propsOrChildren)) {
      // h('div', { class: 'foo' })
      return createVNode(type, propsOrChildren)
    } else {
      // h('div', [child1, child2])
      return createVNode(type, null, propsOrChildren)
    }
  }
  // h('div', { class: 'foo' }, [child1, child2])
  return createVNode(type, propsOrChildren, children)
}
```

**Q2：为什么要规范化 class 和 style？**
- **统一格式**：模板中可以写对象、数组、字符串，内部统一为字符串/对象
- **性能优化**：规范化后可以直接设置 DOM 属性，不需要运行时再转换
- **响应式隔离**：克隆响应式对象，避免触发不必要的更新

**Q3：ShapeFlag 的位运算有什么好处？**
```javascript
// 传统方式
if (vnode.isElement && vnode.hasTextChildren) { ... }

// 位运算方式
if (vnode.shapeFlag & (ShapeFlags.ELEMENT | ShapeFlags.TEXT_CHILDREN)) { ... }

// 优势：
// 1. 一次判断多个条件
// 2. 位运算比逻辑运算快
// 3. 节省内存（一个数字存储多个布尔值）
```

**Q4：Block Tree 如何提升性能？**
```javascript
// 传统 diff：遍历整棵树
function diff(oldVNode, newVNode) {
  // O(n) 遍历所有节点
  for (const child of oldVNode.children) {
    diffChild(child, newVNode.children[i])
  }
}

// Block Tree：只 diff 动态节点
function diff(oldBlock, newBlock) {
  // O(m) 只遍历 dynamicChildren（m << n）
  for (const child of oldBlock.dynamicChildren) {
    diffChild(child, newBlock.dynamicChildren[i])
  }
}

// 性能提升：3-5 倍（取决于静态节点比例）
```

### 延伸阅读

1. **下一步：VNode 的渲染流程**
   - createVNode 创建了 VNode，那么 VNode 如何变成真实 DOM？
   - 阅读：`patch` 函数的实现

2. **深入：编译器优化**
   - 编译器如何分析模板生成 PatchFlag？
   - 阅读：`transform` 阶段的静态分析

3. **对比：Vue 2 vs Vue 3**
   - Vue 2 使用 `_createElement`，Vue 3 使用 `createVNode`
   - 主要区别：Block Tree、PatchFlag、ShapeFlag

4. **实战：自定义渲染器**
   - 如何基于 createVNode 实现自定义渲染器（如 Canvas、WebGL）？
   - 阅读：`createRenderer` API
