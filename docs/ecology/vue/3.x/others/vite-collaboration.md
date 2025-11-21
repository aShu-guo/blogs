# Vite 与 Vue 协同

介绍 @vitejs/plugin-vue 与 Vue Compiler 的协同

## 核心协同流程

```
Vite 构建系统
  ↓
@vitejs/plugin-vue (Vite 插件)
  ├─ 解析 .vue 文件请求
  ├─ 调用 vue/compiler-sfc
  │  ├─ compiler.parse() - 解析 SFC 文件
  │  ├─ compiler.compileTemplate() - 编译 template
  │  ├─ compiler.compileStyle() - 编译 style
  │  └─ compiler.compileScript() - 编译 script
  └─ 生成可执行的 JavaScript 代码
     ↓
浏览器执行
```

## 1. 编译器加载机制

plugin-vue 需要从项目的依赖中加载 Vue 的 compiler-sfc 模块。

```typescript
// @vitejs/plugin-vue 的编译器解析逻辑
function resolveCompiler(root) {
  const compiler = tryResolveCompiler(root) || tryResolveCompiler();
  if (!compiler) {
    throw new Error(
      `Failed to resolve vue/compiler-sfc.
@vitejs/plugin-vue requires vue (>=3.2.25) to be present in the dependency tree.`,
    );
  }
  return compiler;
}

function tryResolveCompiler(root) {
  const vueMeta = tryRequire('vue/package.json', root);
  // 检查 Vue 版本 >= 3
  if (vueMeta && vueMeta.version.split('.')[0] >= 3) {
    // 动态加载 vue/compiler-sfc
    return tryRequire('vue/compiler-sfc', root);
  }
}
```

**关键点**：

- 动态解析 `vue/compiler-sfc` 模块
- 验证 Vue 版本 \>= 3.2.25
- 支持自定义编译器版本（通过 options.compiler）

## 2. SFC 解析与缓存

当 Vite 请求一个 .vue 文件时，plugin-vue 首先解析该文件。

```typescript
// 创建 SFC 描述符（Descriptor）
function createDescriptor(
  filename,
  source,
  { compiler, sourceMap },
  hmr = false,
) {
  // ① 调用 compiler.parse() 解析 .vue 文件
  const { descriptor, errors } = compiler.parse(source, {
    filename,
    sourceMap,
    templateParseOptions: template?.compilerOptions,
  });

  // ② 生成组件 ID（唯一标识）
  descriptor.id = getHash(normalizedPath + (isProduction ? source : ''));

  // ③ 缓存 descriptor（避免重复解析）
  cache.set(filename, descriptor);

  return { descriptor, errors };
}
```

**compiler.parse\(\) 的职责**：

- 将 .vue 文件分解为 script、template、style 块
- 返回 SFCDescriptor 对象（包含所有块的信息）
- 返回解析错误列表

**SFCDescriptor 结构**：

```typescript
interface SFCDescriptor {
  filename: string; // 文件路径
  source: string; // 原始源代码
  script: SFCScriptBlock | null; // <script> 块
  scriptSetup: SFCScriptBlock | null; // <script setup> 块
  template: SFCTemplateBlock | null; // <template> 块
  styles: SFCStyleBlock[]; // <style> 块数组
  customBlocks: SFCBlock[]; // 自定义块
  cssVars: string[]; // CSS 变量列表
  id: string; // 组件唯一 ID
}
```

## 3. Template 编译

当请求 template 相关资源时，调用 `compiler.compileTemplate()`。

```typescript
// plugin-vue 中编译 template 的流程
function compile(code, descriptor, options, pluginContext, ssr, customElement) {
  const filename = descriptor.filename;

  // ① 先处理 script
  resolveScript(descriptor, options, ssr, customElement);

  // ② 调用 compiler.compileTemplate() 编译 template
  const result = options.compiler.compileTemplate({
    ...resolveTemplateCompilerOptions(descriptor, options, ssr),
    source: code,
  });

  // ③ 处理编译错误和警告
  if (result.errors.length) {
    result.errors.forEach((error) =>
      pluginContext.error(createRollupError(filename, error)),
    );
  }

  if (result.tips.length) {
    result.tips.forEach((tip) =>
      pluginContext.warn({ id: filename, message: tip }),
    );
  }

  return result;
}

// 准备 template 编译选项
function resolveTemplateCompilerOptions(descriptor, options, ssr) {
  return {
    id: descriptor.id,
    filename: descriptor.filename,
    source: descriptor.template.source,
    ast: descriptor.template.ast,

    // Scoped CSS 相关
    scoped: descriptor.styles.some((s) => s.scoped),
    cssVars: descriptor.cssVars,

    // Asset URLs 转换
    transformAssetUrls: {
      base: devBase + '/' + path.relative(root, path.dirname(filename)),
      includeAbsolute: true,
    },

    // 预处理器选项（如 pug、stylus）
    preprocessLang: descriptor.template.lang,

    // SSR 模式
    ssr: ssr,

    // 其他编译器选项
    ...options.template?.compilerOptions,
  };
}
```

