# 表达式与操作符

## 基本(primary)表达式

指最基本的、无法再分的表达式，包含三种：

- 字面量：数值字面量、字符串字面量等等
- 一部分保留字：true、false、null、undefined等
- 变量、常量和全局对象的引用：arr、i、global object

## 对象、数组初始化表达式

又称为对象字面量、数组字面量

```js
const obj = {};

const obj2 = {
  name: '',
  value: 1,
};
```

```js
const arr = [];

const arr2 = [1, 2, , , 3];
```

## 函数定义表达式

又称为函数字面量

```js
const add = function (a, b) {
  return a + b;
};
```

## 属性访问表达式

包含两种形式，分别是静态的和动态的

- `expression.identifier`
- `expression[expression]`

形式一更加简洁，但是在需要`事先`知道`要访问属性的标识符`。形式二要访问的属性则是`动态计算`的，并且方括号中的表达`一定`会被解释为`字符串`

### 条件式属性访问

又称为可选链

- `expression?.identifier`
- `expression?.[expression]`

在JS中，`null和undefined`是唯二没有属性的值，那么如果变量为其中一个，在访问属性时会抛出TypeError，但是`可选链`可以防止这种错误发生

支持引用或者函数

```js
const a = { b: null };
console.log(a.b?.c);
console.log(a.b?.['c']);
// output： undefined
```

```js
a.func?.(...args);
```

:::warning
注意这里只会检测fun是否为null和undefined，并不会检查它是否是一个函数。
:::

在访问`值可能`为null和undefined的`变量属性`时，添加可选链是一个最佳实践。

可选链表达式等价于

```js
a.b === null || a.b === undefined ? undefined : a.b.c;
```

可以将可选链表达式理解为一个电路通道，当短路时返回`undefined`，反之则正常通过（即正常访问属性）

## 调用表达式

指调用函数或方法的语法

```js
fun(1);
[(1, 2, 3)].sort();
```

调用表达式时，执行流程如下：

1. 首先求值函数表达式，然后求值参数列表。如果函数表达式的值不是函数，则抛出TypeError。
2. 接着按照参数列表的顺序给参数赋值
3. 之后执行函数体

如果函数体中return了值，则执行结果为这个值。反之则为undefined

:::info

- 附着在其附属对象上调用时，我们称其为“方法”，例如面向对象编程时
- 直接调用则称为“函数”

:::

:::warning

注意使用了可选链调用的函数或方法与不使用的区别如下：

根据调用表达式的执行步骤可知：当非可选链调用时，`计算出函数表达式和参数列表表达式的值之后`才会执行函数体，那么即使`函数表达式最终计算出的值并不是函数类型`，参数列表中的表达式也已经执行了

而可选链调用时，如果它的值为`null`和`undefined`则会短路掉，便不会再去执行参数列表中的表达式。

```js
let fun = null,
  x = 0;
try {
  fun(x++);
} catch (e) {
  console.log(x);
}

fun?.(x++);
console.log(x);

// output：
// 1
// 1
```

:::

## 实例化表达式

```js
new Object();
```

如果实例化时，不需要传递任何参数，则可以省略圆括号

```js
new Object();
```

:::info
虽然省略圆括号也可以实例化，但是最好带上圆括号保持格式统一
:::
