# AST Transform - AST 转换模块

AST Transform 是 Vue 3 编译器系统中的**第二道工序**，负责对 Parser 生成的 AST 进行"语义处理"和"性能优化"
。这个阶段的目标是为最终的代码生成做好准备，并提前应用各种编译时优化。

## 核心概念

### Transform 在编译流程中的位置

```
原始 AST（来自 Parser）
  ↓ 语义分析
  ↓ 静态提升
  ↓ 指令转换
  ↓ 属性规范化
优化后的 AST（Transform 输出）
  ↓ Codegen
JavaScript 代码（render 函数）
```

### Transform 的核心职责

1. **静态分析**：确定哪些节点是静态的（不会变化）
2. **静态提升**：将静态节点提取到模块级别，避免重复创建
3. **指令转换**：将 Vue 指令转换为可执行的逻辑
4. **表达式优化**：分析和优化 JavaScript 表达式
5. **Block 树构建**：标记动态节点以优化 diff
6. **属性规范化**：统一化处理 props、class、style 等
7. **依赖收集**：记录需要的 runtime helpers

## Transform 的架构

### 分层 Transform

Vue 采用**插件式 Transform 架构**，多个独立的 Transform 按顺序处理 AST：

```typescript
// 默认的 Transform 执行顺序
const nodeTransforms = [
  transformVBindShorthand, // 1. 简化绑定语法
  transformOnce, // 2. v-once 处理
  transformIf, // 3. v-if/v-else-if/v-else
  transformMemo, // 4. v-memo
  transformFor, // 5. v-for
  transformExpression, // 6. 表达式处理
  transformSlotOutlet, // 7. <slot/> 处理
  transformElement, // 8. 元素处理
  trackSlotScopes, // 9. slot 作用域追踪
  transformText, // 10. 文本处理
];

const directiveTransforms = {
  on: transformOn, // @click 等事件指令
  bind: transformBind, // :prop 绑定指令
  model: transformModel, // v-model 双向绑定
};
```

### Transform 执行模型

每个 Transform 接收三个参数：

```typescript
type NodeTransform = (
  node: TemplateChildNode, // 当前 AST 节点
  context: TransformContext, // 转换上下文
) => (() => void) | undefined; // 返回退出时的回调

// 执行流程
visit(node, transformer);
{
  // 进入节点时调用 transformer
  const exit = transformer(node, context);

  // 递归处理子节点
  if (node.children) {
    for (const child of node.children) {
      visit(child, transformer);
    }
  }

  // 退出节点时调用 exit 回调
  if (exit) {
    exit();
  }
}
```

## 核心 Transform 详解

### 1. transformIf - 条件语句处理

将 `v-if/v-else-if/v-else` 转换为三元表达式。

**输入 AST**：

```html
<div v-if="show">A</div>
<div v-else-if="showB">B</div>
<div v-else>C</div>
```

**输出 AST**：

```typescript
IfNode
{
  branches: [
    IfBranchNode {
      condition: show
      children: [ElementNode(div with A
)]
},
  IfBranchNode
  {
    condition: showB
    children: [ElementNode(div
    with B)]
  }
,
  IfBranchNode
  {
    condition: undefined  // else
    children: [ElementNode(div
    with C)]
  }
]
  codegenNode: ConditionalExpression
  {
    // show ? divA : (showB ? divB : divC)
  }
}
```

**生成代码**：

```javascript
show ? _createVNode(...) : showB ? _createVNode(...) : _createVNode(...)
```

### 2. transformFor - 循环语句处理

处理 `v-for` 指令，生成循环逻辑。

**输入 AST**：

```html
<div v-for="(item, index) in items" :key="index">{{ item.name }}</div>
```

**转换过程**：

1. **解析 v-for 表达式**：

   ```
   "( item, index ) in items"
     ↓ 解析
   {
     source: items,
     valueAlias: item,
     keyAlias: index,
     objectIndexAlias: undefined
   }
   ```

2. **生成循环代码**：
   ```javascript
   _renderList(items, (item, index) => {
     return _createVNode(...)
   })
   ```

### 3. transformElement - 元素处理

处理普通元素节点，收集动态属性。

**关键职责**：

- 分析 class、style 的动态/静态部分
- 提取动态 props
- 生成 patchFlag（标记此节点的动态部分）
- 处理内置组件的特殊逻辑

**示例**：

```html
<div :class="{ active: isActive }" class="box" :style="dynamicStyle">
  content
</div>
```

**转换后**：

```typescript
{
  type: NodeTypes.ELEMENT,
    tag
:
  'div',
    props
:
  [
    // class 被合并和规范化
    {
      type: NodeTypes.DIRECTIVE,
      name: 'bind',
      arg: 'class',
      exp: classExpression
    },
    // style 被合并和规范化
    {
      type: NodeTypes.DIRECTIVE,
      name: 'bind',
      arg: 'style',
      exp: styleExpression
    }
  ],
    codegenNode
:
  {
    patchFlag: PatchFlags.CLASS | PatchFlags.STYLE  // 标记此节点
  }
}
```

