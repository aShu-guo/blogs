# 词法结构

`词法结构`是了一门编程语言的`基本规则`，规定了`变量如何命名`、`注释的定界符`、`如何分隔程序的语句`等。

## 文本

JS严格区分大小写，忽略token之间的空格，并且很大程度上也忽略换行符。

除了常规空格（\u0020），JS也将制表符（Tab键）、各种ASCII控制符（Ctrl键）、Unicode间隔（U+0020）识别为空格；

将换行符（\n）、回车符（\r）、return键（回车键）识别为行终止符。

## 注释

JS中有2种注释，分别是单行注释和多行注释，其中多行注释又包含两种

单行注释

```js
// hello world
```

多行注释

```js
/*
hello world
 */

/**
 * hello world
 */
```

## 字面量

直接体现在程序中的数据值

```js
'123';
123;
1.23;
true;
false;
null;
```

## 标识符和保留字

标识符就是一个名字，在JS中用来声明变量、函数、属性和class。JS规定表示只能以字母（a-zA-Z）、美元符号（$）、下划线（\_）开头（也可以使用中文，但不建议）

```js
helloworld;
_helloworld;
$vm;
const 你好 = 'hello';
```

:::info
为什么标识符不能以数字开头？

JS是为了区分`数值`和`标识符`才做如此限制
:::

### 保留字

JS内部保留的标识符，不能当作普通标识符使用。

已经定义而且使用了

![img.png](/imgs/base/js/word-stuct.png)

已经定义但是未使用

![img.png](/imgs/base/js/word-stuct-1.png)

而且建议也不要使用`arguments`和`eval`作为标识符

## Unicode

JS是基于Unicode编写的，因此支持在字符串和标识符中使用Unicode字符

```js
// const caf\u00e9=123
// const café = 123;
```

但是考虑到兼容性和可移植性，建议只使用ASCII和数字声明标识符。

早期，JS只支持4位Unicode。在ES6之后，引入了花括号方便更好的支持大于16位的Unicode

```js
// const caf\u{E9}=123
```

由于在Unicode中，一个字符可能对应多个编码，这就会导致在编辑代码时，标识符看起来相同，但其实是不同的怪异现象

```js
const café = 1; // caf\u{e9}
const café = 2; // cafe\u{301}
console.log(café); // 1
console.log(café); // 2
```

为了避免这种情况的发生，建议只使用ASCII和数字声明标识符。

## 可选的分号

分号是可省略的，JS默认将换行符当作分号，但是有3种特例：

1. return、continue、break等关键字后面的`换行符`不会当作`;`

```js
/*
function say(){
  return 
  true;
}
*/

// 上述代码中你期望是return true，但是会被解释为
function say() {
  return;
  true;
}
```

2. `递增++`和`递减--`符号，必须与自己的操作数在同一行，否则无法编译通过

```js
let a = 1;
a
++;
```

3. 箭头函数，参数列表和箭头必须在同一行，否则无法编译通过

```js
const say=(name)
  =>{

}
```
