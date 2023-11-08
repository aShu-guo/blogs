> css scoped指南 🧭

作用类似于react推荐的css modules，但是原理不同

添加了scoped的style标签只作用于当前vue组件的template，不会污染全局样式

```vue
<!-- son.vue -->
<template>
  <div class="square"></div>
</template>

<style lang="scss" scoped>
.square {
  width: 100px;
  height: 100px;
  background: red;
}
</style>
```

```vue
<!-- root.vue -->
<template>
  <div class="parent">
    <Son></Son>
  </div>
</template>

<style lang="scss" scoped>
.square {
  background: blue;
}
</style>
```

root做父组件，son做子组件，在root组件中引用son组件。加完scoped的style标签编译之后变成

```html
<!-- 子hash在前，父hash在后（方便覆盖样式） -->
<div data-v-5954443c data-v-9283948c class="parent">
    <div data-v-5954443c class="square"></div>
</div>

<style>
    /* son.vue */
    .square[data-v-5954443c] {
        width: 100px;
        height: 100px;
        background: red;
    }

    /* root.vue */
    .square[data-v-9283948c] {
        background: blue;
    }
</style>
```

加完:v-deep 深度修改子组件样式时

```html
<!-- 子hash在前，父hash在后（方便覆盖样式） -->
<div data-v-5954443c data-v-9283948c class="parent">
    <div data-v-5954443c class="square"></div>
</div>

<style>
    /* son.vue */
    .square[data-v-5954443c] {
        width: 100px;
        height: 100px;
        background: red;
    }

    /* root.vue */
    [data-v-9283948c] .square {
        background: blue;
    }
</style>
```

> 最佳实践

1. 公共组件样式不加scoped，方便被引用时修改默认样式
2. 非公共组件要加scoped，防止污染全局样式

> 总结

|             | ✅父组件有scoped | ❌父组件无scoped |
|:-----------:|:-----------:|:----------:|
| ✅子组件有scoped |  ::v-deep   |  ::v-deep  |
| ❌子组件无scoped |  保证样式优先级最高  |保证样式优先级最高   |

只要子组件有scoped，都必须使用样式深度选择器；反之，只需要保证父组件样式最高即可
