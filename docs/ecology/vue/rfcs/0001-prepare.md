# 准备篇

## slot的两种类型

在本篇开始之前，首先再复习下slot相关的知识点，可以将slot理解为一个`占位符`

在vue2时，vue可以根据是否有名称将slot分为两种slot：`默认slot`以及`具名slot`
；也可根据是否包含作用域（scope），分为：`作用域插槽`和`非作用域插槽`

作用域slot的功能与它的名字类似：在slot中提供一个作用域，供插槽中的内容使用

::: warning 警告 ⚠️

`slot` `slot-scope`语法在vue 2.6之后标记为废弃，并在vue 3中完全移除

:::

## 基于2.5版本的代码

### 默认slot

1. 首先在组件中声明slot

```vue
<!-- Foo.vue -->
<template>
  <div>
    我是Foo组件
    <!--  默认插槽，隐式的带有name="default"  -->
    <slot></slot>
  </div>
</template>
```

2. 在使用Foo组件时

```vue
<!-- Home.vue -->
<template>
  <Foo>
    <div>我是默认slot</div>
  </Foo>
</template>
```

页面为：
![img.png](/imgs/vue-rfcs/slot-1.png)

### 具名slot

1. 首先在组件中声明slot，只需要在slot中新增一个name props指定slot的名称

```vue
<!-- Foo.vue -->
<template>
  <div>
    我是Foo组件
    <slot name='one'></slot>
  </div>
</template>
```

2. 在使用Foo组件时

```vue
<!-- Home.vue -->
<template>
  <Foo>
    <div slot="one">
      我是名字为one的slot
    </div>
  </Foo>
</template>
```

页面为：
![img.png](/imgs/vue-rfcs/slot-2.png)

## 作用域slot

将slot转变为作用域slot时，只需要通过传递props的方式传递给slot即可

1. 首先在组件中声明slot

```vue
<!-- Foo.vue -->
<template>
  <div>
    我是Foo组件
    <slot :age="25"></slot>
    <slot name='one' :age="23"></slot>
  </div>
</template>
```

2. 在使用Foo组件时

```vue
<!-- Home.vue -->
<template>
  <Foo>
    <div slot-scope="params">我是默认slot，我的scope为：{{params}}</div>
    <div slot="one" slot-scope="params">
      我是名字为one的slot，我的scope为：{{params}}
    </div>
  </Foo>
</template>
```

页面为：
![img.png](/imgs/vue-rfcs/slot-3.png)

