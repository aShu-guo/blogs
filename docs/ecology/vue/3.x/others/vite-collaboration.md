# Vite 与 Vue 协同

## 1. 概念先行：建立心智模型

### 核心问题

Vue 3 的 `.vue` 文件包含 template、script、style 三种不同语法，浏览器无法直接执行。Vite 如何在开发时实现"保存即刷新"，在生产时打包优化？

### 生活化类比

想象一个**翻译工作室**：

- **Vite**：工作室的项目经理，负责接单、分配任务、管理流程
- **@vitejs/plugin-vue**：翻译协调员，识别 `.vue` 文件并拆分任务
- **Vue Compiler**：专业翻译团队，将 template 翻译成 render 函数，将 `<script setup>` 翻译成标准 JS
- **浏览器**：客户，只接受标准的 JavaScript/CSS

当你修改 `.vue` 文件时，协调员会判断：只改了 template？那就只重新翻译 template，script 和 style 复用之前的结果。这就是 **HMR（热模块替换）** 的核心思想。

### 核心流程

```
开发者保存 App.vue
  ↓
Vite 拦截请求 /src/App.vue
  ↓
plugin-vue 调用 compiler.parse() 解析文件
  ├─ template → compiler.compileTemplate() → render 函数
  ├─ script   → compiler.compileScript()   → 标准 JS
  └─ style    → compiler.compileStyle()    → Scoped CSS
  ↓
合并为浏览器可执行的 JS 模块
  ↓
浏览器执行并渲染
```

---

## 2. 最小实现：手写"低配版"

以下是一个 40 行的简化版 Vite Vue 插件，展示核心协同逻辑：

```javascript
// mini-vite-vue-plugin.js
import { parse, compileTemplate, compileScript } from '@vue/compiler-sfc'

export function vuePlugin() {
  const cache = new Map() // 缓存已解析的文件

  return {
    name: 'vite-vue',

    // 处理 .vue 文件请求
    async transform(code, id) {
      if (!id.endsWith('.vue')) return

      // 1. 解析 .vue 文件
      const { descriptor } = parse(code, { filename: id })
      cache.set(id, descriptor)

      // 2. 编译 script
      const script = compileScript(descriptor, { id })

      // 3. 编译 template
      const template = compileTemplate({
        source: descriptor.template.content,
        id,
        scoped: descriptor.styles.some(s => s.scoped)
      })

      // 4. 编译 style
      const styles = descriptor.styles.map(style =>
        `const style = document.createElement('style')
         style.textContent = ${JSON.stringify(style.content)}
         document.head.appendChild(style)`
      ).join('\n')

      // 5. 合并输出
      return `
        ${script.content}
        ${template.code}
        ${styles}
        _sfc_main.render = render
        export default _sfc_main
      `
    }
  }
}
```

**运行效果**：这段代码可以处理简单的 `.vue` 文件，但缺少 HMR、错误处理、缓存优化等生产特性。

---

## 3. 逐行解剖：关键路径分析

### 3.1 编译器加载机制

plugin-vue 需要动态加载项目中的 `vue/compiler-sfc`：

| 源码片段 | 逻辑拆解 |
|---------|---------|
| `const compiler = tryResolveCompiler(root)` | **动态解析**：从项目的 node_modules 中查找 Vue 编译器 |
| `if (vueMeta.version.split('.')[0] >= 3)` | **版本校验**：确保 Vue 版本 >= 3.2.25，避免 API 不兼容 |
| `return tryRequire('vue/compiler-sfc', root)` | **按需加载**：只在需要时加载编译器，减少启动时间 |

### 3.2 SFC 解析与缓存

当 Vite 请求 `/src/App.vue` 时：

```typescript
function createDescriptor(filename, source, { compiler }) {
  // ① 调用 compiler.parse() 解析
  const { descriptor, errors } = compiler.parse(source, {
    filename,
    sourceMap: true
  })

  // ② 生成唯一 ID（用于 Scoped CSS 和 HMR）
  descriptor.id = hash(filename + source)

  // ③ 缓存 descriptor（避免重复解析）
  cache.set(filename, descriptor)

  return { descriptor, errors }
}
```

**SFCDescriptor 结构**：

