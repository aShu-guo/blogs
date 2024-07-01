# SharedWorker

SharedWorker支持多个页面访问同一个worker，并且有同源限制，它接收一个脚本URL以及可选的name。

## 初始化

```js
const worker = new SharedWorker('service.js');
```

## 通信

与SharedWorker的通信是通过显式的 MessagePort 对象完成的。 SharedWorker() 构造函数返回的对象在其端口属性上保存对端口的引用。

```js
worker.port.onmessage = function(event) {
  // todo 
};
worker.port.postMessage('some message');
worker.port.postMessage({ foo: 'structured', bar: ['data', 'also', 'possible'] });
```

在service.js内部使用onconnect监听连接事件

```js
onconnect = function(event) {
  var newPort = event.source;
  // set up a listener
  newPort.onmessage = function(event) {
    // todo 
  };
  // send a message back to the port
  newPort.postMessage('ready!'); // can also send structured data, of course
};
```

## 使用场景

:::info
如果我们需要调试SharedWorker，可以在浏览器地址栏中输入`chrome://inspect/#workers`，这样就可以看到当前页面中的SharedWorker。

点击`inspect`则会自动弹出一个控制台，控制台上输出的是worker中打印的文本

![img.png](/imgs/visual/real-time/index-1.png)

:::

### 在两个同源页面之间通信

需要将port实例存入map中，方便存取

```js
// worker.js
import { md5 } from 'js-md5';

const ports = new Map();

self.onconnect = (event) => {
  const port = event.source;

  // set up a listener
  port.onmessage = function(event) {
    const { type, data } = event.data;
    const rawKey = md5(data.key);
    switch (type) {
      case 'init':
        if (!ports.get(rawKey)) {
          ports.set(rawKey, port);
        }
        break;
      case 'unmounted':
        ports.delete(rawKey);
        break;
      case 'broadcast':
        const channel = ports.get(rawKey);

        if (channel) {
          channel.postMessage(data.data);
        }
        break;
    }
  };

  // send a message back to the port
  port.postMessage('ready!'); // can also send
};
```

在每个页面中首先执行postMessage，触发worker保存key和对应的MessagePort实例

```js
// index.vue
const worker = new SharedWorker(new URL('./worker.js', import.meta.url), { type: 'module' });

worker.port.onmessage = (event) => {
  console.log('>>>event:', event);
};
worker.port.start();

worker.port.postMessage({ type: 'init', data: { key: 'index.vue' } });

const count = ref(0);

const { pause } = useRafFn(
  () => {
    worker.port.postMessage({ type: 'broadcast', data: { key: 'index2.vue', data: count.value++ } });
  },
  {
    immediate: true,
    fpsLimit: 1,
  },
);
```

```js
// index2.vue
const worker = new SharedWorker(new URL('./worker.js', import.meta.url), { type: 'module' });
worker.port.onmessage = (event) => {
  console.log('>>>event:', event);
};

worker.port.postMessage({ type: 'init', data: { key: 'index2.vue' } });
onUnmounted(() => {
  worker.port.postMessage({ type: 'unmounted', data: { key: 'index2.vue' } });
});
```
