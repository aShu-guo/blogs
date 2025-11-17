# Vue 3 内置指令、简写及修饰符对照表

本文档整理了 Vue 3 的所有内置指令、简写规则、可用修饰符及其行为说明，统一团队内部使用规范，便于查阅与培训。

## 1. Vue3 内置指令一览表

| 指令          | 简写 | 支持表达式 | 支持修饰符 | 说明                             | 示例                          |
| ------------- | ---- | ---------- | ---------- | -------------------------------- | ----------------------------- |
| **v-bind**    | `:`  | ✔         | ✔         | 绑定 attribute / prop            | `:src="url"`                  |
| **v-on**      | `@`  | ✔         | ✔         | 注册事件监听器                   | `@click="handleClick"`        |
| **v-model**   | 无   | ✔         | ✔         | 双向绑定、支持具名 `v-model:xxx` | `v-model="value"`             |
| **v-if**      | 无   | ✔         | ✘          | 条件渲染                         | `v-if="visible"`              |
| **v-else**    | 无   | ✘          | ✘          | `v-if` 的 fallback 分支          | `v-else`                      |
| **v-else-if** | 无   | ✔         | ✘          | `v-if` 的 else-if 分支           | `v-else-if="cond"`            |
| **v-show**    | 无   | ✔         | ✘          | 基于 CSS display 控制显示        | `v-show="visible"`            |
| **v-for**     | 无   | ✔         | ✘          | 列表渲染                         | `v-for="item in list"`        |
| **v-once**    | 无   | ✘          | ✘          | 节点仅渲染一次                   | `<div v-once>`                |
| **v-memo**    | 无   | ✔         | ✘          | 手动缓存子树（3.2+）             | `v-memo="[a, b]"`             |
| **v-pre**     | 无   | ✘          | ✘          | 跳过编译                         | `<div v-pre>{{ raw }}</div>`  |
| **v-html**    | 无   | ✔         | ✘          | 渲染 HTML 字符串                 | `v-html="htmlStr"`            |
| **v-text**    | 无   | ✔         | ✘          | 设置文本内容                     | `v-text="msg"`                |
| **v-cloak**   | 无   | ✘          | ✘          | 配合 CSS 避免闪烁                | `[v-cloak] { display: none }` |
| **v-slot**    | `#`  | ✔         | ✔         | 插槽声明（含具名、作用域插槽）   | `<template #default>`         |

## 2. 简写规则（统一团队代码风格）

| 指令     | 简写规则 | 示例                 | 说明                 |
| -------- | -------- | -------------------- | -------------------- |
| `v-bind` | `:`      | `:class="cls"`       | 应用于所有绑定       |
| `v-on`   | `@`      | `@click="fn"`        | 事件监听优先使用简写 |
| `v-slot` | `#`      | `<template #header>` | 具名插槽统一使用 `#` |

> **团队规范建议**：项目中必须统一使用简写，不混用长写法。

## 3. v-model 修饰符与用法说明

Vue3 支持多种 v-model 形式，包括具名、带修饰符、多 model。

### 3.1 v-model 形态总览

| 写法              | 功能说明              | 示例                                  |
| ----------------- | --------------------- | ------------------------------------- |
| `v-model`         | 默认绑定 `modelValue` | `<Comp v-model="value" />`            |
| `v-model:arg`     | 具名 model            | `<Comp v-model:title="title" />`      |
| `v-model.xxx`     | 修饰符                | `<input v-model.trim="msg" />`        |
| `v-model:arg.xxx` | 具名 + 修饰符         | `<Comp v-model:title.lazy="title" />` |

### 3.2 修饰符列表

| 修饰符    | 含义                     | 示例                   |
| --------- | ------------------------ | ---------------------- |
| `.lazy`   | 在 `change` 事件后同步值 | `v-model.lazy="msg"`   |
| `.trim`   | 输入去除空格             | `v-model.trim="msg"`   |
| `.number` | 自动转数值               | `v-model.number="age"` |

## 4. v-bind 修饰符（Binding Modifiers）

| 修饰符 | 作用 | 示例 | 说明 |
|--------|------|------|------|
| `.camel` | 属性名转换 | `:my-prop.camel="val"` | 将 kebab-case 转为 camelCase（用于 Web Components、SVG） |
| `.prop` | 绑定为 property | `:value.prop="val"` | 绑定为 DOM 对象属性而非 HTML 特性（如：`el.value`） |
| `.attr` | 绑定为 attribute | `:data-id.attr="id"` | 显式绑定为 HTML 特性（如：`el.getAttribute()`）；常用于 `data-*` 和 ARIA 属性 |


:::info DOM Property vs HTML Attribute 区别

**HTML Attribute（特性）**：
- 在 HTML 源码中的声明
- 示例：`<input value="hello" disabled>`
- 访问：`el.getAttribute('value')` / `el.setAttribute('value', 'new')`
- 特点：字符串值，在源码中可见

**DOM Property（属性）**：
- JavaScript 对象上的属性
- 示例：`el.value = 'hello'` / `el.disabled = true`
- 访问：`el.value` / `el.disabled`
- 特点：可以是任意类型（字符串、布尔值、对象等），在源码中不可见

