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

一个`m x n`的矩阵M转置之后，变为`n x m`的矩阵

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

![img.png](/imgs/visual/3d-math/matrix-multiply.png)

### 注意事项

1. 矩阵乘法不满足交换律

$$
AB\neq BA
$$

:::warning
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

![img.png](/imgs/visual/3d-math/vector-matrix.png)

在几何上解释`pM`、`Mp`

- `左乘`相当于对矩阵M的`行向量`进行转换
- `右乘`相当于对矩阵M的`列向量`进行转换

简称为`左乘行右乘列`

## 几何解释

每个矩阵都代表着一种坐标系的变换，但是我们在需要对图形进行线性变换时，如何构建这个矩阵是要研究的问题。线性变换在`保持直线`的同时，其他几何性质，例如：`体积`、`面积`、`长度`、`角度`可能会在变换后改变。线性变换不包含平移，仿射变换包含平移

下面是一些有用的变换：

- 旋转
- 放缩
- 投影
- 镜像
- 仿射

以三维坐标系为例，存在向量v：

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

由此可知，任意向量都可以拆分为对应坐标轴基向量的线性组合

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

这与前面计算结果相同，因此如果我们将对角矩阵中的`每个行向量`看作是`线性变换后坐标系的基向量`，那么对角矩阵代表的是将`原坐标系`下的向量变换为`新坐标系`下的向量

### 2D

$$
\begin{bmatrix}
2 & 1\\
-1 &2
\end{bmatrix}
$$

可以得到转换后坐标系下的两个基向量：

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

![img.png](/imgs/visual/3d-math/matrix-2d.png)

那么该矩阵可以看作是两个变换的组合：旋转、放大

![img.png](/imgs/visual/3d-math/matrix-2d-1.png)

### 3D

![img.png](/imgs/visual/3d-math/matrix-3d.png)

考虑以下3D转换矩阵：

$$
\begin{bmatrix}
0.707 &-0.707  &0 \\
1.250 &  1.250 &0 \\
0 & 0 &1
\end{bmatrix}
$$

![img.png](/imgs/visual/3d-math/matrix-3d-1.png)

总结：

1. 矩阵可以看作对`原坐标系的基向量`的一种线性变换
2. 方阵的`行向量`可以看作是`转换后坐标系`的`基向量`，这也恰好可以用来计算转换矩阵，只需要计算坐标系转换后的基向量即可
3. 推广到多维矩阵与多维矩阵相乘，其几何意义是将`左边矩阵`的`列向量`转换到以`右边矩阵``行向量`为`基向量`的坐标系中
