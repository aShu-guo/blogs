---
head:
  - - meta
    - name: description
      content: 矩阵的代数公式和几何意义解释
  - - meta
    - name: keywords
      content: ashu_guo 计算机图形学 3D数学 矩阵 代数公式 几何意义
---

# 矩阵

向量是标量的数组，矩阵是向量的数组。可以将向量看作是1xn或者nx1的矩阵

$$
\begin{bmatrix}
1 \\
2 \\
3
\end{bmatrix}
$$

$$
\begin{bmatrix}
1 & 2 &3
\end{bmatrix}
$$

一个m行、n列的矩阵示例

$$
\begin{bmatrix}
{a_{11}}&{a_{12}}&{\cdots}&{a_{1n}}\\
{a_{21}}&{a_{22}}&{\cdots}&{a_{2n}}\\
{\vdots}&{\vdots}&{\ddots}&{\vdots}\\
{a_{m1}}&{a_{m2}}&{\cdots}&{a_{mn}}\\
\end{bmatrix}
$$

## 方阵

行数与列数相等，表现为一个正方形矩阵，主要讨论2x2，3x3，4x4矩阵

$$
\begin{bmatrix}
1 & 2 & 3\\
1 & 2 & 3\\
1 & 2 &3
\end{bmatrix}
$$

### 对角矩阵

`行号与列号相等`的元素称为对角线元素，如果一个矩阵只有对角线元素有值，其他位置的元素值为0，那么这个矩阵称为对角矩阵。

$$
\begin{bmatrix}
1 & 0 & 0\\
0 & 2 & 0\\
0 & 0 &3
\end{bmatrix}
$$

### 单位矩阵

单位矩阵是一种特殊的`对角矩阵`，对角线元素的值均为1

$$
\begin{bmatrix}
1 & 0 & 0\\
0 & 1 & 0\\
0 & 0 &1
\end{bmatrix}
$$

单位矩阵的基本性质是：`任意矩阵`乘`单位矩阵`都会得到`原矩阵`

## 矩阵转置

一个r x c的矩阵M转置之后，变为r x c的矩阵

$$
\begin{bmatrix}
{a_{11}}&{a_{12}}&{\cdots}&{a_{1n}}\\
{a_{21}}&{a_{22}}&{\cdots}&{a_{2n}}\\
{\vdots}&{\vdots}&{\ddots}&{\vdots}\\
{a_{m1}}&{a_{m2}}&{\cdots}&{a_{mn}}\\
\end{bmatrix}^{T} = \begin{bmatrix}
{a_{11}}&{a_{12}}&{\cdots}&{a_{m1}}\\
{a_{12}}&{a_{22}}&{\cdots}&{a_{m2}}\\
{\vdots}&{\vdots}&{\ddots}&{\vdots}\\
{a_{1n}}&{a_{2n}}&{\cdots}&{a_{mn}}\\
\end{bmatrix}
$$

转置记法经常在书面中表示列向量

引理：

- 对于任意矩阵，转置两次之后都会得到原矩阵
- 任意`对角矩阵`，转置之后仍是自身

## 矩阵乘法

### 与标量相乘

标量与矩阵中的元素挨个相乘

$$
k\begin{bmatrix}
{a_{11}}&{a_{12}}&{\cdots}&{a_{1n}}\\
{a_{21}}&{a_{22}}&{\cdots}&{a_{2n}}\\
{\vdots}&{\vdots}&{\ddots}&{\vdots}\\
{a_{m1}}&{a_{m2}}&{\cdots}&{a_{mn}}\\
\end{bmatrix} =\begin{bmatrix}
{a_{11}}&{a_{12}}&{\cdots}&{a_{1n}}\\
{a_{21}}&{a_{22}}&{\cdots}&{a_{2n}}\\
{\vdots}&{\vdots}&{\ddots}&{\vdots}\\
{a_{m1}}&{a_{m2}}&{\cdots}&{a_{mn}}\\
\end{bmatrix} k= \begin{bmatrix}
{ka_{11}}&{ka_{12}}&{\cdots}&{ka_{1n}}\\
{ka_{21}}&{ka_{22}}&{\cdots}&{ka_{2n}}\\
{\vdots}&{\vdots}&{\ddots}&{\vdots}\\
{ka_{m1}}&{ka_{m2}}&{\cdots}&{ka_{mn}}\\
\end{bmatrix}
$$

### 与矩阵相乘

在进行矩阵乘法运算之前，首先需要判断矩阵乘法是否有意义：

一个`m x n`的矩阵，与`r x c`的矩阵相乘时，只有当`n = r`时乘法才有意义，最终得到一个`m x c`的矩阵。

$$
c_{ij} =\sum_{k=1}^{n} a_{ik} b_{kj}
$$

矩阵c中第i行、第j列的元素值是矩阵a第i行的向量与矩阵b第j列向量的点乘，推广可知矩阵c中的每个元素的值是矩阵a对应行向量和矩阵b对应列向量的点乘。

