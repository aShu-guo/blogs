# Vue 3 编译器模块 - 调用链与时序分析

### 核心源代码位置

- **baseCompile 主入口**：`packages/compiler-core/src/compile.ts:67-124` - 编译流程调度
- **Parser 调用**：`packages/compiler-core/src/parser.ts:1036-1087` - baseParse() 解析
- **Transform 调用**：`packages/compiler-core/src/transform.ts:331-353` - transform() 转换
- **Codegen 调用**：`packages/compiler-core/src/codegen.ts:281-404` - generate() 生成代码

Vue 3 编译器是将模板字符串转换为可执行渲染函数的系统。本文档详细分析编译流程的调用链、时序关系和各模块的交互方式。

## 第一部分：编译系统架构全景

### 系统组成

```
Vue 3 编译器系统
├─ compiler-core        编译核心（Parser + Transform + Codegen）
├─ compiler-dom         DOM 专属扩展
├─ compiler-sfc         .vue 单文件组件编译
├─ compiler-ssr         服务端渲染编译
└─ compiler-vue         Vue 模板完整编译器（core + dom）
```

### 编译入口和出口

```
输入：
  • 模板字符串（HTML 文本）
  • 编译选项（mode、prefixIdentifiers 等）
  • 自定义 Transform 和指令 Transform

输出：
  • 渲染函数代码字符串
  • source map（可选）
  • 错误列表
```

## 第二部分：完整编译调用链

### 顶层调用流程图

```
用户代码
  ↓
app.mount() 或 编译.vue 文件
  ↓
┌─────────────────────────────────────────┐
│ 编译入口选择                             │
├─────────────────────────────────────────┤
│ ✓ 浏览器环境 → compileToFunction()       │
│ ✓ 构建环程 → compile()                   │
│ ✓ .vue 文件 → compileScript/compileTemplate│
└─────────────────────────────────────────┘
  ↓
┌─────────────────────────────────────────────┐
│ baseCompile(source, options)                │ ← 核心编译函数
├─────────────────────────────────────────────┤
│ 1. 配置验证与合并                            │
│ 2. Parser: baseParse()                      │
│ 3. Transform: transform()                   │
│ 4. Codegen: generate()                      │
└─────────────────────────────────────────────┘
  ↓
render 函数代码
```

### 详细调用链路

#### 第一层：编译入口

**浏览器环境**（使用完整版 Vue）：

```typescript
// 使用场景：<script> 中直接使用 template
const app = createApp({
  template: '<div>{{ message }}</div>'
})

// 内部调用链
createApp(rootComponent)
  ↓ setup()
  ↓ renderComponentRoot()
  ↓ compile(template, options)
  ↓ baseCompile()
```

**构建环境**（Vite/Webpack）：

```typescript
// 使用场景：.vue 文件的 <template>
<template>
  <div>{{ message }}</div>
</template>

// 内部调用链
Vite/Webpack loader
  ↓ @vitejs/plugin-vue 或 vue-loader
  ↓ compileTemplate(source, options)
  ↓ baseCompile()
```

#### 第二层：baseCompile 核心函数

```typescript
export function baseCompile(
  source: string | RootNode,
  options: CompilerOptions = {},
): CodegenResult {
  // ━━━ 阶段 1：初始化与验证 ━━━
  const onError = options.onError || defaultOnError;
  const isModuleMode = options.mode === 'module';

  // 浏览器环境限制检查
  if (__BROWSER__) {
    if (options.prefixIdentifiers === true) {
      onError(createCompilerError(ErrorCodes.X_PREFIX_ID_NOT_SUPPORTED));
    }
    if (isModuleMode) {
      onError(createCompilerError(ErrorCodes.X_MODULE_MODE_NOT_SUPPORTED));
    }
  }

  // ━━━ 阶段 2：配置合并 ━━━
  const resolvedOptions = extend({}, options, {
    prefixIdentifiers:
      !__BROWSER__ && (options.prefixIdentifiers === true || isModuleMode),
  });

  // ━━━ 阶段 3：Parser 解析 ━━━
  const ast = isString(source)
    ? baseParse(source, resolvedOptions) // ← 字符串 → AST
    : source; // ← 或接收已解析的 AST

  // ━━━ 阶段 4：获取 Transform 预设 ━━━
  const [nodeTransforms, directiveTransforms] =
    getBaseTransformPreset(prefixIdentifiers);

  // ━━━ 阶段 5：合并用户自定义 Transform ━━━
  if (options.nodeTransforms) {
    nodeTransforms.push(...options.nodeTransforms);
  }
  if (options.directiveTransforms) {
    Object.assign(directiveTransforms, options.directiveTransforms);
  }

  // ━━━ 阶段 6：Transform 转换 ━━━
  transform(ast, {
    ...resolvedOptions,
    nodeTransforms,
    directiveTransforms,
  }); // ← 修改 ast 对象，添加 codegenNode 等信息

  // ━━━ 阶段 7：Codegen 代码生成 ━━━
  return generate(ast, resolvedOptions); // ← AST → JavaScript 代码
}
```

