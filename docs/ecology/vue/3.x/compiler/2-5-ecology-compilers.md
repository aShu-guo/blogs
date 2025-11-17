# 生态编译器扩展 - 多平台编译适配

Vue 3 的编译器体系采用**分层扩展设计**，在 Compiler-core 的基础上，为不同的运行环境和使用场景提供专门优化的编译器。这些生态编译器复用核心逻辑，并添加环境特定的处理。

## 架构设计

### 分层编译器体系

```
使用场景
  ↓
┌─────────────────────────────────┐
│  Compiler-sfc（.vue 单文件）     │
└────────────┬────────────────────┘
             ↓
┌────────────────────────────────────────┐
│         Compiler-dom / Compiler-ssr    │
│      （浏览器 / 服务器渲染特定）        │
└────────────┬────────────────────────────┘
             ↓
┌─────────────────────────────────┐
│     Compiler-core（核心）        │
│  Parser + Transform + Codegen   │
└─────────────────────────────────┘
```

### 编译路径

```
.vue 单文件
  ↓
template/script/style 分割
  ↓ (Compiler-sfc)
template 部分
  ↓
浏览器 or 服务器模式
  ├─ render 函数（浏览器）← Compiler-dom
  └─ HTML 字符串（SSR）  ← Compiler-ssr
    ↓ (Compiler-core)
JavaScript 代码
```

---

## Compiler-dom：浏览器优化编译器

### 职责

Compiler-dom 为浏览器环境优化 Vue 模板编译，处理 DOM 特有的属性和行为。

**核心特性**：
1. **class 属性特殊处理**：智能合并静态和动态 class
2. **style 属性特殊处理**：解析和优化内联样式
3. **HTML 特性识别**：识别原生 HTML 属性和 Vue 属性的区别
4. **事件修饰符**：处理 `.prevent`、`.stop` 等修饰符
5. **表单处理**：v-model 与表单元素的集成

### 主要组件

#### 1. compile 函数

Compiler-dom 导出的主要编译函数：

```typescript
import { baseCompile } from '@vue/compiler-core'

export function compile(
  template: string,
  options: CompilerOptions = {}
): CodegenResult {
  return baseCompile(template, {
    ...options,
    nodeTransforms: [
      transformStyle,              // 处理 style 属性
      ...baseNodeTransforms,       // 基础 transforms
    ],
    directiveTransforms: {
      cloak: transformCloak,       // v-cloak
      ...baseDirectiveTransforms,
    },
  })
}
```

#### 2. class 处理

```typescript
// 输入
<div class="static" :class="{ active: isActive }"></div>

// Compiler-dom 处理
// class 和 :class 合并为单一指令
<div :class="_normalizeClass(['static', { active: isActive }])"></div>

// 生成的代码
_createVNode('div', {
  class: _normalizeClass(['static', { active: _ctx.isActive }])
})
```

#### 3. style 处理

```typescript
// 输入
<div style="color: red" :style="{ fontSize: size }"></div>

// Compiler-dom 处理
// style 和 :style 合并，进行规范化
<div :style="_normalizeStyle([{ color: 'red' }, { fontSize: size }])"></div>

// 生成的代码
_createVNode('div', {
  style: _normalizeStyle([
    { color: 'red' },
    { fontSize: _ctx.size }
  ])
})
```

#### 4. 事件修饰符处理

Compiler-dom 将事件修饰符转换为具体的事件处理逻辑：

```typescript
// 输入
<button @click.prevent.stop="handler">Click</button>

// 转换后
<button @click="(...args) => {
  args[0].preventDefault()
  args[0].stopPropagation()
  handler(...args)
}">Click</button>

// 生成代码
onClick: _cache[0] || (_cache[0] = (...args) => {
  const $event = args[0]
  $event.preventDefault()
  $event.stopPropagation()
  _ctx.handler(...args)
})
```

#### 5. v-model 处理（表单绑定）

Compiler-dom 为不同表单元素提供特殊的 v-model 处理：

