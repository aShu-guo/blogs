在 Vue3 的源码体系中，**编译（compiler）模块** 是结构最清晰、分层最严格的部分之一。整体上可以将它拆分为以下 **5 大核心章节**（非常适合作为博客的结构与目录）：

---

# **Vue3 Compiler 模块体系的主要章节（大纲级别）**

## **1. Parser（模板解析）模块**

**作用：**
将模板字符串解析成 AST（抽象语法树）。

**主要内容：**

* HTML 模板的词法分析（扫描文本、标签、属性）
* 生成元素节点、文本节点、注释节点等
* 支持 `v-if / v-for / v-on / v-bind` 等内置指令结构化解析
* 保留位置信息（sourceLocation）

**对应源码包：**
`packages/compiler-core/src/parse/`

---

## **2. AST Transform（AST 转换）模块**

**作用：**
对 AST 进行“语义处理”和“结构优化”，为后续生成代码做准备。

**主要内容：**

* 静态提升（hoist static）
* props/事件等属性规范化
* v-if / v-for 等结构指令的 AST 重写
* slot 处理（inline / dynamic slots）
* 转换文本节点为复合表达式
* 依赖注入 transform（如 helpers 注册）

**对应源码包：**
`packages/compiler-core/src/transform/`

---

## **3. Codegen（代码生成）模块**

**作用：**
将转换后的 AST 转为可执行的渲染函数代码（JavaScript 字符串）。

**主要内容：**

* 生成 `render()` 函数的 JS 代码字符串
* 生成创建 vnode、patchFlag、动态属性等 helper 调用
* 处理 block tree（生成 block 节点）
* 处理元素、组件、文本等节点的 codegenNode

**对应源码包：**
`packages/compiler-core/src/codegen/`

---

## **4. Compiler-core（核心逻辑）模块**

**作用：**
整合 Parser + Transform + Codegen，形成编译主流程。

**主要内容：**

* `baseCompile()` 管理整个编译流水线
* 插件式 transform 架构（内置 + 自定义 transform）
* 配置项注入（mode、prefixIdentifiers、hoistStatic 等）

**对应源码包：**
`packages/compiler-core/`

---

## **5. 模板编译生态扩展模块**

Vue 将编译体系拆分为多个 **面向不同输入环境的子编译器**：

### 5.1 compiler-dom

专为浏览器模板优化。

* 支持 DOM 特殊属性（class/style）
* 支持 HTML 特性解析
* DOM 专属 transform

包：`packages/compiler-dom/`

### 5.2 compiler-sfc

负责 `.vue` 单文件组件（SFC）解析。

* template/script/style 分割与处理
* script setup 编译
* template 编译入口包装

包：`packages/compiler-sfc/`

### 5.3 compiler-ssr

专为服务端渲染（SSR）生成字符串模板。

* 与客户端 codegen 不同
* 生成 “拼接字符串” 版本的渲染函数

包：`packages/compiler-ssr/`

---

# **总结：Vue3 Compiler 模块可以分为 5 大章节**

| 章节                        | 主要职责            | 源码位置                                       |
| ------------------------- | --------------- | ------------------------------------------ |
| **1. Parser**             | 模板 → AST        | compiler-core/parse                        |
| **2. AST Transform**      | AST 规范化与优化      | compiler-core/transform                    |
| **3. Codegen**            | AST → 渲染函数      | compiler-core/codegen                      |
| **4. Compiler-core**      | 编译入口与流程管理       | compiler-core                              |
| **5. 生态编译器（dom/sfc/ssr）** | 针对不同平台与 SFC 的增强 | compiler-dom / compiler-sfc / compiler-ssr |
