<template>
  <div>
    <canvas id="cube" width="720" height="405"></canvas>
  </div>
</template>

<script setup lang="ts">
import {
  AxesHelper,
  BufferAttribute,
  BufferGeometry,
  Color,
  Mesh,
  MeshBasicMaterial,
  PerspectiveCamera,
  Scene,
  WebGLRenderer,
} from 'three';
import { onMounted, shallowRef } from 'vue';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

defineOptions({ name: 'MultiTriangle' });

const renderer = shallowRef<WebGLRenderer>();
// 创建场景
const scene = new Scene();

// 创建相机
const camera = new PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
// 设置相机位置
camera.position.set(0, 0, 10);
scene.add(camera);

for (let i = 0; i < 50; i++) {
  const vertices = new Float32Array(9);
  for (let j = 0; j < 9; j++) {
    // 创建几何体，坐标点在0到5之间
    vertices[j] = Math.random() * 10 - 5;
  }
  const geometry = new BufferGeometry();

  geometry.setAttribute('position', new BufferAttribute(vertices, 3));
  const material = new MeshBasicMaterial({
    color: new Color(Math.random(), Math.random(), Math.random()),
    transparent: true,
    opacity: 0.5,
  });
  const cube = new Mesh(geometry, material);
  scene.add(cube);
}

// 创建坐标轴辅助器
const axesHelper = new AxesHelper(5);
scene.add(axesHelper);

onMounted(() => {
  // 初始化渲染器
  renderer.value = new WebGLRenderer({ antialias: true, canvas: document.getElementById('cube') as HTMLCanvasElement });
  renderer.value.setSize(720, 405);

  const controls = new OrbitControls(camera, renderer.value.domElement);
  controls.enableDamping = true;

  const animate = () => {
    renderer.value?.render(scene, camera);

    controls.update();
    requestAnimationFrame(animate);
  };

  animate();
});
</script>

<style scoped></style>
