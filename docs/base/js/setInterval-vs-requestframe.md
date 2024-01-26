# setInterval vs requestAnimationFrame

定时执行的任务与`requestAnimationFrame` api比较

## 功能

`setInterval`中为宏任务，在执行到`setInterval`时会推入的宏任务队列，在微任务执行完毕之后才回去执行宏任务。

由于`EventLoop`机制，导致`setInterval`的执行事件间隔并不是准确的，会受`微任务队列执行的时长`、`CPU load`等影响。

执行第一次宏任务`setInterval`回调之后，主线程开始执行微任务，如果微任务没有执行完毕，那么下次宏任务的执行时机会延迟，并不会按照传入的时长去执行

## requestAnimationFrame 是宏任务还是微任务？

在宏任务`前`新增一个微任务，`后`新增一个`requestAnimationFrame`

- 如果`requestAnimationFrame`是微任务

则输出：微任务 -> requestAnimationFrame -> 宏任务

- 如果`requestAnimationFrame`是宏任务

则输出：微任务 -> 宏任务 -> requestAnimationFrame

```js
const promise = new Promise((resolve) => {
  console.log('promise');
  resolve();
});

promise.then((res) => {
  console.log('promise then');
});

setTimeout(() => {
  console.log('setTimeout');
});

requestAnimationFrame(() => {
  console.log('requestAnimationFrame');
});

/*
如果是 微任务，输出顺序微：
promise
promise then
requestAnimationFrame
setTimeout
 */
/*
如果是 宏任务，输出顺序微：
promise
promise then
setTimeout
requestAnimationFrame
 */
```

可知`requestAnimationFrame`是宏任务，那么既然是宏任务，为什么不会出现时长延迟的问题？

简单来说，即使两者都是宏任务，但是执行时机不同，`setTimeout`执行时机早于`requestAnimationFrame`

![img.png](/imgs/base/setInterval-vs-requestframe.png)

在页面重新绘制之前有渲染时机的判断`Rendering opportunities`，用来减少不必要的渲染。也就是说，如果`setTimeout`
回调执行了多次之后，浏览器发现还不到渲染时机，那么便不会执行重绘。例如在1帧之内执行多次`setTimeout`，并不会立刻渲染，这会导致渲染的DOM出现掉帧

参考：

【1】[requestAnimationFrame 执行机制探索](https://segmentfault.com/a/1190000040945949)

【2】[8.6 Timers](https://html.spec.whatwg.org/multipage/timers-and-user-prompts.html#dom-settimeout)
