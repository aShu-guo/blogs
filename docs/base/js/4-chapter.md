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

## 操作符概述

![img.png](/imgs/base/js/expression.png)

![img.png](/imgs/base/js/expression-1.png)

### 操作数个数

可以根据操作数个数进行分类：假如需要的操作数个数为n，则称该操作符为n元操作符。

例如：

- -x只有一个操作符（取x的负值），因此为一元操作符
- \*是二元操作符
- ?:为三元操作符

### 操作数与结果类型

有些操作符适用于任何类型的值，但是多数操作符期待自己的`操作数`是`某种特定类型`，也期待结果是`某种特定类型`。表4-1中的类型一栏：

```text
输入类型 -> 输出类型

例如：
num -> num 表示：期待输入类型是number类型，输出也是number类型

```

在对操作数进行操作符对应的运算之前，首先会根据操作符期待的输入类型进行数据转换，转换规则如下：

![img.png](/imgs/base/js/expression-2.png)

当然也有写操作符会根据操作数的类型不同而不同，例如：`+操作符`（既可以拼接字符串，又可以进行数值加减）、`<操作符`（可以根据数值大小排序，也可以通过字符顺序排序）

```js
// 拼接字符串
'3' + '3';
// output: '33'

// 数值加减
3 + 3;
// output: 6

// 字符串与数值
3 + '3';
// output：'33'
```

:::info

其中`lval`表示左值表达式，即可以合法的出现在赋值表达式（即`=`）左侧的表达式。

在js中，变量、对象属性和数组元素都是左值
:::

### 操作符副效应

副效应（side effect）：操作符对应的运算可能影响将来的求值。例如：赋值(=)、递增(++)、递减(--)、delete操作符

其他操作符则没有负效应，但是函数调用和对象创建表达式是否有副效应，取决与函数或构造函数内部是否使用了有副效应的操作符。

### 优先级

4-1表格按照优先级`从高到低排列`，而且用横线对相同优先级的操作符进行了分组

但是操作符的优先级可以通过圆括号`()`改变：

```js
(1 + 2) * 3;
```

### 求值顺序

求值顺序只会在一种情况下有差异：操作符有副效应，例如递增、递减

## 算术操作数

包含`**`、`*`、`+`、`-`、`/`、`%`等6种基本操作符。

在必要时会将输入值转换为数值类型，再进行操作。如果无法转换，则输出NaN。而且如果操作数为NaN，结果几乎都是NaN

### +操作符

`二元+操作符`用于`计算数值操作数的和`或者`拼接字符串操作数`

对于两个相同类型的操作数比较简单，但是对于两个不同类型的操作数一般都伴随着类型转换：

1. 获取原始值

- Date调用toString方法获取原始值，其他对象调用valueOf获取原始值
- 如果没有valueOf方法，则调用toString方法获取

2. 计算

如果其中一个操作数为字符串类型，那么则将另一个操作数转换为字符串类型进行拼接

3. 否则两个操作数都转换为数值（或NaN），计算加法

需要注意的是当混合字符串和数值使用二元+操作符时：

```js
1 + 2 + 'hello world'; // '3hello world'
1 + (2 + 'hello world'); //  '12hello world'
```

可以这样理解：如果二元+操作符运算时，只要在运算过程中碰到一次运算结果为string类型，则后续运算结果都是string类型

### 一元操作符

`+`、`-`、`++`、`--`都在必要时将自己唯一的操作符转换为数值类型

也就意味着这些一元操作符具有隐式转换，可以利用这个性质简化类型转换操作，例如：一元操作符`+`

```js
const a = '1';
console.log(typeof +a); // number
```

### 关系表达式

包括`<`、`>`、`<=`、`>=`、`==`、`===`

:::info
虽然比较操作符支持比较引用数据类型，但是不建议这样做
:::

### in操作符

in操作符期望左侧操作数为string或symbol，右侧操作数为对象

### instanceOf操作符

instanceOf操作符期望左侧操作数为对象实例，右侧操作数为对象标识符。

它本质是基于原型链查询，对于`o instanceOf f`，JS则是先取得`f.prototype`，并在`o的原型链`上查找这个值。如果找到了，则返回true，反之则返回false

## 逻辑表达式

包含3种：`逻辑与（&&）`、`逻辑或（||）`、`逻辑非（!）`

- 逻辑与（&&）：如果左侧操作数为假值（falsy）则短路
- 逻辑或（||）：如果左侧操作数为值（falsy）则短路
- 逻辑非（!）

德摩根定律

```js
!(p && q) === !p || !q;
!(p || q) === !p && !q;
```

## 赋值操作符

使用`=`赋值，但是当与`===`或`==`赋值时需要注意顺序

```js
(a = b) === 0;
```

除了常规的赋值操作符外，JS还提供了其他赋值操作符：

![img.png](/imgs/base/js/expression-3.png)

多数情况下`a op= b`等价于`a = a op b`，例如