**compiler.compileTemplate() 的职责**：

- 编译 Vue template 为 render 函数
- 处理指令（v-if、v-for 等）
- 处理动态内容和表达式
- 支持 SSR 模式编译

**返回结果**：

```typescript
interface TemplateCompileResult {
  code: string; // 生成的 JavaScript 代码
  ast: TemplateAST; // 模板 AST
  preamble: string; // 前置代码（导入语句等）
  errors: string[]; // 编译错误列表
  tips: string[]; // 编译提示列表
}
```

## 4. Style 编译与处理

处理 \<style\> 块的编译。

```typescript
// plugin-vue 中处理 style 的流程
async function transformStyle(
  code,
  descriptor,
  index,
  options,
  filename,
  devServer,
) {
  const blockOptions = descriptor.styles[index];

  // ① 确定是否为 scoped CSS
  const isScoped = blockOptions.scoped;

  // ② 调用 compiler.compileStyle() 编译 style
  const result = await options.compiler.compileStyle({
    source: code,
    filename: filename + `?vue&type=style&index=${index}`,
    id: `data-v-${descriptor.id}`,
    scoped: isScoped,
    modules: blockOptions.module,
    preprocessLang: blockOptions.lang,
    postcssOptions: options.postcssOptions,
    inMap: blockOptions.map,
    postcssPlugins: options.postcssPlugins,
    preprocessCustomRequire: options.preprocessCustomRequire,
  });

  return result;
}
```

**compiler.compileStyle() 的职责**：

- 处理 CSS 预处理器（Less、Sass 等）
- 生成 Scoped CSS（添加 data-v-xxx 属性）
- 处理 CSS Modules
- Source map 生成

## 5. Script 编译

处理 \<script\> 和 \<script setup\> 块。

```typescript
// plugin-vue 中处理 script 的流程
function resolveScript(descriptor, options, ssr, customElement) {
  // 获取 script 或 scriptSetup 块
  let resolvedScript = descriptor.script;

  // 如果有 <script setup>，调用 compiler.compileScript()
  if (descriptor.scriptSetup) {
    resolvedScript = options.compiler.compileScript(descriptor, {
      inlineTemplate: true,
      templateOptions: resolveTemplateCompilerOptions(descriptor, options),
      sourceMap: options.sourceMap,
      ssr: ssr,
      customElement: customElement,
    });
  }

  return resolvedScript;
}
```

**compiler.compileScript() 的职责**：

- 编译 `<script setup>` 语法
- 处理 `defineProps`、`defineEmits` 等宏
- 转换为标准 Vue 3 代码
- 进行模板内联（如果需要）

## 6. 请求类型处理

plugin-vue 通过 query 参数区分不同的编译需求。

```typescript
// 解析 Vue 请求的 query 参数
function parseVueRequest(id) {
  const [filename, rawQuery] = id.split('?', 2);
  const query = Object.fromEntries(new URLSearchParams(rawQuery));
  return { filename, query };
}

// 不同的请求类型
// ① /App.vue - 主请求，返回完整组件
// ② /App.vue?vue&type=script - 获取 script 块
// ③ /App.vue?vue&type=template - 获取 template 块
// ④ /App.vue?vue&type=style&index=0 - 获取指定 style 块
// ⑤ /App.vue?vue&type=custom - 获取自定义块
```

**query 参数说明**：