#### 第三层：Parser 解析阶段

```typescript
function baseParse(
  content: string,
  options: ParserOptions
): RootNode {
  // 1. 创建解析器上下文
  const context = createParserContext(content, options)
  const start = getCursorInfo(context.source, 0)

  // 2. 解析根节点内容（可能有多个顶级节点）
  const children = parseChildren(context, TextModes.DATA, [])

  // 3. 构建 RootNode
  const root: RootNode = {
    type: NodeTypes.ROOT,
    children,
    source: content,
    ...rest,
  }

  // 4. 后处理和错误收集
  postProcess(root, context)

  return root
}

// 核心解析函数调用链
baseParse()
  ↓ createParserContext()        // 创建上下文
  ↓ parseChildren()
    ├─ parseTag()               // 解析标签
    │ ├─ parseTagName()
    │ ├─ parseAttributes()
    │ │ ├─ parseAttribute()
    │ │ └─ parseAttributeValue()
    │ └─ parseTagClosed()
    ├─ parseText()              // 解析文本
    ├─ parseComment()           // 解析注释
    └─ parseInterpolation()     // 解析插值 {{ }}
  ↓ postProcess()               // 后处理（冰错误等）
```

**Parser 的输出示例**：

```typescript
// 输入模板
<div class="box">
  <p>{{ message }}</p>
</div>

// 输出 AST
{
  type: NodeTypes.ROOT,
  children: [
    {
      type: NodeTypes.ELEMENT,
      tag: 'div',
      props: [
        {
          type: NodeTypes.ATTRIBUTE,
          name: 'class',
          value: { type: NodeTypes.TEXT, content: 'box' }
        }
      ],
      children: [
        {
          type: NodeTypes.ELEMENT,
          tag: 'p',
          props: [],
          children: [
            {
              type: NodeTypes.INTERPOLATION,
              content: { type: NodeTypes.SIMPLE_EXPRESSION, content: 'message' }
            }
          ]
        }
      ]
    }
  ],
  helpers: new Set([Symbol(openBlock), Symbol(createBlock)]),
  components: [],
  directives: []
}
```

#### 第四层：Transform 转换阶段

```typescript
function transform(
  root: RootNode,
  options: TransformOptions
): void {
  const context = createTransformContext(root, options)

  // 1. 使用各个 nodeTransform 递归转换每个节点
  traverseNode(root, context)

  // 2. 后处理：处理提升的静态节点
  if (!context.hoistStatic) {
    return
  }

  // 进入静态提升阶段
  context.hoistStatic = false

  // 3. 再次遍历，收集和提升静态节点
  walk(root, context, root.children)
}

// 详细调用链
transform()
  ↓ createTransformContext()            // 创建转换上下文
  ↓ traverseNode()                      // 递归遍历 AST
    ├─ 执行 exitFns（post-order）
    │ └─ 对每个节点应用 nodeTransforms
    │   ├─ transformVBindShorthand()    // 1. v-bind 简写
    │   ├─ transformOnce()              // 2. v-once
    │   ├─ transformIf()                // 3. v-if 转换
    │   ├─ transformMemo()              // 4. v-memo
    │   ├─ transformFor()               // 5. v-for 转换
    │   ├─ transformExpression()        // 6. 表达式转换
    │   ├─ transformSlotOutlet()        // 7. slot 出口
    │   ├─ transformElement()           // 8. 元素转换
    │   ├─ trackSlotScopes()            // 9. 插槽作用域追踪
    │   └─ transformText()              // 10. 文本转换
    │
    └─ 对于指令使用 directiveTransforms
      ├─ transformModel()               // v-model 转换
      ├─ transformOn()                  // v-on 转换
      ├─ transformBind()                // v-bind 转换
      ├─ transformShow()                // v-show 转换
      └─ ... 其他指令
  ↓ hoistStatic()                       // 静态提升
    ├─ walk()
    └─ collectHoistedStatic()
```

