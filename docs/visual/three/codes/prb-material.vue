<template>
  <div>
    <canvas id="cube" width="720" height="405"></canvas>
  </div>
</template>

<script setup lang="ts">
import {
  AmbientLight,
  AxesHelper,
  BoxGeometry,
  BufferAttribute,
  DirectionalLight,
  DoubleSide,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  PerspectiveCamera,
  Scene,
  SRGBColorSpace,
  TextureLoader,
  WebGLRenderer,
} from 'three';
import { onMounted, shallowRef } from 'vue';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import door from '../assets/door/color.jpg';
import alpha from '../assets/door/alpha.jpg';
import ambientOcclusion from '../assets/door/ambientOcclusion.jpg';
import height from '../assets/door/height.jpg';
import roughness from '../assets/door/roughness.jpg';
import normal from '../assets/door/normal.jpg';

defineOptions({ name: 'PRBMaterial' });

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
camera.position.set(0, 0, 10);
scene.add(camera);

// 设置物体
const geometry = new BoxGeometry(3, 3, 3, 100, 100, 100);
const textureLoader = new TextureLoader();

const map = textureLoader.load(door as string);
map.colorSpace = SRGBColorSpace;

const basicMaterial = new MeshStandardMaterial({
  map: map, // 加载纹理贴图
  alphaMap: textureLoader.load(alpha as string), // 加载alpha map
  aoMap: textureLoader.load(ambientOcclusion as string),
  displacementMap: textureLoader.load(height as string),
  displacementScale: 0.1,
  roughnessMap: textureLoader.load(roughness as string),
  roughness: 1,
  normalMap: textureLoader.load(normal as string),
  transparent: true,
  // opacity: 0.3,
  side: DoubleSide,
});

const mesh = new Mesh(geometry, basicMaterial);
scene.add(mesh);

geometry.setAttribute(
  'uav2',
  new BufferAttribute(geometry.attributes.uv.array, 2),
);

// 设置环境光
const light = new AmbientLight(0xffffff, 0.5);
scene.add(light);
// 设置平行光，模拟太阳光照
const directionLight = new DirectionalLight(0xffffff, 1);
directionLight.position.set(10, 10, 10);
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
