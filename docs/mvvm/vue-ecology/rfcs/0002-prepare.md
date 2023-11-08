# 准备篇

在本篇中引入`#`作为v-slot的简写，例如[0001-准备篇](/vue-ecology/rfcs/0001-准备篇.md)的例子：

## 代码基于2.6版本

- 默认插槽

1. 首先在组件中声明slot

```vue
<!-- Foo.vue -->
<template>
  <div>
    我是Foo组件
    <!--  默认插槽，隐式的带有name="default"  -->
    <slot :age="25"></slot>
  </div>
</template>
```

2. 在使用Foo组件时

```vue
<!-- Home.vue -->
<template>
  <Foo #default="params">
    {{params}}
    <div>我是默认slot</div>
  </Foo>
</template>
```

![img.png](/imgs/vue-rfcs/slot-short-2.png)

- 默认插槽与作用域插槽组合使用

1. 首先在组件中声明slot

```vue
<!-- Foo.vue -->
<template>
  <div>
    我是Foo组件
    <!--  默认插槽，隐式的带有name="default"  -->
    <slot :age="25"></slot>
    <slot name="one" :age="27"></slot>
  </div>
</template>
```

2. 在使用Foo组件时

```vue
<!-- Home.vue -->
<template>
  <Foo>
    <template #default="params">
      {{params}}
      <div>我是默认slot</div>
    </template>

    <template #one="params">
      {{params}}
      <div>我是name为one的slot</div>
    </template>
  </Foo>
</template>
```

![img.png](/imgs/vue-rfcs/slot-short-1.png)

## 代码基于3.0版本

此时在使用时可以直接省略默认插槽的`default`

```html

<template>
    <Foo #="params">
        {{params}}
        <div>我是默认slot</div>
    </Foo>
</template>
```

