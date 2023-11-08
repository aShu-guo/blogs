# vue2与vue3的区别

本章节主要介绍

- v3.x新特性的实现原理
- vue2与vue3在使用上的不同点和底层不同

## 新特性

- 组合式 API*
- 单文件组件中的组合式 API 语法糖 (`<script setup>`)*
- Teleport 组件
- Fragments 片段
- Emits 组件选项**
- 来自 @vue/runtime-core 的 createRenderer API 用来创建自定义渲染函数
- 单文件组件中的状态驱动的 CSS 变量 (`<style>` 中的 v-bind)*
- SFC `<style scoped>` 新增全局规则和针对插槽内容的规则
- Suspense 实验性
