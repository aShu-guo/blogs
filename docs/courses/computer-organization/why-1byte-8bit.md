# 为什么1byte等于8个bit

## 历史背景

字节是数字信息的单位，`通常`由八位组成。从历史上看，字节是用于在计算机中对`文本的单个字符`进行编码的位数，因此它是许多计算机体系结构中
`最小的可寻址内存单元`。从 0 到 7 或 7 到 0 进行编号。第一位是数字 0，使第八位数字为 7。

字节的大小在历史上一直取决于`硬件`，并且不存在强制大小的明确标准。使用过 1 ～ 48
位的大小。其中六位字符代码是早期编码系统中常用的实现方式，使用六位和九位字节的计算机在
1960 年代很常见。

在现代，架构通常使用 32 位或 64 位字，分别由四个或八个字节构成。（1B=8bit 32b=4B同64bit）

## ASCII码由来

最初，我们只需要处理整数运算，所以只需要编码0-9十个字符，再加上运算符+和-，4bit就够了。

后来又需要处理字母，大小写字母加上数字，再加上例如逗号等标点符号，这时大概有了70多个字符，需要7bit（这也是ASCII码使用7-bit的原因，因为7-bit对于英语来说够用了）。

如果不同的计算机要想互相通信而不造成混乱，那么每台计算机就必须使用相同的编码规则，于是美国有关的标准化组织就推出了ASCII编码。

## 原因

综上可知，在英文中，7-bit可以表示所有字符。但是在其他语言中仍不够，又因为8是2的幂次，所以使用了1B=8bit作为标准。

但是对于中文10万+的字符而言仍是不够的，所以在`GB2312(中华人民共和国国家标准简体中文字符集)`使用2个Byte记录中文，覆盖了99.8%的高频率使用的中文字符。
