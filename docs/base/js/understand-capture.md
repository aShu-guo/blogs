# 理解eventListener中的options

本文主要探讨事件绑定中的capture、

为元素绑定事件时可以通过`addEventListener`

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <title>addEventListener</title>
  </head>
  <body>
    <button id="btn"></button>
    <script>
      addEventListener(document.getElementById('btn'), callback, {
        capture: false,
        once: false,
        passive: false,
      });
    </script>
  </body>
</html>
```

## passive

在Chrome 51，Firefox 49发布的新特性中支持事件绑定设置passive选项，主要用来解决移动设备中滚动卡顿的问题。

通常passive的默认值为false，当设置为true时表明回调中不会使用`preventDefault`阻止事件的默认行为，立刻执行滚动而无需等待事件回调的执行。

在现代浏览器中，会开启一个滚动线程确保设备具有丝滑的滚动效果（尤其是基于触摸的设备），即使同时主线程中运行着复杂的JS任务。

但是当在touchstart、touchmove、wheel事件绑定回调事件时，这种优化手段便达不到预期的效果，只有当事件回调逻辑执行完毕之后才会继续进行滚动，视觉效果上为浏览器滚动卡顿。

`{ passive: true }`与`preventDefault()`同时使用，如果同时使用了，则会抛出异常

```text
Unable to preventDefault inside passive event listener invocation.
```

## capture

事件传递机制包含3个阶段：

- 捕获阶段
- 目标阶段
- 冒泡阶段

浏览器默认在冒泡阶段处理事件回调，当设置`{ capture: true }`时则会在捕获阶段处理事件

## once

顾名思义，只会执行一次的事件，执行完之后会立刻销毁

参考：

【1】[Passive event listeners](https://github.com/WICG/EventListenerOptions/blob/gh-pages/explainer.md)

【2】[MDN#addEventListener](https://developer.mozilla.org/zh-CN/docs/Web/API/EventTarget/addEventListener#%E4%BD%BF%E7%94%A8_passive_%E6%94%B9%E5%96%84%E6%BB%9A%E5%B1%8F%E6%80%A7%E8%83%BD)

【3】[demo](https://rbyers.github.io/janky-touch-scroll.html)
