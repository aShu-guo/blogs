<template>
  <div class="card">
    <div class="img-wrap">
      <img src="/imgs/base/css/qa-1.webp" alt="a flower" />
    </div>
    <div class="content">
      <div>登录</div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineOptions({ name: 'ImgWrap' });
</script>

<style scoped>
/* 当然也可以不使用伪类元素 */
.card {
  height: 100%;
  width: 60%;
  background-color: #fff;
  margin: 0 auto;
  border-radius: 10px;
  overflow: hidden;
  min-width: 500px;
}
.img-wrap {
  width: 50%;
  float: left;
  position: relative;
}
/* 撑开图片容器 */
.img-wrap::after {
  width: 100%;
  padding-top: 125%;
  display: block;
  content: '';
}
/* 图片大小撑开并定位 */
.img-wrap img {
  position: absolute;
  height: auto;
  max-width: 100%;
  left: 0;
  top: 0;
  bottom: 0;
  right: 0;
}
.card .content {
  float: left;
  width: 50%;
  padding: 20px;
  box-sizing: border-box;
  color: red;
}
</style>