```typescript
{
  filename: '/src/App.vue',
  script: { content: 'export default { ... }' },
  scriptSetup: { content: 'const count = ref(0)' },
  template: { content: '<div>{{ count }}</div>', ast: {...} },
  styles: [{ content: 'div { color: red }', scoped: true }],
  id: 'abc123'  // 用于生成 data-v-abc123
}
```

### 3.3 请求类型分发

plugin-vue 通过 URL query 参数区分不同的编译需求：

| 请求 URL | 返回内容 | 编译器调用 |
|---------|---------|-----------|
| `/App.vue` | 完整组件（主请求） | 所有编译器 API |
| `/App.vue?type=script` | 编译后的 script | `compileScript()` |
| `/App.vue?type=template` | render 函数 | `compileTemplate()` |
| `/App.vue?type=style&index=0` | 第一个 style 块 | `compileStyle()` |

```typescript
function parseVueRequest(id) {
  const [filename, rawQuery] = id.split('?', 2)
  const query = Object.fromEntries(new URLSearchParams(rawQuery))

  // 根据 query.type 决定调用哪个编译器 API
  if (query.type === 'template') return compileTemplate(...)
  if (query.type === 'style') return compileStyle(...)
  // ...
}
```

### 3.4 Template 编译

```typescript
const result = compiler.compileTemplate({
  source: descriptor.template.content,
  id: descriptor.id,

  // Scoped CSS 支持
  scoped: descriptor.styles.some(s => s.scoped),

  // 资源路径转换（如 <img src="./logo.png">）
  transformAssetUrls: {
    base: '/src/',
    includeAbsolute: true
  },

  // SSR 模式
  ssr: false
})

// 返回：{ code: 'function render() { ... }', errors: [] }
```

| 配置项 | 作用 |
|-------|------|
| `scoped: true` | 为模板中的元素添加 `data-v-abc123` 属性 |
| `transformAssetUrls` | 将相对路径转换为 Vite 可处理的模块导入 |
| `ssr: true` | 生成服务端渲染代码（返回字符串而非 VNode） |

### 3.5 Script 编译

处理 `<script setup>` 的魔法：

```typescript
const script = compiler.compileScript(descriptor, {
  id: descriptor.id,

  // 内联 template（避免额外请求）
  inlineTemplate: true,

  // 传递 template 的绑定信息（用于类型推断）
  templateOptions: {
    ast: descriptor.template.ast,
    bindingMetadata: {...}
  }
})
```

**编译前后对比**：

```vue
<!-- 编译前 -->
<script setup>
import { ref } from 'vue'
const count = ref(0)
defineProps({ msg: String })
</script>

<!-- 编译后 -->
<script>
import { ref, defineComponent } from 'vue'
export default defineComponent({
  props: { msg: String },
  setup(__props) {
    const count = ref(0)
    return { count }
  }
})
</script>
```

### 3.6 Style 编译

```typescript
const result = await compiler.compileStyle({
  source: descriptor.styles[0].content,
  filename: '/src/App.vue',
  id: `data-v-${descriptor.id}`,

  // Scoped CSS：为所有选择器添加属性选择器
  scoped: true,

  // CSS Modules
  modules: descriptor.styles[0].module,

  // 预处理器（less/sass/stylus）
  preprocessLang: 'scss'
})
```

**Scoped CSS 转换**：

```css
/* 编译前 */
div { color: red; }

/* 编译后 */
div[data-v-abc123] { color: red; }
```

---

## 4. 细节补充：边界与性能优化

### 4.1 缓存策略

plugin-vue 使用三层缓存：

```typescript
const cache = new Map()      // 主缓存（生产构建）
const hmrCache = new Map()   // HMR 缓存（开发时）
const prevCache = new Map()  // 前一版本缓存（用于对比）
```

| 缓存类型 | 使用场景 | 失效时机 |
|---------|---------|---------|
| `cache` | 生产构建时复用 descriptor | 构建完成后清空 |
| `hmrCache` | 开发时快速获取当前版本 | 文件修改时更新 |
| `prevCache` | HMR 时对比新旧版本 | 下次 HMR 时覆盖 |

### 4.2 HMR 精确更新

当你修改 `.vue` 文件时，plugin-vue 会对比新旧 descriptor：

