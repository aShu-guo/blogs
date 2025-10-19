# 简单实用的calc()函数

calc()函数支持加减乘除4种运算，任何可以使用`<length>`、`<frequency>`、`<angle>`、`<time>`、`<percentage>`、`<number>`或者`<integer>`数据类型的地方都可以使用calc()函数

1. 带符号计算时，只能进行加减

```text
/* 不合法 */
width: calc(100% - 10deg);
```

2. 除法运算时，右侧不能为0

```text
/* 不合法 */
width: calc(100px / 0);
```

3. 如加号和减号左右两边一定要有`空格`，否则是不合法的

> 乘法和除法符号两侧无须空格，但是为了格式一致、便于阅读， 建议也要设置空格。

```text
/* 不合法 */
width: calc(100%-2rem);
```
