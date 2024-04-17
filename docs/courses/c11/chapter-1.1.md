# struct

C `数组`允许定义可存储`相同类型`数据项的变量，`struct`是 C 编程中另一种用户自定义的可用的数据类型，它允许您存储`不同类型`的数据项。

## 语法

```c
struct tag{
    member_list1;
    member_list2;
    member_list3;
    ...
} variable_name
```

tag、member_list、variable_name三者至少出现2个才是合法的。

## 声明

1. 分两步，先定义，后声明

```c
struct InitMember
{
    int first；
    double second；
    char* third；
    float four;
};

struct InitMember test,test1;

```

2. 定义时声明

```c
struct InitMember
{
    int first；
    double second；
    char* third；
    float four;
} test,test1;
```

3. 不写名称

```c
struct
{
    int first；
    double second；
    char* third；
    float four;
} test,test1;
```

## 初始化

```c
struct InitMember
{
    int first；
    double second；
    char* third；
    float four;
};

```

1. 定义时赋值

```c
struct InitMember test = {-10, 3.141590,"method one",0.25};

```

2. `.语法`逐个赋值

```c
struct InitMember test;
test.first = 1;
test.double = 1.1;
test.third = 'c';
test.four = 1.23;
```

3. 定义时乱序赋值（C风格）

```c
struct InitMember test = {
            .first=1,
            .second=1.1,
            .third="",
            .four= 1.23
    };
```

这种方法在Linux内核（kernel）中经常使用，在音视频编解码库FFmpeg中也大量频繁使用，还是很不错的一种方式。

4. 定义时乱序赋值（C++风格）

```c
struct InitMember test = { first: 1, second: 1.1, third: "123", four: 1.23};
```

## 成员的访问

为了访问结构的成员，我们使用成**员访问运算符（.）**

## 指向结构的指针

```c
struct 结构体类型 *结构体变量名;
```

### 访问

```c
struct Student {
    char name[10];
    int age;
};

```

1. 通过取地址对应的结构体变量来访问成员变量

```c
#include <stdio.h>

int main() {
    struct Student student = {"xiaoming", 23}, *p = &student;
    printf("%s\n", (*p).name);
    printf("%d", (*p).age);
    return 0;
}
```

2. 通过`->`访问成员变量

```c
#include <stdio.h>

int main() {
    struct Student student = {"xiaoming", 23}, *p = &student;
    printf("%s\n", p->name);
    printf("%d", p->age);
    return 0;
}
```

## 思维导图

![img.png](/imgs/computes-course/c11/chapter1-10.png)

![img.png](/imgs/computes-course/c11/chapter1-11.png)
