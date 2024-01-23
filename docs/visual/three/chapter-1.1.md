# gsap

它是一个专业的动画库，内容非常多，经常用到的是to、from等API

## 初始化

```js
import gsap from 'gsap';

const anmi = gsap.to(cube.position, {
  y: 5,
  duration: 3,
  ease: 'power1.in',
  repeat: -1,
  yoyo: true,
});
```

## 常用方法

- gsap.to()：这是一种最常用的tween动画，就是让元素从`初始状态`变化到`目标状态`。
- gsap.from()：让元素从`目标状态`变化到`初始状态`，与to函数的变化方向是相反的。

要注意的是，频繁调用from函数触发动画时，初始状态是会改变的。

- gsap.fromTo()：需要自己定义两个状态的数据，然后从`前一个`变化到`后一个`。
- gsap.set()：直接设置成想要的状态，`没有任何过度与动画效果`。本质上就是duration为0的 .to 方法

## 属性

- y：变化的属性，不一定是属性y，可以是DOM元素的任意属性，例如transform、rotation、scale等等
- yoyo：循环往复的运动，类似悠悠球，0->1->0之间都有动画过渡
- repeat：重复运动，从0到1重复，只有0到1之间有过渡动画，从1到0之间没有动画
- ease：指定过渡动画
- duration：动画执行时长
