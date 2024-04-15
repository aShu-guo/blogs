# 计算机组成原理

## 硬件

1. 微型计算机的发展是以微处理器技术为标志
2. 机器字长：计算器`一次`整数运算所能处理的二进制位数。虽然可以在低位数处理器中通过拆分高位数来运算，但是需要运算多次，没有直接在高位数处理器中计算效率高。

:::info
机器字长与操作系统的位数是不同概念，后者是其所依赖的指令集的位数，前者是计算一次整数运算所能处理的二进制位数。
:::

## 软件

![img.png](/imgs/computes-course/computer-origanization/index-1.png)

### 计算机的分类

1. 指令和数据流

- 单指令流和单数据流（SISD）：冯诺伊曼体系结构

![img.png](/imgs/computes-course/computer-origanization/index-2.png)

- 单指令流和多数据流（SIMD）：阵列处理器、向量处理器

![img.png](/imgs/computes-course/computer-origanization/index-3.png)

- 多指令流和单数据流（MISD）：实际上不存在

![img.png](/imgs/computes-course/computer-origanization/index-4.png)

- 多指令流和多数据流（MIMD）：多处理器、多计算机

![img.png](/imgs/computes-course/computer-origanization/index-5.png)

