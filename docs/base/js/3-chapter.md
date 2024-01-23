# 类型、值和变量

JS包含两种数据类型：基本数据类型和引用数据类型

其中基本数据类型为：number、boolean、string、null、undefined、symbol。除了这些类型之外都是引用数据类型，即对象。对象是一系列属性的合集

普通对象是一个命名值的无序集合，同时js也定义了一个特殊对象——数组，除了这些之外也内置了一些对象

- Set：无序、不重复的集合
- Map：key和value的映射集合
- RegExp：正则，用于匹配文本
- Date：日期和时间
- Error：与其子类型表示JS运行期间可能发生的错误

JS支持面向对象的编程风格，从技术上讲，只有JS对象才有方法，但是number、string、boolean、symbol都可以调用方法，在JS中只有null、undefined没有方法调用。

JS的引用数据类型是mutable，但是基本数据类型是immutable的

## 数值

JS使用IEEE754标准定义的64位浮点格式表示数值，可表示范围为

- 最大值

$$
\pm 1.7976931348623156\times 10^{308}
$$

- 最小值

$$
\pm 5\times10^{-324}
$$

### 整数字面量

ES6之前，只支持十进制、十六进制（0x或者0X）数值；在ES6之后，支持二进制（0b或者0B）、八进制（0o或者0O）

### 浮点字面量

```text
[digits][.digits][(E|e)[(+|-)]digits]
```

例如：

![img.png](/imgs/base/js/type.png)

:::info
支持使用下划线对数值分割，更易读

```js
const a = 1_000_000_000;
```

:::

### 算术

JS算术中一些特殊情况：

- 在JS中被0除并不认为是错误的，而是会返回Infinity或-Infinity，但是有一个特例：0/0返回NaN

![img.png](/imgs/base/js/type-1.png)

- NaN有个特性：它不等于任何值，同时也不等于自身。可以通过Number.isNaN方法判断是否为NaN
- 0等于-0，意味着：作为除数使用时几乎无法区分这两个值

![img.png](/imgs/base/js/type-2.png)

### 二进制浮点数和舍入错误

JS使用的是IEEE-754浮点表示法，它是一种二进制表示法，可以精确的表示1/2、1/4、1/1024等分数，但是我们常用的分数是1/10、1/100等。这就会导致：

```js
0.3 - 0.2 === 0.1; // false
```

这并不是JS独有的问题，所有采用IEEE-754表示浮点数的语言都会出现这种问题，解决方法是尽量不使用浮点数，而去使用整数。

例如0.3人民币，使用3角或30分表示来减少误差

### BigInt

ES2020新增的数值类型BigInt，主要是为了表示64位整数

## String

JS采用的是Unidcode字符集的`UTF-16编码`，因此JS字符串是`无符号16位值`的序列。

在ES6中，字符串是可以通过`for/of`、`...操作符`迭代的，而且它是`不可变的`、支持`>`、`<=`、`>`、`>=`，其实是根据符号的Unicode值进行比较

## Boolean

布尔类型的值只有两个：true、false。如果一个变量的值是以下6种，我们称它为`falsy`：

- null
- undefined
- ''
- false
- 0
- NaN

除了这6种情况外，其他都称为`truthy`

## null和undefined

两者都表示值不存在，但是也有一些`细微差距`：undefined表示的是`更深层次的不存在`，例如：

- void函数返回undefined
- 访问未声明变量为undefined
- 调用函数时没有传值的参数列表为undefined
- ...

作者认为`undefined`更像是`系统级别的`、`意料之外的`不存在，`null`更像是`程序级别的`、`意料之内的`不存在，因此更建议声明一个值为空时，应该将它初始值置为null，而不是undefined。

当然也有其他开发人员更倾向于初始值赋值为undefined。但是我更倾向于将初始值定义为null

## Symbol

它是ES6新增的一种原始类型，用作`非字符串`的`属性名称`。同时它没有字面量，不像字符串、对象、数组等可以直接通过字面量初始化：

```js
const obj = {};
const arr = [];
const str = '';
```

只能通过`Symbol()`初始化一个符号值

```js
const symbol = Symbol('hello');
```

即使传入的字符串或数值是相等的，比较时也是不等的，也就意味着这个函数`永远不会返回相同值`

```js
Symbol('hello') === Symbol('hello'); // false
```

在实践中，Symbol通常作为一种`语言扩展机制`，例如ES6新增的for/of循环和可迭代对象，可以通过为对象添加`[Symbol.iterator]`使对象变得可迭代，并支持上述功能。

通过Symbol()函数，我们可以定义私有的、与其他扩展不冲突的属性名。但是如果我们定义了一些扩展，但是想要共享使用的方法，ES6也提供了方式：`Symbol.for()`

```js
Symbol.for('hello') === Symbol.for('hello'); // true
```

## 全局对象

全局对象可以在任何JS程序上下文中使用，当JS解释器启动后，都会创建一个新的全局对象并为其添加一组初始的属性，例如：

- undefined、Infinity和NaN等全局常量
- isNaN()、parseInt()、parseFloat()和eval()这样的全局函数
- Date()、String()、Object()等这样的构造函数
- Math、Json这样的全局的对象

在浏览器中还会添加windows、document等全局对象，alert()等全局函数

在Node中，全局对象有一个名为global的属性，可以在任何地方通过它访问全局对象

ES2020定义了一个名为`globalThis`的全局属性，始终指向全局对象

