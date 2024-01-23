# 纹理

纹理可以简单理解为`“贴图”`，用来覆盖物体的表面时物体看起来更加真实、逼真。

我们不只是想让物体「看起来」像是某个现实物体，我们还希望它符合物体`在现实中的样子`，指在面对`不同的光照环境`时

- 物体需要有不同的反应
- 物体需要有其对应的`质感`

这就不是一张图片可以解决的问题了，我们需要有`不同类型的`图片`表达`物体的`不同属性`（例如：哪里透明，哪里应该有金属光泽等等）。

## 种类

包含7种，分别是颜色纹理-color、透明度纹理-alpha、环境光遮挡纹理-ao、高度纹理-height、法线纹理-normal、粗糙度纹理-roughness、金属度纹理-metalness

### 颜色纹理

是最基础的纹理，用于模拟物体表面的颜色和反射特性

<img src="/imgs/visual/threejs/textures/color.jpg" style="width: 50%">

### 透明度纹理

控制物体哪里是透明的，哪里是不透明的。白色为不透明，黑色表示透明

<img src="/imgs/visual/threejs/textures/alpha.jpg" style="width: 50%">

### 环境光遮挡纹理

模拟光线在物体不同部分之间的传播和遮挡效果，颜色越暗表示遮蔽程度越高，反之越低

<img src="/imgs/visual/threejs/textures/ambientOcclusion.jpg" style="width: 50%">

### 高度纹理

模拟物体不同部位的凹凸，白色表示凸起程度高，黑色表示凸起程度低

<img src="/imgs/visual/threejs/textures/height.jpg" style="width: 50%">

### 粗糙度纹理

模拟物体表面的粗糙度

<img src="/imgs/visual/threejs/textures/roughness.jpg" style="width: 50%">

### 金属度纹理

控制物体上哪些部分是金属，哪些部分不是金属。其中白色的部分表示金属，越黑则越不是金属。下图中灰色的部分是生锈的金属

<img src="/imgs/visual/threejs/textures/metalness.jpg" style="width: 50%">

### 法线纹理

<img src="/imgs/visual/threejs/textures/normal.jpg" style="width: 50%">

参考：

【1】[和我一起学 Three.js【初级篇】：4. 掌握纹理](https://zhuanlan.zhihu.com/p/615285137)
