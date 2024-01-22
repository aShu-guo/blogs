# 异步

JS不像计算密集型的程序，例如科学计算和机器学习模型，它是典型的事件驱动程序（发布-订阅模式），只有在用户触发后才会去执行。

- ES6新增了Promise
- ES2017新增了async、await
- ES2018中引入了异步迭代器和for/await循环

以上特性支持开发者将异步代码写成同步的形式

## callback

在上述异步解决方案出现之前，JS异步一直通过回调的形式存在，因此也衍生出了许多关于回调的面试题：什么是回调地狱（callback hell）？如何解决回调地狱问题？

### 定时器

JS提供了两种定时器：`setTimeout`、`setInterval`

setTimeout的使用场景是延迟执行回调函数

```js
// 延迟1000ms后执行回调函数
setTimeout(() => {
  console.log(123);
}, 1000);
```

setInterval的使用场景是定时执行回调函数，例如：轮询、定时刷新

```js
// 每隔1000ms执行一次回调函数
setInterval(() => {
  console.log(123);
}, 1000);
```

### 事件

客户端JS编程几乎全是事件驱动的，通过`addEventListener`在元素上注册事件

```js
const element = document.querySelector('.container');
element.addEventListener('click', () => {
  console.log('u click!');
});
```

### 网络事件

当需要进行网络请求，并且在请求响应之后执行的回调

```js
function getCurrentVersionNumnber(versionCallback) {
  let request = new XMLHttpRequest();
  request.open('GET', 'http:www.example.com/api/version');
  request.send();

  // 请求响应的回调
  request.onload = function () {
    if (request.status === 200) {
      let currentVersion = parseFloat(request.responseText);
      versionCallback(null, currentVersion);
    } else {
      versionCallback(request.statusText, null);
    }
  };

  // 请求出现错误、超时的回调
  request.onerror = request.ontimeout = function (e) {
    versionCallback(e.type, null);
  };
}
```

客户端代码通过`XMLHttpRequest`发起网络请求，不过在现代客户端的JS中多数情况下是使用fetch api来替代发起网络请求的。

### node中的回调和事件

Node的服务器JS环境底层就是异步的，定义了许多回调和事件的API，例如读取文件的模块-fs

Node中绑定事件与客户端中不同，是通过`on`而不是`addEventListener`

## promise

虽然可以通过回调函数的方式进行异步操作，但是容易出现回调地狱，且难以处理错误。虽然在处理错误时，可通过层层向上传递错误堆栈信息，但是这样非常麻烦，而且容易出错。

ES6引入Promise对象来解决回调函数中出现的问题：

- 针对回调地狱问题，提供了链式调用方案
- 针对难以进行错误处理的问题，提供了统一的catch捕获机制

promise支持传入一个executor函数，入参是两个函数，分别是`resolve`、`reject`：

- 执行`resolve`函数则是将promise状态从`pending -> fulfill`时调用
- 执行`reject`函数则是将promise状态从`pending -> reject`时调用

```js
getJSON('/api/user/profile').then(displayUserProfile);
```

虽然可以在第二个参数中处理异常，但是大多数情况下只传入一个参数。通过使用.catch()捕获异常，这样更符合传统的方式

```js
getJSON('/api/user/profile').then(displayUserProfile, handleProfileError);
```

```js
getJSON('/api/user/profile').then(displayUserProfile).catch(handleProfileError);
```

如果两者同时出现时，则会忽略catch子句，将异常抛给then的第二个参数

```js
new Promise((resolve, reject) => {
  reject();
})
  .then(
    () => {
      console.log(111);
    },
    () => {
      console.log(222);
    },
  )
  .catch(() => {
    console.log(333);
  });

// 222
```

:::info
为什么说异步计算的错误很难捕获？

同步计算出错时会抛出一个异常，该异常会沿着调用栈向上一直传播到一个处理它的catch字句。

而异步计算出错时，它的调用栈已经出栈了，根本没有办法向调用者抛出异常
:::

### 链式调用

链式调用方案是为了解决回调地狱问题的，使用场景是多个异步操作相互依赖，后一个异步操作依赖上一个异步操作的结果

一个错误的链式调用的例子：使用fetch API请求数据

```js
fetch('/api/user/profile').then((response) => {
  response.json().then((profile) => {
    displayUserProfile(profile);
  });
});
```

这种使用方式显然违背了Promise的设计初衷，本来是要解决callback hell的，但是在使用中又变成了嵌套，因此应该修改为

```js
fetch('/api/user/profile')
  .then((response) => {
    return response.json(); // return出一个promise对象
  })
  .then((profile) => {
    displayUserProfile(profile);
  });
```

![img.png](/imgs/base/js/promise.png)

### resolve promise

本章主要解释resolved与fulfill的区别：

- 对于一个promise对象，resolved执行的同时promise对象就变成fulfill了
- 对于多个链式调用的promise对象，只有当所有对象的resolved执行了，才能称它们的状态变为了fulfill了（类似Promise.all()）

### 错误处理

处理错误有两种形式：.catch(errorHandler)、.then(null, errorHandler)，但是建议使用前者来捕获异常。

