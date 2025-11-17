# Codegen - 代码生成模块

Codegen 是 Vue 3 编译器系统中的**第三道工序**，负责将经过 Transform 处理的 AST 转换为**可执行的 JavaScript render 函数代码**。这是编译流程的最后一步，直接生成最终的编译产物。

## 核心概念

### Codegen 在编译流程中的位置

```
优化后的 AST（来自 Transform）
  ↓ 代码模板匹配
  ↓ 生成 VNode 创建调用
  ↓ 生成事件处理逻辑
  ↓ 生成循环和条件代码
JavaScript 字符串（render 函数源代码）
  ↓ 运行时执行
VNode 树
```

### Codegen 的核心职责

1. **字符串代码生成**：生成可执行的 JavaScript 代码字符串
2. **VNode 创建调用生成**：生成 `_createVNode()` 等 helper 调用
3. **表达式代码生成**：生成 JavaScript 表达式代码
4. **资源导入生成**：生成组件、指令的导入语句
5. **静态提升处理**：生成提升的 VNode 和常量定义

---

## Codegen 的核心架构

### CodegenContext（代码生成上下文）

Codegen 维护一个上下文对象来管理生成状态：

```typescript
interface CodegenContext {
  // 生成的代码
  code: string                    // 累积的代码字符串
  line: number                    // 当前行号
  column: number                  // 当前列号
  offset: number                  // 当前偏移量

  // 配置
  isModule: boolean               // 是否为模块模式
  prefixIdentifiers: boolean      // 是否使用标识符前缀
  sourceMap: boolean              // 是否生成源码映射

  // 生成 helper 时推动 import
  helper(s: symbol): string       // 获取 helper 名称
  push(code: string, node?: Node): void  // 添加代码
  indent(): void                  // 增加缩进
  deindent(): void                // 减少缩进
  newline(): void                 // 换行

  // 资源收集
  hoists: Array<JSChildNode | null>     // 提升的节点
  temps: number                   // 临时变量计数
  identifiers: Map<string, number>      // 标识符映射
}
```

### 代码生成流程

```typescript
function generate(ast, options) {
  const context = createCodegenContext(ast, options)

  // 1. 生成 import 语句
  if (ast.imports.length) {
    genImports(ast.imports, context)
  }

  // 2. 生成提升的 VNode 和常量
  if (ast.hoists.length) {
    genHoists(ast.hoists, context)
  }

  // 3. 生成 render 函数
  context.push('const render = ')
  genFunctionExpression(ast, context)

  // 4. 生成返回和导出
  context.push(`return { render }`)

  return {
    code: context.code,
    ast: ast,
    map: context.map
  }
}
```

---

## 关键代码生成详解

### 1. VNode 创建代码生成

将 Element 节点转换为 `_createVNode()` 调用。

**输入 AST**：
```typescript
{
  type: NodeTypes.ELEMENT,
  tag: 'div',
  props: [
    { name: 'class', value: 'box' },
    { name: 'id', value: 'app' }
  ],
  children: [
    { type: NodeTypes.TEXT, content: 'Hello' }
  ]
}
```

**生成代码**：
```javascript
_createVNode('div', { class: 'box', id: 'app' }, 'Hello')
```

**完整 VNode 创建签名**：
```typescript
// _createVNode 的调用形式
_createVNode(
  type,                  // 'div' 或组件名
  props,                 // { class: 'box', ... }
  children,              // 子节点或文本
  patchFlag,             // PatchFlags 标记（可选）
  dynamicProps,          // 动态属性键数组（可选）
  isBlock,               // 是否为 Block（可选）
  isStableFrag,          // 是否为稳定 fragment（可选）
  shouldUseBlock         // 是否应使用 Block（可选）
)
```

### 2. Props 代码生成

将 props AST 节点转换为 JavaScript 对象字面量。

**输入 props**：
```typescript
[
  { type: NodeTypes.ATTRIBUTE, name: 'class', value: 'box' },
  { type: NodeTypes.DIRECTIVE, name: 'bind', arg: 'id', exp: 'dynamicId' },
  { type: NodeTypes.DIRECTIVE, name: 'on', arg: 'click', exp: 'handleClick' }
]
```

**生成代码**：
```javascript
{
  class: 'box',
  id: _ctx.dynamicId,
  onClick: _cache[0] || (_cache[0] = (...args) => _ctx.handleClick(...args))
}
```

### 3. 条件语句代码生成（v-if）

**输入 AST**：
```typescript
IfNode {
  branches: [
    IfBranchNode { condition: 'show', children: [...] },
    IfBranchNode { condition: 'showB', children: [...] },
    IfBranchNode { condition: undefined, children: [...] }
  ]
}
```

