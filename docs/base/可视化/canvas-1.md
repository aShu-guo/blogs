1.线性渐变对象

CanvasRenderingContext2D.createLinearGradient(x0, y0, x1, y1)创建一个线性渐变对象

定义从(x0, y0)到(x1, y1)两点间的渐变规则，如果超出渐变范围，那么仍展示颜色

```js
let gradientLinear = ctx.createLinearGradient(0, 0, 0, 100)
gradientLinear.addColorStop(0, 'red');
gradientLinear.addColorStop(1, 'green');

// 在0,0 到 0,100 间的渐变规则为从red到green
```

![image-20210916163633155](/Users/ifugle/Library/Application Support/typora-user-images/image-20210916163633155.png)

2.径向渐变对象

CanvasRenderingContext2D.createRadialGradient(x0, y0, x1, y1, r0, r1)创建一个线性渐变对象

r0初始圆半径；r1结束圆半径；

(x0, y0) 到 (x1, y1)的长度 < r1 - r0

满足是正常展示：

```js
    var gradient = ctx.createRadialGradient(120, 60, 10, 150, 60, 60);
```



![image-20210916165726789](/Users/ifugle/Library/Application Support/typora-user-images/image-20210916165726789.png)

如果等于则只展示一半；

```js
    var gradient = ctx.createRadialGradient(120, 60, 10, 170, 60, 60);
```



![image-20210916165749501](/Users/ifugle/Library/Application Support/typora-user-images/image-20210916165749501.png)

如果大于则图形失真

```js
    var gradient = ctx.createRadialGradient(120, 60, 10, 180, 60, 60);
```

![image-20210916165859345](/Users/ifugle/Library/Application Support/typora-user-images/image-20210916165859345.png)



定义从(x0, y0)到(x1, y1)两点间的渐变规则，如果超出渐变范围，那么仍展示颜色

```js
 var gradient = ctx.createRadialGradient(120, 60, 0, 120, 60, 60);
    // 设置起止颜色
gradient.addColorStop(0, 'red');
gradient.addColorStop(1, 'green');
```

特殊的径向渐变：标准两色径向渐变（开始圆直径为0）、色带分隔明显的色环（设置colorStop）



3.贝塞尔曲线



4.图像对象

通过createImageData(x, y) 创建一个宽为x 高为y的矩形画布，默认为透明黑，像素点数量为x * y

每个像素点包含4个颜色值，分别是：红 绿 蓝 透明度

```js
// 画图像时，以像素点为维度考虑更简单些
var imagedata = context.createImageData(300, 11);
console.log(imagedata.data.length) // 长度为300 * 11 * 4

context.putImageData(imagedata, 0, 0);// 需要重绘 
```



5.drawImage
