# 循环结构

## while

当表达式为真时才回去执行while语句

```c
while(表达式){
    语句1;
    语句2;
    语句3;
    ...
    语句n;
}
```

:::warning

问以下case会执行多少次？

```c
int k = 0;
while(k=1) k++;
```

无限次
:::

## do...while语句

与while语句不同的是，它会首先执行一次

```c
do {
    语句1;
    语句2;
    语句3;
    ...
    语句n;
} while(表达式)
```

## for循环

```c
for(赋值语句;条件语句;更新值){
    循环体
}

```

![img.png](/imgs/computes-course/c11/chapter3-1.png)

执行步骤：

1. 赋值语句
2. 判断是否符合条件
3. 执行循环体
4. 更新值（更新操作在每次循环的末尾）

### 变异情况

1. 没有条件语句

```c
for(赋值语句;;更新值){
    循环体
}

```

效果等价于`while(true)`或者`while(1)`

2. 赋值语句放在外部，更新值操作放在循环体内部

```c
赋值语句;
for(;条件语句;){
    循环体;
    更新值;
}
```

## for循环与while语句的转化

![img.png](/imgs/computes-course/c11/chapter3-2.png)

## break与continue

break：终止当前循环，例如：在多层循环中只跳出当前层循环
continue：跳过本次循环

## 测试题

1. 求出所有的水仙花数，水仙花数为一个三位数的各个位数上的值的立方和等于它本身，例如：153是一个水仙花数，因为153=1\*1\*1+5\*5\*5+3\*3\*3

```c
#include <stdio.h>
#include <math.h>

int main() {
    for (int i = 100; i <= 999; i++) {
        int a = i / 100;
        int b = (i - a * 100) / 10;
        int c = (i - a * 100 - b * 10) / 1;
        if (i == pow(a, 3) + pow(b, 3) + pow(c, 3)) {
            printf("水仙花数：%d", i);
        }
    }
    return 0;
}
```

2. 输入一个数n，计算出它的阶乘n!，注：n的值不能大于10

```c
#include <stdio.h>

int main() {
    int num, result = 1;
    printf("请输入一个小于等于10的正整数：");
    scanf("%d", &num);

    if (num <= 10) {
        for (int i = num; i > 0; i--) {
            result *= i;
        }
        printf("%d!：%d", num, result);
    }
    return 0;
}
```

::: danger 切记
题目中的之间表示的是双开区间，例如：在50-100之间取第一个被7整除的数，意思是在(50, 100)取值
:::

n=127

A