## 类型转换

类型转换分为两种：基本类型之间的转换、引用类型转换为基本类型。

进行类型转换的时机是期望的类型与输入的类型不同时，会进行类型转换。例如：undefined用在了期望是boolean类型的地方时，它会被转换为false

以下标明了JS类型之间的转换关系，其中加粗的部分表示可能令人意外的转换

![img.png](/imgs/base/js/expression-2.png)

表中基本类型之间的转换相对更好理解，但是引用类型转换为基本类型理解起来有些复杂。

在JS中将引用类型转换为基本类型根据`引用数据类型的算法偏好`分为3种：

- 偏字符串
- 偏数值
- 无偏好

:::info
其中Date对象是偏字符串的，其他内置对象都是偏数值的

:::

偏字符串算法的对象的转换步骤：

1. 首先调用toString()函数，如果可以得到原始值则返回；
2. 如果不存在toString()函数或toString()没有返回原始值，则调用valueOf()函数，如果可以得到原始值则返回；
3. 两者都没有返回原始值，则抛出TypeError

偏数值算法的对象的转换步骤与上面类似，只不过先尝试valueOf()，再尝试toString()

:::info
开发者也可以自定义类型转换算法，其实就是去定义toString和valueOf函数逻辑

```js
class Test {
  toString = function () {
    return 'test';
  };

  valueOf = function () {
    return 1;
  };
}

const test = new Test();
console.log(Number(test));
```

:::

此外，JS操作符中也会隐式进行类型转换，例如：+一元操作符，自动转换为Number类型

```js
const a = '123';
console.log(typeof +a); // number
```

操作符的类型转换规则如下：

![img.png](/imgs/base/js/expression.png)

![img.png](/imgs/base/js/expression-1.png)

## 变量声明和赋值

在ES6之后，可以通过3种方式声明变量：`var`、`let`、`const`

### let与const

使用const声明变量时必须要给初始值，并在无法更改。因此要声明一个常量而非变量时，可以通过const声明，并且建议最好全部字母大写以区分变量，例如：NOT_FOUND

```js
const NOT_FOUND = 404;
```

使用let声明的变量无需给初始值，并且在后续可更改：

```js
let a, b;

a = 1;

console.log(a, b); // 1 undefined
```

使用let与const声明的变量是有`块作用域`的，即被声明的变量只作用于当前块作用域（当前代码块），而且可以在`嵌套作用域`中`重复声明同名变量`（但是不建议这样）

```js
const a = 1;
function test() {
  const a = 2;
  console.log(a); // 2
}
```

在传统的客户端编码中，如果在一个`script标签`中定义了一个`全局变量`，那么在`其他script标签`中也可以访问（至少在const或let执行之后的所有脚本中）

### var

使用var声明变量与let、const有以下不同：

1. 没有块作用域，只有函数作用域和全局作用域。使用`var声明变量`，会自动将变量添加到`最接近`的作用域中。这也是模块化方案没出现之前，`IIFE普遍使用的原因`

```js
// 全局作用域

if (true) {
  var test = true;
}
console.log(test); // true
```

```js
// 函数作用域：case1

function test() {
  if (true) {
    var a = true;
  }
}

test();
console.log(a); // Uncaught ReferenceError: a is not defined
```

```js
// 函数作用域：case2

function test() {
  if (true) {
    var a = true;
  }
  console.log(a);
}

test(); // true
```

其中，在全局作用域中使用var声明的变量，可以理解为在globalThis对象上添加属性

```js
var a = 123;
console.log(globalThis.a); // 123
```

2. 作用域提升（hoisting），使用var声明的变量会提升到`当前作用域`的顶部

提升（hoisting）意味着可以在变量未声明之前访问，并且不会抛出异常

```js
console.log(a); // undefined
var a = 123;
```

3. 允许重复声明相同名称的变量

```js
var a = 1;
var a = 2;
console.log(a); // 2
```

### IIFE

在古早的JS代码中，经常出现立刻执行函数的身影。是因为为了解决var没有块级作用域的问题，用来模仿块级作用域

var没有块级作用域：

```js
var a = 1;
{
  var a = 2;
}
console.log(a); // 2
```

let有块级作用域：

```js
let a = 1;
{
  let a = 2;
}
console.log(a); // 1
```

那么通过立刻执行函数来模仿块级作用域

```js
var a = 1;

(function () {
  var a = 2;
})();

console.log(a); // 1
```

:::info
在ES6之前，JS只有两个作用域：`函数作用域`和`全局作用域`。但是在ES6之后，出现了另外一种作用域：`块级作用域`，即用花括号包裹的部分
:::

## 面试题

1. 使用var声明变量的for循环中，迭代执行setTimeout

```js
for (var i = 0; i < 5; i++) {
  setTimeout(() => {
    console.log(i);
  }, 1000);
}
/*
5
5
5
5
5
 */
```

原因：

var声明的变量存在变量提升，导致setTimeout宏任务中访问的变量i，实际上是访问的全局变量中的i

解决方案：

- 使用let声明i
- 利用IIFE

```js
for (var i = 0; i < 5; i++) {
  (function (j) {
    setTimeout(() => {
      console.log(j);
    }, 1000);
  })(i);
}
```

- 使用setTimeout的第三个参数

```js
for (var i = 0; i < 5; i++) {
  setTimeout(console.log, 1000, i);
}
```
