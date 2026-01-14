# 编译时优化

## 1. 概念先行：建立心智模型

### 生活类比：智能工厂的预处理系统

想象一个传统工厂和智能工厂的对比：

**传统工厂（Vue 2）**：

- 原材料到达后，工人现场检查每个零件
- 每次生产都要重新测量、分类、组装
- 即使某些零件从不改变，也要反复检查
- 效率低下，浪费大量时间

**智能工厂（Vue 3 编译优化）**：

- 原材料到达前，AI 系统已经分析好了
- 给每个零件贴上标签："永不改变"、"可能改变"、"经常改变"
- 标记为"永不改变"的零件直接放到仓库，不再检查
- 标记为"可能改变"的零件才进入检查流程
- 生产效率提升 10 倍以上

**Vue 3 编译优化就是这个"AI 预处理系统"**：

- 编译时：分析模板，标记哪些内容是静态的、哪些是动态的
- 运行时：只处理动态内容，静态内容直接复用
- 结果：渲染性能大幅提升

### 核心公式

```
性能优化 = 编译时分析 + 运行时跳过
静态提升 = 提取静态内容到 render 函数外
PatchFlags = 标记动态属性（只 diff 标记的部分）
Block Tree = 扁平化动态节点（跳过静态子树）
```

### 流程总览

```
模板代码：
<div>
  <h1>Static Title</h1>
  <p>{{ message }}</p>
  <span>Static Footer</span>
</div>

编译时分析：
    ↓
识别静态节点：h1, span
识别动态节点：p (包含 {{ message }})
    ↓
应用优化策略：
1. 静态提升：h1, span 提升到 render 外
2. PatchFlags：p 标记为 TEXT (1)
3. Block Tree：只收集 p 到 dynamicChildren
    ↓
生成优化后的渲染函数

运行时执行：
    ↓
首次渲染：创建所有节点
    ↓
更新时：只 diff dynamicChildren 中的 p 节点
    ↓
性能提升：O(3 个节点) → O(1 个节点)
```

## 2. 最小实现：手写"低配版"

下面是一个 50 行的编译优化核心实现，展示静态提升、PatchFlags 和 Block Tree 的基本原理：

```javascript
// 1. 静态提升：提取静态节点
const hoisted1 = { tag: 'h1', children: 'Static Title' };
const hoisted2 = { tag: 'span', children: 'Static Footer' };

// 2. PatchFlags 定义
const PatchFlags = {
  TEXT: 1,
  CLASS: 2,
  STYLE: 4,
  PROPS: 8,
};

// 3. 创建 Block（收集动态节点）
function createBlock(tag, props, children) {
  const vnode = { tag, props, children, dynamicChildren: [] };

  // 收集动态子节点
  function collectDynamic(node) {
    if (node.patchFlag > 0) {
      vnode.dynamicChildren.push(node);
    }
    if (Array.isArray(node.children)) {
      node.children.forEach(collectDynamic);
    }
  }

  if (Array.isArray(children)) {
    children.forEach(collectDynamic);
  }

  return vnode;
}

// 4. 优化后的 render 函数
function render(message) {
  return createBlock('div', null, [
    hoisted1, // 静态节点，直接复用
    { tag: 'p', children: message, patchFlag: PatchFlags.TEXT }, // 动态节点
    hoisted2, // 静态节点，直接复用
  ]);
}

// 5. 优化的 diff 函数
function patchBlock(oldBlock, newBlock) {
  // 只 diff dynamicChildren，跳过静态节点
  const { dynamicChildren } = newBlock;

  console.log(`传统 diff: 需要比较 ${oldBlock.children.length} 个节点`);
  console.log(`优化 diff: 只需比较 ${dynamicChildren.length} 个节点`);

  dynamicChildren.forEach((newChild, i) => {
    const oldChild = oldBlock.dynamicChildren[i];

    // 根据 patchFlag 精确更新
    if (newChild.patchFlag & PatchFlags.TEXT) {
      if (oldChild.children !== newChild.children) {
        console.log(
          `更新文本: "${oldChild.children}" → "${newChild.children}"`,
        );
      }
    }
  });
}

// 测试
const vnode1 = render('Hello');
const vnode2 = render('World');

patchBlock(vnode1, vnode2);
// 输出：
// 传统 diff: 需要比较 3 个节点
// 优化 diff: 只需比较 1 个节点
// 更新文本: "Hello" → "World"
```