为了更好的记忆计算规则，在计算时可以将乘数位置的矩阵放在上面，方便计算。

![img.png](/imgs/computes-course/matrix-multiply.png)

### 注意事项

1. 矩阵乘法不满足交换律

$$
AB\neq BA
$$

:::warning
但是如果其中一个矩阵是方阵，则满足交换律

$$
AB = BA
$$

如果方阵是单位矩阵，则结果为原矩阵

$$
AI = IA = A
$$

:::

2. 矩阵乘法满足结合律

$$
ABC = A(BC) = (AB)C
$$

:::info
前提是ABC相乘是有意义的，而且如果AB有意义，那么BC也一定有意义。
:::

3. 矩阵与标量的乘法也满足结合律

$$
kA = Ak
$$

4. 矩阵转置

$$
(AB)^{T} = B^{T} A^{T}
$$

推广到n个矩阵的转置

$$
(M_{1}M_{2}{\cdots}M_{n-1}M_{n} )^{T} = M_{n}^{T} M_{n-1}^{T}{\cdots} M_{2}^{T} M_{1}^{T}
$$

## 向量与矩阵的乘法

行向量左乘矩阵有意义，列向量右乘矩阵有意义。（左乘和右乘是根据向量的位置判断的，向量在左边则为左乘，在右边则为右乘）

![img.png](/imgs/computes-course/vector-matrix.png)

## 几何解释

每个矩阵都代表着一种坐标系的变换，但是我们在需要对图形进行线性转换时，如何构建这个矩阵是要研究的问题，下面是一些有用的变换：

- 旋转
- 放缩
- 投影
- 镜像
- 仿射

以三维坐标系为例，任意向量可以拆分为对应坐标轴基向量的线性组合

$$
v=\begin{bmatrix}
x\\
y\\
z
\end{bmatrix}=x\begin{bmatrix}
1\\
0\\
0
\end{bmatrix}+y\begin{bmatrix}
0\\
1\\
0
\end{bmatrix}+z\begin{bmatrix}
0\\
0\\
1
\end{bmatrix}
$$

可以进一步推广

$$
p=\begin{bmatrix}
1\\
0\\
0
\end{bmatrix}
$$

$$
q=\begin{bmatrix}
0\\
1\\
0
\end{bmatrix}
$$

$$
r=\begin{bmatrix}
0\\
0\\
1
\end{bmatrix}
$$

$$
v=xp+yq+zr
$$

继续推广到更一般的情况

$$
p=\begin{bmatrix}
p_{x}\\
p_{y}\\
p_{z}
\end{bmatrix}
$$

$$
q=\begin{bmatrix}
q_{x}\\
q_{y}\\
q_{z}
\end{bmatrix}
$$

$$
r=\begin{bmatrix}
r_{x}\\
r_{y}\\
r_{z}
\end{bmatrix}
$$

$$
\begin{align}
\begin{bmatrix}
x& y &z
\end{bmatrix}\begin{bmatrix}
p_{x} &  p_{y}&p_{z} \\
q_{x} & q_{y} & q_{z}\\
r_{x} & r_{y} &r_{z}
\end{bmatrix} & \\
&\quad= \begin{bmatrix}
xp_{x}+yq_{x}+zr_{x} & xp_{y}+yq_{y}+zr_{y} &xp_{z}+yq_{z}+zr_{z}
\end{bmatrix} & & \\
&\quad= \begin{bmatrix}
xp_{x} & xp_{y} &xp_{z}
\end{bmatrix}+\begin{bmatrix}
yq_{x} & yq_{y} &yq_{z}
\end{bmatrix}+\begin{bmatrix}
zr_{x} & zr_{y} &zr_{z}
\end{bmatrix} & \\
&\quad= xp+yp+zr
\end{align}
$$

将矩阵中的`每个行向量`看作是`转换后坐标系的基向量`

### 2D

$$
\begin{bmatrix}
2 & 1\\
-1 &2
\end{bmatrix}
$$

可以得到两个行向量：

$$
\begin{bmatrix}
2 &1
\end{bmatrix}
$$

$$
\begin{bmatrix}
-1 &2
\end{bmatrix}
$$

![img.png](/imgs/computes-course/matrix-2d.png)

那么该矩阵可以看作是两个变换的组合：旋转、放大

![img.png](/imgs/computes-course/matrix-2d-1.png)

### 3D

![img.png](/imgs/computes-course/matrix-3d.png)

考虑以下3D转换矩阵：

$$
\begin{bmatrix}
0.707 &-0.707  &0 \\
1.250 &  1.250 &0 \\
0 & 0 &1
\end{bmatrix}
$$

![img.png](/imgs/computes-course/matrix-3d-1.png)

总结：

1. 矩阵可以看作对原坐标系的基向量的一种线性变换
2. 方阵的行向量可以看作是坐标系的基向量
