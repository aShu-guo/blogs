# Parser - 模板解析模块

Parser 是 Vue 3 编译器系统中的**第一道关卡**，负责将 HTML 模板字符串转换为 **抽象语法树（AST）**。这是一个经典的编译器前端任务，涉及词法分析、语法分析等核心概念。

### 源代码位置

- **Parser 主函数**：`packages/compiler-core/src/parser.ts:1036-1087` - `baseParse()` 函数
- **Tokenizer**：`packages/compiler-core/src/tokenizer.ts:236+` - `Tokenizer` 类
- **State 枚举**：`packages/compiler-core/src/tokenizer.ts:87-138` - 状态机所有状态定义

## 核心概念

### Parser 在编译流程中的位置

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

### Parser 的职责

Vue Parser 需要处理：

1. **HTML 标签解析**：识别元素标签、属性、文本
2. **Vue 指令解析**：处理 v-if、v-for、v-bind、@click 等
3. **插值表达式解析**：识别 `{{ expression }}`
4. **源码位置追踪**：记录每个节点在源代码中的位置（便于错误提示）
5. **错误恢复**：尽可能继续解析，收集多个错误

## Parser 的两层架构

Vue 3 的 Parser 采用**分层设计**：

### 第 1 层：Tokenizer（分词器）

**职责**：将模板字符串分解为 Token 流

```
输入字符串：<div class="box">{{ msg }}</div>
  ↓ Tokenizer 分词
Token 流：
  - OpenTag: div
  - Attribute: class="box"
  - Text/Interpolation: {{ msg }}
  - CloseTag: div
```

**关键特性**：

- 支持 HTML 实体解码
- 识别各种 HTML 标签形式（自闭合、嵌套等）
- 支持 CDATA、注释等
- 支持自定义分隔符（如 `{{ }}` 或 `<% %>`）

### 第 2 层：Parser（解析器）

**职责**：将 Token 流转换为 AST

```
Token 流
  ↓ Parser 解析
AST 树：
{
  type: NodeTypes.ROOT,
  children: [
    {
      type: NodeTypes.ELEMENT,
      tag: "div",
      props: [{ type: NodeTypes.ATTRIBUTE, name: "class", value: "box" }],
      children: [
        { type: NodeTypes.INTERPOLATION, content: "{{ msg }}" }
      ]
    }
  ]
}
```

## Tokenizer 详解

### 状态机设计

Tokenizer 本质上是一个**有限状态自动机（FSM）**，定义了多个状态：

```typescript
export enum State {
  Text = 1, // 文本状态
  InterpolationOpen, // 插值开始（{）
  Interpolation, // 在插值内（{{ ... }}）
  InterpolationClose, // 插值结束（}）
  BeforeTagName, // <之后
  InTagName, // 在标签名内
  InSelfClosingTag, // 自闭合标签
  BeforeClosingTagName, // </之后
  InClosingTagName, // 在关闭标签名内
  BeforeAttrName, // 属性前
  InAttrName, // 在属性名内
  AfterAttrName, // 属性名后
  BeforeAttrValue, // 属性值前
  InAttrValueDoubleQuoted, // 双引号属性值内
  InAttrValueSingleQuoted, // 单引号属性值内
  InAttrValueUnquoted, // 无引号属性值内
  BeforeDeclaration, // <!之后
  InDeclaration, // 声明内
  InComment, // 注释内
  // ... 更多状态
}
```

### 转移规则示例

```
状态转移过程（以解析 <div class="box"> 为例）：

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
触发事件: onopentagname("div")

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
触发事件: onattr(name="class", value="box")

位置 16: >
状态: BeforeAttrName → Text
触发事件: onopentagend()
```

### Tokenizer 的回调机制

Tokenizer 在识别关键点时触发回调（事件）：

