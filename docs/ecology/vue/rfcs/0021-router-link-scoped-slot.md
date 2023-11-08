# 为router-link添加作用域插槽

## 概览

- 移除`tag` props
- 移除`event` props
- 停止自动分配点击事件给内部锚点
- 新增作用域插槽API
- 新增`custom`props满足自定义`router-link`渲染

## 基础用例

```html

<router-link to="/">
    <Icon>home</Icon>
    Home
</router-link>
```

## 动机

目前的router-link有很多限制：

- active状态下的自定义能力不完备
- 无法整合自定义组件
- click事件无法被阻止（应当通过`@click.prevent`阻止，而不是`disabled`属性）

提出这个RFC来解决上述问题，通过提供一个作用域插槽允许开发者更容易拓展他们项目上的链接，而且允许库开发者更容易集成Vue-router。

## 详细设计

### 默认插槽

一个简单的用例是默认插槽（没有内嵌的锚点和按钮）

```html

<router-link to="/">
    <Icon>home</Icon>
    Home
</router-link>
```

这个实现应该：

- 生成一个锚点元素（`a`）而且添加相关的属性：
    - href指向目的地
    - class为`router-link-active`或者/和`router-link-exact-active`（可以通过props或者全局选项改变）
    - 点击事件触发导航通过`router.push`或者`router.replace`，并阻止默认行为`event.preventDefault`（除了当使用修饰符 `⌘` 或者
      `Ctrl`点击时）
- 可以传入任何元素作为锚点的子节点
- 透传不属于`a`标签的属性作为props

重大变更：

- 不再接收`tag` props 修改为 用默认作用域插槽替代
- 不再接收`event` 修改为 使用默认作用域插槽替代
- 不再像wrapper那样工作去自动搜索第一个`a`标签 修改为 使用默认作用域插槽替代

### 作用域插槽

作用域插槽应该提供访问任意信息来自定义的能力，并且允许添加active
class、click监听器、链接等等。这可以在集成UI框架类似bootstrap时提供很好的集成。创建vue组件时，可以避免类似bootstrap-vue的模板代码那样。

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

`custom`标识`router-link`组件的渲染完全受控：不会渲染为`a`标签包裹

为什么custom props是必须的：在vue3中，作用域插槽和普通插槽被统一了，两者没有区别，这意味着vue-router无法区分下面3种用例：

```html

<router-link to="/" v-slot="{ href, navigate, isActive }"></router-link>
<router-link to="/" v-slot></router-link>
<router-link to="/">Some Link</router-link>
```

在上面3种用例中，我们需要渲染插槽内容，但是`router-link`要知道是否需要用`a`
标签包裹。在vue2中，我们可以通过判断`$scopedSlots`
，但是在vue3中统一了插槽，所以无法区分开。这也意味着在`vue-router@3`和`vue-router@4`中`router-link`的行为略有不同的：

- 在v3中，在使用`v-slot`时，`custom` props是必须的。这样`router-link`将不会用`a`标签包裹插槽内容。
- 在v4中，在使用`v-slot`时，`custom` props不是必须的。来标识`router-link`是否应该用`a`标签包裹插槽内容：

```vue

<router-link to="/" v-slot="{ href }">
<router-link to="/" custom v-slot="{ href, navigate }">
  <a :href="href" @click="navigate">{{ href }}</a>
</router-link>
<!-- both render the same -->
<a href="/">/</a>
<a href="/">/</a>
```

:::tip 译者注
翻译这块时读者需要事先接受几个约定：vue-router@3对应Vue2， vue-router@4对应Vue3。

但是由于是向下兼容的，也就意味着vue3也可以使用vue-router@3。

**为什么在使用vue-router@3自定义导航内容的时候custom是必须的呢？**

在vue3 版本中，vue3将作用域插槽和普通插槽统一了，也就意味着vue3中无法区分一个插槽是不是作用域插槽。

而vue-router会判断插槽是否为作用域插槽，如果是作用域插槽则会直接渲染它。

```js
if (scopedSlot) {
    if (scopedSlot.length === 1) {
        return scopedSlot[0]
    }
}
```

所以在这个RFC中，强制要求了在vue-router@3中自定义导航内容时，需要显式指定`custom`props。

custom的作用是告诉vue3`router-link`中的插槽内容是不是一个作用域插槽

**那么又为什么在使用vue-router@4自定义导航内容的时候custom不是必须的呢？**

custom的作用是告诉vue-router要不要用一个a标签包裹导航内容

总结：

- vue-router@3会判断插槽是否为作用域插槽
    - 是：则渲染
    - 否：则用`a`标签包裹
- vue-router@4不关心插槽内容，默认用`a`标签包裹

:::

### 可访问的变量

slot应该提供router-link中的computed属性：

- `href`：解析出相对url作为锚点标签添加（当`route.fullPath`不存在时，如果提供了href则需要包含基础路径）
- `route`：从`to`中解析出标准的`route` location（结构与`$rout`e类似）
- `navigate`：触发导航的函数（通常与click事件监听器关联起来）。如果触发点击事件，需要调用preventDefault
- `isActive`：当为true时，会添加`router-link-active`到class上。可以通过`exact` props修改。
- `isExactActive`：当为true时，会添加`router-link-exact-active`到class上。可以通过`exact` props修改。

## 移除`tag`props

`tag`props将会被作用域插槽替代，因为后者让代码更清晰，而且无需抛出任何警告。移除它也会使vue-router的库更轻。

```html

<router-link to="/" tag="button">
    <Icon>home</Icon>
    <span class="xs-hidden">Home</span>
</router-link>
```

等价于

```html

<router-link to="/" custom v-slot="{ navigate, isActive, isExactActive }">
    <button role="link" @click="navigate" :class="{ active: isActive, 'exact-active': isExactActive }">
        <Icon>home</Icon>
        <span class="xs-hidden">Home</span>
    </button>
</router-link>
```

## 缺点

- 尽管这样可以保持现有的行为有效，且只是暴露出一个新的作用域插槽行为，但是这也将会阻碍我们修复当前实现中出现的问题。这就是为什么会有一些重大变更，以使事情变得更加一致。
- 无法访问`router-link`的默认类名，如：`router-link-active` 和 `router-link-exact-active`

## 可替代方案

- 让`event`props更便利？
- 使用一个具名插槽而不是一个props：

```html

<router-link #custom="{ href }">
    <a :href="href"></a>
</router-link>

<router-link v-slot:custom="{ href }">
    <a :href="href"></a>
</router-link>

<router-link custom v-slot="{ href }">
    <a :href="href"></a>
</router-link>
```

使用这个用例要采取的策略是跟之前的方案类似的，要注意的是抛出警告时要告诉用户使用名字为custom的插槽，而不是一个props。

- 新建一个名为`router-link-custom`
  的组件来区分它们的行为。这种方式相较于一个props或者一个具名插槽很重（包的大小）。props相较于它而言更加适合，因为我们只需要改变一个组件的行为。两个组件之间的差异太小，无法证明新建一个组件是合理的。

## 采取的策略

- 在文档中添加新插槽行为的例子
- 在vue-router@3中废弃`tag`和`event` props，并且抛出链接到文档的信息，然后在vue-router@4中完全移除
- 在vue-router@3中，当使用一个作用域插槽而没有传递`custom`时，警告用户添加`custom`属性
