# 输入与输出

需要引入头文件`#include <stdio.h>`

## 单个字符输入与输出

### putchar

输出单个字符

```c
putchar(x); // 输出变量x的值
putchar('A);
putchar('\n'); // 换行
putchar('\101'); // 输出字符A
```

### getchar

获取键盘输入的单个字符

```c
char c = getchar();
```

## 格式输入与输出

### printf

按格式打印出来

语法：printf("格式符1格式符2格式符3...格式符n", 表达式1, 表达式1, 表达式2, ..., 表达式n);

```c
int i = 1;
printf("hello world：%d", i);
```

### scanf

将键盘输入的值自动赋值给变量

语法：scanf("格式符1格式符2格式符3...格式符n", &变量名1, &变量名, &变量名, ..., &变量名n);

```c
int i;
printf("请输入变量i的值：")
scanf("%d", &i);

// scanf("%d，%d", &a, &b); 只有输入1，2才会正确赋值
```

:::info
重点记忆以下4个格式符即可：

![img.png](/imgs/computes-course/c11/chapter1-6.png)

:::

#### %md

指定输出数据的宽度为m

:::warning
如果是获取键盘`输入值`，则只取m宽度的值

```c
    int x;
    scanf("%3d", &x);
    // 键盘输入：123456
   // output: 123
```

如果是获取键盘`输出值`，如果不足m则`补足空格`，反之则输出原值

```c
    int x = 123456;
    printf("%3d", x);
   // output: 123456
```

:::

#### %m.nf

指定输出数据的宽度为m，小数点后保留n位，最后一位四舍五入

```c
float a= 6.78932;
printf("n: %3.2f",a);
// output: 6.79
```

`宽度m`指的是`小数`的个数+`整数`的个数

## 拓展

### fmax与fmin

分别求两个数值的最大值和最小值，需要引入头文件`#include <math.h>`

```c
int a = 1, b = 2;
fmax(a, b);
fmin(a, b);
```

## 测试题

实现输入两个整数，输出其中两个值中的最大值和最小值，并且给出提示

```c
#include <stdio.h>

int main() {
    printf("请输入两个整数\n");
    int a, b;
    scanf("%d%d", &a, &b);
    printf("最大值为：%d", a >= b ? a : b);
    printf("最小值为：%d", a <= b ? a : b);
    return 0;
}
```

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
