背景image引发的BFC问题



由背景图产生的一个BFC问题

1.精灵图

一种优化多图片网页性能的方式；将多张图片放在一张图片上，通过backgroud-image以及background-position做偏移来定位目标图片；

```css
.main-box{
    background: url("../../../../assets/images/servicecode/background.png") no-repeat;
		 background-position: 0 -65;
}
```

background-position中的值表示为：x y

x表示相对于原来位置左（负）右（正）移动的值

y表示相对于原来位置上（负）下（正）移动的值

以图片左上角为原点位置



2.BFC（block format context）

BFC是一个只有block-level的box参与的布局环境，内部的元素不受外部影响，垂直的按照父元素的边框排列



特性：

--垂直的沿着父元素边框排列

--同一个BFC中的元素会产生margin塌陷

--浮动的时候，每个盒子的左margin与包含块的左border相接处

--计算BFC高度时，浮动元素也参与计算（激活BFC，解决子元素浮动造成的父元素高度塌陷）



激活方式：

--overflow不为visible

--float不是none



--position不是static或者relative

--display值为flex、inline-block





> #### background

```css
.main{
  background: url("/static/img/规上服务业@2x.1f1293e.png") 0% 0% / 100% 100%;
}
等价于
.main{
  background: url("/static/img/规上服务业@2x.1f1293e.png");
  background-size: 100% 100%;
}
```





