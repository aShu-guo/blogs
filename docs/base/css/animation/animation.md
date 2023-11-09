# 动画 - animation

animation可以使一个元素从一个样式慢慢变化为另外一个样式

你想使用多少个过渡样式就可以使用多少个

在使用animation时需要事先定义一些keyframe

keyframe控制元素在确切时间下要展示的样式

## @keyframes、animation-name、animation-duration

只有在绑定到元素上时才有效果（通过animation-name指定）

:::warning
animation-duration有值而且大于0时才有效果，因为默认值为0
:::

## animation-delay

指定动画延迟多久开始执行，允许负值。当值为负值n时，会从运行了n秒后的位置开始运行

## animation-iteration-count

指定动画运行多少次后停止，也可以设置为`infinite`，那么动画会无限运行不会停止

## animation-direction

控制动画的执行方向

- normal: 动画正序执行，默认值
- reverse - 动画倒序执行
- alternate - 动画按照次数交替执行，首先正序执行，而后倒序执行
- alternate-reverse - 动画按照次数交替执行，首先倒序执行，而后正序执行

## animation-timing-function

控制动画执行速度，可设置的值同transition属性transition-timing-function

## animation-fill-mode

在动画的第一帧之前和最后一帧之后，动画并不会影响元素样式。但是这个属性可以覆盖上述行为

- none - 默认值，默认行为
- forwards - 保留最后一帧的样式，依赖`animation-direction`、`animation-iteration-count`
- backwards - 保留第一帧的样式，依赖`animation-direction`
- both - 动画将遵循`forwards`和`backwards`的规则，从而在两个方向上扩展动画属性。
