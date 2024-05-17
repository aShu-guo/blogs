# scale与zoom的差异

1. zoom的缩放是相对于`左上角`的；而scale默认是`居中`缩放；
2. zoom的缩放`改变`了元素占据的`空间大小`；而scale的缩放占据的`原始尺寸不变`，页面布局不会发生变化；也就意味着如果使用zoom对大屏的放缩时，不会影响事件的触发
3. 对文字的缩放规则一致。zoom、scale均可以突破中文大小最小12px限制

## case

<style scoped>
.zoom-half { zoom: 0.5; }
.scale-half { transform: scale(0.5); }
img{ width:10%; }
</style>
<p><strong>图片zoom: 0.5;</strong></p>
<p><img src="https://raw.githubusercontent.com/devicons/devicon/master/icons/javascript/javascript-original.svg" class="zoom-half"></p>
<p><strong>图片transform: scale(0.5);</strong></p>
<p><img src="https://raw.githubusercontent.com/devicons/devicon/master/icons/javascript/javascript-original.svg" class="scale-half"></p>
<p><strong>容器(含图文)zoom: 0.5;</strong></p>
<p class="zoom-half">文字啊哈！<br><img src="https://raw.githubusercontent.com/devicons/devicon/master/icons/javascript/javascript-original.svg"></p>
<p><strong>容器(含图文)transform: scale(0.5);</strong></p>
<p class="scale-half">文字啊哈！<br><img src="https://raw.githubusercontent.com/devicons/devicon/master/icons/javascript/javascript-original.svg"></p>
