# 准备篇

## attribute 与 property

- 从词源来看
    - attribute更偏向于解释为：将原本不属于自己的某个属性指派给自己（mdn翻译为标签属性）
    - property更偏向于解释为：与生俱来的属性（mdn翻译为属性）
- 从是否可变来看
    - attribute更偏向于是不可变的，反映的是初始值，而且可以通过setAttribute && getAttribute自定义
    - property更偏向于是可变的，反映的是当前值，但是不能自定义

> 两者并不是一一映射的
![img.png](/imgs/vue-rfcs/attribute-vs-property.png)

## 两者在vue中的应用

props中声明的属性不是attribute也不是property，只有传入非props声明的属性时而且未设置`inheritAttrs: false`才会在添加到子组件的根节点上。

参考：

[1] [vue-透传Attributes](https://cn.vuejs.org/guide/components/attrs.html#disabling-attribute-inheritance)

[2] [angular-HTML Attribute 和 DOM Property](https://angular.cn/guide/binding-syntax#html-attribute-vs-dom-property)

[3] [前端杂谈: Attribute VS Property](https://juejin.cn/post/6844903712721387534)
