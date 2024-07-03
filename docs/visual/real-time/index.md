# 实时通信技术

对于前端开发者来说，实时与后端通信的技术主要分为3种，分别是：

- 定时轮询接口
- web socket
- event stream

## 定时轮询接口

顾名思义，这种方式通过定期检查服务器是否有新信息，而不是接收自动更新。

在实践中，前端通过`setInterval`或者`RFA（requestFrameAnimation）`每隔一段事件请求一次接口，底层是基于HTTP协议的。优点是上手很快，而且对于后端、前端代码的侵入很小，缺点非常明显--资源损耗大

## web socket

在 RFC 6455 规范中描述的 WebSocket 协议，提供了一种在浏览器和服务器之间建立持久连接来交换数据的方法。数据可以作为“数据包”在两个方向上传递，而无需中断连接也无需额外的
HTTP 请求。

支持客户端和服务端全双工通信，这意味着服务器和客户端都可以在任何时候发送消息。由于其全双工特性，适用于需要服务器和客户端双向实时交互的应用场景，如在线游戏、聊天应用等。

有其自己的独立协议（即 `ws://` 和 `wss://`），其中`wss://`是基于 TLS 的 WebSocket，类似于 HTTPS 是基于 TLS 的
HTTP。可以发送任意数据格式，如文本、二进制等。大多数现代浏览器都支持WebSocket。但是如果连接中断，客户端需要手动实现重连逻辑。

## event stream

event stream是一种支持服务端单向通信的技术，只支持半双工通信，只允许服务器向客户端发送消息。而且它使用的是标准HTTP协议。不像web
socket那样断连后需要客户端手动重连，它内置自动重连功能。如果连接断开，浏览器会尝试重新连接。消息通常是UTF-8编码的文本。在兼容性方面，虽然大多数现代浏览器都支持SSE，但例如Internet
Explorer和一些版本的Edge不支持。

在探索ChatGPT的使用过程中，我们发现GPT也是采用了流式数据返回的方式，即event stream

参考：

【1】[现代JavaScript教程-WebSocket](https://zh.javascript.info/websocket)

【2】[MDN-WebSocket](https://developer.mozilla.org/zh-CN/docs/Web/API/WebSocket)
