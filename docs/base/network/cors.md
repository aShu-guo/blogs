# 跨域

跨域限制是`浏览器`独有的安全特点（浏览器的行为，即在服务端构建Http请求访问非同源服务端并不会出现跨域问题），
严格限制**协议、端口、域名**来保证数据的安全。网站的内容可能是从多个服务器中获取资源，

## 为什么浏览器可以加载不同源的图片资源？

明明请求图片资源是get请求，为什么跨域请求资源可以正常响应？原因是浏览器允许一小部分标签可以通过跨域访问，这是历史遗留问题。那么也就意味着可能会存在漏洞，例如iframe的点击劫持

点击劫持：通过诱导用户点击一些功能按钮来达到目的。因为在浏览器登录网页之后，会存有用户的cookie。

防范上诉问题需要服务端设置`X-Frame-Options`，告诉浏览器能不能加载iframe：

- DENY：浏览器禁止加载任何iframe
- SAMEEORIGIN：允许加载同源的iframe
- ALLOW-FROM uri：已废弃

## 什么是源

如果两个URL的协议、端口、域名都相同，那么这两个URL是同源的

### 源的继承

通过data:、javascript:、about:打开的无需包含服务端内容的页面，这些完全由客户端生成的静态页面。那么打开新页面的源是从创建它的脚本那里继承的。

## 哪些是允许的哪些是禁止的？

可以分为三类：

- 跨域写：一般是被允许的。例如链接、重定向以及表单提交（forms）
- 跨域资源嵌入：iframe嵌入跨域资源，但是通过js读取iframe中的DOM是禁止的。
- 跨域读：一般是禁止的。但是可以通过iframe巧妙的解决`postMessage`

### 跨域资源嵌入

- 通过`<img>`展示的图片资源
- 通过`<video>`和`<audio>`播放的多媒体资源
- 通过`@font-face`引入的外部字体资源
- 通过`<iframe>`嵌入的任何资源都可以访问，如果响应头`X-Frame-Options`设置为`DENY`或者`SAMEEORIGIN`，则可能无法访问。
- 通过`<script src="...">`引入的脚本，例如：用于CDN加速引入的第三方依赖
- 通过`<link>`引入的css资源，例如：用于CDN加速引入的antdv的样式资源。需要设置争取的`Content-Type`

## 修改源

通过设置`document.domain`来修改当前源，但是域名必须是上下级关系。例如：在`https://www.aaa.com`
中设置`document.domain=aaa.com`，在访问`https://aaa.com`时将会通过同源检测，同时也必须在`https://aaa.com`
中设置`document.domain=aaa.com`
来表明允许它这样做。

任何对`document.domain`的赋值操作都会导致端口号置为`null`，因此必须要在两者中都设置`document.domain`来保证端口号相同。

但是对于localStorage、indexedDB等web API并不能通过同源检测，而且如果是通过iframe访问也无法通过检测。

### 如何允许跨源资源访问？

服务端设置`Access-Control-Allow-Origin: *`允许所有非同源下的客户端访问。


