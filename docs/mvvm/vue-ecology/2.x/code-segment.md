> Cache

```js
/*
 缓存fn执行的值，适用于单一入参、纯函数
 将内存中的值与入参比较，如果相同则取内存中的值，反之执行函数取值
 cache结构：{入参1:出参1, 入参2:出参2}
*/
function cached (fn) {
        var cache = Object.create(null);
        return (function cachedFn (str) {
            var hit = cache[str];
            return hit || (cache[str] = fn(str))
        })
    }

//ex:
function hello(name){return name}
let cachedFn=cached(hello)
cachedFn('tom tim')
cachedFn('tom tim') // 缓存后会直接取值，不再执行fn，提高性能


```



> 三元表达式优化

```js
// 如果存在则赋属性值，反之则指向空对象的属性值

// vue源码
(clone.devtoolsMeta = clone.devtoolsMeta || {}).renderContext = renderContext;
(clone.devtoolsMeta || (clone.devtoolsMeta={})).renderContext = renderContext;

// 自己实现
clone.devtoolsMeta ? clone.devtoolsMeta.renderContext = renderContext : {}.renderContext = renderContext;
```



