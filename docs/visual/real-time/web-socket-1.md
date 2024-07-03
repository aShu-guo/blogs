# web socket

要打开一个 WebSocket 连接，我们需要在 url 中使用特殊的协议 ws 创建 new WebSocket：

```js
const socket = new WebSocket("ws://javascript.info");
```

一旦 socket 被建立，我们就应该监听 socket 上的事件。一共抛出4个事件，分别是：

- open：连接已建立，
- message：接收到数据，
- error：WebSocket 错误，
- close：连接已关闭。