### 4. transformExpression - 表达式处理

分析 JavaScript 表达式，标记其中的变量依赖。

**功能**：

- 使用 Babel 解析表达式
- 识别变量引用（用于作用域分析）
- 标记常量表达式

**示例**：

```javascript
// 表达式
"count + 1"

// 转换后
{
  type: NodeTypes.SIMPLE_EXPRESSION,
    content
:
  'count + 1',
    isStatic
:
  false,
    identifiers
:
  ['count']  // 识别出依赖的变量
}
```

### 5. transformVOn - 事件处理

处理 `@event` 事件绑定。

**输入**：

```html
<button @click="handleClick" @click.prevent="prevent">Click</button>
```

**转换**：

```typescript
DirectiveNode
{
  name: 'on',
    arg
:
  'click',
    exp
:
  createCallExpression('_cache[0] || (...)'),  // 缓存事件处理函数
    modifiers
:
  ['prevent']
}
```

### 6. transformVBind - 属性绑定

处理 `:prop` 动态属性绑定。

**示例**：

```html
<MyComponent :msg="message" :style="{ color: activeColor }" />
```

**转换**：

- 分离 class、style 特殊处理
- 其余属性作为 props 或 attrs
- 应用 PatchFlags 标记

## 静态提升（Static Hoisting）

这是 Transform 最重要的优化之一。

### 概念

将**永久不变的 VNode** 提取到 render 函数外部，编译时创建一次，运行时复用。

### 示例

**输入模板**：

```html
<div class="static-div">
  <p>Static paragraph</p>
  <p>{{ dynamicText }}</p>
</div>
```

**没有提升的代码**：

```javascript
const render = () => {
  return _createVNode('div', { class: 'static-div' }, [
    _createVNode('p', null, 'Static paragraph'), // 每次都创建
    _createVNode('p', null, dynamicText),
  ]);
};
```

**提升后的代码**：

```javascript
const _hoisted_1 = _createVNode('p', null, 'Static paragraph');

const render = () => {
  return _createVNode('div', { class: 'static-div' }, [
    _hoisted_1, // 复用同一个对象
    _createVNode('p', null, dynamicText),
  ]);
};
```

### 提升条件

一个节点可以被提升，当且仅当：

1. **所有子节点都是静态的**
2. **所有属性都是静态的**（不包含 v-if、v-for 等结构指令）
3. **不包含动态绑定或事件**
4. **不包含插值**

### ConstantTypes 级别

```typescript
enum ConstantTypes {
  NOT_CONSTANT = 0, // 不是常量，需要动态计算
  CAN_SKIP_PATCH = 1, // 可以跳过 patch（但需要追踪其他属性变化）
  CAN_CACHE = 2, // 可以缓存（需要比较和可能的哈希检查）
  CAN_STRINGIFY = 3, // 可以字符串化（完全静态）
}
```

## Block 树与动态追踪

Transform 阶段构建 **Block 树** 用于 diff 优化。

### 概念

在动态节点上标记 `dynamicChildren`，记录哪些子节点需要 diff：

```
Root Block
  ├─ Static Child 1  ← 跳过
  ├─ Dynamic Child 1  ← 需要 diff
  │   ├─ Static Descendant  ← 跳过
  │   └─ Dynamic Descendant  ← 需要 diff
  └─ Dynamic Child 2  ← 需要 diff
```

### PatchFlags

每个动态节点都被标记上 PatchFlags，告诉 diff 算法需要检查什么：

```typescript
enum PatchFlags {
  TEXT = 1, // 动态文本内容
  CLASS = 1 << 1, // 动态 class
  STYLE = 1 << 2, // 动态 style
  PROPS = 1 << 3, // 动态 props
  FULL_PROPS = 1 << 4, // 需要完全 props diff
  HYDRATE_EVENTS = 1 << 5, // 需要事件处理
  STABLE_FRAGMENT = 1 << 6, // 稳定 fragment
  KEYED_FRAGMENT = 1 << 7, // 有 key 的 fragment
  UNKEYED_FRAGMENT = 1 << 8, // 无 key 的 fragment
  NEED_PATCH = 1 << 9, // 需要完全 patch
  DYNAMIC_SLOTS = 1 << 10, // 动态 slots
}
```

### 示例

```html
<div class="container" :class="{ active: isActive }">
  <span>Static</span>
  <span :style="dynamicStyle">Dynamic</span>
</div>
```

**生成的代码**：

```javascript
_createVNode(
  'div',
  {
    class: _normalizeClass(['container', { active: isActive }]),
  },
  [
    _createVNode('span', null, 'Static'),
    _createVNode('span', { style: dynamicStyle }, null, PatchFlags.STYLE),
  ],
  PatchFlags.CLASS, // ← 标记此元素有动态 class
  [1], // ← dynamicChildren 中第 2 个子节点需要 diff
);
```