```typescript
interface VueQuery {
  vue?: boolean; // 标记为 Vue 请求
  type?: 'script' | 'template' | 'style' | 'custom';
  index?: number; // style 块索引
  lang?: string; // 语言类型（jsx、ts、less 等）
  raw?: boolean; // 返回原始源代码
  url?: boolean; // 返回 URL
  scoped?: boolean; // 是否为 scoped style
  id?: string; // 组件 ID
}
```

## 7. 完整编译流程示例

```typescript
// 用户的 .vue 文件
// App.vue
<template>
  <div>{{ message }}</div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
const message = ref('Hello')
</script>

<style scoped>
div { color: red; }
</style>

// ========== 编译流程 ==========

// 步骤 1: 解析文件
Vite 请求 /src/App.vue
  ↓
plugin-vue 拦截请求
  ↓
compiler.parse(source)
  → 提取 template、script、style 块
  → 生成 SFCDescriptor
  → 缓存 descriptor

// 步骤 2: 编译 template
Vite 请求 /src/App.vue?type=template
  ↓
plugin-vue 从缓存获取 descriptor
  ↓
compiler.compileTemplate({
  source: '<div>{{ message }}</div>',
  scoped: true,
  id: 'data-v-abc123'
})
  → 生成 render 函数
  → 处理响应式绑定
  → 返回编译代码

// 步骤 3: 编译 script
compiler.compileScript(descriptor, {
  inlineTemplate: true
})
  → 编译 <script setup>
  → 处理 defineProps/defineEmits
  → 返回标准 Vue 代码

// 步骤 4: 编译 style
compiler.compileStyle({
  source: 'div { color: red; }',
  scoped: true,
  id: 'data-v-abc123'
})
  → 生成 Scoped CSS
  → 处理预处理器
  → 返回 CSS 代码

// 步骤 5: 合并所有块
最终代码 =
  import { defineComponent } from 'vue'
  import { compileTemplate } from '@vue/compiler-sfc'

  const script = { ... }  // 编译后的 script
  const render = function() { ... }  // 编译后的 template

  export default {
    ...script,
    render,
    __scopeId: 'data-v-abc123'  // Scoped 标识
  }
```

## 8. 缓存机制

plugin-vue 使用多层缓存提高性能。

```typescript
// 缓存策略
const cache = new Map(); // 主缓存（用于静态构建）
const hmrCache = new Map(); // HMR 缓存（用于开发时热更新）
const prevCache = new Map(); // 前一版本缓存（用于对比更新）

// 缓存 descriptor
function getDescriptor(filename, options, createIfNotFound = true) {
  if (cache.has(filename)) {
    return cache.get(filename); // 从缓存返回
  }

  if (createIfNotFound) {
    const { descriptor, errors } = createDescriptor(
      filename,
      fs.readFileSync(filename, 'utf-8'),
      options,
    );
    return descriptor;
  }
}

// 当文件变更时，使缓存失效
function invalidateDescriptor(filename) {
  const prev = cache.get(filename);
  cache.delete(filename);
  if (prev) {
    prevCache.set(filename, prev); // 保存前一版本用于 HMR
  }
}
```

## 9. 热更新（HMR）机制

### HMR 的完整流程

当文件变更时，Vite 会调用 plugin-vue 的 `handleHotUpdate()` 钩子。

```typescript
// plugin-vue 的 HMR 处理流程
async function handleHotUpdate({ file, modules, read }, options) {
  // ① 获取前一版本的 descriptor（从 HMR 缓存）
  const prevDescriptor = getDescriptor(file, options, false, true)
  if (!prevDescriptor) {
    return  // 第一次加载，无需 HMR
  }

  // ② 读取新文件内容并创建新 descriptor
  const content = await read()
  const { descriptor } = createDescriptor(file, content, options, true)

  // ③ 对比新旧 descriptor 的各个块
  let needRerender = false
  const affectedModules = new Set()

  // 解析新 script
  resolveScript(descriptor, options, false)

  // 检测 script 是否变化
  const scriptChanged = hasScriptChanged(prevDescriptor, descriptor)
  if (scriptChanged) {
    affectedModules.add(getScriptModule(modules) || mainModule)
  }

  // 检测 template 是否变化
  if (!isEqualBlock(descriptor.template, prevDescriptor.template)) {
    if (!scriptChanged) {
      // 仅 template 变化，复用之前的 script 解析结果
      setResolvedScript(
        descriptor,
        getResolvedScript(prevDescriptor, false),
        false
      )
    }
    affectedModules.add(templateModule)
    needRerender = true
  }

  // 检测 style 是否变化
  let didUpdateStyle = false
  for (let i = 0; i < nextStyles.length; i++) {
    const prev = prevStyles[i]
    const next = nextStyles[i]
    if (!prev || !isEqualBlock(prev, next)) {
      didUpdateStyle = true
      affectedModules.add(styleModules[i])
    }
  }

  // 返回需要更新的模块
  return [...affectedModules].filter(Boolean)
}
```

