# Web Worker

web worker是指独立于任何用户UI界面，而在后台运行的脚本。它使得长时间运行的脚本不会被响应点击或其他用户交互的脚本（例如click事件）打断，并且允许执行长时间任务而不会产生任何影响以保持页面响应。

简单来说，由于JS是基于EventLoop、单线程的，如果页面是重计算、复交互的，通过使用Worker技术可以将页面更新渲染逻辑与重计算、复交互的逻辑拆分开，这样页面在响应事件时便不会影响页面UI更新渲染。

Worker相对较重，不宜大量使用。一般来说，Worker进程寿命长、启动性能成本高、并且每个实例的内存成本也高。

Worker中不存在window、document等对象，也就意味着禁止在Worker中操作DOM，在其中可以合法使用的API：

- setInterval()
- setTimeout()
- requestAnimationFrame()（仅专用 worker）
- cancelAnimationFrame()（仅专用 worker）

更多参考：[Worker 全局上下文和函数](https://developer.mozilla.org/zh-CN/docs/Web/API/Web_Workers_API#worker_%E5%85%A8%E5%B1%80%E4%B8%8A%E4%B8%8B%E6%96%87%E5%92%8C%E5%87%BD%E6%95%B0)

## 分类

有许多不同类型的 worker：

- 专用 worker 是由单个脚本使用的 worker。该上下文由 DedicatedWorkerGlobalScope 对象表示。
- Shared worker 是可以由在不同窗口、IFrame 等中运行的多个脚本使用的 worker，只要它们与 worker 在同一域中。它们比专用的
  worker 稍微复杂一点——脚本必须通过活动端口进行通信。
- Service Worker 基本上是作为代理服务器，位于 web
  应用程序、浏览器和网络（如果可用）之间。它们的目的是（除开其他方面）创建有效的离线体验、拦截网络请求，以及根据网络是否可用采取合适的行动并更新驻留在服务器上的资源。它们还将允许访问推送通知和后台同步
  API。

## 初始化

创建Worker需要Worker.js文件所在的URL。使用该文件的URL作为其唯一参数来调用`Worker()`构造函数；然后创建并返回一个Worker：

```js
const worker = new Worker('helper.js');
```

这种方式调用返回的Worker是经典脚本形式，意味着在helper.js文件中导入其他脚本时只能通过`importScript()`
的方式。如果希望在helper.js文件中支持ES6 Module，那么在实例化Worker时传入：

```js
const worker = new Worker('helper.mjs', { type: "module" });
```

### Webpack

如果在项目中使用了Webpack，那么需要引入worker-loader来使用Web Worker。

```shell
npm install worker-loader -D
```

1. 内联加载Worker

```js
import Worker from "worker-loader!./Worker.js";
```

2. 非内联加载Worker

```js
// vue.config.js
module.exports = {
  chainWebpack: config => {
    config.module
      .rule('worker')
      .test(/\.worker\.js$/)
      .use('worker-loader')
      .loader('worker-loader')
      .end();

    // 清除worker cache
    // config.module.rule('js').exclude.add(/\.worker\.js$/);
  }
}
```

```js
// app.js
import Worker from "./file.worker.js";

const worker = new Worker();

worker.postMessage({ a: 1 });
worker.onmessage = function(event) {
};

worker.addEventListener("message", function(event) {
});
```

### vue-cli

如果你是使用vue-cli bundler，那么只需要修改上文webpack中vue.config.js文件

```js
module.exports = {
  chainWebpack: config => {
    config.module
      .rule('worker')
      .test(/\.worker\.js$/)
      .use('worker-loader')
      .loader('worker-loader')
      .end();

    // 清除worker loader cache
    // config.module.rule('js').exclude.add(/\.worker\.js$/);
  },
};
```

### Vite

如果使用的是Vite，那么分为两种使用方式：

1. 通过construct导入

```js
const worker = new Worker(new URL('./worker.js', import.meta.url))
```

对应的，如果希望使用ES Module

```js
const worker = new Worker(new URL('./worker.js', import.meta.url), {
  type: 'module',
})
```

:::warning
所有选项参数必须是静态值（即字符串字面量）。
:::

2. 带查询后缀的导入

可以在导入请求上添加 `?worker` 或 `?sharedworker` 查询参数来直接导入一个 web worker 脚本。

```js
import MyWorker from './worker?worker'

const worker = new MyWorker()
```

- `?worker`：表示实例化一个普通Worker
- `?sharedworker`：表示实例化一个SharedWorker

## 通信

实例化Worker之后，脚本通过postMessage与onmessage通信

```js
// app.js
const worker = new Worker('helper.js');

worker.onmessage = function(event) {
  // todo 事件处理逻辑
};
```

```js
// helper.js
worker.onmessage = function(event) {
  // todo 事件处理逻辑
};

worker.postMessage = function(event) {
  // todo 事件处理逻辑
}
```

:::info

在日常开发实践中，在传递data时，建议封装一个标准格式的对象，例如：

```ts
type Data<T> = { type: string, data: T }
```

在onmessage的执行逻辑中区分type执行不同的逻辑：

```js
self.onmessage = (e) => {
  const { data } = e
  if (data.type) {
    switch (data.type) {
      case 'start':
        resume()
        break
      case 'terminate':
        pause()
        break
    }
  }
}
```

:::

## 销毁

立即终止 worker

```js
const worker = new Worker('helper.js');

worker.terminate();
```

## 使用场景

### 轮询接口

在页面中添加一个定时请求空域数据的Worker，保证地图中的`禁飞区`、`适飞区`、`限飞区`范围是最新的。

```js
// airspace.worker.js
// 初始化空域限制
import { useRafFn } from '@/utils/useRafFn'
import { fromLonLat } from 'ol/proj'

const initRealTimeUavList = async () => {
  try {
    const { data = {} } = await xxxxx()
    if (data.data) {
      self.postMessage({
        data: data.data,
      })
    }
  } catch (e) {
    console.error('[real-time worker]:', e)
    self.postMessage({ type: 'error' })
  }
}

// 定时任务
const { pause, resume } = useRafFn(initRealTimeUavList, {
  immediate: false,
  fpsLimit: 1,
})

self.onmessage = (e) => {
  const { data } = e
  if (data.type) {
    switch (data.type) {
      case 'start':
        resume()
        break
      case 'terminate':
        pause()
        break
    }
  }
}

```
