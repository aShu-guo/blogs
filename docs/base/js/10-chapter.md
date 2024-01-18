# 模块

模块化编程的目标是能够用不同作者和来源的代码模块`组装`成大型程序。实践中，模块化的作用主要体现在：

- 封装和隐藏私有实现细节
- 保证不污染全局命名空间

因此模块之间不会意外修改各自定义的变量、函数和类

在JS没有内置模块化解决方案的年代，大型项目主要利用`类`、`对象`和`闭包`的弱模块化能力。而且由于打包工具的支持，`基于闭包的模块化方案`在实践中成为主流，核心是使用Node的`require()`函数，但是JS官方并没有采纳。

在ES6时，官方提供了export、import的模块化解决方案，虽然近年来浏览器和Node都已经实现，但是在实践中仍需要依赖打包工具。

JS的模块化方案可以大致分为以下3类：

- 基于类、对象和闭包的模块
- Node中使用require()的模块
- ES6的export、import和import()的模块

## 基于类、对象和闭包的模块

类的一个重要特性，是它们可以充当自己方法的模块（act as modules for their methods）。

导出class：

```js
const BitSet = (function () {
  function isValid(set, n) {...}
  return class BitSet extends AbstractWritableSet{
    ...
  }
})();
```

导出API：

```js
const stats = (function () {
  const sum = (x, y) => x + y;

  function mean(data) {
    return data.reduce(sum) / data.length;
  }
  return { mean };
})();

console.log(stats.mean([1, 3, 5, 7, 9])); // 5
```

在暴露出API的同时，也隐藏了实现细节

:::info
文中提到：类的一个重要特性，是它们可以充当自己方法的模块（act as modules for their methods），那么如何理解这句话呢？

可以将模块理解为一个积木，它对外提供了接口和方法方便调用方使用，并且支持可拔插的。类作为模块的一种实现方式，它可以更小的粒度（方法层面）控制模块。
:::

### 基于闭包的自动模块化

将多个模块打包到一个文件中

```js
const modules = {};
function require(moduleName) {
  return modules[moduleName];
}

modules['sets.js'] = (function () {
  const exports = {};

  // The contents of the sets.js file go here:
  exports.BitSet = class BitSet {};
  return exports;
})();

modules['stats.js'] = (function () {
  const exports = {};

  // The contents of the stats.js file go here:
  const sum = (x, y) => x + y;
  const square = (x) => x * x;

  exports.mean = function (data) {};
  exports.stddev = function (data) {};

  return exports;
})();
```

使用时：

```js
// Get references to the modules (or the module content) that we need
const stats = require('stats.js');
const BitSet = require('sets.js').BitSet;

// Now write code using those modules
let s = new BitSet(100);
s.insert(10);
s.insert(20);
s.insert(30);

let average = stats.mean([...s]); // average is 20
```

:::info
这也是webpack和Parcel的基本工作原理
:::

## Node中的模块

## ES6中的模块

JS官方在ES6中通过添加import、export关键字提供了模块化支持

在常规的脚本中，顶级声明的变量、函数会在其他脚本中访问，例如在`<script>`中声明全局变量，但是在模块中只能访问自己的私有上下文

ES6中的模块自动应用严格模式，意味着无需显示写`use strict`，而且也无法使用with语句、arguments对象或未声明的变量。

ES中的严格模式相对于`use strict`又更加严格，例如：ES6模块中全局作用域中的this为`undefined`

<<< @/base/js/codes/module.js

<<< @/base/js/codes/module.html{13-18}

### export

用于导出常量、变量、函数或类

```js
export const NOT_FOUND = 404;
export const name = 'xiaoming';
export function sayHello() {
  console.log('hello world');
}
export class Student {}
```

也可以合并起来导出一个对象

```js
export { NOT_FOUND, name, sayHello, Student };
```

同时也提供了`export default`语法，导出匿名模块

```js
export default function () {}
```

模块中可以同时存在多个常规导出（export）和一个默认导出（export default），而且export关键字`只能`出现在`顶级作用域`，`不能`出现在`函数作用域`或`块作用域`中

### import

1. 如果导入的模块是默认导出，则有：

```js
import BitSet from './sets.js';
```

2. 如果导入的模块是常规导出，则有：

```js
import { NOT_FOUND } from './test.js';
```

ES6不支持`import { NOT_FOUND } from 'test.js`，因为这是有歧义的：是导入当前目下的文件，还是第三方的依赖呢？，但是webpack并没有限制这种用法，不过不建议这样使用

3. 当一个模块有`许多常规导出`而且又需要`同时使用`这个模块中的多个导出时，可以导出这个模块中的所有：

<<< @/base/js/codes/export.js

<<< @/base/js/codes/import.js

4. 也可以同时导入默认导出和常规导出：

```js
import Histogram, { mean, stddev } from './histogram-stats.js';
```

5. 如果该模块没有任何导出，也可以导入

```js
import './analytics.js';
```

### 重命名

导出时重命名

