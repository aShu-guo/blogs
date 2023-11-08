# 准备篇

## sync使用

本质一个props/event模式的语法糖

假设props变量名为title，那么要求抛出的事件名必须是为`update:title`格式，事件抛出的值必须是新值。 那么这意味着：`sync修饰符`
是不支持表达式的。

假如支持表达式，变量名为`name + '1'`，抛出事件名为`update:name + '1'`是不合理的。

综上，使用sync时，只支持具体的property，这边于`v-model`类似。

```vue

<text-document
    :title.sync="doc.title"
></text-document>
```

等价于

```js
this.$emit('update:title', newTitle)

```

```vue

<text-document
    :title="doc.title"
    @update:title="doc.title = $event"
></text-document>
```

## 为什么要在Vue中删除sync修饰符（2.0版本）

防止子组件隐式的影响父组件的state

## 为什么要在Vue中再次引入sync修饰符

[Feature: multiple v-model bindings](https://github.com/vuejs/vue/issues/4946)希望v-model支持多个变量，但是v-model最初是为单值输入组件设计的。

对于管理多个值同步的复杂组件（非输入组件），props/event是合适的解决方案。但是在开发过程中，开发者更多的是将v-model作为sync的受限版本来使用，这偏离了Vue的设计初衷。

对此，如果能确保父组件的state是通过props/event来改变的（通过封装`$emit`逻辑到子组件中），那么引入`sync`修饰符似乎更好点。

## 为什么引入之后又要在Vue3中使用v-model代替sync？

在vue2.x中`v-bind.sync`造成了困惑，因为用户希望像使用`v-bind`
一样使用它。虽然在文档中告诉开发者不要有这样的想法，但是这又引入了另外一个问题：既然告诉用户不要像`v-bind`
那样使用`v-bind.sync`，又告诉用户用法类似`v-model`，那么为什么不能成为`v-model`的一部分呢？

所以希望通过合并sync修饰符到v-model中来解决上述困惑。（既然两者并没有本质的区别，而且还存在功能上的重叠，为什么不将两者合并暴露出一个API呢？既减少了用户的学习成本，也可以减少打包体积）

# 拓展

## 表单元素与事件

- text 和 textarea 元素使用 value property 和 input 事件；
- checkbox 和 radio 使用 checked property 和 change 事件；
- select 字段将 value 作为 prop 并将 change 作为事件。

## 原生input事件与change事件之间的区别

### input事件

当一个 `<input>`, `<select>`, 或 `<textarea>` 元素的 value 被修改时，会触发 input 事件。

- 值只要发生改变便会触发input事件

### change事件

当用户更改 `<input>`、`<select>` 和 `<textarea>` 元素的值时，会触发change事件，但是并不是每次值改变都会触发`change`事件

- 可输入`<input>`元素的值发生改变并且失去焦点后，才会触发`change`事件(
  例如：编辑了input的值之后，鼠标点击除input之外的位置，此时input失去焦点)
- 可选的`<input>`、`<select>`以及`<input type='file'>`、`<input type='date'>`的值发生改变时，触发`change`事件

Vue提供了v-model的lazy修饰符来区分change事件以及input事件

```vue

<template>
  <input type="text" v-model.lazy="onChange">
</template>
```
