# 基本类型

又称为简单数据类型

![img.png](/imgs/computes-course/c11/chapter1-1.png)

## 常量

- 整型：C语言中主要有十进制、八进制、十六进制等
    - 十进制：0-9组成
    - 八进制：`0开头`，0-7组成
    - 十六进制：`0x开头`，0-9+a-f组成
    - ...
    - n进制：0-n+字母组成
- 实型：小数形式，例如：0.123、.123、123.
- 字符：经常占一个字节，`1个字符`而且用`单引号`包裹`'1'`
- 符号：用标识符表示一个常量，格式：`#define 标识符 常量值`。如：#define PI 3.1415926
- 字符串：用一对`双引号`引起的字符序列，`"ashuguo"`

## 变量

变量定义语法：类型说明符 变量名1,变量名2,...,变量名n

- 整型：int
- 浮点型（实型）：float、double
- 字符型：char

![img.png](/imgs/computes-course/c11/chapter1-2.png)

赋值的两种方式：

```c
int a,b,c;

a = 1;
b = 2;
c = 3;
```

```c
int a=1, b=2, c=3;
```

:::info
打印时的占位符，其中只有short、long、double以及与它们相关的非符号、符号类型不对应，其他类型都是对应的

- char: %c
- int: %i
- short: `%hi` short int
- long: `%li` long int
- float: %f
- double: `%lf` long float

unsigned类型的占位符都是以`u`结尾
:::