**Transform 的输出示例**：

```typescript
// 转换后每个节点会添加 codegenNode
{
  type: NodeTypes.ELEMENT,
  tag: 'div',
  props: [...],
  children: [...],
  codegenNode: {  // ← 新增，用于代码生成
    type: NodeTypes.VNODE_CALL,
    tag: "_Fragment",
    props: null,
    children: [
      // 子节点的 codegenNode
    ],
    patchFlag: "PatchFlags.STABLE_FRAGMENT"
  }
}
```

#### 第五层：Codegen 代码生成阶段

```typescript
function generate(
  ast: RootNode,
  options: CodegenOptions
): CodegenResult {
  const context = createCodegenContext(ast, options)

  // 1. 生成导入语句（helpers）
  if (options.mode === 'module') {
    genModulePreamble(ast, context)
  }

  // 2. 生成 render 函数
  genFunctionPreamble(context)
  context.push(`function render(_ctx) {`)
  context.indent()

  // 3. 递归生成每个节点的代码
  if (ast.children.length) {
    genNode(ast.children[0], context)
  } else {
    context.push(`undefined`)
  }

  context.deindent()
  context.push(`}`)

  return {
    code: context.code,
    map: context.map,
  }
}

// 详细调用链
generate()
  ↓ createCodegenContext()              // 创建代码生成上下文
  ├─ genModulePreamble()                // 生成模块头（imports）
  ├─ genFunctionPreamble()              // 生成函数头
  ├─ genNode()                          // 递归生成每个节点
  │ ├─ genVNodeCall()                   // VNode 创建调用
  │ ├─ genElement()                     // 元素节点
  │ ├─ genIf()                          // v-if 块
  │ ├─ genFor()                         // v-for 块
  │ ├─ genText()                        // 文本节点
  │ ├─ genInterpolation()               // 插值表达式
  │ └─ ... 其他节点类型
  └─ 返回 { code, map }
```

**Codegen 的输出示例**：

```javascript
// 输入 AST
// 输出代码字符串
`
import { openBlock as _openBlock, createElementBlock as _createElementBlock, toDisplayString as _toDisplayString } from "vue"

export function render(_ctx, _cache, $props, $setup, $data, $options) {
  return (_openBlock(), _createElementBlock("div", { class: "box" }, [
    _createElementVNode("p", null, _toDisplayString(_ctx.message), 1 /* TEXT */)
  ]))
}
`;
```

## 第六部分：完整时序图

### 从模板到渲染函数的完整时序

