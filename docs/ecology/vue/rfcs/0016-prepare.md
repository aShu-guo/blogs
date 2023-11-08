# 准备篇

inline-template提供了无需修改`.vue`文件便可以重写模板的能力，而且可以直接使用子组件的上下文，类似css的行内样式

```html
<!-- css的行内样式 -->
<div style="color: red;background: blue;width: 100px;height: 100px"></div>
```

## 如何使用

**必须定义在DOM内**

```vue
<!--foo.vue-->
<template>
  <div>我是{{ name }}文件</div>
</template>

<script>
export default {
  name: "Foo",
  data: () => {
    return {
      name: "Foo",
    };
  },
};
</script>

```

```vue

<template>
  <div class="main-box">
    <Foo inline-template>
      <div>我是重写后的行内模板 {{ name }}</div>
    </Foo>
    <Foo/>
  </div>
</template>

<script>
import Foo from "./foo.vue";

export default {
  name: "HelloWorld",
  components: {Foo},
};
</script>
```

![img.png](/imgs/vue-rfcs/inline-template.png)

## 它有哪些优缺点

优点

- 更加了灵活的定义template
- 更方便的改写第三方组件库而无需更改它的源码

缺点

- 上下文作用域难以理解，例如：父组件与子组件定义了相同的变量名，在inline-template中使用时其实使用的是子组件中的变量，但是看着像是使用的是父组件中的变量。

