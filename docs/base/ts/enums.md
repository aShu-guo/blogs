# 枚举

枚举类型是包含一组常量的特殊`class`，它只有两种形式：`string` 或者 `number`

## number类型

number类型的枚举默认值是从0开始的

```ts
enum Result {
    Success,
    Fail
}
```

```js
// 编译之后的
var Result;
(function (Result) {
    Result[Result["Success"] = 0] = "Success";
    Result[Result["Fail"] = 1] = "Fail";
})(Result || (Result = {}));
// Result: {0: 'Success', 1: 'Fail', Success: 0, Fail: 1}
```

### 初始化

初始化enum上的第一个值，之后的值会依次递增。

```ts
enum Result {
    Success = 2,
    Fail
}
```

### 完全初始化

初始化enum中每个属性的值

```ts
enum Result {
    Success = 200,
    Fail = 500
}
```

## string类型

包含string类型的枚举，与number类型的enum使用方式相同，但是由于它具有更好的可读性和含义而更广泛的使用。

```ts
enum Result {
    Success = 'success',
    Fail = 'fail'
}
```

:::warning
从技术上来说，number类型和string类型可以混合使用，但是这并不建议。
:::