**实际例子**：

```html
<!-- HTML 源码 -->
<input value="hello" checked>

<!-- Attribute vs Property -->
el.getAttribute('value')        // 返回 "hello"
el.value                        // 返回 "hello"

el.getAttribute('checked')      // 返回 ""（字符串）
el.checked                      // 返回 true（布尔值）

el.getAttribute('disabled')     // 无此特性 → null
el.disabled                     // 返回 false（默认值）
```

**更新行为对比**：

```javascript
// 设置 Attribute（特性）
el.setAttribute('data-id', '123')
// HTML 源码变为：<div data-id="123"></div>
// 可通过 el.getAttribute('data-id') 读取

// 设置 Property（属性）
el.dataset.id = '123'
// HTML 源码不变，但 JavaScript 对象有此属性
// 可通过 el.dataset.id 或 el['data-id'] 读取
```

**Vue 绑定行为**：
- **无修饰符**（默认）：Vue 自动判断属性（通常正确）
- **`.prop`**：明确设置为 DOM property（`el.value = ...`）
- **`.attr`**：明确设置为 HTML attribute（`el.setAttribute(...)`）

**何时使用哪个修饰符**：

| 场景 | 修饰符 | 原因 |
|------|--------|------|
| `<input>` 的 value、checked | `.prop` | 表单值需要通过 property 访问和修改 |
| `<video>` 的 currentTime | `.prop` | 时间属性是 number 类型，只能用 property |
| `data-*` 自定义属性 | `.attr` | 需要在 HTML 源码中可见 |
| `aria-*` ARIA 属性 | `.attr` | 无障碍属性需要在 HTML 中声明 |
| 自定义元素 | 看文档 | Web Components 可能需要 property 或 attribute |

:::

## 5. v-on 事件修饰符（Event Modifiers）

以下修饰符适用于所有事件监听：

| 修饰符                         | 示例              | 行为说明                       |
| ------------------------------ | ----------------- | ------------------------------ |
| `.stop`                        | `@click.stop`     | 阻止事件冒泡                   |
| `.prevent`                     | `@submit.prevent` | 阻止默认行为                   |
| `.capture`                     | `@click.capture`  | 捕获阶段触发                   |
| `.self`                        | `@click.self`     | 非自身节点触发时忽略           |
| `.once`                        | `@click.once`     | 事件只触发一次                 |
| `.passive`                     | `@scroll.passive` | Passive listener，提高滚动性能 |
| `.left` / `.middle` / `.right` | `@click.left`     | 指定触发的鼠标按键             |
| `.exact`                       | `@click.exact`    | 精确修饰符组合                 |

## 6. 键盘修饰符（Keyboard Event Modifiers）

适用于 `keyup` / `keydown`，Vue 内置常用键位修饰符。

| 修饰符                         | 示例            | 说明               |
| ------------------------------ | --------------- | ------------------ |
| `.enter`                       | `@keyup.enter`  | 回车               |
| `.tab`                         | `@keyup.tab`    | Tab                |
| `.delete`                      | `@keyup.delete` | Delete / Backspace |
| `.esc`                         | `@keyup.esc`    | Escape             |
| `.space`                       | `@keyup.space`  | 空格键             |
| `.up` `.down` `.left` `.right` | `@keyup.up`     | 方向键             |

支持组合键，例如：

```html
<input @keyup.ctrl.k="fn" />
```

## 7. 特殊指令说明（性能 / 编译相关）

### 7.1 `v-once`

- 节点只渲染一次，以后不会参与更新。
- 静态内容建议使用，减少 diff 开销。

### 7.2 `v-memo`

- 手工声明缓存条件，依赖数组不变则组件跳过渲染。
- 适合复杂子树性能优化。

### 7.3 `v-pre`

- 跳过编译阶段。
- 常用于显示 Mustache 原文或作为模板示例展示。

### 7.4 `v-cloak`

- 配合 CSS 用于避免闪烁（首屏 SSR/CSR 切换场景）。

## 8. 指令与编译器之间的对应关系（源码阅读参考）

Vue3 模板编译时，指令最终会落地到对应的 transform 函数：

| 指令                        | 编译器函数       |
| --------------------------- | ---------------- |
| `v-bind`                    | `transformBind`  |
| `v-on`                      | `transformOn`    |
| `v-model`                   | `transformModel` |
| `v-if / v-else-if / v-else` | `transformIf`    |
| `v-for`                     | `transformFor`   |
| `v-slot`                    | `buildSlots`     |

适用于内部培训、源码阅读或二次开发场景。

## 9. 团队使用规范建议

1. **所有绑定必须使用简写**（`:`, `@`, `#`），避免长写法混用。
2. **事件监听类统一优先使用 `.stop`、`.prevent` 等修饰符**，减少手写逻辑代码。
3. 需要性能优化时优先考虑：
   - `v-once`
   - `v-memo`
   - `v-pre`

4. 模板逻辑保持简单，不在指令中过度堆叠业务逻辑。
5. 使用 `v-html` 必须明确来源可信，避免 XSS。
