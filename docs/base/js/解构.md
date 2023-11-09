> 解构操作符 🧭

- 普通对象

```js
const student = {name: 'xiaoming', age: 25}
const {name = 'lihua', age} = student

const {log} = console
log('name:' + JSON.stringify(name))
log('age:' + JSON.stringify(age))

/*
output:
    name:"xiaoming"
    VM613:4 age:25
 */

```

- 数组

只要对象包含Iterator 接口，都可以采用数组形式的解构赋值

```js
const student = {name: 'xiaoming', age: 25}
const arr = [1, 2, student]
const [a, b, {name, age}] = arr


```

- 字符串

解构出字符

```js
const [a, b, c, d, e] = '12345'
const {log} = console
log('>>>>>>', a, b, c, d, e)
/*
output:
>>>>>> 1 2 3 4 5
 */
```

> 其他

- 默认值

```js
const student = {name: 'xiaoming', age: 25}
const {name = 'lihua'} = student

const arr = [1, 2]
const [a = 2, b = 3] = arr

```

- 变量重命名

```js
const student = {name: 'xiaoming', age: 25}
const {name = 'lihua', age: AGE} = student

const arr = [1, 2]
```

- 默认值、重命名同时使用

```js
const student = {name: 'xiaoming', age: 25}
const {name = 'lihua', age: AGE = 30} = student
```

> 拓展

1. 数组交换值

```js
const arr = [1, 2, 3, 4];
log(arr[0]);
log(arr[1]);
[arr[0], arr[1]] = [arr[1], arr[0]]

const {log} = console
log(arr[0])
log(arr[1])
```