```typescript
interface TokenizerCallbacks {
  // 遇到文本
  ontext(start: number, end: number): void

  // 遇到 HTML 实体
  ontextentity(char: string, start: number, end: number): void

  // 遇到插值 {{ ... }}
  oninterpolation(start: number, end: number): void

  // 开标签名
  onopentagname(start: number, end: number): void

  // 属性
  onattr(name: string, value: string, ...): void

  // 开标签结束
  onopentagend(start: number, end: number): void

  // 闭标签名
  onclosetag(start: number, end: number): void

  // 注释
  oncomment(start: number, end: number): void

  // 错误
  onerr(code: ErrorCodes, ...): void
}
```

## Parser 详解

### 构建 AST 的栈机制

Parser 使用**栈（Stack）** 来追踪嵌套元素：

```typescript
const stack: ElementNode[] = [];

// 解析 <div><p>text</p></div> 的过程

// 1. 遇到 <div>
stack.push(divNode);
// stack: [divNode]

// 2. 遇到 <p>
stack.push(pNode);
// stack: [divNode, pNode]

// 3. 遇到文本 "text"
stack[stack.length - 1].children.push(textNode);
// divNode.children = [pNode]
// pNode.children = [textNode]

// 4. 遇到 </p>
pNode = stack.pop();
// stack: [divNode]

// 5. 遇到 </div>
divNode = stack.pop();
// stack: []
// 完成！divNode 就是最终的 AST 根节点
```

### 关键处理逻辑

#### 1. 元素节点创建

```typescript
const Callbacks = {
  // 遇到开标签名时
  onopentagname(start: number, end: number) {
    const name = getSlice(start, end);
    currentOpenTag = {
      type: NodeTypes.ELEMENT,
      tag: name,
      ns: currentOptions.getNamespace(name, stack[0], currentOptions.ns),
      tagType: ElementTypes.ELEMENT, // 初始化为 ELEMENT
      props: [],
      children: [],
      loc: getLoc(start - 1, end),
    };
  },

  // 遇到开标签结束时
  onopentagend(start: number, end: number) {
    if (!currentOpenTag) return;

    // 判断标签类型
    if (currentOptions.isComponent(currentOpenTag.tag)) {
      currentOpenTag.tagType = ElementTypes.COMPONENT;
    } else if (currentOpenTag.tag === 'slot') {
      currentOpenTag.tagType = ElementTypes.SLOT;
    } else if (currentOpenTag.tag === 'template') {
      currentOpenTag.tagType = ElementTypes.TEMPLATE;
    }

    // 检查 v-pre（禁用处理）
    if (isVPre(currentOpenTag)) {
      inVPre++;
    }

    // 压栈
    stack.push(currentOpenTag);
    currentOpenTag = null;
  },
};
```

#### 2. 属性和指令解析

```typescript
// 遇到属性时
onattr(name: string, value: string, ...) {
  let attrNode: AttributeNode | DirectiveNode

  // 判断是否为指令
  if (name.startsWith('v-') || name.startsWith('@') || name.startsWith(':')) {
    // 指令处理
    const directive = parseDirective({
      name,
      value,
      loc: ...
    })
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

// 指令解析示例
// v-if="condition" → {
//   type: NodeTypes.DIRECTIVE,
//   name: "if",
//   exp: SimpleExpressionNode { content: "condition" },
//   loc: ...
// }

// @click="handler" → {
//   type: NodeTypes.DIRECTIVE,
//   name: "on",
//   arg: SimpleExpressionNode { content: "click" },
//   exp: SimpleExpressionNode { content: "handler" },
//   loc: ...
// }

// :value.sync="msg" → {
//   type: NodeTypes.DIRECTIVE,
//   name: "bind",
//   arg: SimpleExpressionNode { content: "value" },
//   exp: SimpleExpressionNode { content: "msg" },
//   modifiers: [SimpleExpressionNode { content: "sync" }],
//   loc: ...
// }
```

#### 3. 文本和插值处理

