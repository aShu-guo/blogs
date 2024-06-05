# 问题

在用@vue/cli开发前端项目时， 可以通过

```shell
npm run serve
```

启动一个本地服务，服务启动后会提示一个网址，在浏览器中输入该网址便可查看开发中的vue页面。

在将前端项目部署时，则会通过

```shell
npm run build

```

将项目文件构建到一个目录，通常时`dist`目录，此目录下包含`index.html`以及相关的资源文件（js, css, img）等。

有时我们需要在本地对dist目录进行预览，但直接双击index.html打开文件，会发现页面是一片空白。F12查看控制台会发现报了“net::
ERR_FILE_NOT_FOUND”的错误。

## 原因

直接双击`index.html`打开文件，是以file://协议打开的，但默认构建时，一般是针对服务器构建的。

也就是说，dist 目录需要启动一个 HTTP服务器来访问 ，以 file:// 协议直接打开 dist/index.html 是不会工作的。

当然，如果在构建前，已经将 publicPath配置为了一个相对的值，那么构建后也是可以直接双击index.html打开文件进行本地预览的。

## 本地预览dist目录

知道了原因就好办了，可以有多种方法来在本地预览构建后的dist目录。在本地预览生产环境构建最简单的方式就是使用一个 Node.js
静态文件服务器，例如serve或http-server。

### serve

安装serve

```shell
npm install -g serve

```

运行serve提供服务

```shell
serve -s dist

```
运行成功后，会提示服务的网址，一般是http://localhost:5000，访问这个网址，即可在本地预览构建后的dist目录内容。

### http-server

安装http-server

```shell
npm install http-server –g

```
运行http-server提供服务

```shell
hs dist

```
运行成功后，会提示服务的网址，一般是http://127.0.0.1:8080，访问这个网址，即可在本地预览构建后的dist目录内容。

### 通过修改publicPath进行本地预览

修改项目根目录下的vue.config.js文件（如果没有就自行创建），在 vue.config.js 里设置publicPath为相对路径'./'：

```js
// vue.config.js
module.exports = {

  publicPath: './',

};
```

再运行npm run build重新构建项目。这时，直接双击dist目录下的index.html在浏览器打开文件就可以进行本地预览了。（ 注：baseUrl 从Vue CLI 3.3 起已弃用，要使用publicPath ）
