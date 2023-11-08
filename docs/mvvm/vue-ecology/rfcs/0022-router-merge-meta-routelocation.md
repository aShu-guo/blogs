# 合并router的meta对象

## 概览

当创建routes时，我们可以通过meta属性关联一些额外的数据：

```js
const routes = [
    {path: '/profile', meta: {requiresAuth: true}}
]
```

然后在路由守卫中和`$route`中访问：

```js
router.beforeEach((to, from, next) => {
    if (to.meta.requiresAuth && !auth.loggedIn()) next('/login')
    else next()
})
```

然而，当处理内嵌的`routes`对象时，需要遍历`matched`数组中的所有对象的`meta`：

```js
router.beforeEach((to, from, next) => {
    if (to.matched.some(record => record.meta.requiresAuth)) {
        // ...
    }
})
```

这个RFC的提议是合并所有`matched`中路由对象的`meta`，从父路由到子路由，以便我们可以直接从`to.meta.requiresAuth`
访问。我认为`Nuxt`也是这样做的，但是我没有从文档中发现。

## 基础用例

一个内嵌的路由：

```js
const routes = [{
    path: '/parent',
    meta: {requiresAuth: true, isChild: false},
    children: [
        {
            path: 'child',
            meta: {isChild: true}
        }
    ]
}]
```

导航到`/parent/child`时，应该构造出一个合并的meta属性为：

```js
to.meta = {requiresAuth: true, isChild: true}
```

## 动机

大多数时候，合并`meta`属性才是我们需要的。我从来没有见过需要始终内嵌最深的那个路由的`meta`属性。

这也会移除`to.matched.some`来检查`meta`是否存在的的需求，将只需要检查重重载后的`meta`属性。

## 详细设计

`meta`属性只会合并第一层级，像`Object.assign`和`...`操作符：

```js
const routes = [
    {
        path: '/parent',
        meta: {nested: {a: true}},
        children: [
            {
                path: 'child',
                meta: {nested: {b: true}}
            }
        ]
    }
]
```

`/parent/child`路由下的meta属性值：

```js
const meta = {
    nested: {
        b: true
    }
}
```

## 缺点

- 这是技术上的重大变更