```typescript
const Callbacks = {
  // 遇到文本
  ontext(text: string, start: number, end: number) {
    if (inVPre) {
      // v-pre 中的文本不处理插值
      addNode({
        type: NodeTypes.TEXT,
        content: text,
        loc: getLoc(start, end),
      });
    } else {
      // 正常文本，可能包含插值
      parseTextContent(text, start, end);
    }
  },

  // 遇到插值
  oninterpolation(start: number, end: number) {
    if (inVPre) {
      // v-pre 中的插值作为文本处理
      return ontext(getSlice(start, end), start, end);
    }

    // 提取插值内的表达式
    let innerStart = start + '{{'.length;
    let innerEnd = end - '}}'.length;
    const exp = getSlice(innerStart, innerEnd);

    addNode({
      type: NodeTypes.INTERPOLATION,
      content: createExpression(exp, false, getLoc(innerStart, innerEnd)),
      loc: getLoc(start, end),
    });
  },
};
```

#### 4. 闭标签处理

```typescript
const Callbacks = {
  onclosetag(start: number, end: number) {
    const name = getSlice(start, end);

    // 查找匹配的开标签
    let j = stack.length - 1;
    while (j >= 0) {
      if (stack[j].tag.toLowerCase() === name.toLowerCase()) {
        break;
      }
      j--;
    }

    if (j < 0) {
      // 未找到匹配的开标签 - 错误
      emitError(ErrorCodes.X_MISSING_END_TAG_BEFORE_EOF, start);
      return;
    }

    // 弹出栈中的元素
    const closedElement = stack.pop();

    // 如果有中间未闭合的元素，这些也应该被闭合
    for (let k = stack.length - 1; k > j; k--) {
      emitError(ErrorCodes.X_MISSING_END_TAG, stack[k].loc.start);
    }
  },
};
```

## 完整 Parser 示例

### 输入与输出

**输入模板**：

```html
<div v-if="show" class="container">
  <p>{{ message }}</p>
</div>
```

**输出 AST**：

```typescript
{
  type: NodeTypes.ROOT,
  source: '<div v-if="show" class="container">\n  <p>{{ message }}</p>\n</div>',
  children: [
    {
      type: NodeTypes.ELEMENT,
      tag: 'div',
      tagType: ElementTypes.ELEMENT,
      ns: Namespaces.HTML,
      props: [
        {
          type: NodeTypes.DIRECTIVE,
          name: 'if',
          exp: {
            type: NodeTypes.SIMPLE_EXPRESSION,
            content: 'show',
            isStatic: false,
            constType: ConstantTypes.NOT_CONSTANT
          },
          loc: { ... }
        },
        {
          type: NodeTypes.ATTRIBUTE,
          name: 'class',
          value: {
            type: NodeTypes.TEXT,
            content: 'container'
          },
          loc: { ... }
        }
      ],
      children: [
        {
          type: NodeTypes.TEXT,
          content: '\n  '
        },
        {
          type: NodeTypes.ELEMENT,
          tag: 'p',
          tagType: ElementTypes.ELEMENT,
          props: [],
          children: [
            {
              type: NodeTypes.INTERPOLATION,
              content: {
                type: NodeTypes.SIMPLE_EXPRESSION,
                content: 'message',
                isStatic: false,
                constType: ConstantTypes.NOT_CONSTANT
              }
            }
          ]
        },
        {
          type: NodeTypes.TEXT,
          content: '\n'
        }
      ]
    }
  ],
  helpers: new Set([...]),
  components: [],
  directives: [],
  hoists: [],
  imports: [],
  cached: [],
  temps: 0
}
```

## Parser 的高级特性

### 1. 错误恢复

Parser 不会在遇到第一个错误时停止，而是尽可能继续解析：

```typescript
// 错误的 HTML
<div>
  <p>text
  <span>more</span>  ← <p> 未闭合
</div>

// Parser 仍然会生成 AST，并记录错误
// 错误列表：
// - X_MISSING_END_TAG: <p> 标签未闭合
// - 但仍然能解析出 <span> 等后续内容
```

参考[ErrorCodes详解](2-1.2-error-codes.md)

### 2. 源码位置追踪

每个 AST 节点都记录其在源代码中的位置，便于精确的错误提示：

```typescript
interface SourceLocation {
  start: {
    offset: number; // 从文件开头的偏移量
    line: number; // 行号（从 1 开始）
    column: number; // 列号（从 1 开始）
  };
  end: {
    offset: number;
    line: number;
    column: number;
  };
  source: string; // 源代码片段
}

// 示例
node.loc = {
  start: { offset: 5, line: 1, column: 6 },
  end: { offset: 8, line: 1, column: 9 },
  source: 'div',
};
```