```
时间轴 →

用户环境
  │
  ├─ ① 创建应用
  │  createApp(App)
  │  └─ app._instance = null
  │
  ├─ ② 挂载应用
  │  app.mount('#app')
  │  └─ isMounted = true
  │
  └─ ③ 需要渲染时
     │
     └─┬─ 模板类型判断
       │
       ├─ 若是字符串模板
       │  └─ compileToFunction(template)
       │     │
       │     └─┬─ 检查编译缓存
       │       │
       │       ├─ 若缓存存在
       │       │  └─ 直接返回缓存的 render 函数
       │       │
       │       └─ 若缓存不存在
       │          │
       │          └─ compile(template, options)  ← 开始编译
       │             │
       │             ├─ [编译时间：1-10ms]
       │             │  └─ baseCompile()
       │             │     └─ 返回 { code, map }
       │             │
       │             ├─ new Function('Vue', code)(runtimeDom)
       │             │  └─ 编译代码字符串为函数
       │             │
       │             └─ 缓存 render 函数
       │                └─ compileCache[key] = render
       │
       └─ 若是导入的 .vue 文件
          └─ 已在构建时预编译
             └─ 直接返回 render 函数

编译流程（baseCompile 内部）
       │
       ├─ [1] Parser 阶段 (~2-3ms)
       │  │   template → tokens → AST
       │  ├─ createParserContext()
       │  ├─ parseChildren()
       │  │  ├─ parseTag()
       │  │  ├─ parseText()
       │  │  └─ parseInterpolation()
       │  └─ postProcess()
       │
       ├─ [2] Transform 阶段 (~2-4ms)
       │  │   AST → optimized AST (with codegenNode)
       │  ├─ createTransformContext()
       │  ├─ traverseNode()
       │  │  ├─ 应用 nodeTransforms
       │  │  │  ├─ transformVBindShorthand
       │  │  │  ├─ transformOnce
       │  │  │  ├─ transformIf
       │  │  │  ├─ transformFor
       │  │  │  ├─ transformElement
       │  │  │  └─ ... (共 10 个)
       │  │  └─ 应用 directiveTransforms
       │  │     ├─ transformModel
       │  │     ├─ transformOn
       │  │     └─ transformBind
       │  └─ hoistStatic()
       │
       ├─ [3] Codegen 阶段 (~1-2ms)
       │  │   optimized AST → JavaScript code string
       │  ├─ createCodegenContext()
       │  ├─ genModulePreamble()
       │  ├─ genFunctionPreamble()
       │  ├─ genNode()
       │  │  ├─ genVNodeCall()
       │  │  ├─ genElement()
       │  │  ├─ genIf()
       │  │  └─ ... (递归)
       │  └─ 返回 code 字符串
       │
       └─ [4] 返回编译结果
          return { code, map }

运行时
       │
       ├─ 函数化 → render 函数
       │  new Function(code)
       │
       ├─ 执行 render() → VNode 树
       │  render(_ctx)
       │
       └─ patch/mount → 真实 DOM
          patch(null, vnode)
```

### 状态机演进图

```
模板字符串 "状态"
    │
    ├─ Parser State Machine
    │  │
    │  ├─ State: TEXT
    │  │  ├─ 读取 '<' → State: TAG_OPEN
    │  │  └─ 读取其他 → State: TEXT (继续)
    │  │
    │  ├─ State: TAG_OPEN
    │  │  ├─ 读取 '/' → State: TAG_CLOSE
    │  │  └─ 读取字母 → State: TAG_NAME
    │  │
    │  ├─ State: TAG_NAME
    │  │  ├─ 读取 '>' → State: TEXT
    │  │  ├─ 读取 ' ' → State: ATTRIBUTE_NAME
    │  │  └─ 读取字母 → State: TAG_NAME (继续)
    │  │
    │  └─ State: ATTRIBUTE_* (多个)
    │     └─ ... 属性解析
    │
    ├─ AST 树（Parser 输出）
    │  ├─ type: ROOT
    │  ├─ children: [Element, Element, ...]
    │  └─ helpers: Set
    │
    ├─ Transform 阶段
    │  ├─ 遍历每个节点
    │  ├─ 应用每个 transform
    │  └─ 添加 codegenNode
    │
    ├─ Optimized AST（Transform 输出）
    │  ├─ 原有 AST 结构
    │  └─ 新增 codegenNode
    │
    ├─ Codegen 阶段
    │  ├─ 遍历 AST
    │  ├─ 生成对应代码
    │  └─ 累积 code 字符串
    │
    └─ JavaScript 代码字符串（Codegen 输出）
       └─ function render(_ctx) { ... }
```

## 第七部分：关键转换点详解

### 1. Parser → AST 的转换细节

```typescript
// 模板
<div :class="isActive" @click="handleClick">
  {{ message }}
</div>

// 转换步骤
① 初始化
   source = '<div :class="isActive" @click="handleClick">\n  {{ message }}\n</div>'
   context.source = source
   context.position = 0

② 遇到 '<'
   → 进入 TAG_OPEN 状态
   → 读取标签名 'div'
   → 读取属性 ':class="isActive"' 和 '@click="handleClick"'

③ 生成 Element 节点
   {
     type: NodeTypes.ELEMENT,
     tag: 'div',
     props: [
       {
         type: NodeTypes.DIRECTIVE,
         name: 'class',
         exp: { content: 'isActive' }
       },
       {
         type: NodeTypes.DIRECTIVE,
         name: 'on',
         arg: { content: 'click' },
         exp: { content: 'handleClick' }
       }
     ],
     children: [
       {
         type: NodeTypes.TEXT_CALL,
         content: '{{ message }}'
       }
     ]
   }

④ 生成 Interpolation 子节点
   {
     type: NodeTypes.INTERPOLATION,
     content: {
       type: NodeTypes.SIMPLE_EXPRESSION,
       content: 'message'
     }
   }
```