**关键点**：

1. **静态提升**：hoisted1 和 hoisted2 在 render 函数外定义，多次调用 render 时直接复用
2. **PatchFlags**：动态节点标记 patchFlag，diff 时只检查标记的属性
3. **Block Tree**：dynamicChildren 只包含动态节点，跳过静态子树

## 3. 逐行解剖：Vue 3 编译优化详解

### 3.1 静态提升（Static Hoisting）

**核心思想**：将完全静态的节点提升到 render 函数外，避免重复创建。

| 优化前                                      | 优化后                                                                     | 效果       |
|------------------------------------------|-------------------------------------------------------------------------|----------|
| 每次 render 都创建静态 VNode                    | 静态 VNode 只创建一次                                                          | 减少对象创建开销 |
| `render() { return h('div', 'static') }` | `const _hoisted = h('div', 'static')`<br>`render() { return _hoisted }` | 内存复用     |

**编译示例**：

| 模板代码                             | 编译输出                                                                                                                  | 优化说明         |
|----------------------------------|-----------------------------------------------------------------------------------------------------------------------|--------------|
| `<div><p>Static</p></div>`       | `const _hoisted_1 = createVNode('p', null, 'Static')`<br>`render() { return createVNode('div', null, [_hoisted_1]) }` | p 节点被提升      |
| `<div><p>{{ msg }}</p></div>`    | `render() { return createVNode('div', null, [createVNode('p', null, msg, 1)]) }`                                      | 动态节点不提升      |
| `<div class="static">text</div>` | `const _hoisted_1 = { class: 'static' }`<br>`render() { return createVNode('div', _hoisted_1, 'text') }`              | 静态 props 也提升 |

**提升条件**：

| 条件      | 是否提升 | 原因      |
|---------|------|---------|
| 纯静态文本   | ✅    | 永不改变    |
| 静态属性    | ✅    | 永不改变    |
| 包含动态绑定  | ❌    | 可能改变    |
| 包含 ref  | ❌    | 可能改变    |
| 包含动态子节点 | ❌    | 子节点可能改变 |

### 3.2 PatchFlags（补丁标记）

**核心思想**：标记 VNode 中哪些属性是动态的，diff 时只比较标记的属性。

| 标记                   | 值    | 含义            | 编译场景             |
|----------------------|------|---------------|------------------|
| **TEXT**             | 1    | 动态文本          | `{{ msg }}`      |
| **CLASS**            | 2    | 动态 class      | `:class="cls"`   |
| **STYLE**            | 4    | 动态 style      | `:style="sty"`   |
| **PROPS**            | 8    | 动态 props      | `:id="id"`       |
| **FULL_PROPS**       | 16   | 完整 props diff | `v-bind="obj"`   |
| **HYDRATE_EVENTS**   | 32   | 事件 hydration  | `@click="fn"`    |
| **STABLE_FRAGMENT**  | 64   | 稳定片段          | 固定子节点            |
| **KEYED_FRAGMENT**   | 128  | 有 key 片段      | `v-for` with key |
| **UNKEYED_FRAGMENT** | 256  | 无 key 片段      | `v-for` 无 key    |
| **NEED_PATCH**       | 512  | 需要完整 patch    | 组件               |
| **DYNAMIC_SLOTS**    | 1024 | 动态插槽          | 条件插槽             |
| **HOISTED**          | -1   | 静态提升          | 完全静态             |
| **BAIL**             | -2   | 跳过优化          | 复杂场景             |

**编译示例**：

| 模板                                    | 编译输出                                                           | PatchFlag         | 说明          |
|---------------------------------------|----------------------------------------------------------------|-------------------|-------------|
| `<div>{{ msg }}</div>`                | `createVNode('div', null, msg, 1)`                             | TEXT = 1          | 只有文本动态      |
| `<div :class="cls">text</div>`        | `createVNode('div', { class: cls }, 'text', 2)`                | CLASS = 2         | 只有 class 动态 |
| `<div :class="cls">{{ msg }}</div>`   | `createVNode('div', { class: cls }, msg, 3)`                   | TEXT \| CLASS = 3 | 两者都动态       |
| `<div :id="id" class="static"></div>` | `createVNode('div', { id, class: 'static' }, null, 8, ['id'])` | PROPS = 8         | 只有 id 动态    |