### HMR 缓存策略

plugin-vue 维护三层缓存来支持热更新：

```typescript
// 三层缓存
const cache = new Map()           // 主缓存（生产构建）
const hmrCache = new Map()        // HMR 缓存（开发时）
const prevCache = new Map()       // 前一版本缓存（用于对比）

// HMR 时的缓存操作流程
function invalidateDescriptor(filename, hmr = false) {
  const _cache = hmr ? hmrCache : cache

  // ① 获取当前缓存的 descriptor
  const prev = _cache.get(filename)

  // ② 删除当前缓存
  _cache.delete(filename)

  // ③ 保存为前一版本（用于下次 HMR 对比）
  if (prev) {
    prevCache.set(filename, prev)
  }
}

// HMR 开始时，从 HMR 缓存获取前一版本
const prevDescriptor = getDescriptor(
  filename,
  options,
  false,  // 不创建新的
  true    // 使用 HMR 缓存
)

// 解析新文件后，保存到 HMR 缓存
const { descriptor } = createDescriptor(
  filename,
  content,
  options,
  true    // 标记为 HMR 操作
)
```

### 对比逻辑

plugin-vue 通过对比 descriptor 的各个块来决定是否需要重新渲染：

```typescript
// ① 比较两个块是否相等
function isEqualBlock(a, b) {
  // 都为空
  if (!a && !b) return true

  // 一个为空，另一个不为空
  if (!a || !b) return false

  // 两个都有 src 属性且相同
  if (a.src && b.src && a.src === b.src) return true

  // 比较内容
  if (a.content !== b.content) return false

  // 比较属性（lang、scoped 等）
  const keysA = Object.keys(a.attrs)
  const keysB = Object.keys(b.attrs)
  if (keysA.length !== keysB.length) return false

  return keysA.every(key => a.attrs[key] === b.attrs[key])
}

// ② 比较 script 是否变化
function hasScriptChanged(prev, next) {
  const prevScript = getResolvedScript(prev, false)
  const nextScript = getResolvedScript(next, false)

  // 比较 <script> 块内容
  if (!isEqualBlock(prev.script, next.script)) {
    // 进一步比较 AST（忽略位置信息）
    if (!isEqualAst(prevScript?.scriptAst, nextScript?.scriptAst)) {
      return true
    }
  }

  // 比较 <script setup> 块内容
  if (!isEqualBlock(prev.scriptSetup, next.scriptSetup)) {
    if (!isEqualAst(prevScript?.scriptSetupAst, nextScript?.scriptSetupAst)) {
      return true
    }
  }

  return false
}

// ③ 比较 AST（深度比较，忽略位置信息）
function isEqualAst(prev, next) {
  if (typeof prev === 'undefined' || typeof next === 'undefined') {
    return prev === next
  }

  if (prev.length !== next.length) return false

  for (let i = 0; i < prev.length; i++) {
    if (!deepEqual(prev[i], next[i], [
      'start', 'end', 'loc',        // 位置信息
      'range', 'leadingComments',   // 注释信息
      'trailingComments',
      '_ownerScope',                // TypeScript 内部属性
      '_resolvedReference'
    ])) {
      return false
    }
  }

  return true
}
```

### 受影响的模块判断

根据哪些块变化，plugin-vue 决定哪些模块需要重新加载：