### 2. Transform 的多层转换

```typescript
// 原始 AST 节点
{
  type: NodeTypes.ELEMENT,
  tag: 'div',
  props: [/* ... */],
  children: [/* ... */]
}

// ① transformElement() 之后
{
  // ... 原有属性
  codegenNode: {
    type: NodeTypes.VNODE_CALL,
    tag: '"div"',
    props: null,
    children: [/* ... */],
    patchFlag: '"TEXT"'
  }
}

// ② transformExpression() 之后（表达式规范化）
{
  // ... 原有属性
  codegenNode: {
    // ... 原有属性
    props: {
      type: NodeTypes.PROPS_EXPRESSION,
      properties: [
        {
          key: 'class',
          value: '_normalizeClass(isActive)'  // ← 规范化
        }
      ]
    }
  }
}

// ③ 最终代码生成
_createVNode('div', {
  class: _normalizeClass(_ctx.isActive)  // ← 编译为 JavaScript
}, [
  _toDisplayString(_ctx.message)
], PatchFlags.TEXT)
```

### 3. v-if 的特殊处理

```typescript
// 模板
<div v-if="show">Show</div>
<div v-else>Hide</div>

// Parser 输出
{
  type: NodeTypes.ELEMENT,
  tag: 'div',
  props: [
    {
      type: NodeTypes.DIRECTIVE,
      name: 'if',
      exp: { content: 'show' }
    }
  ]
},
{
  type: NodeTypes.ELEMENT,
  tag: 'div',
  props: [
    {
      type: NodeTypes.DIRECTIVE,
      name: 'else'
    }
  ]
}

// Transform 中 transformIf() 处理
{
  type: NodeTypes.IF,
  branches: [
    {
      type: NodeTypes.IF_BRANCH,
      condition: { content: 'show' },
      children: [{ /* div */ }]
    },
    {
      type: NodeTypes.IF_BRANCH,
      condition: undefined,  // else 分支无条件
      children: [{ /* div */ }]
    }
  ],
  codegenNode: {
    type: NodeTypes.CONDITIONAL_EXPRESSION,
    test: 'show',
    consequent: /* div codegenNode */,
    alternate: /* div codegenNode */
  }
}

// 最终代码
_ctx.show
  ? _createVNode('div', null, 'Show')
  : _createVNode('div', null, 'Hide')
```

## 第八部分：调用链依赖图

### 模块间的调用关系

```
用户应用层
    │
    ├─ Application Context
    │  ├─ app.mount()
    │  ├─ app.use()
    │  └─ app.config
    │
    └─ 编译入口
       ├─ compileToFunction()    ← 浏览器环境
       │  └─ compile()
       │     └─ baseCompile()
       │
       └─ compile()              ← 构建环境
          └─ baseCompile()

baseCompile() 依赖链
    │
    ├─ Parser 层 (compiler-core/src/parse)
    │  ├─ baseParse()
    │  ├─ createParserContext()
    │  ├─ parseChildren()
    │  ├─ parseTag()
    │  ├─ parseAttributes()
    │  ├─ parseText()
    │  ├─ parseInterpolation()
    │  └─ postProcess()
    │
    ├─ Transform 层 (compiler-core/src/transform)
    │  ├─ transform()
    │  ├─ createTransformContext()
    │  ├─ traverseNode()
    │  ├─ nodeTransforms
    │  │  ├─ transformVBindShorthand
    │  │  ├─ transformOnce
    │  │  ├─ transformIf
    │  │  ├─ transformFor
    │  │  └─ ... (10+ transforms)
    │  ├─ directiveTransforms
    │  │  ├─ transformModel
    │  │  ├─ transformOn
    │  │  └─ transformBind
    │  └─ hoistStatic()
    │
    ├─ Codegen 层 (compiler-core/src/codegen)
    │  ├─ generate()
    │  ├─ createCodegenContext()
    │  ├─ genModulePreamble()
    │  ├─ genFunctionPreamble()
    │  ├─ genNode()
    │  ├─ genVNodeCall()
    │  ├─ genElement()
    │  ├─ genIf()
    │  └─ genFor()
    │
    ├─ 配置管理
    │  ├─ CompilerOptions
    │  ├─ ParserOptions
    │  ├─ TransformOptions
    │  └─ CodegenOptions
    │
    └─ 扩展层
       ├─ compiler-dom
       │  ├─ getBaseTransformPreset() + DOM transforms
       │  ├─ parserOptions
       │  └─ codegenOptions
       ├─ compiler-sfc
       │  ├─ parse() (SFC 解析)
       │  ├─ compileScript()
       │  ├─ compileTemplate()
       │  └─ compileStyle()
       └─ compiler-ssr
          ├─ ssrTransformElement()
          ├─ ssrCodegenTransformContext()
          └─ generateSSRCreateVNodeExpression()
```

