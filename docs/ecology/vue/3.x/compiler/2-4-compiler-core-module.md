# Compiler-core - 编译核心模块

### 源代码位置

- **baseCompile 主函数**：`packages/compiler-core/src/compile.ts:67-124` - 编译流水线主入口
- **getBaseTransformPreset**：`packages/compiler-core/src/compile.ts:32-63` - 默认转换预设配置
- **compile.ts 文件**：`packages/compiler-core/src/compile.ts` (125 lines) - 编译流程协调

## 概述

Compiler-core 是 Vue 3 编译器系统的核心枢纽，整合 Parser、Transform 和 Codegen 三个模块，形成统一的编译流水线。

## 核心概念

### 在编译流程中的角色

```
模板字符串
  ↓ baseCompile()
  ├─ Parser → AST
  ├─ Transform（多层）→ 优化 AST
  └─ Codegen → JavaScript 代码
  ↓
render 函数代码
```

### 核心职责

1. **编译流程协调**：管理 Parse → Transform → Codegen 的完整流程
2. **配置管理**：接收和处理编译选项
3. **插件系统**：提供 Transform 插件的注册和管理机制
4. **预设配置**：提供默认的 Transform 预设
5. **错误处理**：统一的错误收集和报告

## 源码分析

### baseCompile 编译函数

```typescript
export function baseCompile(
  source: string | RootNode,
  options: CompilerOptions = {}
): CodegenResult {
  const onError = options.onError || defaultOnError
  const isModuleMode = options.mode === 'module'

  // 1. 检查浏览器模式的限制
  if (__BROWSER__) {
    if (options.prefixIdentifiers === true) {
      onError(createCompilerError(ErrorCodes.X_PREFIX_ID_NOT_SUPPORTED))
    } else if (isModuleMode) {
      onError(createCompilerError(ErrorCodes.X_MODULE_MODE_NOT_SUPPORTED))
    }
  }

  const prefixIdentifiers =
    !__BROWSER__ && (options.prefixIdentifiers === true || isModuleMode)

  if (!prefixIdentifiers && options.cacheHandlers) {
    onError(createCompilerError(ErrorCodes.X_CACHE_HANDLER_NOT_SUPPORTED))
  }

  if (options.scopeId && !isModuleMode) {
    onError(createCompilerError(ErrorCodes.X_SCOPE_ID_NOT_SUPPORTED))
  }

  // 2. 合并配置选项
  const resolvedOptions = extend({}, options, {
    prefixIdentifiers,
  })

  // 3. 解析（Parser）
  const ast = isString(source)
    ? baseParse(source, resolvedOptions)
    : source

  // 4. 获取 Transform 预设
  const [nodeTransforms, directiveTransforms] =
    getBaseTransformPreset(prefixIdentifiers)

  // 5. 合并用户提供的 Transform
  if (options.nodeTransforms) {
    nodeTransforms.push(...options.nodeTransforms)
  }
  if (options.directiveTransforms) {
    Object.assign(directiveTransforms, options.directiveTransforms)
  }

  // 6. 转换（Transform）
  transform(ast, {
    ...resolvedOptions,
    nodeTransforms,
    directiveTransforms,
  })

  // 7. 生成代码（Codegen）
  return generate(ast, resolvedOptions)
}
```

## 实现细节

### 编译流程分解

#### 第 1 步：配置验证与合并

```typescript
const resolvedOptions = extend({}, options, {
  prefixIdentifiers,  // 计算出的标识符前缀选项
})
```

主要配置项：

- `mode`：'function' | 'module' | 'ssr'
- `prefixIdentifiers`：是否为标识符添加前缀（用于模块模式）
- `hoistStatic`：是否进行静态提升
- `cacheHandlers`：是否缓存事件处理函数
- `sourceMap`：是否生成源码映射
- `isTS`：是否为 TypeScript 模式

#### 第 2 步：解析模板

```typescript
const ast = isString(source)
  ? baseParse(source, resolvedOptions)
  : source

// Parser 的输出
// ast: RootNode {
//   type: NodeTypes.ROOT,
//   children: [...],
//   helpers: Set<symbol>,
//   components: string[],
//   directives: string[],
//   ...
// }
```

#### 第 3 步：获取 Transform 预设

```typescript
const [nodeTransforms, directiveTransforms] =
  getBaseTransformPreset(prefixIdentifiers)

// 返回：
// [
//   [  // nodeTransforms 数组
//     transformVBindShorthand,
//     transformOnce,
//     transformIf,
//     transformMemo,
//     transformFor,
//     transformExpression,
//     transformSlotOutlet,
//     transformElement,
//     trackSlotScopes,
//     transformText,
//   ],
//   {  // directiveTransforms 对象
//     on: transformOn,
//     bind: transformBind,
//     model: transformModel,
//   }
// ]
```

