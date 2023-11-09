WebGL提供一套API（Js）与GPU通信，也可以直接使用GLSL直接与GPU通信，来编写着色器程序



> #### 流水线（图形管线 or 渲染管线）：

一般情况下，最初的顶点坐标是相对于`模型中心`的，不能直接传递到着色器中，我们需要对`顶点坐标`按照一系列步骤执行`模型转换`，`视图转换`，`投影转换`，转换之后的坐标才是 WebGL 可接受的坐标，即`裁剪空间坐标`。我们把最终的`变换矩阵`和`原始顶点坐标`传递给 `GPU`，GPU 的渲染管线对它们执行流水线作业。

![img](https://p1-jj.byteimg.com/tos-cn-i-t2oaga2asx/gold-user-assets/2018/9/5/165a8dc3be028ca3~tplv-t2oaga2asx-watermark.awebp)



> #### 坐标系变换

```js
1.观察坐标---（投影矩阵）--->裁剪坐标---（透视除法）--->设备坐标（NDC坐标系）坐标范围：[-1，1]
---视口变换--->屏幕坐标

2.投影矩阵：
	2.1.正射投影矩阵 按照原貌同比例缩小，常用于建筑图纸，但不符合人眼”远大近小“
	2.2.透视投影矩阵
	
3.坐标系变换要点
计算出原坐标系的原点 O 在新坐标系的坐标。（平移变换）
计算出新坐标系坐标分量的单位向量在原坐标系下的长度。（缩放变换）
计算出原坐标系的坐标分量（基向量）的方向。（旋转变换）
```



>#### 深度检测

```js
未开启之前：谁后绘制，谁展示在前
开启之后：z值越小，展示在前
```





> #### 在ESModule中使用import导入着色器文件

```js
1.着色器后缀
顶点着色器：.vert
片元着色器：.frag

2.使用webpack2的raw-loader，导入vert文件、frag文件到ES6module中
npm install --save-dev raw-loader

3.webpack配置
module.exports = {
  module: {
    rules: [
      {
        test: /\.(vert|frag|geom)$/,
        use: 'raw-loader'
      }
    ]
  }
}
4.导出使用
import LightShader from 'light.vert';
// LightShader为对应的string
```

