一、干什么用的

异步的一种实现方式



二、怎么用的

1.同步

被*标记的函数是一个generator函数，每执行一次generator函数的next()方法都会执行yield后的代码，并返回结果：{value:'', done:false}，其中value对应函数的返回，有则返回，无则为undefined

```js
function haveReturn(){return 1}
function noReturn(){let a=1}

function* fun(){
    yield haveReturn()
    yield noReturn()
}

```

![image-20211013143924070](/Users/ifugle/Library/Application Support/typora-user-images/image-20211013143924070.png)

2.异步

为什么要引入微任务，由于js是单线程的，是为了解决异步任务的执行





三、怎么实现的





四、有哪些优缺点



五、缺点有哪些优化方式



六、有没有产出