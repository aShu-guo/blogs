# 鉴权的几种方式

## JWT模式

在服务端渲染的页面是不能访问localStorage的，所以只能通过Cookie判断用户登录态。

如果之前使用JWT模式，并且存储token到localStorage中的校验登录态，则需要调整为存入Cookie中。

JWT模式中的token使用方式：

- 登录用户用账号、密码换取的token，在客户端保存时既可以放在`Cookie`中，又可以放在`localStorage`中
- token中间用`.`隔开分成3段，`Header.Payload.Signature`存放有关token类型、加密方式、签发方式等信息
- 再次请求接口时，需要将token带回服务端。既可以将token放在`Cookie`中（会存在跨域），又可以放在请求头的`Authorization`中

缺点：

- token一旦签发，有效期只与失效时间有关，除非服务端添加额外的逻辑。
- 默认不加密，需要传输敏感数据时则应加密

### 前端实践

1. 用户输入账号、密码以及验证码（可选），请求登录接口时，响应给客户端token。
2. 客户端将token存储到localStorage中，并设置有效期，可如此设计：

```json
{
  "token": "xxxxxx",
  "start": "设置时的时间戳",
  "expire": "有效时长"
}
```

并且如果前端中有状态管理模块（vuex||pinia），那么也需要将token同步更新到该模块中，如此在代码中验证用户是否为登录态时只需要与该模块交互即可。

3. 在request拦截器中将token设置到请求头上。
4. 在全局路由守卫中判断token是否有效，有效则跳转，无效则跳转至403页面。

## session-cookie验证

在这种方式下，客户端和服务端验证两者相互验证的是sessionId。这种方式下，前端参与度并不高。

只需要将服务端返回的唯一标识sessionId存到cookie中，在向服务端发送请求时会自动携带当前域名下的Cookie，如此服务端便可以判断发送请求的用户是否为登录状态。

优点：

简单、快捷

缺点：

由于cookie存在跨域问题，所以如果需要多个系统对接如此设计的登录模块时会存在跨域问题。

### 前端实践

1. 用户输入账号、密码以及验证码（可选），请求登录接口时，响应给客户端sessionId。
2. 客户端将sessionId存储到Cookie中。

## OAuth2 开放验证

引用阮一峰博客的一句话：

```text
简单说，OAuth 就是一种授权机制。数据的所有者告诉系统，同意授权第三方应用进入系统，获取这些数据。系统从而产生一个短期的进入令牌（token），用来代替密码，供第三方应用使用。
```

目前OAuth2已经被标准化了，被google、github、microsoft等公司广泛使用，用于开发者调用他们提供的API。

1. 第三方系统在开放平台（例如google api console）中备案，获取客户端id和客户端密钥，简称客户端凭证。并且需要添加回调地址（第三方系统内部的页面），用于获取code
2. 第三方系统的用户登录时，重定向到开发平台提供的网页中，用户确认后从资源所有者（Resource Owner）获取code并跳回第一步中填入的回调链接
3. 在回调链接对应的页面拿code向Authorization server换取token
4. 后携带token向资源服务器请求目标资源。

以上只是简化后的OAuth2.0协议的简化步骤，更多的可以参考[OAuth2 RFC6749](https://colobu.com/2017/04/28/oauth2-rfc6749/#1-2-_%E5%8D%8F%E8%AE%AE%E6%B5%81%E7%A8%8B)

参考：

【1】[OAuth 2.0 的一个简单解释](http://www.ruanyifeng.com/blog/2019/04/oauth_design.html)
