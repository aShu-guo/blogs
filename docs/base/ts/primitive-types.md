# 原始数据类型

ts中的原始数据类型只包含了js中一部分（null、undefined除外），分为：

- number：包含浮点型、整数型
- boolean：true、false
- string：字符串
- symbol：用于创建一个全局唯一的标识
- bigint：包含浮点型、整数型，但是可以保存比number更大的正值或者更小的负值

## 类型分配

创建一个变量时，ts有两种方式来为它分配类型：

- 显式分配：写出的代码易于阅读，但代码冗余
- 隐式分配：代码简洁，但不易于阅读

### 显示分配

明确变量类型，无需ts介入

```ts
const name: string = 'xiaoming'
```

### 隐式分配

ts根据变量的值`猜测`变量的类型，也称为`infer`

```ts
const name = 'xiaoming'
```

:::warning
ts也并不是每次都可以合适的根据变量的值"猜测"出类型，例如：`JSON.parse`
:::
