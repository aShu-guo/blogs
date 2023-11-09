> array api

1. reduce

```js
const arr = [{value: 1}, {value: 2}]
arr.reduce((pre, cur) => pre.value + cur.value)

/**
 * 如果给了默认值，会把initValue作为pre传入reducer函数
 * 此时从initValut中取value属性为undefined
 *
 * 最终输出为NaN
 */
arr.reduce((pre, cur) => pre.value + cur.value, 100)

/**
 * 如果与数组中元素结构保持一致，回调函数中的返回结果为一个number类型的值
 *
 * 输出仍为NaN
 */
arr.reduce((pre, cur) => pre.value + cur.value, {value: 100})

/**
 * 如果reduce需要处理的数组是一个对象时，
 *      1. 初始值结构与回调返回值的结构需要与数组中的元素结构保持一致
 *      2. 也可以先使用map返回出对应的值，再去reduce
 */
arr.reduce((pre, cur) => ({value: pre.value + cur.value}), {value: 100}).value
arr.map(item => item.value).reduce((pre, cur) => pre + cur, 100)
```