**生成代码**：
```javascript
_ctx.show
  ? _createVNode(...)
  : _ctx.showB
    ? _createVNode(...)
    : _createVNode(...)
```

### 4. 循环语句代码生成（v-for）

**输入 AST**：
```typescript
ForNode {
  source: 'items',
  valueAlias: 'item',
  keyAlias: 'index',
  children: [...]
}
```

**生成代码**：
```javascript
_renderList(_ctx.items, (item, index) => {
  return _createVNode(...)
})
```

### 5. 插值表达式代码生成

**输入 AST**：
```typescript
InterpolationNode {
  content: SimpleExpressionNode { content: 'msg' }
}
```

**生成代码**：
```javascript
_toDisplayString(_ctx.msg)
```

---

## 完整编译示例

### 输入模板

```html
<template>
  <div id="app" v-if="show" @click="handleClick">
    <p class="text">{{ message }}</p>
    <ul>
      <li v-for="item in items" :key="item.id">
        {{ item.name }}
      </li>
    </ul>
  </div>
</template>
```

### 生成的代码

```javascript
import { openBlock as _openBlock, createBlock as _createBlock, createVNode as _createVNode, toDisplayString as _toDisplayString, renderList as _renderList, Fragment as _Fragment } from 'vue'

const _hoisted_1 = { id: 'app' }

const render = (_ctx, _cache, $props, $attrs, $slots, $emit, $options) => {
  return _ctx.show
    ? (_openBlock(),
      _createBlock(
        'div',
        _hoisted_1,
        [
          _createVNode(
            'p',
            { class: 'text' },
            _toDisplayString(_ctx.message),
            1
          ),
          _createVNode(
            'ul',
            null,
            [
              (_openBlock(true),
              _createBlock(
                _Fragment,
                null,
                _renderList(_ctx.items, (item) => {
                  return _createVNode(
                    'li',
                    { key: item.id },
                    _toDisplayString(item.name),
                    1
                  )
                }),
                64
              ))
            ],
            1
          )
        ],
        PatchFlags.TEXT,
        ['onClick']
      ))
    : _createCommentVNode('', true)
}
```

### 代码解析

1. **导入 helpers**：引入必需的 runtime helpers
2. **提升静态节点**：`_hoisted_1` 是提升的 props 对象
3. **生成 render 函数**：
   - 参数：`_ctx`（组件实例）、`_cache`（缓存）等
   - 条件判断：`_ctx.show ? ... : ...`
   - Block 包装：使用 openBlock/createBlock 优化 diff
   - 子节点：递归生成子 VNode
4. **PatchFlags**：标记动态部分（如 `PatchFlags.TEXT` 表示文本动态）
5. **事件缓存**：使用 `_cache` 缓存事件处理函数

---

## 高级代码生成特性

### 1. 静态提升代码

将完全静态的节点提升到 render 函数外部：

```javascript
// 提升前
const render = () => {
  const vnode = _createVNode('p', null, 'Static Text')
  // ... 其他代码
}

// 提升后
const _hoisted_1 = _createVNode('p', null, 'Static Text')

const render = () => {
  // 直接复用 _hoisted_1
  // ... 其他代码
}
```

### 2. 事件处理缓存

事件处理函数在第一次渲染时生成，之后从缓存中获取：

```javascript
// 不缓存（错误）
_createVNode('button', {
  onClick: () => _ctx.handleClick()  // 每次都创建新函数
})

// 缓存（正确）
_createVNode('button', {
  onClick: _cache[0] || (_cache[0] = (...args) => _ctx.handleClick(...args))
})
```

### 3. Block 树与 Fragment

使用 Block 和 Fragment 优化动态节点的 diff：

```javascript
// v-for 生成的代码
(_openBlock(true),
_createBlock(
  _Fragment,
  null,
  _renderList(_ctx.items, (item) => {
    return _createVNode(...)
  }),
  64  // PatchFlags.KEYED_FRAGMENT
))
```

### 4. 条件注释节点

v-if 的 else 分支使用注释节点：

```javascript
_ctx.show
  ? _createVNode(...)
  : _createCommentVNode('', true)  // 占位符，用于保持位置
```

---

## Mode 模式

Codegen 支持两种生成模式：

### 1. Function 模式（默认）

```javascript
const render = () => {
  return _createVNode(...)
}

export { render }
```

适用于组件内联使用。

### 2. Module 模式

```javascript
import { ... } from 'vue'

const _hoisted_1 = ...

export function render() {
  return _createVNode(...)
}

export const staticRenderFns = []
```

