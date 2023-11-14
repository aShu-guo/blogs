---
head:
  - - meta
    - name: description
      content: 向量的代数公式和几何意义解释
  - - meta
    - name: keywords
      content: ashu_guo 计算机图形学 3D数学 向量 代数公式 几何意义
---

# 向量

## 数学定义

在数学中区分为向量和标量，其中标量有大小，向量既有大小又有方向，例如：速度、位移等都是向量，速率、长度等是标量。

## 几何定义

向量可以表示为位移序列，例如`[1,2,3]`表示为在三维坐标系中向x轴右移1个位置，y轴上移2个位置，z轴前移3个位置。位移顺序无关，最终得到点的位置是相同的

## 向量与点

向量与点的区别：向量记录点的位移量，而点记录的是位置信息

![img.png](/imgs/computes-course/vector-point.png)

大多数情况下，位移都是从原点开始的，但是也存在位移并不是从原点开始的情况。

## 向量运算

### 零向量

零向量是唯一一个没有方向的向量，但是不能将它理解为一个点，而是应该理解为一个没有位移的向量

### 负向量

$$
-\begin{bmatrix}
a_{1}
\\a_{2}
\\{\vdots}
\\a_{n-1}
\\a_{n}
\end{bmatrix}=\begin{bmatrix}
-a_{1}
\\-a_{2}
\\{\vdots}
\\-a_{n-1}
\\-a_{n}
\end{bmatrix}
$$

#### 几何解释

负向量是原向量对应的一条反方向的、大小相同的向量

### 长度

代数公式：

$$
\begin{Vmatrix}
v
\end{Vmatrix}=\sqrt{v_{1}^{2}+v_{2}^{2}+{\cdots}++v_{n-1}^{2}+v_{n}^{2} }
$$

$$
\begin{Vmatrix}
v
\end{Vmatrix}=\sqrt{\sum_{i=1}^{n} v_{i}^{2}   }
$$

#### 几何解释

对于任意向量v，都可以构造出以v为斜边的直角三角形，并通过勾股定理计算三角形斜边的长度

![img.png](/imgs/computes-course/vector-length-2.png)

推广到三维坐标系下

![img.png](/imgs/computes-course/vector-length-3.png)

### 标量与向量的乘积

将标量挨个与向量中的值相乘。

$$
k\begin{bmatrix}
a_{1}
\\a_{2}
\\{\vdots}
\\a_{n-1}
\\a_{n}
\end{bmatrix}=\begin{bmatrix}
a_{1}
\\a_{2}
\\{\vdots}
\\a_{n-1}
\\a_{n}
\end{bmatrix}k=\begin{bmatrix}
ka_{1}
\\ka_{2}
\\{\vdots}
\\ka_{n-1}
\\ka_{n}
\end{bmatrix}
$$

[负向量](#负向量)本质上是值为-1的标量与原向量相乘得到

#### 几何解释

向量的放缩

![img.png](/imgs/computes-course/vector-multiply-2.png)

:::warning
向量不能除以向量，标量不能除以向量
:::

### 标准化

向量中的值除以向量的长度，最终得到标准化后的向量，任何向量标准化后的取值范围在0～1之间

$$
v_{norm} = \frac{v}{\begin{Vmatrix}
v
\end{Vmatrix}} ,v\neq0
$$

#### 几何解释

标准化后的向量一定在长度为1的单位圆内（在三维坐标中是单位球）

![img.png](/imgs/computes-course/vector-normalize.png)

### 加减规则

相同维度的向量支持相互加减，结果的维度与原向量维度相同。两个向量相加减，将向量中对应维度的值相加减即可。其中减法可以理解为加一个负向量

$$
\begin{bmatrix}
a_{1}
\\a_{2}
\\{\vdots}
\\a_{n-1}
\\a_{n}
\end{bmatrix}+\begin{bmatrix}
b_{1}
\\b_{2}
\\{\vdots}
\\b_{n-1}
\\b_{n}
\end{bmatrix}=\begin{bmatrix}
a_{1}+b_{1}
\\a_{2}+b_{2}
\\{\vdots}
\\a_{n-1}+b_{n-1}
\\a_{n}+b_{n}
\end{bmatrix}
$$

#### 几何解释

加法满足交换律：向量AB+向量AC=向量AC+向量AB。将向量AC平移到与AB尾部相连，相加的到的向量则是AD

![img.png](/imgs/computes-course/vector-plus.png)

但是减法不满足交换律：向量AB-向量AC 与 向量AC-向量AB计算结果不同

向量AB-向量AC=向量CB
![img.png](/imgs/computes-course/vector-sub.png)

向量AC-向量AB=向量BC
![img.png](/imgs/computes-course/vector-sub-2.png)

这也可以解释向量的位移序列
![img.png](/imgs/computes-course/vector-sub-3.png)

:::info
两向量相减，计算出长度即是两向量之间距离

![img.png](/imgs/computes-course/vector-length-1.png)

:::

### 点乘

又称为内积，两个相同维度的向量依据位置挨个相乘，将每个值相加的结果为点乘

$$
\begin{bmatrix}
a_{1}
\\a_{2}
\\{\vdots}
\\a_{n-1}
\\a_{n}
\end{bmatrix}·\begin{bmatrix}
b_{1}
\\b_{2}
\\{\vdots}
\\b_{n-1}
\\b_{n}
\end{bmatrix}=a_{1}·b_{1}+a_{2}·b_{2}+{\cdots}+a_{n-1}·b_{n-1}+a_{n}·b_{n}
$$

#### 几何解释

点乘结果描述的是两个向量的“相似”程度，值越大越相似，返回的是一个标量

$$
v·n=\begin{Vmatrix}
v
\end{Vmatrix}·\begin{Vmatrix}
n
\end{Vmatrix}·\cos \theta
$$

等价于

$$
v·n=\begin{Vmatrix}
v
\end{Vmatrix}·\cos \theta ·\begin{Vmatrix}
n
\end{Vmatrix}
$$

其中`向量v的长度 * cosθ`为向量v在向量n方向上的投影

#### 水平投影和垂直投影

给定向量v，向量n。可以将向量v分解成两个向量，这两个向量分别垂直、平行于向量v

![img.png](/imgs/computes-course/vector-projection.png)

平行方向的向量：
![img.png](/imgs/computes-course/vector-projection-2.png)

垂直方向的向量：

如果将向量n标准化之后，则向量n变为单位向量，长度为1，简化后的n向量垂直方向的向量计算公式为

```text
水平方向上的投影 + 垂直方向上的投影 = 向量v

====>
垂直方向上的投影 = 向量v - 水平方向上的投影
```

### 叉乘

仅可用于三维向量，不满足交换律、结合律，但是满足反交换律

```text
向量v x 向量n = -(向量n x 向量v)
```

代数计算公式：

![img.png](/imgs/computes-course/vector-cross.png)
![img.png](/imgs/computes-course/vector-cross-2.png)

计算顺序：y、z、x

#### 几何解释

叉乘得到的向量是垂直于向量a、向量b所在的平面
![img.png](/imgs/computes-course/vector-cross-3.png)

![img.png](/imgs/computes-course/vector-cross-5.png)

1. 叉乘向量的长度等于向量a、向量b构成平行四边形的面积
2. 几何计算公式，n向量为向量a、向量b构成平面的单位向量

$$
{\vec{a}  \times \vec{b}  =\begin{vmatrix}
\vec{a}
\end{vmatrix}\begin{vmatrix}
\vec{b}
\end{vmatrix}\sin \theta \vec{n}  }
$$

:::info
计算顺序：叉乘、点乘、乘除、加减
:::
