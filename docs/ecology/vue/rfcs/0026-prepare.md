# 准备篇

## 什么是异步组件？

在vue中常见的是同步组件，即通过ES6提供的`import`关键字导入的模块，而通过`import()`动态导入的模块为动态加载

:::warning
`import()`本身就是一个`Promise`对象，所以特性依赖于内置的 `Promise`，在低版本中使用`import()`时，需要添加对应的`polyfill`
:::

## 如何使用异步组件？

### 同步

```js
import Vue from 'vue';

Vue.component('foo', {
    name: 'Foo',
    components: {},
    created() {
    }
})

```

### 异步

:::tip
异步时支持传入一个对象或者是一个`resolve`、`reject`的函数
:::

```js
import Vue from 'vue';

Vue.component('foo', function (resolve, reject) {
    setTimeout(() => {
        resolve({
            name: 'Foo',
            components: {},
            created() {
            }
        })
    }, 300)
})
```

- 也支持处理异常以及loading状态

```js
import Vue from 'vue';

Vue.component('foo', {
    // 需要加载的组件 (应该是一个 `Promise` 对象)
    component: import('./MyComponent.vue'),
    // 异步组件加载时使用的组件
    loading: LoadingComponent,
    // 加载失败时使用的组件
    error: ErrorComponent,
    // 展示加载时组件的延时时间。默认值是 200 (毫秒)
    delay: 200,
    // 如果提供了超时时间且组件加载也超时了，
    // 则使用加载失败时使用的组件。默认值是：`Infinity`
    timeout: 3000
})
```

定义异步组件时，第二个参数可以传递一个promise对象，来resolve对应的组件属性

## 异步组件的使用场景有哪些？

- 异步加载路由组件：在vue-router中，异步加载组件

```js
{
    component:() => import('@/views/home/index')
}
```

- 添加全局loading

```js
export const AsyncComponent = function (AsyncView) {
    const AsyncHandler = () => ({
        // 需要加载的组件 (应该是一个 `Promise` 对象)
        component: AsyncView,
        // 异步组件加载时使用的组件
        loading: require('./Loading.vue').default,
        // 加载失败时使用的组件
        error: require('./Error.vue').default,
        // 展示加载时组件的延时时间。默认值是 200 (毫秒)
        delay: 200,
        // 如果提供了超时时间且组件加载也超时了，
        // 则使用加载失败时使用的组件。默认值是：`Infinity`
        timeout: 10000
    })
    return Promise.resolve({
        functional: true,
        render(h, {data, children}) {
            console.log(data, children)
            return h(AsyncHandler, data, children)
        }
    })
}
```

```js
// 在路由文件中使用

{
    component:() => AsyncComponent(import('@/view/home/index'))
}
```