**运行时使用**：

| 源码片段                                  | 逻辑拆解                          |
|---------------------------------------|-------------------------------|
| `const { patchFlag } = vnode`         | **提取标记**：从 VNode 获取 patchFlag |
| `if (patchFlag > 0) {`                | **优化入口**：只有标记 > 0 才进入优化路径     |
| `if (patchFlag & PatchFlags.TEXT) {`  | **按位检查**：用 `&` 检查是否包含 TEXT 标记 |
| `patchText(el, oldText, newText)`     | **精确更新**：只更新文本，跳过其他属性         |
| `if (patchFlag & PatchFlags.CLASS) {` | **按位检查**：检查是否包含 CLASS 标记      |
| `patchClass(el, oldClass, newClass)`  | **精确更新**：只更新 class            |

### 3.3 Block Tree（块树）

**核心思想**：将动态节点扁平化收集到 dynamicChildren 数组，diff 时跳过静态子树。

**传统 VNode 树 vs Block Tree**：

```
传统树（需要递归遍历）：
div
├─ h1 (static)
├─ div
│  ├─ p (static)
│  └─ span {{ msg }} (dynamic)
└─ footer (static)

Block Tree（扁平化）：
div (Block)
├─ children: [h1, div, footer]  // 完整树结构
└─ dynamicChildren: [span]      // 只包含动态节点

diff 时：
传统：递归遍历 5 个节点
Block：只遍历 dynamicChildren 中的 1 个节点
```

**编译示例**：

| 模板                                                          | 编译输出                                                                                                            | dynamicChildren   |
|-------------------------------------------------------------|-----------------------------------------------------------------------------------------------------------------|-------------------|
| `<div><h1>Static</h1><p>{{ msg }}</p></div>`                | `openBlock()`<br>`createBlock('div', null, [_hoisted_1, createVNode('p', null, msg, 1)])`                       | `[p]`             |
| `<div><p v-if="show">{{ msg }}</p></div>`                   | `openBlock()`<br>`createBlock('div', null, [show ? createVNode('p', null, msg, 1) : null])`                     | `[p]` (条件渲染)      |
| `<div v-for="item in list" :key="item.id">{{ item }}</div>` | `openBlock()`<br>`createBlock(Fragment, null, list.map(item => createVNode('div', { key: item.id }, item, 1)))` | `[div, div, ...]` |

**Block 创建流程**：

| 步骤 | 函数调用               | 作用                                                |
|----|--------------------|---------------------------------------------------|
| 1  | `openBlock()`      | 创建 currentBlock 数组，准备收集动态节点                       |
| 2  | `createVNode(...)` | 创建子节点，如果有 patchFlag > 0，自动加入 currentBlock         |
| 3  | `createBlock(...)` | 创建 Block VNode，将 currentBlock 赋值给 dynamicChildren |
| 4  | `closeBlock()`     | 清空 currentBlock，恢复父 Block                         |

### 3.4 常量折叠（Constant Folding）

**核心思想**：编译时计算常量表达式，减少运行时计算。

| 模板                                | 优化前                           | 优化后                          |
|-----------------------------------|-------------------------------|------------------------------|
| `<div :class="'a' + 'b'">`        | `{ class: 'a' + 'b' }`        | `{ class: 'ab' }`            |
| `<div :style="{ color: 'red' }">` | `{ style: { color: 'red' } }` | `{ style: _hoisted_1 }` (提升) |
| `<div v-if="true">`               | `true ? h('div') : null`      | `h('div')` (移除条件)            |

### 3.5 Tree Shaking（树摇优化）

**核心思想**：按需引入运行时辅助函数，未使用的功能不打包。

| 功能     | Vue 2 | Vue 3        |
|--------|-------|--------------|
| 全局 API | 全部打包  | 按需引入         |
| 内置组件   | 全部打包  | 按需引入         |
| 指令     | 全部打包  | 按需引入         |
| 包体积    | ~32KB | ~13KB (gzip) |

**编译示例**：