## Transform 上下文（TransformContext）

Transform 过程中维护的上下文对象，包含：

```typescript
interface TransformContext {
  // 编译器配置
  prefixIdentifiers: boolean;
  hoistStatic: boolean;
  isModule: boolean;

  // 状态追踪
  root: RootNode;
  currentNode: TemplateChildNode | RootNode | null;
  parent: TemplateChildNode | RootNode | null;
  childIndex: number;
  scopes: {
    vFor: number;
    vSlot: number;
    vPre: number;
    vOnce: number;
  };

  // Helper 函数注册
  helper(s: symbol): void;

  helperString(s: symbol): string;

  // 节点转换 API
  replaceNode(node: TemplateChildNode): void;

  removeNode(node?: TemplateChildNode): void;

  onNodeRemoved(): void;

  // 动态 transforms
  addNodeTransform(nodeType: NodeTypes, fn: NodeTransform): void;

  addDirectiveTransform(name: string, fn: DirectiveTransform): void;

  // 其他工具
  importDeclaration(node: ImportDeclaration): void;

  expression(node: SimpleExpressionNode | undefined): void;

  hasHelper(s: symbol): boolean;
}
```

## 完整 Transform 示例

### 输入 AST

```typescript
{
  type: NodeTypes.ROOT,
    children
:
  [
    {
      type: NodeTypes.IF,
      branches: [
        {
          type: NodeTypes.IF_BRANCH,
          condition: { content: 'show' },
          children: [
            {
              type: NodeTypes.ELEMENT,
              tag: 'div',
              props: [
                { name: 'class', value: 'box' }
              ],
              children: [
                { type: NodeTypes.INTERPOLATION, content: { content: 'msg' } }
              ]
            }
          ]
        }
      ]
    }
  ]
}
```

### Transform 处理步骤

1. **transformIf**：创建 ConditionalExpression
2. **transformElement**：分析 class、标记 dynamicChildren
3. **transformText**：处理文本节点
4. **transformExpression**：识别 `show` 和 `msg` 变量

### 输出 AST

```typescript
{
  type: NodeTypes.ROOT,
    children
:
  [
    {
      type: NodeTypes.IF,
      branches: [
        {
          type: NodeTypes.IF_BRANCH,
          condition: {
            content: 'show',
            identifiers: ['show']  // ← 转换添加
          },
          children: [
            {
              type: NodeTypes.ELEMENT,
              tag: 'div',
              props: [...],
              children: [...],
              codegenNode: {
                patchFlag: PatchFlags.TEXT,  // ← 标记动态部分
                dynamicProps: undefined,
                dynamicChildren: [
                  { type: NodeTypes.INTERPOLATION, ... }  // ← 只标记动态子节点
                ]
              }
            }
          ]
        }
      ],
      codegenNode: ConditionalExpression {
    test: { content: 'show' },
    consequent: VNodeCall { ... },
    alternate
:
  CreateCommentVNode
  { ...
  }
}
}
],
  helpers: new Set([CREATE_VNODE, CREATE_COMMENT]),
    temps
:
  0
}
```

## 常见 Transform 场景

### 场景 1: 多层嵌套结构

```html
<div v-if="show" v-for="item in list">{{ item.name }}</div>
```

Transform 处理顺序：

1. transformIf 处理 v-if
2. transformFor 处理 v-for（嵌套在 if 内）
3. transformElement 分析元素
4. transformExpression 处理表达式

### 场景 2: 复杂 props 合并

```html
<Component
  class="base"
  :class="dynamic"
  style="color: red"
  :style="dynamicStyle"
  :prop="value"
/>
```

Transform 输出：

- class 和 :class 合并成单一属性
- style 和 :style 合并成单一属性
- 其他 props 保持独立

### 场景 3: Slot 作用域分析

```html
<MyComponent>
  <template #default="{ item }"> {{ item }} </template>
</MyComponent>
```

Transform 识别：

- `item` 作为 slot prop（不是全局变量）
- 只在 slot 内有效
- 其他作用域规则不适用

## 总结

| 功能             | 说明                           | 重要性     |
| ---------------- | ------------------------------ | ---------- |
| **静态提升**     | 将不变节点提取外部，运行时复用 | ⭐⭐⭐⭐⭐ |
| **PatchFlags**   | 标记动态节点，优化 diff        | ⭐⭐⭐⭐⭐ |
| **指令转换**     | v-if/for/model 等特殊处理      | ⭐⭐⭐⭐⭐ |
| **表达式分析**   | 识别变量依赖和作用域           | ⭐⭐⭐⭐   |
| **属性规范化**   | class/style 智能合并           | ⭐⭐⭐     |
| **Block 树构建** | 构建高效的 diff 树             | ⭐⭐⭐⭐   |

**设计哲学**：Transform 采用分层插件式架构，多个独立的 Transform 按顺序处理 AST，通过静态提升、PatchFlags 标记等优化，为
Codegen 做好准备，最终生成高性能的 render 函数。