```typescript
// 输入（text input）
<input v-model="message" />

// 转换为
<input
  :value="message"
  @input="e => message = e.target.value"
/>

// 输入（checkbox）
<input type="checkbox" v-model="checked" />

// 转换为
<input
  type="checkbox"
  :checked="checked"
  @change="e => checked = e.target.checked"
/>

// 输入（select）
<select v-model="selected">
  <option value="a">A</option>
  <option value="b">B</option>
</select>

// 转换为
<select
  :value="selected"
  @change="e => selected = e.target.value"
>
  <option value="a">A</option>
  <option value="b">B</option>
</select>
```

### 完整编译示例

**输入模板**：
```html
<template>
  <div class="wrapper" :class="{ active: isActive }">
    <input
      type="text"
      v-model="message"
      :style="{ color: inputColor }"
      placeholder="Enter message"
    />
    <button @click.prevent="handleSubmit" style="padding: 10px">
      Submit
    </button>
  </div>
</template>
```

**生成的代码**：
```javascript
import { openBlock as _openBlock, createBlock as _createBlock, createVNode as _createVNode, normalizeClass as _normalizeClass, normalizeStyle as _normalizeStyle, toDisplayString as _toDisplayString } from 'vue'

const _hoisted_1 = { placeholder: 'Enter message' }
const _hoisted_2 = { style: { padding: '10px' } }

export function render(_ctx, _cache, $props, $attrs, $slots, $emit, $options) {
  return _openBlock(), _createBlock('div', {
    class: _normalizeClass(['wrapper', { active: _ctx.isActive }])
  }, [
    _createVNode('input', Object.assign({}, _hoisted_1, {
      value: _ctx.message,
      onInput: _cache[0] || (_cache[0] = $event => (_ctx.message = $event.target.value)),
      style: _normalizeStyle({ color: _ctx.inputColor })
    }), null, 16),
    _createVNode('button', Object.assign({}, _hoisted_2, {
      onClick: _cache[1] || (_cache[1] = ($event) => {
        $event.preventDefault()
        _ctx.handleSubmit()
      })
    }), 'Submit', 1)
  ], 2)
}
```

---

## Compiler-sfc：单文件组件编译器

### 职责

Compiler-sfc 处理 Vue 单文件组件（.vue）的编译，负责解析和编译 template、script、style 部分。

### 架构

```
.vue 文件内容
  ↓ parseSFC()
  ├─ template 块
  ├─ script 块
  ├─ script setup 块（可选）
  ├─ style 块（可能多个）
  └─ 其他块
    ↓ 分别处理
  ├─ 编译 template → render 函数
  ├─ 处理 script / script setup
  ├─ 处理 style（scope CSS）
  └─ 组合结果
    ↓
JavaScript 模块代码
```

### 核心功能

#### 1. SFC 解析

```typescript
interface SFCDescriptor {
  template?: SFCBlock
  script?: SFCBlock
  scriptSetup?: SFCBlock
  styles: SFCStyleBlock[]
  customBlocks: SFCBlock[]
  source: string
  filename: string
  id: string  // 基于文件名的唯一 ID
}

export function parse(
  source: string,
  options: SFCParseOptions = {}
): SFCDescriptor {
  // 正则表达式匹配各个块
  // <template>, <script>, <style> 等
}
```

#### 2. Template 编译

```typescript
// 处理 <template> 块
export function compileTemplate(
  descriptor: SFCDescriptor,
  options: SFCTemplateCompileOptions
): CodegenResult {
  const template = descriptor.template!
  const source = template.content

  // 调用 compiler-dom 编译
  return compile(source, {
    ...options,
    mode: 'module',
    filename: options.filename,
    scopeId: `data-v-${descriptor.id}`,  // 为 scoped CSS 添加 ID
  })
}
```

#### 3. Script 处理

