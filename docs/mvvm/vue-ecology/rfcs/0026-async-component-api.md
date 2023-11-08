# 异步组件api

## 概览

介绍一个定义异步组件的API。

## 基础用例

```js
import {defineAsyncComponent} from "vue"

// simple usage
const AsyncFoo = defineAsyncComponent(() => import("./Foo.vue"))

// with options
const AsyncFooWithOptions = defineAsyncComponent({
    // 加载函数
    loader: () => import("./Foo.vue"),
    loadingComponent: LoadingComponent,
    errorComponent: ErrorComponent,
    delay: 200,
    timeout: 3000
})
```

## 动机

根据[RFC-008](0008-render-function-api-change.md)介绍的那样，在vue3中，纯函数将会被当作函数式组件对待。异步组件必须明确通过API函数定义。

## 详细设计

### 简单用法

```js
import {defineAsyncComponent} from "vue"

// simple usage
const AsyncFoo = defineAsyncComponent(() => import("./Foo.vue"))
```

`defineAsyncComponent`可以接收一个返回`promise`对象并`resolve`出对应组件的`loader`函数。

- 如果解析的是一个ES模块，那么模块的`default`导出会被解析为实际的组件。
- 与2.x版本的不同点：注意loader函数是没有resolve和reject入参的，而是必须返回一个`promise`对象

对于loader函数中需要依赖自定义resolve和reject的代码，下面的对比是直接的：

```js
// 之前
const Foo = (resolve, reject) => {
}

// 之后
const Foo = defineAsyncComponent(() => new Promise((resolve, reject) => {
}))
```

### 其他使用方式

```js
import {defineAsyncComponent} from "vue"

const AsyncFooWithOptions = defineAsyncComponent({
    loader: () => import("./Foo.vue"),
    loadingComponent: LoadingComponent,
    errorComponent: ErrorComponent,
    delay: 100, // default: 200
    timeout: 3000, // default: Infinity
    suspensible: false, // default: true
    onError(error, retry, fail, attempts) {
        if (error.message.match(/fetch/) && attempts <= 3) {
            retry()
        } else {
            fail()
        }
    }
})
```

- `delay`和`timeout`功能和vue2保持一致。

#### 与2.x版本的不同之处：

- component属性被换成了loader属性，接收一个与简单用例中一致的函数。
- 在2.x版本，带有选项的异步组件被定义为：

```ts
() => ({
    component: Promise<Component>
    // ...other options
})
```

在3.x版本变成了这样：

```ts
defineAsyncComponent({
    loader: () => Promise<Component>
    // ...other options
})
```

- 2.x版本的`loading`和`error`属性名被更改为了`loadingComponent`和`errorComponent`表达的更为准确。

### 重试开关

这个新的`onError`选项提供了一个由于loader函数抛出异常自定义重试行为的hook

```js
const Foo = defineAsyncComponent({
    // ...
    onError(error, retry, fail, attempts) {
        if (error.message.match(/fetch/) && attempts <= 3) {
            // retry on fetch errors, 3 max attempts
            retry()
        } else {
            fail()
        }
    }
})
```

注意retry/fail类似于promise对象中的resolve/reject：在处理错误时，它们之中的一个必须被调用才可以继续。

### 与Suspense一起使用

在3.x版本中的异步组件默认是`suspensible`
。这意味着如果在父组件链中存在`<Suspense>`组件，那么它将会被认为是`<Suspense>`
组件的异步依赖。这种情况下，它的loading状态将会由`<Suspense>`控制，它自己的`loading`、`error`、`delay`、`timeout`将会被忽略。

当然它也可以选择退出`<Suspense>`的控制，通过指定`suspensible:false`来自行控制loading状态。

## 采取的策略

- 语法转换是重复性的，可以通过一个代码模板演示。其中最大的挑战是如何判断哪个纯函数应该作为异步组件对待。一些基本的启发：
    - 返回动态导入`.vue`文件的箭头函数
    - 动态导出返回带有`component`属性的箭头函数

注意这并不能100%覆盖

- 在兼容版本中，应该尽可能去检查函数式组件的返回值并且警告遗留的异步组件用法。这应该能覆盖所有的基于`promise`的用例
- 唯一无法在2.x版本被轻易检查出的用例是使用`resolve/reject`，而不是返回一个`promise`对象。此类情况需要手动升级，但这种情况应该相对较少。



