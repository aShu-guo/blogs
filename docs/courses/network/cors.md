# 跨域(Cross-origin resource sharing)

跨域限制是`浏览器`独有的安全特点（浏览器的行为，即在服务端构建Http请求访问非同源服务端并不会出现跨域问题），
严格限制**协议、端口、域名**来保证数据的安全。网站的内容可能是从多个服务器中获取资源，

约定：

- `OPTIONS请求`又称为`预检请求`（preflight request）：作用是用来问问服务器是否支持该资源进行跨域访问，是浏览器自动发出的
- 后续发出的请求为`实际请求`，并且实际请求中不会携带`Access-Control-Request-*`标头

## 请求

跨源资源共享机制及其所涉及的 HTTP 标头：

- `Access-Control-Allow-Origin`：用于标识允许访问该资源的域名，它的值要么是请求头中`Origin`字段的值，要么是一个`*`
- `Access-Control-Request-Method`：在进行跨域访问时，浏览器发出预检请求时，告诉服务器实际请求将使用`何种请求方式`
  访问这个资源，例如：GET、POST等等
- `Access-Control-Request-Headers`：用于浏览器在发起预检请求时，告诉服务器在实际请求中可能携带的请求头，例如：content-type
- `Access-Control-Expose-Headers`
  ：默认cors请求中只能访问到6个基本字段：`Cache-Control`、`Content-Language`、`Content-Type`、`Expires`、`Last-Modified`、`Pragma`
  ，如果要增加则需要在该字段中指定
- `Access-Control-Allow-Credentials`：标识实际请求中是否要携带cookie，当被标识为`true`时，字段`Access-Control-Allow-Origin`
  的值不能为`*`
- `Access-Control-Max-Age`：单位：s；服务器告诉浏览器将为它保存预检请求的时长，在这个时长范围内再次请求将不会再次发送预检请求

浏览器将CORS请求分成两类：简单请求（simple request）和非简单请求（not-so-simple request）。

### 简单请求

若请求满足所有下述条件，则该请求可视为简单请求：

- `GET`、`HEAD`、`POST`
- headers 只包含以下字段范围内的
    - `Accept`
    - `Accept-Language`
    - `Content-Language`
    - `Content-Type` 只包含以下类型范围内的
        - `text/plain`
        - `multipart/form-data`
        - `application/x-www-form-urlencoded`
    - `Range`（只允许简单的范围标头值 如 bytes=256- 或 bytes=127-255）
- 如果是`XMLHttpRequest`对象发出并且没有通过`addEventListener`绑定事件监听器的
- 请求中没有`ReadableStream`对象。

