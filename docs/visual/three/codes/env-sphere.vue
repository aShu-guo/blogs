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
  CubeTextureLoader,
  DirectionalLight,
  EquirectangularReflectionMapping,
  EquirectangularRefractionMapping,
  Mesh,
  MeshStandardMaterial,
  PerspectiveCamera,
  Scene,
  SphereGeometry,
  WebGLRenderer,
} from 'three';
import { onMounted, shallowRef } from 'vue';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import px from '../assets/env/posx.png';
import nx from '../assets/env/negx.png';
import py from '../assets/env/posy.png';
import ny from '../assets/env/negy.png';
import pz from '../assets/env/posz.png';
import nz from '../assets/env/negz.png';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js';
import hdr2k from '../assets/env/rgbe-2k.hdr?url';
import hdr4k from '../assets/env/rgbe-4k.hdr?url';

defineOptions({ name: 'EnvSphere' });

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
const sphere = new SphereGeometry(3);

const basicMaterial = new MeshStandardMaterial({
  // envMap,
  roughness: 0,
  metalness: 0.9,
});
const mesh = new Mesh(sphere, basicMaterial);
scene.add(mesh);

// 1. 六张环境贴图
/*const cubeTextureLoader = new CubeTextureLoader();
const envMap = cubeTextureLoader.load([
  px as string,
  nx as string,
  py as string,
  ny as string,
  pz as string,
  nz as string,
]);*/

// 2. 一张HDR环境贴图
const rgbeLoader = new RGBELoader();
rgbeLoader.loadAsync(hdr4k as string).then((texture) => {
  texture.mapping = EquirectangularReflectionMapping;
  scene.background = texture;
  basicMaterial.envMap = texture;
});

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
