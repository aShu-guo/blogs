<template>
  <div>
    <canvas id="cube" width="720" height="405"></canvas>
  </div>
</template>

<script setup lang="ts">
import {
  AdditiveBlending,
  AmbientLight,
  AxesHelper,
  BufferGeometry,
  DirectionalLight,
  DoubleSide,
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
// import pointColor from '../assets/points/color.png';
// import pointColor from '../assets/points/color-1.png';
import pointColor from '../assets/points/color-2.png';

defineOptions({ name: 'Points' });

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

// 设置球体
const sphereGeom = new SphereGeometry(3, 40, 40);

// 设置点
const pointsMaterial = new PointsMaterial({ color: 0x00ff00, size: 0.5 });
// 初始化textureLoader
const textureLoader = new TextureLoader();
const assignSRGB = (texture) => {
  texture.colorSpace = SRGBColorSpace;
};

const bufferGeom = new BufferGeometry();
bufferGeom.setAttribute('position', sphereGeom.getAttribute('position'));

const texture = textureLoader.load(pointColor as string, (texture) => {
  texture.colorSpace = SRGBColorSpace;
});
pointsMaterial.map = texture;
pointsMaterial.alphaMap = texture;
pointsMaterial.transparent = true;
pointsMaterial.depthWrite = false;
pointsMaterial.blending = AdditiveBlending;

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
    canvas: document.getElementById('cube') as HTMLCanvasElement,
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