| 模板                                 | 编译输出                                                | 引入的辅助函数         |
|------------------------------------|-----------------------------------------------------|-----------------|
| `<div>{{ msg }}</div>`             | `import { createVNode as _createVNode } from 'vue'` | 只引入 createVNode |
| `<Transition><div /></Transition>` | `import { Transition as _Transition } from 'vue'`   | 额外引入 Transition |
| `<div v-show="show">`              | `import { vShow as _vShow } from 'vue'`             | 额外引入 vShow 指令   |

## 4. 细节补充：边界与性能优化

### 4.1 静态提升的限制

**不会提升的情况**：

| 场景        | 原因     | 示例                              |
|-----------|--------|---------------------------------|
| 包含动态绑定    | 内容可能改变 | `<div :id="id">Static</div>`    |
| 包含 ref    | 需要更新引用 | `<div ref="myRef">Static</div>` |
| 使用 v-once | 已有其他优化 | `<div v-once>{{ msg }}</div>`   |
| 嵌套层级过深    | 提升收益不大 | 超过 3 层嵌套                        |

**提升策略**：

| 配置                  | 默认值   | 说明           |
|---------------------|-------|--------------|
| `hoistStatic`       | true  | 是否启用静态提升     |
| `cacheHandlers`     | false | 是否缓存事件处理器    |
| `prefixIdentifiers` | false | 是否添加前缀（用于优化） |

### 4.2 PatchFlags 的组合使用

**位运算组合**：

| 操作   | 代码                       | 结果                | 说明            |
|------|--------------------------|-------------------|---------------|
| 组合标记 | `TEXT \| CLASS`          | `1 \| 2 = 3`      | 同时标记文本和 class |
| 检查标记 | `3 & TEXT`               | `3 & 1 = 1` (真)   | 包含 TEXT       |
| 检查标记 | `3 & STYLE`              | `3 & 4 = 0` (假)   | 不包含 STYLE     |
| 多标记  | `TEXT \| CLASS \| STYLE` | `1 \| 2 \| 4 = 7` | 三个都标记         |

**dynamicProps 数组**：

当使用 PROPS (8) 标记时，会附带 dynamicProps 数组：

```javascript
// 模板：<div :id="id" :title="title" class="static">
// 编译输出：
createVNode(
  'div',
  {
    id: _ctx.id,
    title: _ctx.title,
    class: 'static',
  },
  null,
  8 /* PROPS */,
  ['id', 'title'],
);

// diff 时只检查 dynamicProps 中的属性
for (const key of dynamicProps) {
  if (oldProps[key] !== newProps[key]) {
    patchProp(el, key, oldProps[key], newProps[key]);
  }
}
```

### 4.3 Block Tree 的边界情况

**不稳定的结构**：

| 场景                | 问题   | 解决方案                 |
|-------------------|------|----------------------|
| `v-if` / `v-else` | 结构改变 | 每个分支创建独立 Block       |
| `v-for` 无 key     | 无法追踪 | 标记为 UNKEYED_FRAGMENT |
| 动态组件              | 类型改变 | 标记为 NEED_PATCH       |

**Fragment 的处理**：

```javascript
// v-if 场景
openBlock();
createBlock(Fragment, null, [
  condition
    ? (openBlock(), createBlock('div', { key: 0 }, 'A'))
    : (openBlock(), createBlock('div', { key: 1 }, 'B')),
]);

// 每个分支都是独立的 Block，确保正确 diff
```

### 4.4 性能对比

**场景 1：大量静态内容**

| 指标   | Vue 2 | Vue 3 | 提升    |
|------|-------|-------|-------|
| 首次渲染 | 100ms | 60ms  | 1.67x |
| 更新渲染 | 50ms  | 5ms   | 10x   |
| 内存占用 | 10MB  | 6MB   | 1.67x |

**场景 2：大量动态内容**

| 指标   | Vue 2 | Vue 3 | 提升    |
|------|-------|-------|-------|
| 首次渲染 | 100ms | 90ms  | 1.11x |
| 更新渲染 | 50ms  | 30ms  | 1.67x |
| 内存占用 | 10MB  | 9MB   | 1.11x |

**结论**：静态内容越多，优化效果越明显。

### 4.5 编译选项

| 选项                  | 默认值       | 说明      | 影响          |
|---------------------|-----------|---------|-------------|
| `hoistStatic`       | true      | 静态提升    | 减少对象创建      |
| `cacheHandlers`     | false     | 缓存事件处理器 | 减少函数创建      |
| `prefixIdentifiers` | false     | 添加前缀    | 优化作用域       |
| `optimizeBindings`  | false     | 优化绑定    | 减少 Proxy 访问 |
| `isCustomElement`   | undefined | 自定义元素判断 | 避免组件解析      |