## 第九部分：性能分析与优化

### 编译时间分解

```
总编译时间：~5-10ms（取决于模板复杂度）

Parser 阶段         2-3ms (40%)
├─ 词法分析          1ms
├─ 语法解析          1ms
└─ AST 构建          0.5ms

Transform 阶段      2-4ms (40%)
├─ 节点遍历          1ms
├─ 多层 transform    2ms
├─ 静态提升          0.5ms
└─ 辅助函数收集      0.5ms

Codegen 阶段       1-2ms (20%)
├─ 代码生成          1ms
├─ source map        0.5ms
└─ 输出格式化        0.5ms
```

### 缓存策略

```typescript
// 浏览器编译缓存
const compileCache: Record<string, RenderFunction> = Object.create(null)

function compileToFunction(template: string, options: CompilerOptions) {
  // 生成缓存 key
  const key = genCacheKey(template, options)

  // 检查缓存
  if (key in compileCache) {
    return compileCache[key]  // ← 直接返回，无需重新编译
  }

  // 首次编译
  const { code } = compile(template, options)
  const render = new Function(code)(runtimeDom)

  // 保存缓存
  compileCache[key] = render
  return render
}

// 缓存效果
首次访问：编译 + 函数化 = 5-10ms
后续访问：直接返回 < 0.1ms
```

### 构建时预编译

```typescript
// Vite/Webpack 在构建时进行预编译

// 输入：App.vue
<template>
  <div>{{ message }}</div>
</template>

// 构建过程
Vite Plugin (@vitejs/plugin-vue)
  ↓ parseDescriptor()      // 解析 .vue 文件
  ↓ compileTemplate()      // 编译 template
    └─ baseCompile()      // 编译时执行，非运行时
  ↓ compileScript()        // 编译 script
  ↓ compileStyle()         // 编译 style
  ↓ 输出 JavaScript 代码

// 输出：已编译的 JavaScript
export default {
  render: function render(_ctx) {
    return _createVNode('div', null, _toDisplayString(_ctx.message), 1)
  }
}

// 运行时
App 加载已编译的 render 函数
  ↓ 无需编译过程
  ↓ 直接调用 render()
  ↓ 性能提升 10-100 倍
```

## 第十部分：错误处理流程

### 编译错误的收集与报告

```typescript
// 错误处理回调
const onError = options.onError || defaultOnError

// 编译过程中遇到错误
if (invalidCondition) {
  onError(createCompilerError(ErrorCodes.X_INVALID_ERROR, loc))
}

// 用户可自定义错误处理
const errors = []
compile(template, {
  onError: (error) => {
    errors.push(error)

    // 可以自定义处理
    if (error.code === ErrorCodes.X_INVALID_END_TAG) {
      console.warn(`Invalid end tag: ${error.message}`)
    }
  }
})

// 错误处理流程图
编译过程
    │
    ├─ Parser 阶段
    │  ├─ 标签不匹配错误
    │  │  └─ X_MISSING_END_TAG
    │  ├─ 属性错误
    │  │  └─ X_MISSING_ATTRIBUTE_VALUE
    │  └─ 插值错误
    │     └─ X_MISSING_INTERPOLATION_END
    │
    ├─ Transform 阶段
    │  ├─ 指令错误
    │  │  ├─ X_V_IF_NO_EXPRESSION
    │  │  ├─ X_V_FOR_MALFORMED_EXPRESSION
    │  │  └─ X_V_MODEL_MALFORMED_EXPRESSION
    │  └─ 结构错误
    │     └─ X_V_SLOT_MIXED_SLOT_USAGE
    │
    └─ Codegen 阶段
       └─ 代码生成错误（通常不会发生）

    ↓ 每个错误调用 onError()
    ↓ 用户处理或忽略
    ↓ 继续编译（容错）
    ↓ 返回有效结果（即使有错误）
```

