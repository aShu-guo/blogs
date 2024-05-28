# union

共用体（又称联合体）是一种特殊的数据类型，允许您在`相同的`内存位置存储`不同的`数据类型。您可以定义一个带有多成员的共用体，但是任何时候只能有一个成员带有值。共用体提供了一种使用相同的内存位置的有效方式。

## 语法

```c
union [union tag] {
    member definition;
    member definition;
    member definition;
    ...
} [one or more union variables];
```

union tag 是可选的，每个 member definition 是标准的变量定义，比如 int i; 或者 float f; 或者其他有效的变量定义。

在共用体定义的末尾，最后一个分号之前，您可以指定一个或多个共用体变量，这也是可选的。

```c
union Data
{
   int i;
   float f;
   char  str[20];
} data;
```

现在，Data 类型的变量可以存储一个整数、一个浮点数，`或者`一个字符串。这意味着一个变量（相同的内存位置）可以存储多个多种类型的数据。

:::info
这与struct的表述不同

```c
struct Data
{
   int i;
   float f;
   char  str[20];
} data;
```

Data 类型的变量可以存储一个整数、一个浮点数，`和`一个字符串
:::

共用体占用的内存等于共用体中最大成员占用的内存。上例中union Data占用的内存是20bytes，因为成员str的长度为20

```c
int main( )
{
   union Data data;

   printf( "Memory size occupied by data : %d\n", sizeof(data));

   return 0;
}

// output: Memory size occupied by data : 20
```

## 访问共用体成员

为了访问共用体的成员，我们使用`成员访问运算符（.）`

```c
   data.i = 10;
```

## 特点

1. 联合体union类似于结构体struct

2. 联合体用同一段内存单元存放不同数据类型的成员，在使用时，一次只能使用其中的一个成员

3. 它的所有成员相对于基地址的`偏移量都为0`

4. union的大小取决于它所有的成员中，占用空间最大的一个成员的大小，并且union的大小要能被其他成员的大小所整除
