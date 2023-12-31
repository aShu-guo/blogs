# 架构上的思考

## 关于产品和技术实现上的思考

作为技术，对于产品设计更多的是考虑如此设计在技术上是否是合适的。但是如此思考便会进入一个误区：总是根据技术实现的难度来确定产品设计是否合理。很明显这是这两个并不相干。

技术不应该是产品实现的限制，应该尽可能的去满足合理的需求。但是如何确定产品设计是合理，我认为这并没有一个合理的标准，如果非要说，应该是用户用起来舒服的产品是合理的。所以必然会经历一个摸石头过河的过程。

那么在这个过程中，也会出现很多不合理的设计。

因为需求是多变，而技术对于需求往哪个方向变化其实是并不能预知的，所以在做项目设计时，需要考虑如何才能使项目更加灵活，而不是去跟产品部门撕逼。但是对于不合理的需求也要及时的说不。

## 关于页面复用的思考

在之前对于一些功能、交互大致相同的详情页，自己总是直接复用页面。现在看来，我认为不应该直接复用页面，应该封装为可复用的组件。原因如下：

1. 组件复用相对于页面复用更加灵活，而且页面复用会存在面包屑展示问题
2. 复用页面，也就意味着大量if...else逻辑会放在一个页面组件中，导致代码可读性差
