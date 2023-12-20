# viewport

是一种将PC Web页面适配到移动端H5的方案，包含3个概念，分别是visual viewport、layout viewport和ideal viewport

## visual viewport

在浏览器范畴里，它代表的是浏览器中网站可见内容的部分。视口外的内容在被滚动进来前都是不可见的。

概括地说，视口基本上是当前文档的可见部分。

![img.png](/imgs/base/css/viewpoint.png)

可以通过window提供的API获取

```ts
const innerHeight = window.innerHeight;
const innerWidth = window.innerWidth;
```

`innerHeight` 和 `innerWidth` 所组成的区域，这块区域不包括滚动条，但包括任何边框（border）和内边距（padding），即是指可视区域内可用于显示文档的宽度，单位为css逻辑像素。

那么在移动设备上，visual viewport大概等于屏幕的大小

## layout viewport

引入layout viewport主要是解决电脑DIP远大于手机，导致pc web网页在手机上展示时出现被挤变形的问题

![img.png](/imgs/base/css/viewpoint-1.png)

可以通过window提供的API获取

```ts
const clientWidth = document.documentElement.clientWidth;
const clientHeight = document.documentElement.clientHeight;
```

实际使用中可能会有一些兼容问题，这跟DOCTYPE声明有关。不同浏览器默认的layout viewport大小不同，常见的有980px、1024px

## ideal viewport

Layout viewport是为了能将电脑上的网页正确的显示到手机上。而ideal viewport是为了将专门为手机设计的网页正确展示在手机上，它的尺寸相当于屏幕大小，与visual viewport的大小相等

## 移动端适配

layout viewport和ideal viewport都是用来渲染页面的两个盒子，HTML页面渲染在盒子里面，而visual viewport用来查看渲染后的结果的，相当于一个窗口

但是在浏览器实现中并没有那么多盒子，只有一个layout viewport盒子，页面就渲染在这个盒子里，如果我们希望渲染到ideal viewport的盒子里面，那就只要调整这个layout viewport的大小即可

那么如何调整呢？

html5提供的meta标签，可以显示声明viewport

```html
<meta
  name="viewport"
  content="width=device-width, user-scalable=no, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0"
/>
```

- 没有声明viewport的页面

![img.png](/imgs/base/css/viewpoint-2.png)

测试代码如下：

<<< @/base/css/unit/codes/no-viewport.html

- 声明了viewport的页面

![img.png](/imgs/base/css/viewpoint-3.png)

测试代码如下：

<<< @/base/css/unit/codes/viewport.html

两个页面在PC web上展示效果是相同的，但是在移动端上是不同的。这再一次验证了viewport只是为了适配移动端展示PC web页面的而存在的

对于用户体验来说，用户更偏好于垂直滚动，页面上存在需要水平滚动的元素是会导致糟糕的用户体验。

因此，在进行响应式布局设计时，我们应该遵循

1. 不要使用大的、固定宽度的元素
2. 不要让内容依赖于特定的视口宽度来良好渲染
3. 根据@media查询，不同的viewport显示不同的样式

参考

【1】[移动端适配之二](https://juejin.cn/post/6844903943298875406)

【2】[移动端适配之三](https://juejin.cn/post/6844903943298891790)

【3】[MDN viewport meta 标记](https://developer.mozilla.org/zh-CN/docs/Web/HTML/Viewport_meta_tag)

【4】[W3School css responsive](https://www.w3schools.com/css/css_rwd_viewport.asp)
