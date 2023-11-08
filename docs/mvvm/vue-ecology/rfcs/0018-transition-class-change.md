# Transition组件类名变更

## 概要

- 重命名v-enter为v-enter-from
- 重命名v-leave为v-leave-from
- 重命名v-appear为v-appear-from

## 基础用例

```css
/* before */
.v-enter, .v-leave-to {
    opacity: 0;
}

/* after */
.v-enter-from, .v-leave-to {
    opacity: 0;
}
```

## 动机

在2.1.8之前，每个过渡方向我们只有两个过渡类名。例如对于进入过渡，我们有`v-enter`和`v-enter-active`
。在v2.1.8，我们引入了v-enter-to来解决进入下一个过渡状态间隔过渡的问题，但是为了向后兼容，v-enter 名称未受影响：

```css
.v-enter, .v-leave-to {
    opacity: 0;
}

.v-leave, .v-enter-to {
    opacity: 1
}
```

`.v-enter`和`.v-leave`的不同步和模糊导致很难阅读和理解。这也是我们想要对他更名的原因：

```css
.v-enter-from, .v-leave-to {
    opacity: 0;
}

.v-leave-from, .v-enter-to {
    opacity: 1
}
```

这样更好的指示了这些类名是如何作用的。

## 详细设计

- 重命名v-enter为v-enter-from
- 重命名v-leave为v-leave-from
- 重命名v-appear为v-appear-from
- `<Transition>`相关的props也需要变更：
    - `leave-class`更名为`leave-from-class` (在渲染函数和JSX中会被重写为leaveFromClass)
    - `enter-class`更名为`enter-from-class` (在渲染函数和JSX中会被重写为enterFromClass)
    - `appear-class`更名为`appear-from-class` (在渲染函数和JSX中会被重写为appearFromClass)

## 采取的策略

在兼容版本中，旧类名很容易被支持，并且抛出警告引导迁移。

