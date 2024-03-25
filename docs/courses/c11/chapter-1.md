---
aside: false
---

# 类型

在 C 语言中，数据类型指的是用于声明不同类型的变量或函数的一个广泛的系统。`变量的类型决定了变量存储占用的空间`，以及如何解释存储的位模式。

C是强类型语言，在声明变量时需要标注类型，语法为：

```c
type variableName = value
```

在C语言中，数据类型可以分为两类：基础数据类型和复合数据类型。

## 基础数据类型

<table class="wikitable">
  <tbody>
    <tr>
      <th>关键字</th>
      <th>字节</th>
      <th>范围</th>
      <th>格式化字符串</th>
      <th>硬件层面的类型</th>
      <th>备注</th>
    </tr>
    <tr>
      <td><code>char</code></td>
      <td>1bytes</td>
      <td>通常为-128至127或0至255，与体系结构相关</td>
      <td>%c</td>
      <td>字节(Byte)</td>
      <td>
        大多数情况下即<code>signed char；</code>
        <p>
          在极少数1byte&nbsp;!=
          8bit或不使用ASCII字符集的机器类型上范围可能会更大或更小。其它类型同理。
        </p>
      </td>
    </tr>
    <tr>
      <td><code>unsigned char</code></td>
      <td>1bytes</td>
      <td>通常为0至255</td>
      <td>%c、%hhu</td>
      <td>字节</td>
      <td></td>
    </tr>
    <tr>
      <td><code>signed char</code></td>
      <td>1bytes</td>
      <td>通常为-128至127</td>
      <td>%c、%hhd、%hhi</td>
      <td>字节</td>
      <td></td>
    </tr>
    <tr>
      <td><code>int</code></td>
      <td>2bytes(16位系统) 或<br />4bytes</td>
      <td>-32768至32767或<br />-2147483648至2147483647</td>
      <td>%i、%d</td>
      <td>字(Word)或双字(Double Word)</td>
      <td>
        即<code>signed int</code>(但用于bit-field时，int可能被视为signed
        int，也可能被视为unsigned int)
      </td>
    </tr>
    <tr>
      <td><code>unsigned int</code></td>
      <td>2bytes 或<br />4bytes</td>
      <td>0至65535 或<br />0至4294967295</td>
      <td>%u</td>
      <td>字或双字</td>
      <td></td>
    </tr>
    <tr>
      <td><code>signed int</code></td>
      <td>2bytes 或<br />4bytes</td>
      <td>-32768至32767 或<br />-2147483648至2147483647</td>
      <td>%i、%d</td>
      <td>字或双字</td>
      <td></td>
    </tr>
    <tr>
      <td><code>short int</code></td>
      <td>2bytes</td>
      <td>-32768至32767</td>
      <td>%hi、%hd</td>
      <td>字</td>
      <td>即<code>signed short</code></td>
    </tr>
    <tr>
      <td><code>unsigned short</code></td>
      <td>2bytes</td>
      <td>0至65535</td>
      <td>%hu</td>
      <td>字</td>
      <td></td>
    </tr>
    <tr>
      <td><code>signed short</code></td>
      <td>2bytes</td>
      <td>-32768至32767</td>
      <td>%hi、%hd</td>
      <td>字</td>
      <td></td>
    </tr>
    <tr>
      <td><code>long int</code></td>
      <td>
        4bytes 或<br />8bytes<sup id="cite_ref-1" class="reference"
          ><a href="#cite_note-1">[1]</a></sup
        >
      </td>
      <td>
        -2147483648至2147483647 或<br />-9223372036854775808至9223372036854775807
      </td>
      <td>%li、%ld</td>
      <td>长整数(Long Integer)</td>
      <td>即<code>signed long</code></td>
    </tr>
    <tr>
      <td><code>unsigned long</code></td>
      <td>4bytes 或<br />8bytes</td>
      <td>0至4294967295 或<br />0至18446744073709551615</td>
      <td>%lu</td>
      <td>
        整数(Unsigned Integer)或
        <p>长整数(Unsigned Long Integer)</p>
      </td>
      <td>依赖于实现</td>
    </tr>
    <tr>
      <td><code>signed long</code></td>
      <td>4bytes或<br />8bytes</td>
      <td>
        -2147483648至2147483647 或<br />-9223372036854775808至9223372036854775807
      </td>
      <td>%li、%ld</td>
      <td>
        整数(Signed Integer)或
        <p>长整数(Signed Long Integer)</p>
      </td>
      <td>依赖于实现</td>
    </tr>
    <tr>
      <td><code>long long</code></td>
      <td>8bytes</td>
      <td>-9223372036854775808至9223372036854775807</td>
      <td>%lli、%lld</td>
      <td>长整数(Long Integer)</td>
      <td></td>
    </tr>
    <tr>
      <td><code>unsigned long long</code></td>
      <td>8bytes</td>
      <td>0至18446744073709551615</td>
      <td>%llu</td>
      <td>长整数(Unsigned Long Integer)</td>
      <td></td>
    </tr>
    <tr>
      <td><code>float</code></td>
      <td>4bytes</td>
      <td>2.939x10<sup>−38</sup>至3.403x10<sup>+38</sup> (7 sf)</td>
      <td>%f、%e、%g</td>
      <td>浮点数(Float)</td>
      <td></td>
    </tr>
    <tr>
      <td><code>double</code></td>
      <td>8bytes</td>
      <td>5.563x10<sup>−309</sup>至1.798x10<sup>+308</sup> (15 sf)</td>
      <td>%lf、%e、%g</td>
      <td>双精度浮点型(Double Float)</td>
      <td></td>
    </tr>
    <tr>
      <td><code>long double</code></td>
      <td>10bytes或<br />16bytes</td>
      <td>7.065x10<sup>-9865</sup>至1.415x10<sup>9864</sup> (18 sf或33 sf)</td>
      <td>%lf、%le、%lg</td>
      <td>双精度浮点型(Double Float)</td>
      <td>在大多数平台上的实现与<code>double</code>相同，实现由编译器定义。</td>
    </tr>
    <tr>
      <td><code>_Bool</code></td>
      <td>1byte</td>
      <td>0或1</td>
      <td>%i、%d</td>
      <td>布尔型(Boolean)</td>
      <td></td>
    </tr>
  </tbody>
</table>

:::info
打印时的占位符，其中只有short、long、double以及与它们相关的非符号、符号类型不对应，其他类型都是对应的

- char: %c
- int: %i
- short: `%hi` short int
- long: `%li` long int
- float: %f
- double: `%lf` long float

unsigned类型的占位符都是以`u`结尾
:::

## 复合数据类型

在C语言中，复合数据类型可分为三类：结构、联合和枚举。在现代C语言中，联合和枚举的使用频率已逐渐减少。

## 数组类型

C 语言支持数组数据结构，它可以存储一个`固定长度`的相同类型元素的顺序集合。数组是用来存储一系列数据，但它往往被认为是一系列`相同类型`的变量。

## struct

C `数组`允许定义可存储`相同类型`数据项的变量，`struct`是 C 编程中另一种用户自定义的可用的数据类型，它允许您存储`不同类型`的数据项。

## union