```typescript
// 处理 <script setup> 块
export function compileScript(
  descriptor: SFCDescriptor,
  options: SFCScriptCompileOptions
): CodegenResult {
  if (!descriptor.scriptSetup) {
    return null
  }

  const setupScript = descriptor.scriptSetup!
  const source = setupScript.content

  // 1. 解析 script setup 中的变量声明
  const variables = parseVariables(source)

  // 2. 生成导出对象，包含 template 需要的所有变量
  const exportList = variables.map(v => v.name).join(', ')

  return {
    code: `
      ${source}
      export default { ${exportList} }
    `
  }
}
```

#### 4. Style 处理（Scoped CSS）

```typescript
// 处理 <style> 块
export function compileStyle(
  descriptor: SFCDescriptor,
  options: SFCStyleCompileOptions
): CodegenResult {
  const styleBlocks = descriptor.styles

  return styleBlocks.map((block, index) => {
    let css = block.content

    if (block.scoped) {
      // 为 scoped CSS 添加属性选择器
      const scopeId = `data-v-${descriptor.id}`
      css = rewriteScoped(css, scopeId)
      // 原：.button { color: blue }
      // 变为：.button[data-v-abc123] { color: blue }
    }

    if (block.lang === 'less' || block.lang === 'scss') {
      // 预处理器编译
      css = compileLang(css, block.lang)
    }

    return {
      type: block.type,
      content: css,
      media: block.media,
      scoped: block.scoped,
    }
  })
}
```

### 完整编译示例

**输入 .vue 文件**：
```vue
<template>
  <div class="container">
    <p>{{ message }}</p>
    <button @click="update">Update</button>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const message = ref('Hello')

const update = () => {
  message.value = 'Updated'
}
</script>

<style scoped>
.container {
  padding: 20px;
}
</style>
```

**编译流程**：

1. **解析 SFC**：分离 template、script setup、style
2. **编译 template**：使用 compiler-dom，添加 scopeId
3. **处理 script setup**：提取变量并生成导出
4. **编译 style**：添加 scoped 属性选择器
5. **合并结果**：生成最终的 JavaScript 模块

**生成的代码**：
```javascript
import { openBlock, createBlock, createVNode, toDisplayString, ref } from 'vue'

const _hoisted_1 = { class: 'container' }

const _sfc_main = {
  setup(__props, { expose: __expose }) {
    __expose()

    const message = ref('Hello')

    const update = () => {
      message.value = 'Updated'
    }

    return { message, update }
  }
}

_sfc_main.render = function render(_ctx, _cache, $props, $attrs, $slots, $emit, $options) {
  return openBlock(), createBlock('div', _hoisted_1, [
    createVNode('p', null, toDisplayString(_ctx.message), 1),
    createVNode('button', {
      onClick: _cache[0] || (_cache[0] = (...args) => _ctx.update?.(...args))
    }, 'Update', 1)
  ])
}

_sfc_main.__scopeId = 'data-v-abc123'

_sfc_main.__file = 'App.vue'

export default _sfc_main
```

**生成的样式**：
```css
.container[data-v-abc123] {
  padding: 20px;
}
```

---

## Compiler-ssr：服务端渲染编译器

### 职责

Compiler-ssr 为服务端渲染（SSR）优化，生成字符串拼接形式的渲染函数，而不是 VNode。

### 工作原理

```
SSR 模板
  ↓ 标准编译 + SSR 特定 Transform
  ↓
字符串渲染函数
  ↓ 运行时
HTML 字符串
  ↓
发送到浏览器
```

### 主要区别

#### 标准编译（客户端）

```javascript
// 输入
<div>{{ message }}</div>

// 生成
_createVNode('div', null, _toDisplayString(_ctx.message))
```

#### SSR 编译

```javascript
// 输入
<div>{{ message }}</div>

// 生成
const render = (ctx, push) => {
  push('<div>')
  push(escapeHtml(ctx.message))
  push('</div>')
}
```

### SSR 编译示例

**输入模板**：
```html
<template>
  <div class="app">
    <h1>{{ title }}</h1>
    <ul>
      <li v-for="item in items" :key="item.id">
        {{ item.name }}
      </li>
    </ul>
  </div>
</template>
```

