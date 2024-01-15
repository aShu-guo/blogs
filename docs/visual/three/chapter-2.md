# 几何体

three中的几何体本质上是一个个顶点构成的，由于three中每个面都是由多个三角形构成。

例如：一个矩形可以拆分为两个或多个三角形，假设它没有划分的那么细腻，是由两个三角形构成，则有

![img.png](/imgs/visual/threejs/box-geom.png)

使用BufferGeometry基础类表示：

```ts
const geometry = new THREE.BufferGeometry();
// 创建一个简单的矩形. 在这里我们左上和右下顶点被复制了两次。
// 因为在两个三角面片里，这两个顶点都需要被用到。
const vertices = new Float32Array([
  -1.0, -1.0, 1.0, 1.0, -1.0, 1.0, 1.0, 1.0, 1.0,

  1.0, 1.0, 1.0, -1.0, 1.0, 1.0, -1.0, -1.0, 1.0,
]);

// itemSize = 3 因为每个顶点都是一个三元组。
geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
const material = new THREE.MeshBasicMaterial({ color: 0xff0000 });
const mesh = new THREE.Mesh(geometry, material);
```

需要注意的是，这里顶点的个数与几何中不一致，平面几何中一个平面是由4个点构成，但是这里需要6个点，即两个三角形。

而且顶点的顺序是有要求的，必须是`逆时针`传入，否则不会渲染出来

<script setup>
import MultiTriangle from './codes/multi-triangle.vue'
</script>

<ClientOnly>
    <MultiTriangle></MultiTriangle>
</ClientOnly>