#### 第 4 步：执行转换

```typescript
transform(ast, {
  ...resolvedOptions,
  nodeTransforms,      // 节点 Transform 列表
  directiveTransforms, // 指令 Transform 对象
})

// Transform 会修改 ast 原地
// 添加：
// - codegenNode（每个节点）
// - dynamicChildren（动态子节点列表）
// - patchFlag（补丁标记）
```

#### 第 5 步：生成代码

```typescript
return generate(ast, resolvedOptions)

// 返回：
// {
//   code: '...',           // JavaScript 代码字符串
//   ast: ast,              // 经过转换的 AST
//   map?: SourceMapObject, // 源码映射（可选）
// }
```

## Transform 预设系统

### getBaseTransformPreset

返回默认的 Transform 配置：

```typescript
export function getBaseTransformPreset(
  prefixIdentifiers?: boolean
): TransformPreset {
  return [
    [
      transformVBindShorthand,
      transformOnce,
      transformIf,
      transformMemo,
      transformFor,
      ...(__COMPAT__ ? [transformFilter] : []),
      ...(!__BROWSER__ && prefixIdentifiers
        ? [
            trackVForSlotScopes,
            transformExpression,
          ]
        : __BROWSER__ && __DEV__
          ? [transformExpression]
          : []),
      transformSlotOutlet,
      transformElement,
      trackSlotScopes,
      transformText,
    ],
    {
      on: transformOn,
      bind: transformBind,
      model: transformModel,
    },
  ]
}
```

**执行顺序很重要**：

```
1. transformVBindShorthand  ← 先处理简化语法
2. transformOnce           ← v-once 要早处理
3. transformIf             ← 条件分支
4. transformMemo           ← v-memo
5. transformFor            ← v-for
6. transformExpression     ← 表达式分析
7. transformSlotOutlet     ← <slot/> 输出
8. transformElement        ← 元素处理
9. trackSlotScopes         ← 作用域追踪
10. transformText          ← 文本处理（最后）
```

### 自定义 Transform

用户可以提供自定义的 Transform：

```typescript
// 用户代码
const result = baseCompile(template, {
  nodeTransforms: [
    // 自定义节点 transform
    (node, context) => {
      if (node.type === NodeTypes.ELEMENT && node.tag === 'custom') {
        // 自定义处理逻辑
        node.codegenNode = createCustomCodegenNode(node)
      }
    }
  ],
  directiveTransforms: {
    // 自定义指令 transform
    'my-directive': (dir, node, context) => {
      // 处理 v-my-directive
    }
  }
})
```

## 编译选项（CompilerOptions）

完整的编译选项配置：

```typescript
export interface CompilerOptions {
  // 输出模式
  mode?: 'function' | 'module' | 'ssr'

  // 文件名（用于错误提示和源码映射）
  filename?: string

  // 源码映射
  sourceMap?: boolean

  // 为生成的变量添加前缀（用于模块模式）
  prefixIdentifiers?: boolean

  // 生成 helpers 的方式
  hoistStatic?: boolean                    // 静态提升
  cacheHandlers?: boolean                  // 事件处理缓存
  scopeId?: string | false                 // scoped CSS 的 ID

  // 解析选项
  delimiters?: [string, string]            // 插值分隔符
  comments?: boolean                       // 保留注释
  isPreTag?: (tag: string) => boolean      // <pre> 标签检测
  isVoidTag?: (tag: string) => boolean     // 自闭合标签检测
  isCustomElement?: (tag: string) => boolean  // 自定义元素检测
  isBuiltInComponent?: (tag: string) => boolean  // 内置组件检测

  // 表达式处理
  isTS?: boolean                           // TypeScript 模式
  expressionPlugins?: string[]             // Babel 插件

  // Transform 扩展
  nodeTransforms?: NodeTransform[]         // 自定义节点 transform
  directiveTransforms?: Record<string, DirectiveTransform>  // 自定义指令 transform

  // 错误处理
  onError?: (error: CompilerError) => void
  onWarn?: (message: CompilerWarning) => void
}
```

## 编译输出示例

### 输入

```typescript
const template = `
  <div v-if="show" class="box">
    <p>{{ message }}</p>
    <button @click="toggleShow">Toggle</button>
  </div>
