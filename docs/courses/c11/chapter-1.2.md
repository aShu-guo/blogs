# 数组类型

C 语言支持数组数据结构，它可以存储一个`固定长度`的相同类型元素的顺序集合。数组是用来存储一系列数据，但它往往被认为是一系列`相同类型`的变量。

所有的数组都是由`连续的内存`位置组成。`最低`的地址对应`第一个`元素，`最高`的地址对应`最后一个`元素。语法为：

```c
type arrayName [arraySize];
```

case:

```c
int arr[10]; // 声明一个长度为10、int类型的数组。
```

## 初始化

### 一维数组

初始化数组有两种方式，根据是否实现给定长度区分：

1. 给定长度时，元素数量必须`<=`arraySize

```c
double balance[5] = {1000.0, 2.0, 3.4, 7.0, 50.0};
```

2. 未给定长度，但给出了一组默认值，则数组长度=默认值的个数。

```c
double balance[] = {1000.0, 2.0, 3.4, 7.0, 50.0};
balance[4] = 100.0;
```

### 二维数组

与一维数组类似，但是初始化时有一点不同。它既支持二维赋值，也支持一维赋值

```c
int arr[3][4] = {{1, 2, 3, 4,}, {1, 2, 3, 4}, {1, 2, 3, 4,}};
```

或者

```c
int arr[3][4] = {1, 2, 3, 4, 1, 2, 3, 4, 1, 2, 3, 4,};
```

此外，二维数组行可以省略，列是不能省略的，列可以自动推理出

```c
int arr[][4] = {1, 2, 3, 4, 1, 2, 3, 4, 1, 2, 3, 4,};
```

:::info 字符数组

在C语言中没有专门的字符串类型，通常用一系列字符构成的数组来表示字符串，并且字符串总是以`\0`结束

那么就意味着不同的char数组初始化占用的存储空间是不同的，字符串赋值char数组的长度`大于`单个字符赋值例如：

```c
char c[] = {'h', 'e', 'l', 'l', 'o'}; // sizeof(c) 输出5
char c1[] = {"hello"}; // sizeof(c1) 输出6
```

![img.png](/imgs/computes-course/c11/chapter1-7.png)

- 字符数组的输出

1. printf

```c
char c[] = {'h', 'e', 'l', 'l', 'o'};
printf("%s", c);
```

2. puts(变量名)

相对于printf自带一个换行符`\n`

```c
char c[] = {'h', 'e', 'l', 'l', 'o'};
printf("%s", c);
```

- 字符数组的输入

1. scanf()

它不用添加取地址符号&，输入的值是不包含空格的

当输入时如果键入了空格，那么只会将空格前的值赋值给char数组

```c
char c[6];
scanf("%s", c);

```

2. gets(变量名)

可以包含空格

```c
// warning: this program uses gets(), which is unsafe.
char c[6];
gets(c);
```

通过`strlen(c)`获取char数组长度时，需要引入头文件`#include <string.h>`

:::

## 访问数组成员

1. 通过索引访问

```c
double num = balance[1]; // 访问数组balance索引=1位置的值
```

2. 通过指针访问

```c
*(balance + 1)
```

## 长度

```c
/*
由于数组中每个元素都是相同类型的数据，也就意味着它们占用存储的大小是相同的

那么可以通过总存储大小/单个数据存储大小 = length
*/
int length = sizeOf(arr) / sizeOf(arr[0]);


```

也可以通过宏定义

```c
#define LENGTH(arr)(sizeof(arr) / sizeof(arr[0]))
```

## 数组名

声明的数组arrayName，不仅表示它是包含固定数量的数组，也表示数组中第一个元素的指针，那么也就意味着arrayName是指针类型。

```c
int var[] = {10, 20, 30};
printf("index=0 address: %p\n", &var[0]);
printf("var address: %p\n", var);

/*
输出：
index=0 address: 0x16fd774d8
var address: 0x16fd774d8
*/
```

需要注意的是，虽然数组名表示数组的地址，但在大多数情况下，数组名会`自动转换`为指向数组`首元素的指针`。这意味着我们可以直接将数组名用于指针运算，例如在函数传递参数或遍历数组时：

## 迭代

```c
int arr = {10, 20,30};
int length =
```

