## RPC 

在面向对象的编程范式中，RPC 表示为[远程方法调用](https://en.wikipedia.org/wiki/Distributed_object_communication)(RMI)。RPC调用远程方法，编码就像是正常的 ( local) 过程调用，无需显式编码远程交互的细节。但通常它们并不相同，因此可以将本地调用与远程调用区分开来。远程调用通常比本地调用慢几个数量级且可靠性较低。



>  服务调用过程

客户端 --阻塞--> 服务端 --响应执行结果--> 客户端 



> 组成

`RPC` 架构里的四个核心的组件:

1. 客户端（Client），服务的调用方。

2. 服务端（Server），真正的服务提供者。

3. 客户端存根(Client Stub)，存放服务端的地址消息，再将客户端的请求参数打包成网络消息，然后通过网络远程发送给服务方。

4. 服务端存根(Server Stub)，接收客户端发送过来的消息，将消息解包，并调用本地的方法。

   

> 支持**同步调用**和**异步调用**



> 支持多种协议：Dubbo、TCP、hessian



## HTTP

> 发展历程

HTTP/1---1996---TCP/IP协议---一次性连接

HTTP/1.1---1997---TCP/IP协议---除非特殊声明，否则为持久连接

HTTP/2---2015---TCP/IP协议

HTTP/3---2022---QUIC+UDP协议



> HTTP/1.1

```js
Accept-Ranges: bytes
Connection: keep-alive
Content-Length: 1328
Content-Type: text/html; charset=UTF-8
Date: Fri, 15 Jul 2022 02:22:59 GMT
ETag: W/"530-jlbjCd48/D9yGTkCjkNdM+fHPzw"
Keep-Alive: timeout=5
X-Powered-By: Express
```

**Connection: keep-alive** 表示建立了一个持久连接，再次请求会复用



> HTTP/2 多路复用

**HTTP/2是基于二进制“帧”的协议，HTTP/1.1是基于“文本分割”解析的协议。**



HTTP/1.1 需要通过换行符解析内容，而且传输内容长度是不可知的

HTTP/2 通过传入帧数据，服务端知道传输的长度



![image-20220715105236045](https://image-static.segmentfault.com/126/067/1260679140-573002cec3232_fix732)



![image-20220715105236045](https://www.sohamkamani.com/fd191e5f5c0030366117f9cecfbabfa4/interleaving.svg)