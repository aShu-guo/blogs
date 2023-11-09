# 数组

## 类型声明

在ts中，声明数组有两种特殊的语法

1. new声明

```ts
const list = new Array<string>()
list.push('hello world')
```

2. []声明

```ts
const list: string[] = []
list.push('hello world')
```

## 只读数组

`readonly`表明数组为只读不可写

```ts
const list: readonly string[] = []
// Error: push不是一个函数
list.push()
```

![img.png](/imgs/typescript/arrays-auto-complete.png)

### `readonly` 与 `const`

在js中`const`声明变量时表示变量不可变，但是对应引用数据类型而言，这并不是有效的。在ts中解决了上述问题

```ts
const arr: readonly number[] = []
arr.push(1)

// ts内置的工具类：ReadonlyArray<number>
const arr2: ReadonlyArray<number> = []
```

![img.png](/imgs/typescript/arr-readonly.png)

## infer type

如果声明数组时包含值，则ts会自动推断出数组类型

```ts
const list = [1, 2, 3]
// list 类型为 number[]
```
