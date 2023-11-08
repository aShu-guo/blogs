# 准备篇

## 什么是Transition

Vue2内置的提供动画功能的组件，在四种状态下提供过渡动画：

- v-if
- v-show
- 动态组件
- 组件根结点

## 提供了那些Hook和内置类名？

当没有指定`<Transition>`的`name`props时，默认类名前缀为`v-`。并且内置了以下类型：

- v-enter：进入过渡的开始状态
- v-enter-active：进入过渡时的状态
- v-enter-to：进入过渡的结束状态，在元素被插入DOM之后的下一帧生效，并移除v-enter
- v-leave：离开过渡的开始状态
- v-leave-active：离开过渡生效的状态
- v-leave-to：离开过渡的结束状态

  ![img.png](/imgs/animation/vue-transition.png)

也可以不按照Vue约定的规范使用`前缀+自定义类名`的风格，用户可以通过`<Transition>`的props指定：

- enter-class
- enter-active-class
- enter-to-class (2.1.8+)
- leave-class
- leave-active-class
- leave-to-class (2.1.8+)

## 可以管理哪些情况下的过渡

### 单个元素或者组件的过渡

常规用法即可：指定name，添加对应name的类名

### 初始渲染的过渡

设置节点初始渲染的过渡，需要首先添加`appear`props

可以通过两种方式：

1. 指定类名（这里进入过渡和离开过渡的类名相同）

- appear-class
- appear-to-class
- appear-active-class

2. 指定钩子

- v-on:before-appear
- v-on:appear
- v-on:after-appear
- v-on:appear-cancelled

### 多个元素的过渡

用于`v-if/v-else`切换的元素，但是对于相同标签名的元素切换时需要指定key

#### 过渡时元素为什么会同时出现？

因为在过渡时，一个元素的离开过渡和另一个元素的进入过渡会同时重绘，即**进入和离开同时发生**

解决这个问题，可以通过

1. 两个元素在相同的位置上
2. 使用transform做转换
3. 指定过渡模式：添加`mode`props


- in-out：新元素先进行过渡，完成之后当前元素过渡离开。
- out-in：当前元素先进行过渡，完成之后新元素过渡进入。

### 多个组件的过渡

通过动态组件实现，无需指定`key`

### 列表的过渡（多节点的过渡）

`<transition-group>`相对于`<transition>`的有以下不同：

1. 它可以改变定位`transform`
2. 过渡模式不可用，无法指定`mode`
3. 内部需要指定唯一的key
4. 会以真实的DOM出现，默认是`<span>`，当然也可以通过`tag`props指定

#### 如何平滑的过渡列表

新增v-move类名，当然也可以指定`move-class`来添加`transform`属性的过渡状态，用于支持添加进行过渡时的样式。