```js
export { sayHello as say };
```

导入时重命名

```js
import { say as sayHello } from './test.js';
```

也可以同时导入默认导出和常规导出时重命名：

```js
import { default as Test, say as sayHello } from './test.js';
```

### 再导出

再导出多用于：用户只需要模块中的某个函数，因此只需要暴露出指定API而无需暴露出整个模块。有两种方式：导入后再导出，直接导出

1. 导入后再导出

```js
import { NOT_FOUND } from './test.js';
export { NOT_FOUND };
```

2. 直接导出

导出指定API

```js
export { NOT_FOUND } from './test.js';
```

导出整个模块

```js
export * from './test.js';
```

将`某个模块的常规导出`作为`当前模块的默认导出`再导出

```js
export { sayHello as default } from './test.js';
```

将`某个模块的默认导出`作为`当前模块的常规导出`再导出

```js
export { default as sayHello } from './test.js';
```

将`某个模块的默认导出`作为`当前模块的默认导出`再导出

```js
export { default } from './test.js';
```

### 在网页中使用

ES6模块具有一个很有用的特性：每个模块的导入都是`静态的`，只需要导入`入口文件`便会`自动加载`入口文件中的模块。

这点我们可以在诸多`支持工程化`的项目中看到，例如使用`npm create vite@latest`创建的项目

```html
<!-- index.html -->
<script type="module" src="/src/main.ts"></script>
```

#### 执行时机

添加了`type="module"`的脚本，执行时机像添加了`defer`脚本那样，延迟到DOM加载完毕之后再去执行

#### 兼容性

支持`<script type="module">`的浏览器必须也支持`<script nomodule>`

- 当支持ES Module的浏览器加载模块脚本时，则会`忽略`掉`<script nomodule>`的脚本，而`不去执行`它
- 不支持ES Module的浏览器加载模块脚本时，由于无法识别`<script nomodule>`，而`去运行`脚本

为了兼容IE11，可以使用Bale、Webpack等工具将代码转换为非模块化ES5代码，放在`<script nomodule>`中来加载性能没有那么高的转换代码。

#### 跨域

常规脚本支持跨域，可以加载任意网络脚本；

```js
<script src="https://unpkg.com/vue@3/dist/vue.global.js"></script>
```

但是模块脚本是不支持跨域的，只能加载与当前html相同域下的脚本。但是可以通过以下方式解决：

- 在服务器上添加适当的CORS header允许资源跨域

而且也不支持在开发模式（development）下通过`file://URL`的方式来测试ES6模块，例如导入的json、img等静态资源等，就需要在本地起一个静态服务器（devServer）来测试

目前市面上大多数主流框架，例如react、vue等都是通过在开发环境中启动devServer来测试ES模块的

#### 后缀

对于浏览器而言，脚本的后缀是`无关紧要的`。无需通过`.mjs`和`.js`来区分`模块脚本`和`常规脚本`，浏览器关注的是`MIME`，需要保证Web服务器和.js文件的MIME相同。

```js
// 在浏览器中加载静态资源
import img from './module.png';
```

![img.png](/imgs/base/js/module-1.png)

对于Node而言，脚本后缀则是`重要的`，原因是：`需要根据脚本后缀判断使用了哪种模块系统`。如果希望写的脚本可以在Node中加载，则需要将脚本后缀改为.mjs

### import()

由于Web都是通过网络加载资源，而不是文件系统。在网络波动的情况下，大脚本文件下载缓慢导致网站无法及时正常渲染（首屏加载问题），因此为了网站的性能考虑，需要将大文件拆分为多个文件，只有在需要它的时候再进行加载，也就是`懒加载`

在ES Module没有出现之前，则是通过DOM API通过`动态生成script标签`来加载文件。

虽然浏览器很早支持了动态加载脚本，但是JS却一直没有支持动态导入。终于，在ES2020中引入了`import()操作符`来支持动态加载资源

```ts
const test: Promise = import('./test.js'); // 异步的，并且返回一个promise对象
```

### import.meta.url

在浏览器中，指向当前执行模块的路径

![img.png](/imgs/base/js/module.png)

```js
console.log(import.meta.url);
// http://localhost:63342/notes/docs/base/js/codes/module.js
```

在Node中则对应的是file://URL

使用场景是在一个 JavaScript 模块中，通过相对路径我们就能得到一个被完整解析的静态资源 URL

```js
function getImageUrl(name) {
  return new URL(`./dir/${name}.png`, import.meta.url).href;
}
```

这可以在浏览器中`原生使用`，例如：

module.png图片与模块文件在相同目录下，由于ES模块的安全策略，`无法`直接通过`import关键字`导出，需要如此加载：

```js
const img = new URL('./module.png', import.meta.url);
```

参考：

【1】[MDN#import.meta](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Operators/import.meta)

【2】[Vite官方文档#new URL(url, import.meta.url)](https://cn.vitejs.dev/guide/assets.html#new-url-url-import-meta-url)
