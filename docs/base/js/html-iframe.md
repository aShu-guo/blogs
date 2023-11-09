一、干什么用的

1.内嵌网页，可用于广告

2.前端早期用于发送异步请求，不用重新打开页面，随着各种异步解决方案出现，这种方式逐渐被废弃



二、怎么用的

1.获取iframe的window对象

1.1 通过选择器获取iframe，再获取内容

iframe.contentWindow, 获取iframe的window对象
iframe.contentDocument, 获取iframe的document对象



1.2 window.frames['name']返回的是window对象

给定iframe一个name属性值，通过window.iframes['name']获取



2.iframe获取父级内容

```js
window.parent //获取上一级的window对象，如果还是iframe则是该iframe的window对象
window.top //获取最顶级容器的window对象，即，就是你打开页面的文档
window.self //返回自身window的引用。可以理解 window===window.self(脑残)
```



3.跨域iframe窗口间通信问题

![img](https://p1-jj.byteimg.com/tos-cn-i-t2oaga2asx/gold-user-assets/2017/2/10/3e56ecd82b4142f612883fb77e5a9a48~tplv-t2oaga2asx-watermark.awebp)

通常情况下，窗口通信无法跨域，但是可以通过postMessage进行跨域通信

```js
// 前置条件：弹出框没有被阻止且加载完成
window.postMessage(message, targetOrigin, [transfer]) 
// message: MessageEvent.data
// targetOrigin: 用于匹配接收消息的窗口

```



三、怎么实现的

......

四、有哪些优缺点

缺点分为两个部分：

​	性能差：重绘、重排

​	安全性：点击劫持

自己的页面被攻击者iframe，通过设置iframe的透明度或者一些诱导图片、文字这些视觉上的欺骗诱导用户点击



五、缺点有哪些优化方式

性能方面：天生的，无法优化

安全性：防止自己的页面被别人iframe

1.通过window.top判断是否被iframe

```js
window.top===window // 限定你的网页不能嵌套在任意网页内，也包括自己网站内的页面
top.location.host!==window.localtion.host // 同源的页面可以iframe

```

2.sandbox

h5新增sandbox属性，控制iframe页面的权限





3.服务端限制

​	2.1 X-Frame-Options

​		DENY： 当前页面不能被嵌套到iframe中

​		SAMEORIGIN： 同源域名可嵌套

​		ALLOW-FROM：可以在指定的origin url的iframe中加载

​	

​	2.2 Content Security Policy



六、有没有产出