```js
a += 1;
// 等价于
a = a + 1;
```

但是要注意特殊情况

```js
data[i++] *= 2;
// 等价于
data[i++] = data[i++] * 2;
```

## 求值表达式

与许多解释型语言一样，JS有能力解释JS源代码字符串，并对它们求值以产生一个值。

'### eval中的this，执行上下文'

```js
eval('2 + 3');
```

虽然eval是一个函数，但是它看起来更像是一个表达式

如果不希望用户在控制台中输入执行`eval`，可以使用在HTTP头部设置`Content-Security-Policy`来禁用它。

`eval()`期望入参是一个字符串，如果：

- 入参不是字符串，则简单返回这个值
- 是字符
  - 如果可以正常解析并执行，则返回最有一个表达式或语句的值
  - 反之，则抛出SyntaxError

```js
// 入参不是字符串
const ctx = { name: 'xiaoming' };

const res = eval(ctx);

console.log(res); // { name: 'xiaoming' }
```

```js
// 入参是字符串，并且可以正常解析
const ctx = '1 + 2';

const res = eval(ctx);

console.log(res); // 3
```

```js
// 入参是字符串，但是无法解析
const ctx = '1 + ';

const res = eval(ctx);

console.log(res); // SyntaxError: Unexpected end of input
```

eval求值时会像本地代码执行的那样去查找变量：首先在作用域找，如果找不到则去上级作用域找，例如：在函数中执行`eval('a')`求值，则是在当前函数作用域中查找`变量a`的

```js
let a = 20;
function test() {
  console.log(eval('a += 1'));
}
test();
```

### 全局eval()

eval()有个特点，如果使用将它赋值给另外一个变量名称，例如`geval`，则它的执行上下文是全局的

```js
const geval = eval;
let a = 10;

function test() {
  let a = 20;
  eval('a += 1');
  // ctx;
  geval('a += 1');
  return a;
}

console.log(test(), a); // 21 11
```

:::warning
注意执行该段代码时，需要新建一个html文件并放入script标签中，在浏览器控制台（可能开启了严格模式）和在node中的执行效果是不同的
:::

根据此特性，我们可以控制`eval中代码片段`的`执行环境`

### 严格eval

- 不再支持重命名eval来控制`eval中代码片段`的`执行环境`
- 不支持在局部作用域中定义新变量或函数

## 其他操作符

### 条件操作符（?:）

又称为三元表达式，可用于简化if条件判断

### 先定义（??）

first-defined操作符，又称为缺值合并（nullish coalescing），它是ES2020提供的新操作符，等价于

```js
a ?? b;
// 等价于
a !== null && a !== undefined ? a : b;
```

它可以作为`||`的替代用法，例如：

```js
let max = maxWidth || preferences.maxWidth || 500;
```

我们经常使用这种方式来检查前面值是否有值，如果有值，则取前面的值。但是如果`maxWidth = 0`时，我们应该取maxWidth的值，但是仍没有短路掉

如果将上述代码改成

```js
let max = maxWidth ?? preferences.maxWidth ?? 500;
```

这样更符合我们的需求，只去判断前值是否为`null或undefined`

当与||、&&同时使用时，需要使用圆括号改变优先级：

```js
(a ?? b) || c; // 先执行??，后执行||
a ?? (b || c); // 先执行||，后执行??
a ?? b || c; // syntaxError
```

### typeOf

typeOf判断变量类型，注意如果它的判断结果并不准确，例如：

```js
console.log(typeof null); // object
```

:::info
面试题：为什么typeOf null会判定为`object`？

历史遗留问题，在JS设计初期使用0000来表示变量类型，但是null全为0，所以会被判定为object
:::

### delete

delete是一元操作数，尝试删除其操作数指定的对象属性或数组元素。具有副作用（side effect）

```js
let o = { x: 1, y: 2 };
delete o.x;
console.log('x' in o); // false

let b = [1, 2, 3];
delete b[0];
console.log(0 in b); // false
console.log(b.length); // 3
```

如果操作数是数组，通过delete删除指定索引的元素时，数组则变成稀疏数组，可以形象表示为数组中多个坑：

```js
[, 2, 3];
```

在严格模式下

- 如果delete的操作数是未限定标识符，例如：变量、函数或函数参数，则抛出SyntaxError
- 删除configurable为false的属性时，抛出TypeError

```js
'use strict';
const o = { x: 1, y: 2 };

Object.defineProperty(o, 'z', {
  configurable: false,
  value: 3,
});

console.log(o.z); // 3

console.log(delete o.z); // TypeError: Cannot delete property 'z' of #<Object>
```

### await

ES2017增加，用于让JS异步编程更加自然，并且只能出现在async标识的函数中

### void

### 逗号操作符（,）

```js
let a = 1,
  b = 1,
  c = 1;

for (let i = 0; i < 10; i++) {
  console.log(i);
}
```
