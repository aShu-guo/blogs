# 准备篇

## router-link组件用法

基于vue-router-3.x

router-link为提供了改变路由重新挂载组件的能力以及为自定义组件提供导航能力，当没有传入默认插槽时，默认渲染为`<a>`标签。

## 与`<a>`标签的区别是什么？

`<a>`标签提供的能力是整体刷新页面，从一个页面链接到另外一个页面，但两个页面的布局相同，改变的只有内容区域时，那么`<a>`
标签跳转便会造成不必要的渲染性能损耗。

`router-link`组件提供了局部更新页面内容的能力，当路由发生改变时，重新挂载要跳转路由对应的组件。

而且从官方文档上可知，还有以下3点不同：

- `router-link`组件在history模式和hash模式下行为一致，无需由于兼容性降级为hash模式时修改代码
- history模式下，`router-link`会阻止默认事件触发，并不会重新加载页面。
- 实例化history模式下router时，如果指定了base，那么props `to`无需指定项目基础路径

## 为组件提供导航能力（3.1新增）

### 之前

在没有新增默认作用域插槽时，虽然提供了tag来指定组件渲染，但是由于router-link并不是函数式组件，所以并不支持自定义组件渲染的能力。

而且由于将router-link重构为函数式组件是重大变更，在vue3版本中也调整了函数式组件的API，废弃了functional选项声明，故尤大提供了另外一方方式：声明v-slot

:::tip 译者注
为什么改为函数式组件就可以实现支持自定义组件的能力了呢？

**需要研究下函数式组件实例化时和普通组件有什么区别？**
:::

### 之后

添加`custom`，并传入默认插槽

```vue

<router-link to="/" custom v-slot="{ href, navigate, isActive }">
<li :class="{ 'active': isActive }">
  <a :href="href" @click="navigate">
    <Icon>home</Icon>
    <span class="xs-hidden">Home</span>
  </a>
</li>
</router-link>
```

## 什么是锚点？

超链接的一种表现形式，用于页面内跳转
