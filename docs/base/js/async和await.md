干什么用的->怎么用的->怎么实现的->有哪些优缺点->缺点有哪些优化方式->有没有产出

一、干什么用的

async await是异步的一种解决方案，本质也是generator来实现的，用同步的写法来按顺序调用多个异步方法的

被async标记的函数，被调用之后

1.无论是否有return，都会返回一个promise对象

如果有return，返回的值会作为promise对象的then方法中的参数



2.async中出现的错误，可以通过返回的promise对象的catch方法捕获



3.返回的promise对象必须等到async函数中所有的await表达式执行完，状态才会改变为fullfilled；除非遇到return 或者 抛出异常 才会执行then方法中的回调



await只能在async函数中使用，否则会报错

1.await出现后，后面的代码在没有抛出异常的情况下会放在then方法的回调中

```js
function request(ms){
  return new Promise(resolve=>{
    setTimeout(resolve,ms*1000)
    console.log('>>>>')
  })
}
async function fun(){
  let res=await request(1)
  console.log(123)
}
fun()
```





二、怎么用的

1.如果两个接口没有依赖关系，那么可以同时触发Promise.all(fun1(), fun2())

2.async函数可以保留运行堆栈

```js
// 同步代码块中包含异步代码，同步代码执行完之后，可能在执行异步代码的时候上下文已经消失
const a = () => {
  b().then(() => c());
};

// async函数会保存运行上下文
const a = async () => {
  await b()
  c()
}
```





二、怎么实现的

本质也是通过generator+自动执行器

```javascript
async function fn(args) {
  // ...
}

// 等同于

function fn(args) {
  return spawn(function* () {
    // ...
  });
}

function spawn(genF) {
  return new Promise(function(resolve, reject) {
    const gen = genF();
    function step(nextF) {
      let next;
      try {
        next = nextF();
      } catch(e) {
        return reject(e);
      }
      if(next.done) {
        return resolve(next.value);
      }
      Promise.resolve(next.value).then(function(v) {
        step(function() { return gen.next(v); });
      }, function(e) {
        step(function() { return gen.throw(e); });
      });
    }
    step(function() { return gen.next(undefined); });
  });
}
```

三、有哪些优缺点

四、缺点有哪些优化方式

五、有没有产出
