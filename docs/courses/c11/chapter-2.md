# 类型

在 C 语言中，数据类型指的是用于声明不同类型的变量或函数的一个广泛的系统。`变量的类型决定了变量存储占用的空间`
，以及如何解释存储的位模式。

C是强类型语言，在声明变量时需要标注类型，语法为：

```c
type variableName = value
```

在C语言中，数据类型可以分为两类：基础数据类型和复合数据类型。

### 测试

![img.png](/imgs/computes-course/c11/chapter1-5.png)

答案参考：27 4 B D A

```c
int x = 11;
printf("%d", ++x * 5 / 2);

// output: 30
```

```c
int x = 11;
printf("%d", x++ * 5 / 2);

// output: 27
```

:::warning
此外，需要注意对整数赋值时，会自动忽略小数点

```c
int f = (int) 2.3;
printf("f:%d", f);
// output: 2
```

![img.png](/imgs/computes-course/c11/chapter1-4.png)
:::