## 第十一部分：实际案例追踪

### 案例：完整编译过程

```text
// ========== 输入 ==========
const template = `
<template>
  <div v-if="show" :class="classes" @click="handleClick">
    {{ message }}
  </div>
</template>
`

// ========== 调用编译 ==========
compileToFunction(template)

// ========== 调用链追踪 ==========

1️⃣ compileToFunction()
   ├─ 生成 key = hash(template)
   ├─ 检查 compileCache[key]
   └─ 不存在，继续编译

2️⃣ compile(template, options)
   └─ baseCompile(template, options)

3️⃣ baseCompile()
   │
   ├─ 阶段 1：初始化
   │  ├─ isModuleMode = false
   │  └─ prefixIdentifiers = false
   │
   ├─ 阶段 2：Parser
   │  └─ baseParse(template)
   │     ├─ createParserContext()
   │     │  └─ context.source = template
   │     │     context.position = 0
   │     │
   │     ├─ parseChildren()
   │     │  ├─ 遇到 '<template>'
   │     │  ├─ parseTag()
   │     │  │  ├─ parseTagName() → 'template'
   │     │  │  └─ 无属性
   │     │  │
   │     │  └─ 递归 parseChildren()
   │     │     ├─ 遇到 '<div'
   │     │     ├─ parseTag()
   │     │     │  ├─ parseTagName() → 'div'
   │     │     │  ├─ parseAttributes()
   │     │     │  │  ├─ parseAttribute() → v-if
   │     │     │  │  ├─ parseAttribute() → :class
   │     │     │  │  └─ parseAttribute() → @click
   │     │     │  └─ parseTagClosed() → '>'
   │     │     │
   │     │     └─ 递归 parseChildren()
   │     │        ├─ parseText() → 空格
   │     │        ├─ parseInterpolation()
   │     │        │  └─ {{ message }}
   │     │        └─ parseText() → 空格
   │     │
   │     ├─ 生成 RootNode
   │     │  └─ type: ROOT
   │     │     children: [TemplateElement]
   │     │
   │     └─ postProcess()
   │        └─ 标记 helpers
   │
   ├─ 阶段 3：Transform 预设
   │  └─ getBaseTransformPreset()
   │     └─ [nodeTransforms, directiveTransforms]
   │
   ├─ 阶段 4：Transform
   │  └─ transform(ast, options)
   │     │
   │     ├─ createTransformContext()
   │     │  └─ context 包含配置、缓存等
   │     │
   │     ├─ traverseNode(root)
   │     │  ├─ 访问 TemplateElement
   │     │  │  └─ 是否应用 transforms？是
   │     │  │     ├─ transformVBindShorthand() - 无匹配
   │     │  │     ├─ transformOnce() - 无匹配
   │     │  │     ├─ transformIf() - 有 v-if 指令
   │     │  │     │  └─ 创建 IF 节点
   │     │  │     ├─ transformElement()
   │     │  │     │  └─ 添加 codegenNode
   │     │  │     └─ ... (其他 transforms)
   │     │  │
   │     │  └─ 遍历子节点 DivElement
   │     │     ├─ transformElement()
   │     │     │  ├─ 规范化 props
   │     │     │  │  ├─ v-if → directiveTransforms.if
   │     │     │  │  ├─ :class → directiveTransforms.bind
   │     │     │  │  └─ @click → directiveTransforms.on
   │     │     │  │
   │     │     │  ├─ 生成 VNodeCall codegenNode
   │     │     │  │  ├─ tag: 'div'
   │     │     │  │  ├─ props: { class, onClick }
   │     │     │  │  ├─ children: [TextCall]
   │     │     │  │  ├─ patchFlag: TEXT | PROPS
   │     │     │  │  └─ dynamicProps: ['class']
   │     │     │  │
   │     │     │  └─ 处理 :class → _normalizeClass()
   │     │     │
   │     │     └─ 遍历子节点 TextInterpolation
   │     │        ├─ transformExpression()
   │     │        │  └─ 规范化 {{ message }}
   │     │        │
   │     │        └─ transformText()
   │     │
   │     └─ hoistStatic()
   │        ├─ template 元素无静态内容可提升
   │        └─ 无操作
   │
   └─ 阶段 5：Codegen
      └─ generate(ast)
         │
         ├─ createCodegenContext()
         │  └─ context.code = ''
         │
         ├─ genFunctionPreamble()
         │  └─ 生成导入语句
         │
         ├─ context.push('export function render(_ctx, _cache, ...) {')
         │
         ├─ genNode(TemplateElement)
         │  └─ genNode(IfNode)
         │     └─ 生成三元表达式
         │        ├─ test: '_ctx.show'
         │        ├─ consequent: genNode(DivElement)
         │        │  └─ _createVNode('div', { class: _normalizeClass(_ctx.classes), onClick: _cache[0] || (_cache[0] = (...args) => _ctx.handleClick(...args)) }, [_toDisplayString(_ctx.message)], 7 /* PROPS | TEXT */)
         │        └─ alternate: null
         │
         ├─ context.push('}')
         │
         └─ 返回 { code, map }

4️⃣ 代码执行
   └─ new Function(code)(runtimeDom)
      └─ 返回 render 函数

5️⃣ 缓存保存
   └─ compileCache[key] = render

// ========== 输出 ==========
render 函数已准备好，可调用：
render(_ctx) → VNode
```