```typescript
async function handleHotUpdate({ file, read }) {
  const prevDescriptor = hmrCache.get(file)
  const content = await read()
  const { descriptor } = createDescriptor(file, content)

  const affectedModules = new Set()

  // ① 仅 template 变化 → 只重新渲染
  if (!isEqual(descriptor.template, prevDescriptor.template)) {
    affectedModules.add(templateModule)
    // 复用之前的 script 解析结果
    descriptor.script = prevDescriptor.script
  }

  // ② script 变化 → 重新加载整个组件
  if (!isEqual(descriptor.script, prevDescriptor.script)) {
    affectedModules.add(mainModule)
  }

  // ③ style 变化 → 只更新样式
  descriptor.styles.forEach((style, i) => {
    if (!isEqual(style, prevDescriptor.styles[i])) {
      affectedModules.add(styleModules[i])
    }
  })

  return [...affectedModules]
}
```

**HMR 流程图**：

```
修改 template
  ↓
plugin-vue 检测到变化
  ↓
对比 descriptor.template
  ↓
仅重新编译 template
  ↓
浏览器调用 __VUE_HMR_RUNTIME__.rerender()
  ↓
组件重新渲染（保持状态）
```

### 4.3 AST 复用优化

Vue 3.3+ 支持 AST 复用，避免重复解析：

```typescript
const templateOptions = {
  source: descriptor.template.content,

  // 传递上次解析的 AST（如果编译器版本支持）
  ast: canReuseAST(compiler.version)
    ? descriptor.template.ast
    : undefined
}
```

**性能提升**：在 HMR 时，如果 template 内容未变化，直接复用 AST 可节省 30-50% 的编译时间。

### 4.4 错误处理

将 Vue 编译器错误转换为 Vite 可识别的格式：

```typescript
function createRollupError(filename, error) {
  return {
    id: filename,
    plugin: 'vue',
    message: error.message,

    // 提取错误位置（用于在编辑器中高亮）
    loc: {
      file: filename,
      line: error.loc.start.line,
      column: error.loc.start.column
    }
  }
}
```

**效果**：在浏览器和终端中显示精确的错误位置。

### 4.5 边界情况

| 场景 | 处理方式 |
|-----|---------|
| 没有 template | 只编译 script 和 style |
| 没有 script | 生成默认的空组件 `export default {}` |
| 多个 style 块 | 按 index 顺序分别编译并注入 |
| 自定义块（如 `<docs>`） | 通过 `customBlocks` 暴露给用户自定义处理 |
| 循环依赖 | 使用 WeakMap 避免内存泄漏 |

---

## 5. 总结与延伸

### 一句话总结

**plugin-vue 是 Vite 和 Vue Compiler 之间的"翻译协调员"，负责请求分发、缓存管理和 HMR 优化，而真正的编译工作由 Vue Compiler 完成。**

### 核心设计理念

| 模块 | 职责 |
|-----|------|
| **Vite** | 开发服务器、模块热替换、生产构建 |
| **plugin-vue** | 拦截 `.vue` 请求、管理缓存、实现 HMR |
| **Vue Compiler** | 解析 SFC、编译 template/script/style |

### 面试考点

1. **Vite 如何处理 `.vue` 文件？**
   - 通过 `@vitejs/plugin-vue` 拦截请求，调用 `vue/compiler-sfc` 编译

2. **HMR 如何实现精确更新？**
   - 对比新旧 descriptor 的各个块，只更新变化的部分

3. **为什么 Vite 比 Webpack 快？**
   - 开发时按需编译（不打包），利用浏览器原生 ESM
   - 生产时使用 Rollup 打包，tree-shaking 更彻底

4. **Scoped CSS 的原理？**
   - 编译时为元素添加 `data-v-xxx` 属性，CSS 选择器添加对应的属性选择器

5. **`<script setup>` 如何编译？**
   - `compiler.compileScript()` 将其转换为标准的 `setup()` 函数，处理 `defineProps` 等宏

### 延伸阅读

- **Vue Compiler 深入**：了解 template 如何编译为 render 函数（transform 流程）
- **Vite 插件机制**：学习如何编写自定义 Vite 插件
- **Rollup 打包原理**：理解生产构建的优化策略
- **浏览器 ESM**：掌握 `import.meta.hot` 和动态导入的原理