**开启所有优化**：

```javascript
// vite.config.js
export default {
  vue: {
    template: {
      compilerOptions: {
        hoistStatic: true,
        cacheHandlers: true,
        prefixIdentifiers: true,
        optimizeBindings: true,
      },
    },
  },
};
```

## 5. 总结与延伸

### 一句话总结

**Vue 3 通过编译时的静态分析（静态提升、PatchFlags、Block Tree），将运行时性能从 O(所有节点) 优化到 O(动态节点)，实现了 10
倍以上的性能提升。**

### 优化策略总结

```
编译时优化的三大支柱：

1. 静态提升（Static Hoisting）
   ├─ 提取静态节点到 render 外
   ├─ 避免重复创建对象
   └─ 减少内存分配

2. PatchFlags（补丁标记）
   ├─ 标记动态属性
   ├─ diff 时精确更新
   └─ 跳过静态属性

3. Block Tree（块树）
   ├─ 扁平化动态节点
   ├─ 跳过静态子树
   └─ 减少遍历次数

协同效果：
静态提升 × PatchFlags × Block Tree = 100 倍性能提升
```

### 与运行时优化的协作

| 优化类型       | 编译时    | 运行时     | 协作方式   |
|------------|--------|---------|--------|
| 静态提升       | 提取静态节点 | 直接复用    | 减少创建开销 |
| PatchFlags | 标记动态属性 | 精确 diff | 减少比较次数 |
| Block Tree | 收集动态节点 | 跳过静态树   | 减少遍历次数 |
| 事件缓存       | 缓存处理器  | 避免重新绑定  | 减少更新开销 |

### 面试考点

**Q1：Vue 3 的编译优化有哪些？**

- 答：静态提升、PatchFlags、Block Tree、常量折叠、Tree Shaking
- 核心思想：编译时分析，运行时跳过
- 效果：性能提升 10 倍以上

**Q2：静态提升是什么？有什么限制？**

- 答：将完全静态的节点提升到 render 函数外，避免重复创建
- 限制：不能包含动态绑定、ref、v-once
- 收益：减少对象创建和内存分配

**Q3：PatchFlags 如何优化 diff 性能？**

- 答：标记 VNode 中哪些属性是动态的，diff 时只比较标记的属性
- 原理：位运算标记 + 运行时按位检查
- 效果：从 O(所有属性) 降低到 O(标记的属性)

**Q4：Block Tree 解决了什么问题？**

- 答：传统 VNode 树需要递归遍历所有节点，Block Tree 将动态节点扁平化
- 原理：编译时收集动态节点到 dynamicChildren 数组
- 效果：diff 时跳过静态子树，只遍历动态节点

**Q5：为什么 v-bind="obj" 性能差？**

- 答：编译器无法确定哪些属性动态，标记为 FULL_PROPS (16)
- 结果：diff 时需要遍历所有属性，无法跳过静态部分
- 建议：改用具体的 `:prop="value"` 绑定

**Q6：编译优化和运行时优化的区别？**

- 编译优化：在构建时分析模板，生成优化的渲染函数
- 运行时优化：在浏览器中执行时的优化（如响应式系统）
- 协作：编译优化为运行时提供元信息（PatchFlags、dynamicChildren）

**Q7：如何开启所有编译优化？**

```javascript
// vite.config.js
export default {
  vue: {
    template: {
      compilerOptions: {
        hoistStatic: true, // 静态提升
        cacheHandlers: true, // 事件缓存
        prefixIdentifiers: true, // 前缀优化
        optimizeBindings: true, // 绑定优化
      },
    },
  },
};
```

### 延伸阅读

- **运行时优化**：响应式系统、虚拟 DOM、diff 算法的运行时优化
- **PatchFlags 详解**：各种标记的具体使用场景和优化效果
- **Block 机制**：Block Tree 的创建、收集、diff 完整流程
- **编译器架构**：parse、transform、codegen 三阶段如何协作
- **SSR 优化**：服务端渲染的编译优化策略
- **性能测试**：如何测量和对比编译优化的效果
