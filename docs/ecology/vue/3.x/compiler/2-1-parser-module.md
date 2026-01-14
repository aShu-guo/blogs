# Parser - 模板解析模块

### 源代码位置

- **Parser 主函数**：`packages/compiler-core/src/parser.ts:1036-1087` - `baseParse()` 函数
- **Tokenizer**：`packages/compiler-core/src/tokenizer.ts:236+` - `Tokenizer` 类
- **State 枚举**：`packages/compiler-core/src/tokenizer.ts:87-138` - 状态机所有状态定义

## 1. 概念先行：建立心智模型

Parser 是 Vue 3 编译器的**第一道关卡**，将 HTML 模板字符串转换为抽象语法树（AST）。

**核心直觉**：Parser = 阅读器 + 记录本 + 结构化笔记

- **阅读器（Tokenizer）**：逐字符扫描模板，识别标签、属性、文本
- **记录本（Stack）**：追踪嵌套关系，确保标签正确闭合
- **结构化笔记（AST）**：将扁平的字符串转为树形结构

### 编译流程中的位置

```
模板字符串（.vue template）
  ↓ 词法分析 (Tokenize)
字符流（Tokens）
  ↓ 语法分析 (Parse)
抽象语法树 (AST)  ← Parser 的输出
  ↓ AST 转换 (Transform)
优化后的 AST
  ↓ 代码生成 (Codegen)
JavaScript 代码（render 函数）
```

### Parser 的两层架构

Vue 3 采用**分层设计**：

**第 1 层：Tokenizer（分词器）** - 将模板字符串分解为 Token 流

```
输入：<div class="box">{{ msg }}</div>
  ↓
Token 流：
  - OpenTag: div
  - Attribute: class="box"
  - Text/Interpolation: {{ msg }}
  - CloseTag: div
```

**第 2 层：Parser（解析器）** - 将 Token 流转换为 AST

```
Token 流
  ↓
AST 树：
{
  type: NodeTypes.ROOT,
  children: [
    {
      type: NodeTypes.ELEMENT,
      tag: "div",
      props: [{ name: "class", value: "box" }],
      children: [
        { type: NodeTypes.INTERPOLATION, content: "{{ msg }}" }
      ]
    }
  ]
}
```

## 2. 最小实现：手写"低配版"

以下是一个简化的 Parser 实现，展示核心逻辑：

```javascript
// 简化版 Parser（仅处理基本标签和文本）
function miniParser(template) {
  const stack = []
  const root = { type: 'ROOT', children: [] }
  let current = root
  let i = 0

  while (i < template.length) {
    // 处理开标签 <div>
    if (template[i] === '<' && template[i + 1] !== '/') {
      const tagEnd = template.indexOf('>', i)
      const tagName = template.slice(i + 1, tagEnd)

      const node = {
        type: 'ELEMENT',
        tag: tagName,
        children: []
      }

      current.children.push(node)
      stack.push(current)
      current = node
      i = tagEnd + 1
    }
    // 处理闭标签 </div>
    else if (template[i] === '<' && template[i + 1] === '/') {
      const tagEnd = template.indexOf('>', i)
      current = stack.pop()
      i = tagEnd + 1
    }
    // 处理文本
    else {
      const textEnd = template.indexOf('<', i)
      const text = template.slice(i, textEnd === -1 ? undefined : textEnd)

      if (text.trim()) {
        current.children.push({
          type: 'TEXT',
          content: text
        })
      }

      i = textEnd === -1 ? template.length : textEnd
    }
  }

  return root
}

// 测试
const ast = miniParser('<div><p>Hello</p></div>')
console.log(JSON.stringify(ast, null, 2))
```

**输出**：
```json
{
  "type": "ROOT",
  "children": [
    {
      "type": "ELEMENT",
      "tag": "div",
      "children": [
        {
          "type": "ELEMENT",
          "tag": "p",
          "children": [
            {
              "type": "TEXT",
              "content": "Hello"
            }
          ]
        }
      ]
    }
  ]
}
```

**核心要点**：
- 使用栈追踪嵌套关系
- 逐字符扫描识别标签和文本
- 构建树形结构

真实的 Vue Parser 在此基础上增加了：属性解析、指令处理、插值识别、错误恢复、源码位置追踪等。

## 3. 逐行解剖：关键路径分析

### 3.1 Tokenizer 状态机

Tokenizer 是一个**有限状态自动机（FSM）**，通过状态转移识别不同的语法元素：

