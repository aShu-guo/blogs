# PBR

基于物理的光照模型，合理的数学计算而得出的材质。Three提供了标准网格材质(MeshStandardMaterial)来模拟PBR材质，可以提供更加逼真的效果，但是代价是计算成本更高。

## 环境贴图

### 使用6张贴图

通过CubeTextureLoader加载，传入顺序为：px、nx、py、ny、pz、nz

<div style="display: flex; justify-content: center; width: 100%">
  <div style="flex: 1; padding: 3px; border: 1px solid black">
    <img src="./assets/env/posx.png" alt="" />
  </div>
  <div style="flex: 1; padding: 3px; border: 1px solid black">
    <img src="./assets/env/negx.png" alt="" />
  </div>
  <div style="flex: 1; padding: 3px; border: 1px solid black">
    <img src="./assets/env/posy.png" alt="" />
  </div>
  <div style="flex: 1; padding: 3px; border: 1px solid black">
    <img src="./assets/env/negy.png" alt="" />
  </div>
  <div style="flex: 1; padding: 3px; border: 1px solid black">
    <img src="./assets/env/posz.png" alt="" />
  </div>
  <div style="flex: 1; padding: 3px; border: 1px solid black">
    <img src="./assets/env/negz.png" alt="" />
  </div>
</div>

```ts
const cubeTextureLoader = new CubeTextureLoader();
const envMap = cubeTextureLoader.load([
  px as string,
  nx as string,
  py as string,
  ny as string,
  pz as string,
  nz as string,
]);
```

### 使用HDR

HDR（High Dynamic Range Imaging）又称高动态范围成像，最初只用于纯粹由计算机生成的图像。后来，人们开发出了一些从`不同曝光范围`照片中生成高动态范围图像的方法。

通过将不同曝光下的照片合成为一个图片，让同一幅照片中`较暗的部分`和`较亮的部分`都保留`较高程度的细节`

![img.png](/imgs/visual/threejs/pbr.png)

<script setup>
import EnvSphere from './codes/env-sphere.vue';
</script>

<ClientOnly>
    <EnvSphere></EnvSphere>
</ClientOnly>
