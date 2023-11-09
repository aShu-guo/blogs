# 过渡 - transition

本文主要介绍transition的使用方法，不深入浏览器原理。

## 它提供了什么能力？

允许开发者改变css属性值时更加平滑

## 如何使用？

创建一个过渡状态，必须满足两点：

- 想要添加过渡的css属性；
- 过渡时长。

注意：如果没有指定过渡时长，那么`transition`没有效果，会立刻触发。

```css
div {
    width: 100px;
    height: 100px;
    background: red;
    transition: width 2s;
}
```

`transition`会从css属性`width`发生变化时开始。

```css
div:hover {
    width: 300px;
}
```

## 可以设置哪些属性？

### transition-timing-function

可以指定DOM过渡状态的速度

![img.png](/imgs/animation/timing-func.png)

提供了一些内置的过渡函数：ease、ease-in、ease-out等。也提供了另外两种函数实现自定义的过渡速度：三次贝塞尔曲线、steps函数。

#### 三次贝塞尔曲线

cubic-bezier(n1,n2,n3,n4) 三次贝塞尔曲线可以通过两个控制点来绘制，而(n1,n2)是第一个控制点的坐标，(n3,n4)
是第二个控制点的坐标。通过调整两个控制点的坐标来绘制不同的曲线。在Css中，贝塞尔曲线被放置在一个1*
1的正方形中，那么意味着n1、n2、n3、n4最大值不能超过1，但是允许负值。

![img.png](/imgs/animation/cubic-bezier.png)

[在线绘制](http://web.chacuo.net/css3beziertool)

#### steps函数

![img.png](/imgs/animation/steps.gif)

```css
div {
    /*跳过起始位置，到达终点过程中走4步*/
    transition-timing-function: steps(4, jump-start);
    /*跳过终点位置，到达起始点过程中走10步*/
    transition-timing-function: steps(10, jump-end);
    /*都不跳过，起始点(包含)和终点(包含)间中走20步*/
    transition-timing-function: steps(20, jump-none);
    /*都跳过，起始点(不包含)和终点间(不包含)中走5步*/
    transition-timing-function: steps(5, jump-both);
}
```

### transition-delay

延迟transition执行时间。

```css
div {
    transition-delay: 1s;
}
```

### transition-property

指定哪个css属性发生改变时，执行过渡状态。

```css
div {
    transition-property: width, height, visibility;
}
```

### transition-duration

transition执行时长

```css
div {
    transition-duration: 3s;
}
```
