# 准备篇

按键修饰符分为两部分：按键码keyCode、系统修饰键（自定义组合按键）

## 按键码

提供了监听用户键盘操作的能力，并且内置了绝大多数常用的按键码的别名：

- .enter
- .tab
- .delete (捕获“删除”和“退格”键)
- .esc
- .space
- .up
- .down
- .left
- .right

```vue

<template>
  <input type="text" @keyup.enter="handleChange">
</template>
```

任意`KeyboardEvent.code`中的值转化为`kebab-case`形式都可以做作为按键码修饰符。

### `KeyboardEvent.code`的一部分

![img.png](/imgs/vue-rfcs/keycodes.png)

```vue
<!-- 按中键盘数字8时会执行handle逻辑 -->
<template>
  <input type="text" @keyup.digit8="handleChange">
</template>
```

### 自定义keyCode别名

也可以通过配置API：`config.keyCodes`自定义keyCode数值

```vue
<!-- 按中键盘数字8时会执行handle逻辑 -->

<template>
  <div @keyup.110="handle"></div>
</template>
<script>
import Vue from 'vue'

Vue.config.keyCodes.digit8 = 110
export default {}
</script>
```

## 系统修饰键（自定义组合按键）

```vue
<!-- 触发的按键中包含鼠标左键+ctrl键 便会触发执行handleClick -->
<template>
  <div @click.ctrl="handleClick"></div>
</template>
```

### 更加精确的控制事件触发

exact修饰符

```vue
<!-- 只有 按了鼠标左键+ctrl+alt这3个按键才会触发执行，不能多按也不能少按 -->
<template>
  <button @click.ctrl.exact.alt.exact="handleClick"></button>
</template>
```





