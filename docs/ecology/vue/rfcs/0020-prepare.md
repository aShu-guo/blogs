# 准备篇

本RFC提出的变更主要影响到bus总线机制

## vue2.x版本的bus总线实现

1. 首先实例化一个vue实例

```js
const bus = new Vue()
Vue.prototype.$bus = bus
```

2. 消费者订阅bus

```js
this.$bus.$on('update:name', console.log)
```

3. 生产者发布事件

```js
this.$bus.$emit('update:name', 'hello world')
```

但是由实例方法衍生出来的bus总线并不是vue设计这些api的初衷
