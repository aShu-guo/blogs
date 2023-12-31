# 概览

无人机政务服务平台的项目目前的技术栈是vue-2.6.10 + vue-cli-4.0，随着业务不断增多，项目每次热更新时间已经超过5秒，即使优化webpack配置也无法在热更新时显著降低时长。

而且目前项目已出现以下问题：

1. vue2的options API的短板逐渐暴露，强制限制通过Options API组织代码的形式导致逻辑复用成本高而且难以维护。
2. css样式混乱，导致`!important`遍布项目中各个角落（项目在迭代版本时，有次需求要求整体替换项目风格，UI彻底换了一版）。
3. 由于前期前端人手不够，后端也参与了部分前端开发，导致项目复杂度更高，代码质量很差
4. 不合理的组件封装，甚至复制粘贴新增不同逻辑的组件，造成`/components`目录异常庞大，而且存在大量的未引用的`.vue`
   文件（存在大量未引用的`.vue`文件的原因是项目模板是从另外一个项目中拷贝而来，并没有删掉无关的文件）。
5. 大量使用`bus总线`进行通信，即使是两组件关系为父子组件
6. axios封装问题，并没有在response拦截器处统一处理错误提醒，导致`message.error`遍布项目各个地方。
7. 代码风格各异，时而使用`JSX`，时而使用`Options API`（公司中有另外react项目，table组件封装直接从react项目中拷贝，然后改成了vue版本）

目前Vue3生态蓬勃发展，社区维护的工具链以及组件库已经逐步迁移到v3版本。

加上这段时间对Vue3以及Vite的学习，认为迁移到v3版本使用setup+composition API组织代码的形式可以更好的关注逻辑点。

但是在此处版本迁移时并没有选择TS，最主要的原因还是自己对TS熟练度不够，无法很好的控制代码质量，还要努力学习鸭。

## 迁移主要分为哪几个步骤？

在参考了官方的迁移帮助文档之后，决定分为以下几步进行：

- 首先将项目整体迁移到vue3+vite中，并且根据兼容模板的warning提示逐步迁移
    - 抽离出组件公用逻辑
    - 优先迁移与业务无关的逻辑代码
- 整体API调整后，开始迁移antd到3.0版本
- 接下来替换vuex为pinia，vue-router升级到v4版本


