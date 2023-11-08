# 准备篇

添加了`scoped`属性的`style`标签标识样式只会作用与当前单文件组件，如果想影响子组件的样式，需要在选择器之前添加`::v-deep`
或者 `/deep/`

## scoped的原理是什么？

vue官方提供了vue-loader处理单文件组件（single file component），其中处理css时：

- 如果style标签中有scoped属性，则会为style标签中selector添加属性选择器，只作用于当前组件

```vue

<template>
  <div class="example">hi</div>
</template>

<style scoped>
.example {
  color: red;
}
</style>

```

输出：

```vue

<template>
  <div class="example" data-v-xxxxx>hi</div>
</template>

<style scoped>
.example[data-v-xxxxx] {
  color: red;
}
</style>

```

- 如果通过:v-deep标记了selector影响子组件，那么会将属性选择器添加在selector前面来影响子组件样式：

```vue
<!-- son.vue -->
<template>
  <div class="son-box">
    <span class="son-title">子组件</span>
  </div>
</template>
```

```vue
<!-- parent.vue -->
<template>
  <div class="parent-box">
    <Son></Son>
  </div>
</template>
<script>
import Son from './son.vue'

export default {
  components: {Son}
}
</script>
<style scoped>
.parent-box {
  color: red;
}

::v-deep .son-title {
  font-size: 50px;
}
</style>

```

输出：

```vue

<template>
  <div data-v-xxxxx class="parent-box">
    <div data-v-xxxxx data-v-yyyyy class="son-box">
      <span data-v-yyyyy class="son-title">子组件</span>
    </div>
  </div>
</template>
<script>
import Son from './son.vue'

export default {
  components: {Son}
}
</script>
<style scoped>
.parent-box[data-v-xxxxx] {
  color: red;
}

[data-v-xxxxx] .son-title {
  font-size: 50px;
}
</style>
```

- 子组件的根节点样式会同时受父组件和子组件影响，原因是为了方便布局时，父组件控制子组件根元素的样式

![img.png](/imgs/vue-rfcs/scoped-style.png)
