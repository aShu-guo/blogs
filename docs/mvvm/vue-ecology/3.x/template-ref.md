# 模板引用

3.x的模板引用语法与2.x版本不同，在2.x版本只需要在需要引用的组件上添加`ref`props即可调用方法和设置属性，但是在3.x中，需要使用特定的语法。

## 使用setup

一个父组件无法访问到子组件中的任何东西，除非子组件在其中通过 `defineExpose` 显式暴露

```vue
<!-- Search.vue -->
<template>
  <div class="search-box"></div>
</template>
<script lang="ts" setup>
import {defineExpose} from 'vue'

const submit = async () => {
  return Promise.resolve('我被提交了')
}
defineExpose({
  submit
})
</script>
```

```vue

<template>
  <Search ref="searchRef"></Search>
</template>
<script lang="ts" setup>
import {ref} from 'vue'
import Search from './Search/index.vue'

// 变量名需要与组件中的ref属性值保持一致
const searchRef = ref<InstanceType<typeof Search> | null>(null);

</script>
```

## 不使用setup

需要保证在子组件的setup函数中返回 暴露出的属性

```vue
<!-- Search.vue  -->
<template>
  <div class="search-box"></div>
</template>
<script lang="ts">

export default {
  setup() {
    const submit = async () => {
      return Promise.resolve('我被提交了')
    }
    return {
      submit
    }
  }
}
</script>
```

```vue

<template>
  <Search ref="searchRef"></Search>
</template>
<script lang="ts">
import {ref} from 'vue'
import Search from './Search/index.vue'

export default {
  setup() {

// 变量名需要与组件中的ref属性值保持一致
    const searchRef = ref<InstanceType<typeof Search> | null>(null);
  }
}

</script>
```