```typescript
// ① template 变化
if (!isEqualBlock(descriptor.template, prevDescriptor.template)) {
  affectedModules.add(templateModule)  // template 模块需要重新编译
  needRerender = true
}

// ② script 变化
const scriptChanged = hasScriptChanged(prevDescriptor, descriptor)
if (scriptChanged) {
  affectedModules.add(getScriptModule(modules) || mainModule)
  // 如果 script 变化，template 的 binding metadata 也需要更新
}

// ③ style 变化
for (let i = 0; i < nextStyles.length; i++) {
  const prev = prevStyles[i]
  const next = nextStyles[i]
  if (!prev || !isEqualBlock(prev, next)) {
    didUpdateStyle = true
    // 找到对应的 style 模块并添加
    const styleModule = modules.find(
      m => m.url.includes(`type=style&index=${i}`)
    )
    if (styleModule) {
      affectedModules.add(styleModule)
    }
  }
}

// ④ CSS 变量变化（影响主模块）
if (prevDescriptor.cssVars.join('') !== descriptor.cssVars.join('')) {
  affectedModules.add(mainModule)
}

// ⑤ Scoped 属性变化（同时影响 template 和 script）
if (prevStyles.some(s => s.scoped) !== nextStyles.some(s => s.scoped)) {
  affectedModules.add(templateModule)
  affectedModules.add(mainModule)
}
```

### HMR 时的代码生成

plugin-vue 在编译代码时会添加 HMR 相关的运行时钩子：

```typescript
// 在编译 template 时添加 HMR 代码
let code = result.code  // 编译后的 render 函数

// 如果是开发环境且 HMR 启用，添加 HMR 接收逻辑
if (devServer && devServer.config.server.hmr !== false && !ssr && !isProduction) {
  code += `
import.meta.hot.accept(({ render }) => {
  __VUE_HMR_RUNTIME__.rerender(${JSON.stringify(descriptor.id)}, render)
})
`
}
```

### 主模块的 HMR 处理

```typescript
// 生成的最终组件代码中包含：
const output = [
  // ① 组件定义
  `const _sfc_main = { ... }`,

  // ② 设置 HMR ID
  `_sfc_main.__hmrId = ${JSON.stringify(descriptor.id)}`,

  // ③ 创建 HMR 记录
  `typeof __VUE_HMR_RUNTIME__ !== 'undefined' && __VUE_HMR_RUNTIME__.createRecord(_sfc_main.__hmrId, _sfc_main)`,

  // ④ 处理 template 更新
  `import.meta.hot.on('vite:beforeUpdate', (update) => {
    if (update.type === 'template') {
      __VUE_HMR_RUNTIME__.rerender(_sfc_main.__hmrId, updated.render)
    }
  })`,

  // ⑤ 处理 script 更新
  `import.meta.hot.on('vite:beforeUpdate', (update) => {
    if (update.type === 'script') {
      __VUE_HMR_RUNTIME__.reload(_sfc_main.__hmrId, updated)
    }
  })`
]
```

### HMR 流程图

```
文件变更
  ↓
Vite 监听到 .vue 文件变化
  ↓
触发 plugin-vue.handleHotUpdate()
  ↓
① 从 hmrCache 获取 prevDescriptor
② 读取新文件内容
③ 创建新 descriptor
  ↓
④ 对比各个块（template、script、style）
  ├─ Template 变化？→ 添加 templateModule
  ├─ Script 变化？ → 添加 scriptModule
  └─ Style 变化？ → 添加 styleModules
  ↓
⑤ 判断是否需要重新渲染
  ├─ 仅 template 变化 → rerender
  ├─ Script 变化 → reload 整个组件
  └─ Style 变化 → 只更新样式
  ↓
⑥ 返回受影响的模块列表
  ↓
Vite HMR 系统
  ├─ 发送模块更新消息到浏览器
  └─ 执行 import.meta.hot.accept() 或 import.meta.hot.invalidate()
     ↓
⑦ 浏览器端 HMR Runtime
  ├─ 调用 __VUE_HMR_RUNTIME__.rerender()（仅 template）
  └─ 调用 __VUE_HMR_RUNTIME__.reload()（完整重载）
     ↓
⑧ 组件热更新完成，保持应用状态
```

### HMR 的特殊情况

```typescript
// ① 仅 template 变化，且 script 未变化
if (!isEqualBlock(descriptor.template, prevDescriptor.template)) {
  if (!scriptChanged) {
    // 复用前一版本的已解析 script
    setResolvedScript(
      descriptor,
      getResolvedScript(prevDescriptor, false),
      false
    )
    // 这样可以避免重新编译 script，提高更新效率
  }
}

// ② Script 中的导入变化，可能影响 template 的类型推断
const prevImports = prevResolvedScript?.imports
if (prevImports) {
  return !next.template || next.shouldForceReload(prevImports)
}

// ③ 新增 style 块
if (prevStyles.length < nextStyles.length) {
  // 新增的 style，需要加载新模块
  affectedModules.add(mainModule)
}

// ④ 删除 style 块
if (prevStyles.length > nextStyles.length) {
  // 删除的 style，需要更新主模块
  affectedModules.add(mainModule)
}
```


