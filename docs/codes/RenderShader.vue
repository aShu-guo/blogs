<template>
  <div ref="containerRef" class="render-shader"></div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch } from 'vue';
import * as THREE from 'three';

/**
 * @description: 定义shader
 * @author ashu-guo
 * @date 2025/10/20 18:59:17
 * @github https://github.com/aShu-guo
 */
defineOptions({ name: 'RenderShader' });

interface Props {
  vert: string;
  frag: string;
  width?: number;
  height?: number;
  uniforms?: Record<string, THREE.IUniform>;
  autoResize?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  width: 600,
  height: 400,
  uniforms: () => ({}),
  autoResize: true,
});

const containerRef = ref<HTMLDivElement | null>(null);

let scene: THREE.Scene | null = null;
let camera: THREE.OrthographicCamera | null = null;
let renderer: THREE.WebGLRenderer | null = null;
let mesh: THREE.Mesh | null = null;
let animationId: number | null = null;

const defaultUniforms = {
  u_time: { value: 0.0 },
  u_resolution: { value: new THREE.Vector2(props.width, props.height) },
};

const initThree = () => {
  if (!containerRef.value) return;

  // 创建场景
  scene = new THREE.Scene();

  // 创建正交相机
  camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

  // 创建渲染器
  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(props.width, props.height);
  renderer.setPixelRatio(window.devicePixelRatio);
  containerRef.value.appendChild(renderer.domElement);

  // 合并默认 uniforms 和用户自定义 uniforms
  const mergedUniforms = {
    ...defaultUniforms,
    ...props.uniforms,
  };

  // 创建平面几何体（使用 BufferGeometry 以便自定义 attributes）
  const geometry = new THREE.BufferGeometry();

  // 定义顶点位置（两个三角形组成一个矩形，覆盖整个屏幕）
  const vertices = new Float32Array([
    -1.0, -1.0, 1.0, -1.0, 1.0, 1.0, -1.0, -1.0, 1.0, 1.0, -1.0, 1.0,
  ]);

  // 设置 attribute（使用 a_position 以兼容自定义的顶点着色器）
  geometry.setAttribute('a_position', new THREE.BufferAttribute(vertices, 2));

  // 同时设置 position attribute（兼容标准 Three.js shader）
  const positions3D = new Float32Array([
    -1.0, -1.0, 0.0, 1.0, -1.0, 0.0, 1.0, 1.0, 0.0, -1.0, -1.0, 0.0, 1.0,
    1.0, 0.0, -1.0, 1.0, 0.0,
  ]);
  geometry.setAttribute('position', new THREE.BufferAttribute(positions3D, 3));

  // 创建着色器材质
  const material = new THREE.ShaderMaterial({
    vertexShader: props.vert,
    fragmentShader: props.frag,
    uniforms: mergedUniforms,
  });

  mesh = new THREE.Mesh(geometry, material);
  scene.add(mesh);

  // 渲染循环
  const animate = (time: number) => {
    animationId = requestAnimationFrame(animate);

    if (mesh && mesh.material instanceof THREE.ShaderMaterial) {
      // 更新时间 uniform
      mesh.material.uniforms.u_time.value = time * 0.001;
    }

    if (renderer && scene && camera) {
      renderer.render(scene, camera);
    }
  };

  animate(0);
};

const cleanup = () => {
  if (animationId !== null) {
    cancelAnimationFrame(animationId);
    animationId = null;
  }

  if (mesh) {
    mesh.geometry.dispose();
    if (mesh.material instanceof THREE.Material) {
      mesh.material.dispose();
    }
    mesh = null;
  }

  if (renderer) {
    renderer.dispose();
    if (
      containerRef.value &&
      renderer.domElement.parentNode === containerRef.value
    ) {
      containerRef.value.removeChild(renderer.domElement);
    }
    renderer = null;
  }

  scene = null;
  camera = null;
};

const handleResize = () => {
  if (!props.autoResize || !renderer || !camera) return;

  const width = containerRef.value?.clientWidth || props.width;
  const height = containerRef.value?.clientHeight || props.height;

  renderer.setSize(width, height);

  if (mesh && mesh.material instanceof THREE.ShaderMaterial) {
    mesh.material.uniforms.u_resolution.value.set(width, height);
  }
};

onMounted(() => {
  initThree();

  if (props.autoResize) {
    window.addEventListener('resize', handleResize);
  }
});

onBeforeUnmount(() => {
  cleanup();

  if (props.autoResize) {
    window.removeEventListener('resize', handleResize);
  }
});

// 监听 shader 变化，重新初始化
watch(
  () => [props.vert, props.frag],
  () => {
    cleanup();
    initThree();
  },
);
</script>

<style scoped>
.render-shader {
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
}
</style>