## 第十二部分：性能优化建议

### 1. 模板级别优化

```typescript
// ❌ 避免：频繁编译相同模板
for (let i = 0; i < 1000; i++) {
  const render = compile(template); // 每次都编译
}

// ✅ 推荐：利用缓存
const render = compile(template); // 仅编译一次
for (let i = 0; i < 1000; i++) {
  render(_ctx); // 复用编译结果
}
```

### 2. 构建优化

```typescript
// ✅ 使用预编译
// vite.config.js
import vue from '@vitejs/plugin-vue';

export default {
  plugins: [vue()], // 在构建时预编译所有 .vue 文件
};

// 结果：运行时零编译成本
```

### 3. 模板复杂度优化

```typescript
// ❌ 避免：过于复杂的单个模板
<template>
  <div>
    <component v-for="item in 1000" :is="getComponent(item)">
      <nested-component v-for="sub in item.subs">
        <!-- 深层嵌套 -->
      </nested-component>
    </component>
  </div>
</template>

// ✅ 推荐：分解为多个组件
<template>
  <div>
    <ListItem v-for="item in 1000" :item="item" />
  </div>
</template>

// ListItem.vue
<template>
  <component :is="getComponent(props.item)">
    <SubItem v-for="sub in props.item.subs" :sub="sub" />
  </component>
</template>
```

## 总结

编译流程的完整调用链：

```
compileToFunction()
  ↓ baseCompile()
    ├─ Parser: 模板字符串 → AST
    ├─ Transform: AST → 优化 AST (with codegenNode)
    └─ Codegen: 优化 AST → JavaScript 代码
  ↓ new Function() → render 函数
  ↓ 缓存保存
  ↓ 返回 render 函数
```

关键性能指标：

- **编译时间**：5-10ms（单次）
- **缓存命中**：< 0.1ms
- **预编译**：0ms（构建时）

调用链依赖关系清晰，各模块职责分明，易于扩展和维护。

## 参考资源

- [编译器核心模块](./2-4-compiler-core-module.md)
- [Parser 详解](./2-1-parser-module.md)
- [Transform 详解](./2-2-ast-transform-module.md)
- [Codegen 详解](./2-3-codegen-module.md)
- [生态编译器](./2-5-ecology-compilers.md)
