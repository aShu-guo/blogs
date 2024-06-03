# 循环结构

## if...else if...else

判断一个学生的成绩区间

```c
if(a >= 0 && a < 60){
    printf("不及格")
} else if(a >= 60 && a < 80) {
    printf("良好")
} else {
    printf("优秀")
}
```

## 三目运算符

- 一目运算符：参与运算的有1个量，例如++、--
- 双目运算符：参与运算的有2个量，例如+、-、*、/
- 三目运算符：参与运算的有3个量，例如：?...:

s=1 k=4
s=2 k=4
s=2 k=5
s=5 k=5

```c
if(a > b){
    max = a;
} else {
    max = b;
}

//  等价于

max = a > b ? a : b;
```

## switch...case
