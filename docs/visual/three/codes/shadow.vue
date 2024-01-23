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
  CameraHelper,
  DirectionalLight,
  DoubleSide,
  Mesh,
  MeshStandardMaterial,
  PerspectiveCamera,
  PlaneGeometry,
  Scene,
  SRGBColorSpace,
  TextureLoader,
  WebGLRenderer,
} from 'three';
import * as dat from 'dat.gui';
import { onMounted, shallowRef } from 'vue';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import door from '../assets/door/color.jpg';
import alpha from '../assets/door/alpha.jpg';
import ambientOcclusion from '../assets/door/ambientOcclusion.jpg';
import height from '../assets/door/height.jpg';
import roughness from '../assets/door/roughness.jpg';
import normal from '../assets/door/normal.jpg';

import grassColor from '../assets/shadow/color.jpg';
import grassAO from '../assets/shadow/ao.jpg';
import grassHeight from '../assets/shadow/height.jpg';
import grassNormal from '../assets/shadow/normal.jpg';
import grassRoughness from '../assets/shadow/roughness.jpg';

defineOptions({ name: 'Shadow' });

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

// 初始化texture loader
const textureLoader = new TextureLoader();

// 设置地面
const grass = new PlaneGeometry(5, 5, 200, 200);
// 设置aoMap时，需要同时设置第二组uv
grass.setAttribute('uv2', new BufferAttribute(grass.attributes.uv.array, 2));

const grassMap = textureLoader.load(grassColor as string);
grassMap.colorSpace = SRGBColorSpace;
const grassMaterial = new MeshStandardMaterial({
  map: grassMap,
  aoMap: textureLoader.load(grassAO as string),
  displacementMap: textureLoader.load(grassHeight as string),
  displacementScale: 0.3,
  normalMap: textureLoader.load(grassNormal as string),
  roughnessMap: textureLoader.load(grassRoughness as string),
  side: DoubleSide,
});
const grassMesh = new Mesh(grass, grassMaterial);
grassMesh.position.set(0, -1, 0);
grassMesh.rotation.set(-Math.PI / 2, 0, 0);
grassMesh.receiveShadow = true;
scene.add(grassMesh);

// 设置门
const geometry = new BoxGeometry(2, 2, 2, 100, 100, 100);

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
mesh.castShadow = true;
scene.add(mesh);

geometry.setAttribute(
  'uav2',
  new BufferAttribute(geometry.attributes.uv.array, 2),
);

// 设置环境光
const light = new AmbientLight(0xffffff, 1);
scene.add(light);
// 设置平行光，模拟太阳光照
const directionLight = new DirectionalLight(0xffffff, 1);
directionLight.position.set(10, 10, 10);
directionLight.castShadow = true;
// 设置阴影的分辨率
// directionLight.shadow.mapSize.set(2048, 2048);
// 设置光的camera，注意区分摄像机
// directionLight.shadow.camera.near = 30;
// directionLight.shadow.camera.far = 500;
// directionLight.shadow.camera.top = 5;
// directionLight.shadow.camera.bottom = -5;
// directionLight.shadow.camera.left = -5;
// directionLight.shadow.camera.right = 5;

scene.add(directionLight);

const shadowCameraHelper = new CameraHelper(directionLight.shadow.camera);
scene.add(shadowCameraHelper);

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