## 10. 自定义编译器选项

用户可以通过 plugin-vue 的 options 自定义 compile module 的行为。

```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
  plugins: [
    vue({
      // 自定义 template 编译选项
      template: {
        compilerOptions: {
          isCustomElement: (tag) => tag.startsWith('ion-'),
        },
        transformAssetUrls: {
          video: ['src', 'poster'],
          source: 'src',
          img: 'src',
        },
      },

      // 自定义 script 编译选项
      script: {
        refTransform: true,
      },

      // 自定义 style 编译选项
      style: {
        postcssPlugins: [require('autoprefixer')],
      },

      // 使用指定版本的编译器
      compiler: require('@vue/compiler-sfc'),

      // 特性开关
      features: {
        propsDestructure: true,
        customElement: /\.ce\.vue$/,
        optionsAPI: true,
      },
    }),
  ],
});
```

## 10. 编译器版本兼容性

plugin-vue 与不同版本的 Vue compiler-sfc 的协同。

```typescript
// 版本检查
function canReuseAST(compilerVersion) {
  // 只有 Vue 3.3+ 生成的 AST 才能复用
  const majorVersion = parseInt(compilerVersion.split('.')[0]);
  const minorVersion = parseInt(compilerVersion.split('.')[1]);

  return majorVersion > 3 || (majorVersion === 3 && minorVersion >= 3);
}

// 如果编译器版本支持 AST 复用，传递给下次编译以加速
const templateOptions = {
  ...options.template,
  ast: canReuseAST(options.compiler.version)
    ? descriptor.template?.ast
    : undefined,
};
```

## 11. 错误处理与诊断

plugin-vue 如何与 compiler 协同处理错误。

```typescript
// 将 compiler 错误转换为 Rollup 错误
function createRollupError(id, error) {
  const { message, name, stack } = error;
  const rollupError = {
    id,
    plugin: 'vue',
    message,
    name,
    stack,
  };

  // 提取位置信息
  if ('code' in error && error.loc) {
    rollupError.loc = {
      file: id,
      line: error.loc.start.line,
      column: error.loc.start.column,
    };
  }

  return rollupError;
}

// 处理编译结果中的错误和警告
if (result.errors.length) {
  result.errors.forEach((error) =>
    pluginContext.error(
      typeof error === 'string'
        ? { id: filename, message: error }
        : createRollupError(filename, error),
    ),
  );
}

if (result.tips.length) {
  result.tips.forEach((tip) =>
    pluginContext.warn({ id: filename, message: tip }),
  );
}
```

## 总结

| 环节         | plugin-vue 职责                | compiler 职责                            |
| ------------ | ------------------------------ | ---------------------------------------- |
| **加载**     | 动态解析 vue/compiler-sfc 模块 | 提供编译器实例                           |
| **解析**     | 拦截 .vue 请求，调用 parse()   | 解析 .vue 文件为 descriptor              |
| **Template** | 缓存 descriptor，传递编译选项  | 编译模板为 render 函数                   |
| **Script**   | 处理请求路由                   | 编译 <span v-pre>`<script setup>`</span> |
| **Style**    | 处理 CSS 相关请求              | 处理预处理器和 Scoped CSS                |
| **缓存**     | 多层缓存策略                   | 支持 AST 复用优化                        |
| **错误**     | 转换为 Vite 错误格式           | 提供详细错误信息                         |
| **HMR**      | 对比前后 descriptor，判断更新   | 支持 AST 对比优化                        |

**核心设计理念**：plugin-vue 是一个轻量级的**请求分发器和缓存管理器**，它将具体的编译工作委托给 Vue 的 compile module，自己负责：

- 动态加载 compile module
- 管理文件缓存（主缓存、HMR 缓存、前版本缓存）
- 处理请求路由
- 转换错误格式
- 实现热更新机制（HMR）
- 集成 Vite 开发体验
