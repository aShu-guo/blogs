# enum

枚举是 C 语言中的一种基本数据类型，用于定义一组具有`离散值`的常量，它可以让数据`更简洁，更易读`。

枚举类型通常用于为程序中的一组相关的`常量`取名字，以便于程序的`可读性`和`维护性`。

## 语法

```c
enum　枚举名　{枚举元素1,枚举元素2,……};
```

1. 先定义枚举类型，再定义枚举变量

```c
enum DAY
{
      MON=1, TUE, WED, THU, FRI, SAT, SUN
};
enum DAY day;
```

2. 同时定义枚举类型、枚举变量

```c
enum DAY
{
      MON=1, TUE, WED, THU, FRI, SAT, SUN
} day;
```

3. 省略枚举名称，直接定义枚举变量

```c
enum
{
      MON=1, TUE, WED, THU, FRI, SAT, SUN
} day;
```

## 示例

```c
enum DAY
{
      MON=1, TUE, WED, THU, FRI, SAT, SUN
};
```

第一个枚举成员的默认值为整型的 0，后续枚举成员的值在前一个成员上加 1。

也可以在声明时指定值

```c
enum season {spring, summer=3, autumn, winter};

```

也就说 spring 的值为 0，summer 的值为 3，autumn 的值为 4，winter 的值为 5

### 遍历

在C 语言中，枚举类型是被当做 `int` 或者 `unsigned int` 类型来处理的，所以按照 C 语言规范是`没有办法遍历`枚举类型的。

不过在一些`特殊的情况`下，枚举类型必须连续是可以实现有条件的遍历。

```c
#include <stdio.h>

enum DAY {
    MON = 1, TUE, WED, THU, FRI, SAT, SUN
};

int main() {
    enum DAY day;
    for (day = MON; day <= SUN; day++) {
        printf("%d\n", day);
    }
    return 0;
}
```

### switch...case

```c
#include <stdio.h>
#include <stdlib.h>

int main() {

    enum color {
        red = 1, green, blue
    } favorite_color;

    /* 用户输入数字来选择颜色 */
    printf("请输入你喜欢的颜色: (1. red, 2. green, 3. blue): ");
    scanf("%u", &favorite_color);

    /* 输出结果 */
    switch (favorite_color) {
        case red:
            printf("你喜欢的颜色是红色");
            break;
        case green:
            printf("你喜欢的颜色是绿色");
            break;
        case blue:
            printf("你喜欢的颜色是蓝色");
            break;
        default:
            printf("你没有选择你喜欢的颜色");
    }

    return 0;
}
```
