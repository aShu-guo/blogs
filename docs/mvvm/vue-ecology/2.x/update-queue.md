# update队列

```
queue // 存放watcher，队列
callbacks // 存放全局回调

调用链：
update->queueWatcher->nextTick->timerFunc->
```

> watcher批量更新

在一个函数作用域内执行了响应式属性的set操作，**触发dep来通知watcher更新视图**。但是并**不是同步的**，而是**第一次**
触发了watcher更新视图时，**会开辟一个微任务队列**，此时并不会执行，在当前同步代码执行完毕之后，再去查找微任务队列去执行视图更新逻辑



> 为什么使用setTimeout开辟一个宏任务会产生奇怪的现象
>
> issue：#7109, #7153, #7546, #7834, #8109

```
requestAnimationFrame具有不确定性？
MutationObserver 监视一个节点，节点发生改变时会触发回调

```
