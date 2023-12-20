# 像素

像素`没有`固有的`尺寸和单位`，实际上它是一个`样本`，但是当它被`打印、显示和扫描`时才会有`物理尺寸`和`像素密度`

它可以细分为两种，分别是逻辑像素和物理像素，其中逻辑像素在不同的场景中单位、换算方式不同，例如

- 在Android中逻辑像素的单位为dp
- 在IOS中逻辑像素的单位为pt
- 在浏览器中逻辑像素单位为px

## 设备像素（device pixel / physical pixel）

显示屏是由一个个物理像素点组成的，物理像素点对应显示屏内部led灯的数量，它们之间的关系是一组三色led代表一个物理像素。

设备像素又称为`物理像素`，它没有固定的尺寸，只是代表像素点的个数，生活中常见的设备分辨率指的就是水平方向、垂直方向上的设备像素数量

## 逻辑像素

### CSS像素

浏览器内的一切长度都是以`CSS像素`为单位的，CSS像素的单位是`px`，它是一个抽象的概念，本质是逻辑像素

- 同一设备上，每一CSS像素所代表的物理像素也可能发生改变（屏幕放缩）
- 不同设备上，每一CSS像素代表的物理像素可以是相同的、也可以是不同的

为了保证相同的CSS像素在不同的设备上视觉效果相同，因此浏览器可以自动根据设备的物理分辨率换算CSS像素，但是在`CSS规范`中，使用`“参考像素”`进行换算

参考像素定义：距离屏幕 28 英寸的标称臂长距离外，观察像素密度为 96dpi的设备上一个像素（长度为1/96英寸）的视角。

<div style="background: white;display: flex;justify-content: center">
<img src="/imgs/base/css/unit-1.png" alt="">
</div>

假设角度为θ，斜边长度为l

```ts
const tan = 1 / (96 * 2) / 28;
const theta = 2 * Math.atan(tan); // 弧度制
// 换算为角度
console.log((theta * 180) / Math.PI);
// output: 0.02131539391825254
```

则对应的视角为0.0213度，但是为了简化计算过程，浏览器都是根据设备像素直接换算

### Android

与设备无关的像素，一般指Google提出的用来适配Android的各种屏幕。

用作`像素单位`，同时也是Android中的逻辑像素，又称为density-independent pixel（与密度无关的像素）、 dip，简称dp

典型的用途是允许移动设备软件将信息显示和用户交互缩放到不同尺寸的屏幕上，这种抽象允许应用程序以逻辑像素作为测量值工作，通过`底层图形系统`将应用程序的`逻辑像素值`转换为适合特定设备的`真实像素值`，其实这

:::warning
注意⚠️这不是设备像素值（device pixel）
:::

在蓝湖中，Android中的UI图默认单位为dp，IOS的单位为pt

![img.png](/imgs/base/css/unit-3.png)

不同的设备有不同的屏幕尺寸，由于设备之间的PPI（像素密度）的差异，系统可能会缩放图片（导致图片变模糊），或者图片可能会以完全错误的尺寸显示

![img.png](/imgs/base/css/unit-4.png)
_尺寸相同的两个屏幕可能具有不同数量的像素_

