# 材质和纹理

相关API实践

## 材质

材质，又称为材料，是人类可以利用制作有用构件、器件或物品的物质。

## 纹理

是物质界面的性质，由地形（lay）、表面粗糙度（surface roughness）、起伏度（waviness）三个特征定义。

材质贴图，又称纹理贴图，在计算机图形学中是把存储在内存里的位图`包裹到3D渲染物体的表面`。纹理贴图给物体提供了`丰富的细节`，用简单的方式模拟出了复杂的外观。

### 加载

通过TextureLoader加载纹理图片

```ts
import img from './img.png';

const textureLoader = new TextureLoader();
const texture = textureLoader.load(img as string);
```

随后为材质指定纹理

```ts
const basicMaterial = new MeshBasicMaterial({
  map: texture,
});
```

### 偏移

可以通过设置offset属性来改变纹理偏移，改变初始点位置即左下角

纹理图如下：

![img.png](/imgs/visual/threejs/texture-1.png)

x轴方向偏移0.1，y轴方向偏移0.5

```js
texture.offset.set(0.1, 0.5);
```

![img.png](/imgs/visual/threejs/texture.png)

### 旋转

通过设置rotation属性来改变纹理的旋转角度，旋转中心点是左下角

```ts
texture.rotation = Math.PI / 4;
```

![img.png](/imgs/visual/threejs/texture-2.png)

也可以通过center属性设置旋转中心点

```ts
texture.center.set(0.5, 0.5);
texture.rotation = Math.PI / 4;
```

![img.png](/imgs/visual/threejs/texture-3.png)

### 重复

纹理改成如`logo图`，重复时更明显。可以通过设置repeat属性改变水平、垂直方向上的重复次数

```ts
texture.repeat.set(3, 2);
```

![img.png](/imgs/visual/threejs/texture-4.png)

但是并没有得到我们想要的效果，即水平方向重复3次、垂直方向重复2次

文档中提到

:::info

如果重复次数在任何方向上设置了超过1的数值， 对应的Wrap需要设置为`THREE.RepeatWrapping`或者`THREE.MirroredRepeatWrapping`来 达到想要的平铺效果。

:::

包裹模式：

- RepeatWrapping，即简单重复到无穷大
- MirroredRepeatWrapping，镜像重复到无穷大

```ts
texture.wrapS = RepeatWrapping;
texture.wrapT = MirroredRepeatWrapping;
```

![img.png](/imgs/visual/threejs/texture-5.png)

### 贴图采样

当展示区域的像素大小与纹理像素不匹配时，可以通过设置magFilter、minFilter来改变，

- magFilter：设置放大时的采样模式，默认值为LinearFilter，获取最接近的4个纹素并进行双线性插值
- minFilter：设置缩小时的采样模式，默认值为LinearMipmapLinearFilter，使用mipmapping和三次线性过滤

```ts
texture.magFilter = NearestFilter;
texture.minFilter = NearestFilter;
```

:::info
为了加快渲染速度和减少图像锯齿，将贴图处理处理成由一系列被预先计算和优化过的图片组成的文件,这样的贴图被称为 MIP map 或者 mipmap。
:::

### 渲染面

设置side属性控制webgl渲染哪一面， 默认为THREE.FrontSide：

- THREE.FrontSide：只渲染前面
- THREE.BackSide：只渲染后面
- THREE.DoubleSide：渲染前面、后面

![img.png](/imgs/visual/threejs/texture-7.png)

### 透明贴图

可以通过设置alphaMap属性来控制物体的透明度，主要要同时设置`transparent`属性为`true`

alphaMap对应的图如下

<img src="/imgs/visual/threejs/texture-8.jpg" style="width: 50%">

在alphaMap图中对应的`黑色为透明`，`白色为不透明`

```ts
import alphaMap from './alpha-map.png';

// 加载alpha map
const alphaTexture = textureLoader.load(alphaMap as string);

const basicMaterial = new MeshBasicMaterial({
  map: texture,
  alphaMap: alphaTexture,
  transparent: true,
});
```

![img.png](/imgs/visual/threejs/texture-9.png)

### 环境遮挡贴图

通过设置aoMap属性添加环境遮挡贴图，是物体看起来更像三维的。设置aoMap时，需要同时对物体设置第二组UV

<img src="/imgs/visual/threejs/texture-10.jpg" style="width: 50%">

渲染结果如下：

<script setup>
import Material from './codes/material.vue'
</script>

<ClientOnly>
    <Material></Material>
</ClientOnly>
