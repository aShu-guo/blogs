# 加密与hash

简单介绍加密算法的种类和如何区分加密与hash，两者都是算法

## hash

hash又称为散列函数、散列算法。可以有效的将明文压缩形成摘要，所以也可以称为摘要函数。

hash的特点：hash后的文本长度固定；不可逆。

不可逆的原因是：明文与hash后的文本对应关系是多对1，也就是说一个hash值对应多个明文。那么便会存在hash冲突

### hash冲突

- 拉链法：java-hashmap便是如此实现的

其他方法可以参考[解决哈希冲突的常用方法分析](https://cloud.tencent.com/developer/article/1672781)

### 多重hash

将多个hash算法组合使用，减少穷举的可能。

### 常见的hash算法

- sha-1
- sha-256
- sha-512
- md5

## 加密

加密的特点：加密后的文本长度不固定，与明文长度相关；可逆。

根据加密/解密密钥是否相同可以分为两类：

1. 对称加密：加密/解密共用同一密钥
2. 非对称加密：加密/解密共用不同密钥，分为公钥/密钥。这在数据传输中广泛使用

## 使用场景

1. 主要根据是否可逆来判断是使用hash还是加密。ex：用户注册时希望不可逆，那么就选用hash；如果希望用户可以看到自己的密码，那么就选用加密
2. 也可根据是否需要压缩来判断，hash具有压缩功能，在传输完成后通过比较`传输前的摘要`和`传输后的摘要`可以有效判断是否被篡改。

参考：

【1】[哈希(Hash)与加密(Encrypt)的基本原理、区别及工程应用](https://www.cnblogs.com/leoo2sk/archive/2010/10/01/hash-and-encrypt.html)

【2】[解决哈希冲突的常用方法分析](https://cloud.tencent.com/developer/article/1672781)

【3】[加密](https://zh.wikipedia.org/zh-hans/%E5%8A%A0%E5%AF%86)

【4】[散列函数](https://zh.wikipedia.org/wiki/%E6%95%A3%E5%88%97%E5%87%BD%E6%95%B8)


