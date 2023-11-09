# 概览

## 什么是动画？

动画本质是每帧的图片在快速刷新下形成的，那么在css中便是通过贝塞尔曲线计算出DOM每一帧的运动轨迹，再借助浏览器的快速刷新，以达到DOM动起来的效果。

## 如何用css实现动画效果？

主要通过三种方式实现：transition、Css3中的animation、transform

- transition兼容性
  ![img_1.png](/imgs/animation/transition-compatibility.png)
- animation兼容性（Css 3 提供）
  ![img.png](/imgs/animation/animation-compatibility.png)
- transform 2d && transfrom 3d
![img.png](/imgs/animation/transform-2d.png)
![img.png](/imgs/animation/transform-3d.png)
### transition与animation区别

1. transition提供了一种实现动画的简单方式，只需要关注起始状态和终止状态即可。如果一个元素处于过渡状态，新的过渡状态会立刻从当前样式开始，而不是起始状态开始。
2. animation提供了一个更加灵活的实现动画的方式，可以自定义起始状态和终止状态之间的状态合集（关键帧）。

## 使用js实现动画和css实现动画的区别

- 实现方式不同：js主要借助requestAnimationFrame实现动画，在浏览器绘制下一帧之前调用传入的回调函数。
- 性能大致相同：大多数场景下，基于 CSS 的动画几乎是跟 JavaScript 动画表现一致，但是CSS 动画是更好的选择：
    - 在重绘发生之前，CSS transition 和 animation 在主的 UI 线程仅仅是重新采集元素的样式，这跟通过 requestAnimationFrame()
      回调获取重新采集元素样式是一样的。假如二者都是在主 UI 线程创建的动画，那它们在性能方面没有差异。
    - 只要动画涉及的属性不会触发重排，可以把采样操作移除主线程。最常见的属性是 CSS transform。如果一个元素被提升为一个
      layer，transform 属性动画就可以在 GPU 中进行。这意味着更好地性能。

:::warning
像 CSS transitions 和 animations 一样，当页面在**后台**运行时，requestAnimationFrame() 也会暂停。
:::