同时需要注意的是，使用场景不同，错误处理的方式不同：

1. 后者依赖前者，并且在前者抛出异常时`不再继续执行`

```js
startAsyncOperation()
  .then(doStageOne)
  .then(doStageTwo)
  .catch(logStageOneAndTwoErrors);
```

2. 后者依赖前者，并且在前者抛出异常时`继续执行`

```js
startAsyncOperation()
  .then(doStageOne)
  .catch(logStageOneError)
  .then(doStageTwo)
  .catch(logStageTwoError);
```

::: info
由于前端主要通过网络发生请求，在复杂的网络环境中，可能会出现网络波动导致偶发问题，可以通过如下方式进行重试：

```js
queryDatabase()
  .catch(() => {
    // 如果发生了网络波动，重试
    return wait(500).then(queryDatabase);
  })
  .then(displayTable)
  .catch(displayDatabaseError);
```

:::

### 并行

JS提供了三种并行的方式，分别是`Promise.all()`、`Promise.allSettled()`、`Promise.race()`

1. Promise.all()

接受一组promise对象，只有当所有promise的状态`都变为fulfill`时（注意是`都`），这顶层的promise对象的状态才会变为`fulfill`，相当于电路中的串联

![img.png](/imgs/base/js/promise-3.png)

![img.png](/imgs/base/js/promise-1.png)

2. Promise.allSettled()

接受一组promise对象，当所有promise的状态变为`fulfill或reject`时，这顶层的promise对象的状态会变为`fulfill`，并且会将每个promise的`执行状态和结果`返回

![img.png](/imgs/base/js/promise-2.png)

3. Promise.race()

接受一组promise对象，返回第一个状态变为`fulfill`的执行结果

```js
const promise1 = new Promise((resolve, reject) => {
  setTimeout(resolve, 500, 'one');
});

const promise2 = new Promise((resolve, reject) => {
  setTimeout(resolve, 100, 'two');
});

Promise.race([promise1, promise2]).then((value) => {
  console.log(value);
  // Both resolve, but promise2 is faster
});
// Expected output: "two"
```

![img.png](/imgs/base/js/promise-4.png)

### 串行

promise串行指的是：在上一个promise对象执行完毕之后（无论是fulfill还是reject）再去执行下一个promise

链式调用提供了实现promise串行的思路，总结起来有两种方式：`循环（多米诺骨牌形式）`和`递归（俄罗斯套娃形式）`

![img.png](/imgs/base/js/promise-5.png)

1. 循环创建

```js
const promises = [
  new Promise((resolve) => {
    console.log(1);

    resolve(1);
  }),
  new Promise((resolve, reject) => {
    console.log(2);

    reject();
  }),
  new Promise((resolve) => {
    console.log(3);

    resolve(3);
  }),
];

function loop() {
  const body = [];

  let p = Promise.resolve(undefined);

  for (let i = 0; i < promises.length; i++) {
    p = p
      .then(() => promises[i])
      .then((res) => {
        body.push(res);
      })
      .catch(() => {
        body.push(null);
      });
  }

  p.then((res) => {
    console.log(body);
  });
}

loop();
```

2. 递归创建

## async和await

ES2017引入，用来简化promise的使用，使异步编程更加简便。

### await

await接收一个promise对象，并返回它的resolve值或者异常。

要注意的是，await并不是阻塞JS进行，它仍是异步的。

### async

await关键字需要搭配async使用，标志这个函数是异步函数。

```js
const test = async () => {
  const result = await Promise.resolve(123);
  console.log(result);
};
test(); // 123
```

但是当需要执行多个异步操作时，之间没有相互依赖关系时，应该使用Promise.all发起并行请求

```js
// 发起getJSON1请求会 阻塞到 前一个请求响应回来之后才会去执行
async function getData() {
  const response = await getJSON();
  const response1 = await getJSON1();
}

function getData() {
  const [response, response1] = Promise.all([getJSON(), getJSON1()]);
}
```

### 实现细节

ES2017解释器是将函数体分割成一系列独立的子函数，每个子函数都将被传给位于它前面的以await标记的那个promise对象的then函数中

对于Babel而言，plugin的转换规则不同，[底层的原理也是不同的](https://www.cnblogs.com/chris-oil/p/10747527.html)，例如：`plugin-transform-async-to-generator`插件的编译原理是将async/await转换为promise+generator

:::info

1. 对于plugin-transform-async-to-generator，`async/await`代码转换为ES5的原理是什么？

本质是将异步操作拆分为多个子函数，并生成一个个相互嵌套的promise对象

2. 为什么在编译后的代码中常看到switch...case子句呢？

因为generator是ES6引入的，为了模拟generator（ES6的polyfill）而实现的一个步进器

:::

参考：

【1】[ES6 transpilation ES5(Babel.js)](https://jstool.gitlab.io/babel-es6-to-es5/)

【2】[Babel 是如何转换 async/await 的？](https://quickapp.vivo.com.cn/await-async-transformation/#toc-2)

【3】[Let’s get serious about ES6 generator functions.](https://facebook.github.io/regenerator/)