```typescript
export enum State {
  Text = 1,                    // 文本状态
  InterpolationOpen,           // 插值开始 {{
  Interpolation,               // 在插值内
  InterpolationClose,          // 插值结束 }}
  BeforeTagName,               // < 之后
  InTagName,                   // 在标签名内
  InSelfClosingTag,            // 自闭合标签
  BeforeClosingTagName,        // </ 之后
  InClosingTagName,            // 在关闭标签名内
  BeforeAttrName,              // 属性前
  InAttrName,                  // 在属性名内
  AfterAttrName,               // 属性名后
  BeforeAttrValue,             // 属性值前
  InAttrValueDoubleQuoted,     // 双引号属性值内
  InAttrValueSingleQuoted,     // 单引号属性值内
  InAttrValueUnquoted,         // 无引号属性值内
  InComment,                   // 注释内
  // ... 更多状态
}
```

**状态转移示例**（解析 `<div class="box">`）：

```
输入: <div class="box">
位置: 0

位置 0: <
状态: Text → BeforeTagName

位置 1: d
状态: BeforeTagName → InTagName

位置 2-3: i, v
状态: InTagName → InTagName

位置 4: ' ' (空格)
状态: InTagName → BeforeAttrName
触发: onopentagname("div")

位置 5-9: class
状态: BeforeAttrName → InAttrName

位置 10: =
状态: InAttrName → BeforeAttrValue

位置 11: "
状态: BeforeAttrValue → InAttrValueDoubleQuoted

位置 12-14: box
状态: InAttrValueDoubleQuoted → InAttrValueDoubleQuoted

位置 15: "
状态: InAttrValueDoubleQuoted → BeforeAttrName
触发: onattr(name="class", value="box")

位置 16: >
状态: BeforeAttrName → Text
触发: onopentagend()
```

**设计要点**：
- **为什么用状态机**：HTML 语法复杂，状态机能清晰表达各种转移规则
- **回调机制**：在关键点触发回调（如 `onopentagname`），让 Parser 构建 AST

### 3.2 Parser 栈机制

Parser 使用**栈**追踪嵌套元素：

```typescript
const stack: ElementNode[] = []

// 解析 <div><p>text</p></div> 的过程

// 1. 遇到 <div>
stack.push(divNode)
// stack: [divNode]

// 2. 遇到 <p>
stack.push(pNode)
// stack: [divNode, pNode]

// 3. 遇到文本 "text"
stack[stack.length - 1].children.push(textNode)
// pNode.children = [textNode]

// 4. 遇到 </p>
pNode = stack.pop()
// stack: [divNode]

// 5. 遇到 </div>
divNode = stack.pop()
// stack: []
// 完成！divNode 就是最终的 AST 根节点
```

**设计要点**：
- **为什么用栈**：栈的后进先出特性天然匹配 HTML 的嵌套结构
- **错误恢复**：当闭标签不匹配时，可以通过栈回溯找到正确的开标签

### 3.3 属性和指令解析

```typescript
// 遇到属性时
onattr(name: string, value: string) {
  let attrNode: AttributeNode | DirectiveNode

  // 判断是否为指令
  if (name.startsWith('v-') || name.startsWith('@') || name.startsWith(':')) {
    // 指令处理
    const directive = parseDirective({ name, value, loc: ... })
    attrNode = directive
  } else {
    // 普通属性
    attrNode = {
      type: NodeTypes.ATTRIBUTE,
      name,
      value: createText(value),
      loc: ...
    }
  }

  currentOpenTag.props.push(attrNode)
}
```

**指令解析示例**：

```javascript
// v-if="condition" →
{
  type: NodeTypes.DIRECTIVE,
  name: "if",
  exp: { content: "condition" }
}

// @click="handler" →
{
  type: NodeTypes.DIRECTIVE,
  name: "on",
  arg: { content: "click" },
  exp: { content: "handler" }
}

// :value.sync="msg" →
{
  type: NodeTypes.DIRECTIVE,
  name: "bind",
  arg: { content: "value" },
  exp: { content: "msg" },
  modifiers: ["sync"]
}
```

**设计要点**：
- **为什么区分指令和属性**：指令需要特殊的转换逻辑（在 Transform 阶段处理）
- **修饰符解析**：`.prevent`、`.stop` 等修饰符被解析为数组，便于后续处理

### 3.4 插值处理

```typescript
// 遇到插值
oninterpolation(start: number, end: number) {
  if (inVPre) {
    // v-pre 中的插值作为文本处理
    return ontext(getSlice(start, end), start, end)
  }

  // 提取插值内的表达式
  let innerStart = start + '{{'.length
  let innerEnd = end - '}}'.length
  const exp = getSlice(innerStart, innerEnd)

  addNode({
    type: NodeTypes.INTERPOLATION,
    content: createExpression(exp, false, getLoc(innerStart, innerEnd)),
    loc: getLoc(start, end)
  })
}
```

**设计要点**：
- **为什么单独处理插值**：插值是动态内容，需要在运行时求值
- **v-pre 支持**：`v-pre` 指令禁用插值处理，将 `{{ }}` 作为普通文本

## 4. 细节补充：边界与性能优化

