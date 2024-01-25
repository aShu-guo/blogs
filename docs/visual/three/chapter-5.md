# 阴影与灯光

## 阴影

模拟光照照射到物体上产生的阴影，在Three中并非所有的材质都会受光照影响，例如：MeshBasicMaterial是不受光照影响的，MeshStandardMaterial、MeshPhysicalMaterial是受光照影响的

### 初始化

模拟阴影效果时，需要首先确定物体的材质`是否是受光照影响的`，接下来：

1. 设置渲染器开启阴影的计算

```js
renderer.shadowMap.enabled = true;
```

2. 设置光照投射阴影

```js
directionalLight.castShadow = true;
```

3. 设置物体（例如球体、box等）投射阴影

```js
sphere.castShadow = true;
```

4. 设置物体（例如地面、墙面等）接收阴影

```js
plane.receiveShadow = true;
```

### 设置shadow的camera

需要注意的是该camera并非是场景中的camera，而是站在光的角度来考虑的

```js
// 设置阴影的分辨率
directionLight.shadow.mapSize.set(2048, 2048);
// 设置光的camera，注意区分摄像机
directionLight.shadow.camera.near = 30;
directionLight.shadow.camera.far = 500;
directionLight.shadow.camera.top = 5;
directionLight.shadow.camera.bottom = -5;
directionLight.shadow.camera.left = -5;
directionLight.shadow.camera.right = 5;
```

![img.png](/imgs/visual/threejs/shadow.png)

开启`directionLight.shadow.camera`、场景中相机的`cameraHelper`

<script setup>
import Shadow from './codes/shadow.vue'
</script>

<ClientOnly>
    <Shadow></Shadow>
</ClientOnly>

## 光源

### 聚光灯

以上示例使用的都是平行光（即模拟真实世界的太阳光），聚光灯示例可参考

![img.png](/imgs/visual/threejs/shadow-1.png)

<a href="/blogs/three/spot-light.html" target="_blank">聚光灯</a>

### 点光灯

![img.png](/imgs/visual/threejs/shadow-2.gif)


<a href="/blogs/three/point-light.html" target="_blank">点光灯</a>