适用于模块化编译。

### 3. SSR 模式

生成字符串拼接的服务端渲染代码：

```javascript
export function ssrRender(_ctx, _push, _parent, ...) {
  _push(`<div id="app">`)
  _push(escapeHtml(_ctx.message))
  _push(`</div>`)
}
```

---

## Helpers 系统

Codegen 使用多个 runtime helpers 来生成高效代码：

```typescript
// 常用 helpers
CREATE_VNODE,            // _createVNode
CREATE_ELEMENT_VNODE,    // _createElementVNode（优化版）
CREATE_BLOCK,            // _createBlock
OPEN_BLOCK,              // _openBlock
CREATE_COMMENT_VNODE,    // _createCommentVNode
RENDER_LIST,             // _renderList（处理 v-for）
RENDER_SLOT,             // _renderSlot（处理 slot）
FRAGMENT,                // _Fragment
WITH_DIRECTIVES,         // _withDirectives（处理自定义指令）
NORMALIZE_CLASS,         // _normalizeClass
NORMALIZE_STYLE,         // _normalizeStyle
CAMELIZE,                // _camelize
TO_DISPLAY_STRING,       // _toDisplayString
RESOLVE_COMPONENT,       // _resolveComponent
RESOLVE_DIRECTIVE,       // _resolveDirective
WITH_CTX,                // _withCtx
CACHE_HANDLERS,          // 缓存处理函数
```

---

## PatchFlags 与优化

Codegen 为每个动态节点标记 PatchFlags，指导 diff 算法：

```typescript
enum PatchFlags {
  TEXT = 1,                  // 动态文本
  CLASS = 2,                 // 动态 class
  STYLE = 4,                 // 动态 style
  PROPS = 8,                 // 动态 props（指定列表）
  FULL_PROPS = 16,           // 完整 props
  HYDRATE_EVENTS = 32,       // 事件
  STABLE_FRAGMENT = 64,      // 稳定 fragment
  KEYED_FRAGMENT = 128,      // 有 key 的 fragment
  UNKEYED_FRAGMENT = 256,    // 无 key 的 fragment
  NEED_PATCH = 512,          // 需要完全 patch
  DYNAMIC_SLOTS = 1024,      // 动态 slots
  // ...
}
```

**示例**：
```html
<div :class="dynamicClass" class="static">
  {{ text }}
</div>

↓ 生成

_createVNode('div', {
  class: _normalizeClass(['static', _ctx.dynamicClass])
}, _toDisplayString(_ctx.text), PatchFlags.CLASS | PatchFlags.TEXT)
                                           ↑ 标记此节点的动态部分
```

---

## 常见 Codegen 场景

### 场景 1: 组件 Props 转发

```html
<MyComponent v-bind="$attrs" />
```

**生成代码**：
```javascript
_createVNode(MyComponent, _attrs)
```

### 场景 2: Slot 处理

```html
<MyComponent>
  <template #header>Header</template>
  <template #default>Content</template>
</MyComponent>
```

**生成代码**：
```javascript
_createVNode(MyComponent, null, {
  header: () => [_createVNode(...)],
  default: () => [_createVNode(...)],
  _: 1  // SlotFlags.STABLE
})
```

### 场景 3: 自定义指令

```html
<div v-mydir="value">Content</div>
```

**生成代码**：
```javascript
_withDirectives(_createVNode('div', null, 'Content'), [
  [_resolveDirective('mydir'), _ctx.value]
])
```

---

## 总结

| 功能 | 说明 | 输出 |
|------|------|------|
| **VNode 生成** | 元素转 _createVNode 调用 | JavaScript 字符串 |
| **Props 生成** | 属性转对象字面量 | `{ class: '...', ... }` |
| **条件生成** | v-if 转三元表达式 | `condition ? node : fallback` |
| **循环生成** | v-for 转 _renderList 调用 | `_renderList(array, item => ...)` |
| **静态提升** | 提升常量到模块级 | `const _hoisted_1 = ...` |
| **Helper 引入** | 收集并生成导入 | `import { ... } from 'vue'` |
| **PatchFlags** | 标记动态节点 | `PatchFlags.CLASS \| PatchFlags.TEXT` |
| **Block 树** | 构建优化 diff 树 | openBlock/createBlock 调用 |

**设计哲学**：Codegen 是编译流程的最终阶段，将经过充分优化的 AST 转换为高效的 JavaScript 代码，通过 PatchFlags、Block 树、静态提升等机制，生成的 render 函数在运行时能够实现快速的 diff 和更新。
