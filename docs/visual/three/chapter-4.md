# PBR

基于物理的光照模型，合理的数学计算而得出的材质。Three提供了标准网格材质(MeshStandardMaterial)来模拟PBR材质，可以提供更加逼真的效果，但是代价是计算成本更高。

<script setup>
import EnvSphere from './codes/env-sphere.vue'
</script>

<ClientOnly>
    <EnvSphere></EnvSphere>
</ClientOnly>