### 3. 自定义分隔符

支持自定义插值分隔符：

```typescript
// 默认
{{ message }}

// 自定义为 <% %>
<% message %>

// 通过配置
const ast = baseParse(template, {
  delimiters: ['<%', '%>']
})
```

### 4. v-pre 支持

`v-pre` 指令禁止在该元素及其子元素中进行处理：

```html
<div v-pre>
  {{ message }} ← 作为文本而不是插值
  <span v-if="show"></span> ← v-if 不处理，作为属性
</div>
```

## Parser 的配置项

```typescript
export interface ParserOptions {
  // 解析模式
  parseMode?: 'base' | 'html' | 'sfc';

  // 命名空间
  ns?: Namespaces;

  // 分隔符
  delimiters?: [string, string];

  // 获取命名空间的函数
  getNamespace?: (
    tag: string,
    parent: ElementNode | null,
    ns: Namespaces,
  ) => Namespaces;

  // 判断标签是否为自闭合
  isVoidTag?: (tag: string) => boolean;

  // 判断标签是否为 <pre>
  isPreTag?: (tag: string) => boolean;

  // 判断是否为自定义组件
  isCustomElement?: (tag: string) => boolean;

  // 是否为内置组件
  isBuiltInComponent?: (tag: string) => boolean;

  // 实体解码
  decodeEntities?: (text: string, asAttr: boolean) => string;

  // 错误处理
  onError?: (error: CompilerError) => void;

  // 警告处理
  onWarn?: (warning: CompilerWarning) => void;

  // 是否保留注释
  comments?: boolean;
}
```

## 常见解析场景

### 场景 1: 解析自定义组件

```html
<template>
  <MyComponent :prop="value" @event="handler">
    <template #header>Header</template>
    <template #default>Content</template>
  </MyComponent>
</template>
```

Parser 生成：

```
RootNode
  └─ ElementNode
      tag: 'MyComponent'
      tagType: ElementTypes.COMPONENT
      props: [
        DirectiveNode { name: 'bind', arg: 'prop', exp: 'value' },
        DirectiveNode { name: 'on', arg: 'event', exp: 'handler' }
      ]
      children: [
        ElementNode { tag: 'template', tagType: ElementTypes.TEMPLATE, ... },
        ElementNode { tag: 'template', tagType: ElementTypes.TEMPLATE, ... }
      ]
```

### 场景 2: 解析复杂指令

```html
<input v-model.trim.lazy="message" />
```

Parser 生成：

```
DirectiveNode {
  name: 'model',
  arg: null,
  exp: SimpleExpressionNode { content: 'message' },
  modifiers: [
    SimpleExpressionNode { content: 'trim' },
    SimpleExpressionNode { content: 'lazy' }
  ]
}
```

### 场景 3: 处理 SVG 和 MathML

```html
<svg>
  <circle r="10" />
</svg>

<math>
  <mi>x</mi>
</math>
```

Parser 根据命名空间智能处理，为 SVG/MathML 设置正确的 `ns` 属性。

## 总结

| 概念           | 说明                                        |
| -------------- | ------------------------------------------- |
| **Tokenizer**  | 将模板字符串分解为 Token 流的有限状态自动机 |
| **Parser**     | 将 Token 流转换为 AST 的语法分析器          |
| **栈机制**     | 用于追踪嵌套元素的开闭匹配                  |
| **错误恢复**   | 尽可能继续解析并收集多个错误                |
| **源码位置**   | 每个节点记录在源代码中的精确位置            |
| **指令解析**   | 识别和处理 Vue 指令（v-if、v-for 等）       |
| **插值处理**   | 识别和处理模板插值 `{{ }}`                  |
| **v-pre 支持** | 支持禁用某区域的模板处理                    |

**设计哲学**：Parser 采用分层设计（Tokenizer + Parser），通过状态机和栈机制高效处理复杂的模板结构，同时提供完善的错误恢复和源码追踪能力。
