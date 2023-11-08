# 移除transition作为template根结点的支持

## 概要

使用`<transition>`作为组件的根时，不再支持从外部切换组件来触发过渡。

## 基础用例

之前：

```vue
<!-- modal component -->
<template>
  <transition>
    <div class="modal">
      <slot/>
    </div>
  </transition>
</template>

<!-- usage -->
<modal v-if="showModal">hello</modal>
```

之后：暴露一个props来控制

```vue
<!-- modal component -->
<template>
  <transition>
    <div v-if="show" class="modal">
      <slot/>
    </div>
  </transition>
</template>

<!-- usage -->
<modal :show="showModal">hello</modal>
```

## 动机

2.x版本的行为是个意外，但是也有一些奇怪。为了支持这种用例，我们添加了很多修复来保证它可以正常工作，因为一些用户依赖这种方法。但是，从语意上来讲，
这种用法没有意义：根据定义，`<transition>`组件通过改变内部的内容来正常工作，而非它本身

```vue
<!-- this does not work -->
<transition v-if="show">
<div></div>
</transition>

<!-- this is expected usage -->
<transition>
<div v-if="show"></div>
</transition>
```

为了在2.x中支持这个行为，我们在判断初始过渡的状态是造成了很多复杂性。

## 详细设计

在3.0版本，切换`<transition>`作为根的组件并不会触发过渡。相反，组件应该暴露出一个布尔类型的props来控制`<transition>`
内部内容的显隐。

## 缺点

兼容版本中不能同时支持旧行为和新行为。

## 采取的策略

依赖旧行为的用例可以通过静态分析检测出，根据`<transition>`作为根的组件而且内部内容没有使用`v-if`或者`v-show`
来判断。迁移工具将会引导用户更新这些用例。
