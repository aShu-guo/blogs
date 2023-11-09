# 元组

一个指定预定义长度和每个索引对应值的类型的数组

## 类型声明
```ts
// 正确的语法
const tuples: [string, number] = ['1', 2]

// 错误的语法
const tuples2: [string, number] = ['1', 2, 4]
// Error: Type '[string, number, number]' is not assignable to type '[string, number]'.
//     Source has 3 element(s) but target allows only 2.ts(2322)
```

### 更加通用的元组声明

```ts
type Tuples = readonly any[]
```

## 只读

像数组一样使用`readonly`限制变量操作，而且最佳实践是将元组设置为只读的

```ts
const tuples: readonly [string, number] = ['1', 2]
tuples.push(1)
```

![img.png](/imgs/typescript/tuples-auto-complete.png)

:::tip
React中`userState()`调用结果便是一个value和设置value的函数组成的元组

```ts
const [name, setName] = userState('')
```

:::

## 可选

通过`?`标记元组中的某个元素是可选的

```ts
type MyTuple = [string, number, boolean?]
const a: MyTuple = ['1', 2]
```

## 解构

在约定式的API中用处更大

### 具名解构

为元组中的每个index的值赋予name，语法等价于js中解构数组

```ts
const graph: [x: number, y: number] = [55.2, 41.3];
```

可以为元组中包含的值提供更多的上下文信息，例如

```ts
const coord: [longitude: number, latitude: number] = [120.3, 30.22]
```

## 数组转为元组

使用`as const`可以将数组类型转化为元组类型，它更加通用的用法是转换为文字类型

```ts
// 此时类型为：string[]
const actions = ["CREATE", "READ", "UPDATE", "DELETE"]
```

![img.png](/imgs/typescript/array-to-tuple.png)

```ts
// 此时类型为：readonly ["CREATE", "READ", "UPDATE", "DELETE"]
const actions = ["CREATE", "READ", "UPDATE", "DELETE"] as const 
```

![img.png](/imgs/typescript/array-to-tuple-2.png)

## 应用

### 函数参数列表

声明一个包含不固定参数的函数，函数名为`readButtonInput`，其中前2个参数的类型分别为`string`，`number`，剩余参数均为`boolean`

```ts
function readButtonInput(name: string, version: number, ...input: boolean[]) {
  // ...
}
```

更加抽象的声明，在库开发中常用
```ts
function readButtonInput(...args: [string, number, boolean[]]) {
    // ...
    const [name, version, input] = args
}
```
