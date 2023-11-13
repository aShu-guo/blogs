# 序列化与反序列化

序列化是一个将对象转换为二进制流的过程，可以理解为对象的`"快照"`。

反序列化是将二进制流重新展开为对象的过程。

序列化和反序列化在分布式系统中很有用，因为可以保存对象的状态，并且可以通过网络传输。

需要注意的是在序列化时，应该将对象`"快照"`成一个共享的格式，并且格式与平台无关，以便可以在不同平台重新创建对象。

常用的格式是xml和json，当然为了减少空间，还有一些自定义格式。

![img.png](/imgs/server/serialization.png)