[计算公式为](https://developer.android.com/training/multiscreen/screendensities?hl=zh-cn#dips-pels)

$$
\rm 1dp\approx 1px
$$

:::info
公式中的1px对应的是`中密度屏幕（160dpi、基准密度）`上的1px
:::

dp转换为屏幕中的物理像素的公式为

$$
\rm px=dp \times \frac{dpi}{160}
$$

### iOS

iOS中的逻辑像素单位为pt，正如[拓展](#逻辑分辨率、物理分辨率)中讲的那样，逻辑像素作为真实物理像素的转换层，在不同的设备中是不同的

例如：

在非视网膜屏幕下

$$
\rm 1pt=1px
$$

在2倍屏幕下

$$
\rm 4pt=1px
$$

![img.png](/imgs/base/css/unit-7.png)

### 印刷业

与px不同，pt是绝对单位，在不同型号的设备中视觉效果是相同的，它的计算公式如下

$$
pt=\frac{1}{72}inch
$$

已知1英寸等于2.54厘米，那么

$$
pt=\frac{1}{72}inch=\frac{2.5}{72}cm
$$

在印刷业中，印刷尺寸的单位被称为point，简称pt

$$
\rm 1pt=\frac{1}{72}inch
$$

例如一个12pt的字体的物理尺寸为12/72即1/6英寸

这是一个72pt的字体

![img.png](/imgs/base/css/unit-2.png)

可以看到72pt的字体不一定是刚好等于72pt的，可能大于也可能小于

而对于显示器来说，直接照搬印刷行业的测量方式是有问题的，因为有两个问题影响：

- 屏幕分辨率不同
- 显示器的物理尺寸不同

所以，物理英寸并不是一个有效的衡量标准，`物理英寸`和`像素`之间`并没有`一个`固定的关系`

相应的，在显示器中引入了逻辑像素的概念，现将逻辑像素转化为点，再转化为像素

$$
\rm 1logical\quad pixel=72 point
$$

在windows中一直使用以下转化关系

$$
\rm 1logical\quad pixel=72 pt=96 px
$$

那么一个12pt的字体最终渲染为16px大小

$$
\rm 12pt=\frac{12}{72}logical\quad pixel=\frac{1}{6}logical\quad pixel=\frac{96}{6}px=16px
$$

## DPR（device pixel ratio）

称为设备像素比，简称DPR

$$
\rm DPR=\frac{物理像素分辨率}{逻辑像素分辨率}
$$

例如：某个设备的物理分辨率为960 x 640，逻辑分辨率为480 x 320，那么它的DPR为

$$
\rm DPR=\frac{物理像素分辨率}{逻辑像素分辨率}=\frac{960 \times 640}{480 \times 320}=2
$$

我们知道window对象上有个属性`devicePixelRatio`返回当前设备的DPR，虽然仍存在一些兼容性问题的（主要是对于IE浏览器），但是[主流浏览器均已支持](https://caniuse.com/?search=Window.devicePixelRatio)

一些常见的屏幕中的逻辑像素，如

- 1倍屏（DPR=1）：对于PC端的Web页面而言，使用1 x 1个物理像素展示1px的内容
- 2倍屏（DPR=2）：iPhone5使用的Retina视网膜屏幕，使用2 x 2个物理像素展示1px的内容
- ...
- n倍屏（DRP=n）：使用n x n个物理像素展示1px的内容

:::info
多少倍屏或者多少x（三倍屏，3x，意思就是3dpr），一般来说就是说的是这个值
:::

## DPI（Dots per inch）

每英寸的点数，是一个度量单位，用于描述`点阵数字图像`，例如打印机，

更高的DPI意味着打印出的内容更加清晰、细腻，但是也意味着较慢的打印速度

下图是相同的ppi（左）和 DPI（右）的比较

![img.png](/imgs/base/css/unit-5.png)

## PPI(pixels per inch)

每英寸的物理像素，更确切的说法是`像素密度`，用于`电子图像设备`，例如电脑显示器、电视屏幕。一般来说，水平方向和垂直方向上的PPI是相同的

可以通过分辨率计算而来：

$$
PPI=\frac{\sqrt{分辨率宽^{2}+分辨率高^{2}} }{屏幕英寸}
$$

例如Iphone6

![img.png](/imgs/base/css/unit.png)

$$
PPI=\frac{\sqrt{1920^{2}+1080^{2}} }{5.5}=401
$$

一个设备的PPI值越大，它展示的图像更加细腻。

### PPI与分辨率

PPI描述的是设备展示图像的细节量

分辨率则是描述了像素的数量

- ppi值越大，越清晰
- 所谓高分屏，其实就是指`ppi大于同类设备`的屏幕。比如对于桌面设备，大于96ppi。对于移动设备，大于160ppi
- 所谓视网膜屏，其实就是指在该观看距离内`超出人类的辨认能力`的屏幕。比如对于桌面设备，大于192ppi。对于移动设备大于326ppi
- ppi，对于移动设备而言，一般来说ppi以160为一个档次

### 相机中的点数

相机制造商一般使用点数来表示屏幕的质量，每个点数对应1/3个像素（红、黄、蓝），例如佳能50D号称有920000个点，那么

$$
\frac{920000}{3}=640\times 480
$$

因此屏幕的分辨率为640x480

## DIP（device-independent pixel）

参考[逻辑像素#Android](#Android)

## 面向逻辑像素开发的基本开发流程

1. 在head 设置width=device-width的viewport
2. 在CSS中使用px
3. 在适当的场景使用flex布局，或者配合vw进行自适应
4. 在跨设备类型的时候（pc <-## 手机 <-## 平板）使用媒体查询
5. 在跨设备类型如果交互差异太大的情况，考虑分开项目开发

## 拓展

### 逻辑分辨率、物理分辨率

物理分辨率对应的是水平方向、垂直方向上的`物理像素点`的个数，生活中常见的设备分辨率一般指的就是物理分辨率

逻辑分辨率则是在为了防止软件在不同的设备上展示出现问题，底层图像系统在软件和设备之间添加的转换层，不同设备的逻辑分辨率不同

转换关系为：

$$
物理分辨率=逻辑分辨率\times DPR
$$

例如：一个设备的物理分辨率为5120 x 2880，DPR为4，那么它的逻辑分辨率为1280 x 720，一个逻辑像素则是由4 x 4个物理像素展示

其中物理分辨率对应的是物理像素，逻辑分辨率对应的是逻辑像素

下图是一些设备的物理分辨率、逻辑分辨率、PPI数据表格
![img.png](/imgs/base/css/unit-6.png)

:::warning
在桌面上设置的显示器分辨率`并非是`物理分辨率，只不过现在液晶显示器成为主流，由于液晶的显示原理与CRT不同，只有`桌边分辨率和物理分辨率一致的情况`下显示效果最佳。
:::

参考：

【1】[为什么很多web项目还是使用 px，而不是 rem？](https://www.zhihu.com/question/313971223/answer/628236155)

【2】[CSS像素、物理像素、逻辑像素、设备像素比、PPI、Viewport](https://github.com/jawil/blog/issues/21)

【3】[length-units](https://www.w3.org/TR/CSS2/syndata.html#length-units)

【4】[Device-independent-pixel](https://en.wikipedia.org/wiki/Device-independent_pixel)

【5】[DPI and device-independent pixels](https://learn.microsoft.com/en-us/windows/win32/learnwin32/dpi-and-device-independent-pixels)

【6】[Pixels. Physical vs. Logical](https://blog.specctr.com/pixels-physical-vs-logical-c84710199d62)

【7】[支持不同的像素密度](https://developer.android.com/training/multiscreen/screendensities?hl=zh-cn)

【8】[每英寸点数](https://zh.wikipedia.org/wiki/%E6%AF%8F%E8%8B%B1%E5%AF%B8%E7%82%B9%E6%95%B0)

【9】[What are pixels and points in iOS?](https://stackoverflow.com/questions/12019170/what-are-pixels-and-points-in-ios)