**生成的 SSR 代码**：
```javascript
import { escapeHtml as _escapeHtml, renderList as _renderList } from 'vue'

export function ssrRender(_ctx, _push, _parent, _attrs, ...) {
  _push(`<div class="app"><h1>`)
  _push(_escapeHtml(_ctx.title))
  _push(`</h1><ul>`)

  _renderList(_ctx.items, (item) => {
    _push(`<li>`)
    _push(_escapeHtml(item.name))
    _push(`</li>`)
  })

  _push(`</ul></div>`)
}
```

### SSR 特定处理

#### 1. Hydration

SSR 生成的 HTML 需要被客户端 hydrate（重新激活）：

```typescript
// SSR 生成
<div id="app" data-server-rendered="true">
  <p>Message</p>
</div>

// 客户端 hydrate
app.mount(document.getElementById('app'), { hydrate: true })
```

#### 2. 异步组件处理

SSR 需要处理异步组件的加载：

```typescript
export async function ssrRender(...) {
  const AsyncComponent = await loadComponent()
  // 渲染异步组件
}
```

#### 3. Teleport 处理

SSR 中 Teleport 需要特殊处理：

```typescript
// 标记 teleport 内容的集合位置
const teleportBuffers = {}
const push = createPushFn(teleportBuffers)

// 渲染时收集 teleport 内容
export function ssrRender(..., ssrContext) {
  // ...
  ssrContext.teleportBuffers = teleportBuffers
}
```

---

## 编译选项总结

### Compiler-dom 特有选项

```typescript
{
  // 是否为 scoped CSS 生成属性选择器
  scopeId?: string

  // DOM 特定的配置
  isCustomElement?: (tag: string) => boolean
  isNativeTag?: (tag: string) => boolean
  whitespace?: 'preserve' | 'condense'
}
```

### Compiler-sfc 特有选项

```typescript
{
  // SFC 文件名
  filename?: string

  // 是否处理 script setup
  scriptSetup?: boolean

  // CSS 预处理器
  stylePreprocessor?: Record<string, Function>

  // scoped CSS ID
  scopeId?: string
}
```

### Compiler-ssr 特有选项

```typescript
{
  // SSR 输出目标
  target?: 'node' | 'browser'

  // 是否生成 hydration 代码
  hydrate?: boolean

  // 是否包含异步组件
  async?: boolean
}
```

---

## 常见使用场景

### 场景 1: 浏览器直接编译

```typescript
import { compile } from '@vue/compiler-dom'

const template = '<div>{{ message }}</div>'
const code = compile(template).code
console.log(code)  // 完整的 render 函数
```

### 场景 2: 编译 .vue 文件

```typescript
import { parse, compileTemplate, compileScript, compileStyle } from '@vue/compiler-sfc'

const source = fs.readFileSync('App.vue', 'utf-8')
const descriptor = parse(source)

const template = compileTemplate(descriptor)
const script = compileScript(descriptor)
const styles = compileStyle(descriptor)

// 组合输出
const output = generateModule(template, script, styles)
```

### 场景 3: SSR 编译

```typescript
import { ssrCompile } from '@vue/compiler-ssr'

const template = '<div>{{ message }}</div>'
const code = ssrCompile(template).code

// 生成字符串拼接代码
const render = new Function('ctx', 'push', code)
const html = render({ message: 'Hello' }, chunks)
```

---

## 总结

| 编译器 | 职责 | 优化重点 | 输出形式 |
|-------|------|--------|--------|
| **Compiler-core** | 核心编译逻辑 | 通用优化 | AST + 代码 |
| **Compiler-dom** | 浏览器特定处理 | class、style、events | VNode 代码 |
| **Compiler-sfc** | .vue 文件处理 | 组件集成 | 组件模块 |
| **Compiler-ssr** | 服务端渲染 | HTML 字符串生成 | 字符串代码 |

**设计哲学**：Vue 采用分层编译器设计，Compiler-core 提供通用的编译基础，各个生态编译器在其上进行针对性的扩展和优化，既保证了代码复用，又实现了高度的定制化。这种设计使得 Vue 能够灵活适应浏览器、SSR、IDE 插件等多种使用场景。
