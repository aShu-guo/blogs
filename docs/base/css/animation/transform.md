# transform

通过transform，我们可以移动、旋转、放缩、倾斜DOM元素。

## 有哪些方法？

### transform 2d

- 移动：translate、translateX、translateY、translateZ
- 旋转：rotate
- 放缩：scale、scaleX、scaleY
- 倾斜：skew、skewX、skewY
- matrix：可以同时添加上述值到transform属性上

```text
matrix(scaleX(), skewY(), skewX(), scaleY(), translateX(), translateY())
```

### transform 3d

- 旋转：rotateX、rotateY、rotateZ

3d旋转特有的属性

- transform-style: 表明元素的子元素是在平面中还是3D空间中
    - flat
    - preserve-3d
- perspective: 表明在3D空间中，元素距离用户多远，更小的值会更好的3D效果
  ![img.png](/imgs/animation/perspective.png)
    - 数值
- perspective-origin: 定义用户在3D空间上的哪个位置上看元素
- backface-visibility: 定义元素没有正对着屏幕时是否展示（通过rotate旋转背对着屏幕）