`

const options = {
  mode: 'module',
  filename: 'App.vue',
  sourceMap: true,
  hoistStatic: true,
  cacheHandlers: true,
}
```

### baseCompile 执行过程

```
1. 配置验证
   ✓ mode = 'module' → prefixIdentifiers = true
   ✓ sourceMap = true → 启用源码映射

2. Parser 解析
   输入：template 字符串
   输出：AST {
     type: ROOT,
     children: [IfNode { ... }],
     helpers: Set([...]),
     hoists: []
   }

3. 获取 Transform 预设
   nodeTransforms = [10 个 transform 函数]
   directiveTransforms = { on, bind, model }

4. Transform 执行
   遍历 AST，应用所有 transform
   - transformIf 处理 v-if → ConditionalExpression
   - transformElement 分析 props
   - transformText 处理文本
   - ... 其他 transform

5. Codegen 生成代码
   输出：{
     code: `
       import { openBlock, createBlock, ... } from 'vue'

       const _hoisted_1 = { class: 'box' }

       export function render(_ctx, _cache, ...) {
         return _ctx.show
           ? (openBlock(), createBlock('div', _hoisted_1, [...]))
           : null
       }
     `,
     map: SourceMapObject
   }
```

### 最终产物

```javascript
import { openBlock, createBlock, createVNode, toDisplayString } from 'vue'

const _hoisted_1 = { class: 'box' }

export function render(_ctx, _cache, $props, $attrs, $slots, $emit, $options) {
  return _ctx.show
    ? (openBlock(), createBlock(
        'div',
        _hoisted_1,
        [
          createVNode('p', null, toDisplayString(_ctx.message), 1),
          createVNode(
            'button',
            { onClick: _cache[0] || (_cache[0] = (...args) => _ctx.toggleShow(...args)) },
            'Toggle',
            1
          )
        ],
        PatchFlags.TEXT
      ))
    : null
}
```

## 性能优化

### 错误处理

Compiler-core 提供了完善的错误处理机制：

```typescript
export enum ErrorCodes {
  // Parser 错误
  X_INVALID_END_TAG,
  X_MISSING_END_TAG,
  X_MISSING_INTERPOLATION_END,

  // Transform 错误
  X_V_IF_NO_EXPRESSION,
  X_V_FOR_NO_EXPRESSION,
  X_V_MODEL_NO_EXPRESSION,

  // Codegen 错误
  X_PREFIX_ID_NOT_SUPPORTED,
  X_MODULE_MODE_NOT_SUPPORTED,
}

interface CompilerError {
  code: ErrorCodes
  message: string
  loc: SourceLocation
}

// 使用
baseCompile(template, {
  onError: (error) => {
    console.error(`[${error.code}] ${error.message}`)
    console.error(`at ${error.loc.source}`)
  }
})
```

### 源码映射支持

Codegen 可以生成源码映射，用于调试：

```typescript
{
  code: '...',
  ast: ast,
  map: {
    version: 3,
    file: 'app.vue',
    sources: ['app.vue'],
    sourcesContent: ['<template>...</template>'],
    mappings: 'AAAA,AACE,MAAM;',
    names: ['message', 'show', ...]
  }
}
```

## 与其他编译器的关系

Compiler-core 是基础，上层编译器在其基础上进行扩展：

```
Compiler-core
  ↑
  ├─ Compiler-dom
  │   ├─ DOM 特殊属性处理（class、style）
  │   ├─ HTML 特性解析
  │   └─ 额外的 Transform 和 Codegen 扩展
  │
  ├─ Compiler-sfc
  │   ├─ .vue 单文件解析
  │   ├─ script/template/style 分割
  │   └─ 集成编译流程
  │
  └─ Compiler-ssr
      ├─ SSR 字符串生成
      └─ Hydration 支持
```

## 总结

| 概念               | 说明                                             |
|------------------|------------------------------------------------|
| **baseCompile**  | 编译流水线的主入口函数                                    |
| **Parser 调用**    | `baseParse(source, options)`                   |
| **Transform 调用** | `transform(ast, context)`                      |
| **Codegen 调用**   | `generate(ast, options)`                       |
| **预设系统**         | `getBaseTransformPreset()` 提供默认配置              |
| **插件系统**         | 支持自定义 `nodeTransforms` 和 `directiveTransforms` |
| **配置选项**         | `CompilerOptions` 接口定义所有配置                     |
| **错误处理**         | `onError` 和 `onWarn` 回调                        |
| **源码映射**         | 支持调试用的源码位置映射                                   |
