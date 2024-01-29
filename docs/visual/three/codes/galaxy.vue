<template>
  <div>
    <canvas id="cube1" width="720" height="405"></canvas>
  </div>
</template>

<script setup lang="ts">
import {
  AdditiveBlending,
  AmbientLight,
  AxesHelper,
  BufferAttribute,
  BufferGeometry,
  DirectionalLight,
  DoubleSide,
  Float32BufferAttribute,
  PerspectiveCamera,
  Points,
  PointsMaterial,
  Scene,
  SphereGeometry,
  SRGBColorSpace,
  TextureLoader,
  WebGLRenderer,
} from 'three';
import { onMounted, shallowRef } from 'vue';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import pointColor from '../assets/points/color-3.png';

defineOptions({ name: 'Galaxy' });

const renderer = shallowRef<WebGLRenderer>();
// 创建场景
const scene = new Scene();

// 创建相机
const camera = new PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000,
);
// 设置相机位置
camera.position.set(10, 10, 10);
scene.add(camera);

const bufferGeom = new BufferGeometry();
// 设置点
const count = 3000;
const positions = new Float32Array(count * 3);
const colors = new Float32Array(count * 3);
for (let i = 0; i < count * 3; i++) {
  positions[i] = (Math.random() - 0.5) * 50;
  colors[i] = Math.random();
}
bufferGeom.setAttribute('position', new BufferAttribute(positions, 3));
bufferGeom.setAttribute('color', new Float32BufferAttribute(colors, 3));

const pointsMaterial = new PointsMaterial({ size: 0.8 });

// 加载纹理贴图
const textureLoader = new TextureLoader();
const texture = textureLoader.load(pointColor as string, (texture) => {
  texture.colorSpace = SRGBColorSpace;
});

pointsMaterial.map = texture;
pointsMaterial.alphaMap = texture;
pointsMaterial.transparent = true;
pointsMaterial.depthWrite = false;
pointsMaterial.blending = AdditiveBlending;
pointsMaterial.vertexColors = true;

const points = new Points(bufferGeom, pointsMaterial);
scene.add(points);

// 设置环境光
const light = new AmbientLight(0xffffff, 1);
scene.add(light);
// 设置平行光，模拟太阳光照
const directionLight = new DirectionalLight(0xffffff, 1);
directionLight.position.set(10, 10, 10);
directionLight.castShadow = true;
scene.add(directionLight);

// 创建坐标轴辅助器
const axesHelper = new AxesHelper(5);
scene.add(axesHelper);

onMounted(() => {
  // 初始化渲染器
  renderer.value = new WebGLRenderer({
    antialias: true,
    canvas: document.getElementById('cube1') as HTMLCanvasElement,
  });
  renderer.value.shadowMap.enabled = true;
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