## 应用

### 多维数组

存储结构化数据时很有用，例如经纬度，空间数据等。

### 传递数组给函数

1. 函数入参为指针类型

```c
void myFunction(int *ptr){}
```

2. 指定长度

```c
void myFunction(int params[10]){}
```

3. 不指定长度

```c
void myFunction(int params[]){}
```

CASE：

```c
#include <printf.h>

//#define LENGTH(arr)(sizeof(arr) / sizeof(arr[0]))

double getAverage(int arr[], int size);

int main() {
    int balance[5] = {1000, 2, 3, 17, 50};
    int size = sizeof(balance) / sizeof(*balance);
    double avg = getAverage(balance, size);
    printf("average: %f", avg);
    return 0;
}

double getAverage(int arr[], int size) {
    double avg = 0;
//    int size = LENGTH(arr);

    for (int i = 0; i < size; i++) {
        avg += arr[i];
    }
    return avg / size;
}
```

问题1： 为什么不能在函数中求解数组的长度，而需要将数组的长度作为形参传递？

因为作为函数接收数组的形参，它并不是静态数组而是`动态数组`。

### 从函数返回数组

C 语言`不允许`返回一个`完整的数组`作为函数的参数，所以必须声明一个`返回指针`的函数。

另外，C `不支持`返回函数`局部变量的地址`，除非定义局部变量为 `static` 变量。

```c
#include <stdio.h>
#include <stdlib.h>
#include <time.h>

int *getRandom() {
    static int r[10];
    srand((unsigned) time(NULL));
    for (int i = 0; i < 10; i++) {
        r[i] = rand();
        printf("r[%d] = %d\n", i, r[i]);
    }
    return r;
}

int main() {
    int *p;

    p = getRandom();
    for (int i = 0; i < 10; i++) {
        printf("*(p + %d): %d\n", i, *(p + i));
    }
    return 0;
}
```

### 指向数组的指针

数组名是指向第一个元素的指针，因此另外一种合法访问数组元素的语法是

```c
int arr[10];

*(arr + 1);
```

### 静态数组与动态数组

在 C 语言中，有两种类型的数组：

- 静态数组：编译时分配内存，大小固定。
- 动态数组：运行时手动分配内存，大小可变。

静态数组的生命周期与作用域相关，而动态数组的生命周期由程序员控制。

在使用动态数组时，需要注意合理地`分配和释放`内存，以避免`内存泄漏`和`访问无效内存`的问题。

1. 静态数组的特点包括：

- 内存分配：在程序编译时，静态数组的内存空间就被分配好了，存储在`栈上`或者`全局数据区`。
- 大小固定：静态数组的大小在声明时确定，并且无法在运行时改变。
- 生命周期：静态数组的生命周期与其作用域相关。如果在函数内部声明静态数组，其生命周期为整个函数执行期间；如果在函数外部声明静态数组，其生命周期为整个程序的执行期间。

2. 动态数组特点如下：

- 内存分配：动态数组的内存空间在运行时通过动态内存分配函数手动分配，并存储在`堆上`。需要使用 `malloc`、`calloc` 等函数来`申请内存`，并使用 `free` 函数来`释放内存`。
- 大小可变：动态数组的大小在运行时可以根据需要进行调整。可以使用 `realloc` 函数来重新分配内存，并改变数组的大小。
- 生命周期：动态数组的生命周期由程序员控制。需要在使用完数组后手动释放内存，以避免内存泄漏。

动态数组示例：

```c
#include <stdlib.h>
#include <printf.h>

int main() {
    int size = 5;
    int *dynamicArr = (int *) malloc(size * sizeof(int));

    if (dynamicArr == NULL) {
        return 1;
    }

    printf("enter %d elements: ", size);
    for (int i = 0; i < size; i++) {
        scanf("%d", &dynamicArr[i]);
    }

    for (int i = 0; i < size; i++) {
        printf("value: %d", dynamicArr[i]);
    }
    free(dynamicArr);
    return 0;
}
```

- 首先分配内存，需要检查分配内存是否成功
- 循环执行scanf函数，将用户输入的值赋值给数组中的元素
- 循环输出打印数组元素
- 最后释放内存

![img.png](/imgs/computes-course/c11/chapter1-8.png)