### 4.1 错误恢复

Parser 不会在遇到第一个错误时停止，而是尽可能继续解析：

```typescript
// 处理闭标签时的恢复
onclosetag(start: number, end: number) {
  const name = getSlice(start, end)

  // 查找匹配的开标签
  let j = stack.length - 1
  while (j >= 0) {
    if (stack[j].tag.toLowerCase() === name.toLowerCase()) {
      break
    }
    j--
  }

  if (j < 0) {
    // 未找到匹配的开标签 - 记录错误但继续
    emitError(ErrorCodes.X_INVALID_END_TAG, start)
    return
  }

  // 检查中间是否有未闭合的标签
  for (let k = stack.length - 1; k > j; k--) {
    emitError(ErrorCodes.X_MISSING_END_TAG, stack[k].loc.start)
  }

  // 弹出栈中的元素
  stack.length = j
}
```

**优势**：
- 一次性看到所有错误，提高调试效率
- 即使有错误也能生成 AST，便于 IDE 工具链集成

参考：[ErrorCodes 详解](2-1.2-error-codes.md)

### 4.2 源码位置追踪

每个 AST 节点都记录其在源代码中的位置：

```typescript
interface SourceLocation {
  start: {
    offset: number    // 从文件开头的偏移量
    line: number      // 行号（从 1 开始）
    column: number    // 列号（从 1 开始）
  }
  end: {
    offset: number
    line: number
    column: number
  }
  source: string      // 源代码片段
}
```

**用途**：
- 精确的错误提示
- IDE 跳转到定义
- Source Map 生成

### 4.3 性能优化

**1. 字符串切片优化**

```typescript
// 不是每次都创建新字符串，而是记录起止位置
function getSlice(start: number, end: number): string {
  return template.slice(start, end)
}
```

**2. 状态机内联**

```typescript
// 状态转移逻辑内联，避免函数调用开销
switch (state) {
  case State.Text:
    if (char === '<') {
      state = State.BeforeTagName
    }
    break
  case State.BeforeTagName:
    if (isAlpha(char)) {
      state = State.InTagName
    }
    break
  // ...
}
```

**3. 栈复用**

```typescript
// 栈不是每次都创建新数组，而是复用同一个数组
const stack: ElementNode[] = []
// 使用 push/pop 而不是创建新数组
```

### 4.4 特殊场景处理

**1. 自定义分隔符**

```typescript
// 默认 {{ message }}
// 自定义为 <% message %>
const ast = baseParse(template, {
  delimiters: ['<%', '%>']
})
```

**2. v-pre 支持**

```html
<div v-pre>
  {{ message }} ← 作为文本而不是插值
  <span v-if="show"></span> ← v-if 不处理，作为属性
</div>
```

**3. SVG 和 MathML 命名空间**

```typescript
// Parser 根据命名空间智能处理
<svg>
  <circle r="10" />  ← 识别为 SVG 元素
</svg>

<math>
  <mi>x</mi>  ← 识别为 MathML 元素
</math>
```

## 5. 总结与延伸

### 一句话总结

Parser 通过**状态机 + 栈机制**将扁平的模板字符串转换为树形 AST，同时提供完善的错误恢复和源码追踪能力。

### 核心设计理念

| 概念 | 说明 | 设计意图 |
|------|------|----------|
| **分层架构** | Tokenizer + Parser 两层设计 | 职责分离，降低复杂度 |
| **状态机** | 有限状态自动机识别语法元素 | 清晰表达转移规则 |
| **栈机制** | 追踪嵌套元素的开闭匹配 | 天然匹配 HTML 嵌套结构 |
| **错误恢复** | 尽可能继续解析并收集多个错误 | 提升开发体验 |
| **源码位置** | 每个节点记录精确位置 | 便于错误提示和工具集成 |

### 面试考点

1. **Parser 的两层架构是什么？为什么要分层？**
   - Tokenizer（词法分析）+ Parser（语法分析）
   - 分层降低复杂度，Tokenizer 专注字符识别，Parser 专注结构构建

2. **如何处理 HTML 标签的嵌套？**
   - 使用栈追踪开标签，遇到闭标签时弹出栈
   - 栈的后进先出特性天然匹配嵌套结构

3. **Parser 如何处理错误？**
   - 错误恢复机制：记录错误但继续解析
   - 一次性收集所有错误，提供完整的错误列表

4. **为什么要记录源码位置？**
   - 精确的错误提示
   - IDE 工具集成（跳转、高亮）
   - Source Map 生成

### 延伸阅读

- [NodeTypes 详解](2-1.1-node-types.md) - 了解 AST 中的所有节点类型
- [ErrorCodes 详解](2-1.2-error-codes.md) - 了解错误恢复机制
- [AST Transform 模块](2-2-ast-transform-module.md) - Parser 的下一步：AST 转换优化
