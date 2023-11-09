# 认证模块

项目的认证模块是基于token的jwt模式。jwt模式是用户访问服务端受限资源的一种策略

## jwt

如果之前使用JWT模式，并且存储token到localStorage中的校验登录态，则需要调整为存入Cookie中。

JWT模式中的token使用方式：

- 登录用户用账号、密码换取的token，在客户端保存时既可以放在`Cookie`中，又可以放在`localStorage`中
- token中间用`.`隔开分成3段，`Header.Payload.Signature`存放有关token类型、加密方式、签发方式等信息
- 再次请求接口时，需要将token带回服务端。既可以将token放在`Cookie`中（会存在跨域），又可以放在请求头的`Authorization`中

缺点：

- token一旦签发，有效期只与失效时间有关，除非服务端添加额外的逻辑。
- 默认不加密，需要传输敏感数据时则应加密

## refresh token

为了更好的用户体验，不会频繁跳入登录页面。所以在认证之后，也需要响应的提供刷新策略。其中刷新token有多种策略，可以大致分为`服务端主动刷新`
和`客户端主动刷新`，当然也有另外一种并不支持的方式：尽可能延长token有效时间，但是这`非常危险⚠️`

### 服务端主动刷新

服务端在用户访问时判断token是否有效以及剩余有效期，无效或者剩余时间不长，则返回新token给客户端。但是服务端每次都前置判断接口请求的`access_token`
是否有效

可以在guide或者middleware上添加检查`token是否有效以及剩余有效期不足`的判断逻辑：

1. token有效，放行
2. token失效，服务端重新生成token并在本次请求中返回给客户端，客户端需要判断是否为新的token，如果是新token则使用

```js
// server
if (isExpire(token)) {
    return {
        access_token: genToken()
    }
}

// client
if (token !== newToken) {
    header['Authorization'] = newToken
}
```

存在安全隐患：用户一旦登录之后就永久认证了，效果等价于用户拥有一个无限有效时长的token；而且压力都集中在服务端。故不建议在服务端主动刷新token

### 客户端主动刷新

客户端自行判断token是否有效，无效时需要主动请求刷新token接口，注意`refresh`接口只能用于刷新token，不能访问其他资源。

既然需要客户端判断，那么在登录时需要保存token以及有效时长，将token存放到状态管理框架（ex:
pinia）中，并且持久化到`localStorage`中。

```json
{
  "token": "xxxx",
  // 生成token时的时间戳
  "start": 0,
  // 过期时间为10分钟
  "expire": 600000
}
```

判断逻辑需要放在：

- axios的request interceptor
- 路由守卫

为什么也要放在路由守卫中呢？

因为导航到新页面的钩子函数中会存在接口请求，那么既然token已经失效，就没必要再去请求接口。而且对应的响应拦截器中的错误提醒：`this.$message.error(message)`
会被触发多次。

但是客户端存储的token有效时长可能会与服务端不一致，存在10ms～100ms的延迟，这与网络情况有关。

用户在登录时返回两个有效时长不同的token，其中`refresh_token`有效期较长：

```json
{
  "access_token": "xxxx",
  "refresh_token": "yyyy"
}
```

假设`access_token`有效时长为10分钟，而`refresh_token`有效时长为1天。那么在客户端请求到服务端时，如果`access_token`
失效则需要拿着`refresh_token`去服务端换取新的token。

但是如果用户登录之后，没有与客户端交互（ex：闲置隐藏了页面或者去玩游戏了），`refresh_token`与`access_token`双双失效导致用户需要重新登录。

![img.png](/imgs/server/jwt-auth-refresh.png)

#### 轮换refresh token

由于`refresh token`有效时间足够长，那么被泄露时导致的安全问题也是严重的。

攻击者在`access_token`失效时，通过`refresh token`重新获取`access_token`直到`refresh token`失效。

所以应该轮换`refresh token`
，限制它只能使用一次，这也是互联网工程任务组推荐的[策略](https://datatracker.ietf.org/doc/html/draft-ietf-oauth-browser-based-apps-05#section-8)。

举个🌰：

假如我们有一个应用：mobile app，服务端提供一下认证链路：

1. 用户登录，获取一对token：`access_token`和`refresh token`，其中`access_token`有效时长为10分钟，`refresh token`有效时长为2年
2. 10分钟后，`access_token`失效，用户与服务端交互时需要首先刷新token，请求`refresh`接口，再次获取一对`access_token`
   和`refresh token`
3. 服务端销毁旧`refresh token`

![img.png](/imgs/server/refresh-token-rotation.png)

## 注销

jwt token是无状态的，只能在有效期到了才会被销毁，除此之外是无法手动销毁的。那么jwt模式下用户是如何注销的呢？

用户注销时，即使客户端清除了token，在下次与服务端交互时会提示：`未认证`。但是token如果还在有效期，它依然可以用来与服务端交互。

既然无法销毁，那么我们就把非法的token存起来，放到一个`"黑名单"`中，用redis存储再合适不过了。

## 实践

参考：

【1】[使用 Jwt-Auth 实现 API 用户认证以及无痛刷新访问令牌](https://learnku.com/articles/7264/using-jwt-auth-to-implement-api-user-authentication-and-painless-refresh-access-token)

【2】[The Ultimate Guide to JWT server-side auth (with refresh tokens)](https://katifrantz.com/the-ultimate-guide-to-jwt-server-side-authentication-with-refresh-tokens)

【3】[Is refreshing an expired JWT token a good strategy?](https://security.stackexchange.com/questions/119371/is-refreshing-an-expired-jwt-token-a-good-strategy)

【4】[JSON Web Token 入门教程](https://www.ruanyifeng.com/blog/2018/07/json_web_token-tutorial.html)
