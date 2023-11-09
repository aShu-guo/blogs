# 类型转换

使用变量时需要覆盖变量的类型，例如：库没有提供正确的类型。强制转换是`重写类型`的过程，可以是`缩小类型`，也可以是`放大类型`。

## `as`

直接的方式是通过`as`，将变量强制转换为指定类型

```ts
let x: unknown = 'name'
console.log((x as string).length)
```

类型转换并不是`真实`转换变量类型，而更像是`假设`变量为某个类型。而且ts会阻止看起来不正确的类型转换

```ts
/*
Conversion of type 'number' to type 'string' may be a mistake because neither type sufficiently overlaps with the other. If this was intentional, convert the expression to 'unknown' first.ts(2352)
 */
console.log((2 as string).length)
```

## `<>`

作用与`as`相同，但是有自己独有的语法，而且在`TSX`中无效

```ts
const x: unknown = 'xiaoming'
console.log((<string>x).length)
```

## 强制类型转换

由于ts会阻止两个看起来不正确的类型之间转换，如果是故意如此，可以先转换为`unknown`再转换为指定类型

```ts
const age: number = 23
console.log(((age as unknown) as string).length)
console.log((<string>(<unknown>age)).length);
```
