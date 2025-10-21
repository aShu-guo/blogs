<template>
  <canvas ref="canvas" class="w-200px h-200px"></canvas>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';

defineOptions({ name: 'LinearGradientCanvas' });

const canvas = ref<HTMLCanvasElement>();

onMounted(() => {
  if (!canvas.value) return;

  // 创建线性渐变
  const ctx = canvas.value?.getContext('2d');

  // 定义渐变线：从左到右
  const gradient = ctx.createLinearGradient(
    0,
    0,
    canvas.value.width,
    0,
  );

  // 添加色标
  gradient.addColorStop(0, '#ff0000'); // 起点：红色
  gradient.addColorStop(0.5, '#00ff00'); // 中点：绿色
  gradient.addColorStop(1, '#0000ff'); // 终点：蓝色

  // 应用渐变
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.value.width, canvas.value.height);
});
</script>

<style scoped></style>