更具体的cors安全的字段参考：[cors-safelisted-request-header](https://fetch.spec.whatwg.org/#cors-safelisted-request-header)

必需的字段：

- Access-Control-Allow-Origin <Badge type="danger" text="required" />

#### 请求流程

对于简单请求，浏览器直接发出CORS请求。具体来说，就是在头信息之中，增加一个`Origin`字段。

```http request
GET /cors HTTP/1.1
Origin: http://api.bob.com
Host: api.alice.com
Accept-Language: en-US
Connection: keep-alive
User-Agent: Mozilla/5.0...
```

服务器通过请求头中的Origin字段判断是否在许可范围内（例如：ip白名单），如果：

1. 允许，则将资源响应回浏览器，例如响应头：

```http request
Access-Control-Allow-Origin: http://api.bob.com
Access-Control-Allow-Credentials: true
Access-Control-Expose-Headers: FooBar
Content-Type: text/html; charset=utf-8
```

2. 禁止，则抛出错误，并且响应头中不包含`Access-Control-Allow-Origin`字段

### 非简单请求

非简单请求的CORS请求，会在正式通信之前，增加一次HTTP查询请求，称为"预检"请求（preflight）。如果一个请求不是简单请求，那么它就是非简单请求。

必需的字段：

- Access-Control-Allow-Origin <Badge type="danger" text="required" />
- Access-Control-Allow-Methods <Badge type="danger" text="required" />

#### 请求流程

1. 浏览器先发起OPTIONS请求询问服务器，当前网页所在的域名`是否在服务器的许可名单`之中，以及可以使用`哪些HTTP动词`和`头信息`
   字段。
2. 得到肯定答复，浏览器发出正式的`XMLHttpRequest`请求，否则就报错。

#### 案例

1. 浏览器发出请求：

```js
var url = 'http://api.alice.com/cors';
var xhr = new XMLHttpRequest();
xhr.open('PUT', url, true);
xhr.setRequestHeader('X-Custom-Header', 'value');
xhr.send();
```

2. 浏览器判断出这是一个非简单请求，则首先自动发起一个OPTIONS请求询问服务器，请求头如下：

```http request
OPTIONS /cors HTTP/1.1
Origin: http://api.bob.com
Access-Control-Request-Method: PUT
Access-Control-Request-Headers: X-Custom-Header
Host: api.alice.com
Accept-Language: en-US
Connection: keep-alive
User-Agent: Mozilla/5.0...
```

3. 请求抵达服务器，服务器检验后认为可以放行，则响应头为：

```http request
HTTP/1.1 200 OK
Date: Mon, 01 Dec 2008 01:15:39 GMT
Server: Apache/2.0.61 (Unix)
Access-Control-Allow-Origin: http://api.bob.com
Access-Control-Allow-Methods: GET, POST, PUT
Access-Control-Allow-Headers: X-Custom-Header
Content-Type: text/html; charset=utf-8
Content-Encoding: gzip
Content-Length: 0
Keep-Alive: timeout=2, max=100
Connection: Keep-Alive
Content-Type: text/plain
```

#### 重定向

并不是所有浏览器都支持预检请求的重定向。如果一个预检请求发生了重定向，一部分浏览器将报告错误：

> Access to fetch
> at 'http://xxx.example.com/xx' (
> redirected from 'http://192.168.110.12:8000/api/account/admin/login') from origin 'http://192.168.110.12:8000' has
> been
> blocked by CORS policy: Response to preflight request doesn't pass access control check: No '
> Access-Control-Allow-Origin' header is present on the requested resource. If an opaque response serves your needs, set
> the request's mode to 'no-cors' to fetch the resource with CORS disabled.

在最开始的CORS规范中要求所有浏览器必须具有该行为，但在后续的修订中删除了这个限制（2016年），所以不同浏览器之间会存在差异。

但是，如果在重定向中报错了，可以通过这两种方式解决：

- 在服务端去掉对预检请求的重定向；
- 将实际请求变成一个`简单请求`。

## 拓展

### 存在跨域问题的操作

- 通过`<canvas>`中的`drawImage()`绘制非同源视频或图片
- 通过`XMLHttpRequest`或`Fetch API`发起的请求
- 通过`<video>`和`<audio>`播放的多媒体资源
- 通过`@font-face`引入的外部字体资源
- 通过`<iframe>`嵌入的任何资源都可以访问，如果响应头`X-Frame-Options`设置为`DENY`或者`SAMEEORIGIN`，则可能无法访问。
- 通过`<script src="...">`引入的脚本，例如：用于CDN加速引入的第三方依赖
- 通过`<link>`引入的css资源，例如：用于CDN加速引入的antdv的样式资源

:::danger
⚠️注意：`<img/>`是不包含在内的
:::

### img标签加载图片

明明请求图片资源是get请求，为什么跨域请求资源可以正常响应？原因是浏览器允许一小部分标签可以通过跨域访问，这是历史遗留问题。那么也就意味着可能会存在漏洞，例如iframe的点击劫持

```html
<!--报CORS-->
<script>
  fetch('http://www.imgworlds.com/wp-content/uploads/2015/12/18-CONTACTUS-HEADER.jpg').then(console.log);
</script>;
<!--可以正常展示图片-->
<img src="http://www.imgworlds.com/wp-content/uploads/2015/12/18-CONTACTUS-HEADER.jpg">;
```

#### 点击劫持

通过诱导用户点击一些功能按钮来达到目的。因为在浏览器登录网页之后，会存有用户的cookie。

防范上诉问题需要服务端设置`X-Frame-Options`，告诉浏览器能不能加载iframe：

- DENY：浏览器禁止加载任何iframe
- SAMEEORIGIN：允许加载同源的iframe
- ALLOW-FROM uri：已废弃

### 哪些是允许的哪些是禁止的？

可以分为三类：

- 跨域写：一般是被允许的。例如链接、重定向以及表单提交（forms）
- 跨域资源嵌入：iframe嵌入跨域资源，但是通过js读取iframe中的DOM是禁止的。
- 跨域读：一般是禁止的。但是可以通过iframe巧妙的解决`postMessage`

### 修改源

通过设置`document.domain`来修改当前源，但是域名必须是上下级关系。例如：在`https://www.aaa.com`
中设置`document.domain=aaa.com`，在访问`https://aaa.com`时将会通过同源检测，同时也必须在`https://aaa.com`
中设置`document.domain=aaa.com`
来表明允许它这样做。

任何对`document.domain`的赋值操作都会导致端口号置为`null`，因此必须要在两者中都设置`document.domain`来保证端口号相同。

但是对于localStorage、indexedDB等web API并不能通过同源检测，而且如果是通过iframe访问也无法通过检测。

参考：

【1】[跨域资源共享 CORS 详解](https://www.ruanyifeng.com/blog/2016/04/cors.html)

【2】[MDN-cors](https://developer.mozilla.org/zh-CN/docs/Web/HTTP/CORS#%E8%8B%A5%E5%B9%B2%E8%AE%BF%E9%97%AE%E6%8E%A7%E5%88%B6%E5%9C%BA%E6%99%AF)
