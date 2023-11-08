# 概览

在Vue-core中可以大致分为3个module：响应式模块、编译器模块、渲染器模块

- 响应式模块：为data添加响应式，并跟踪数据更新
- 编译器模块：编译模板为render函数，可以发生在build过程中，也可发生在浏览器中（需要Vue完整版支持）
- 渲染器模块：通过DOM API将虚拟DOM挂载为真实DOM，并在数据更新时patch最新的数据
    - 渲染阶段：render函数构造出虚拟DOM（VNode）
    - 挂载阶段：调用DOM API挂载虚拟DOM到页面上
    - 打补丁阶段：数据更新时，比较新旧VNode来对页面打补丁

各模块执行过程

- 编译器模块将template编译为render函数
- 响应式模块为data添加响应性
- 渲染器模块会调用render函数（其中render中引用了响应式对象），执行后返回虚拟DOM。
- 当模板依赖的响应式对象发生改变时，重新执行render函数，生成新的VNode，这时将新旧VNode发送到patch函数中，通过diff算法进行局部更新


