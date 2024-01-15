# 入门与调试

Three渲染一个物体必需的4个条件：

- 场景-scene
- 相机-camera
- 物体-material+geometry
- 渲染器-renderer

<a href="/blogs/three/debugger.html" target="_blank">示例</a>

## 自适应

根据窗口大小变化自适应时，需要更新renderer的size以及camera的aspect

```js
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.value?.setSize(window.innerWidth, window.innerHeight);
});
```

## controls

### OrbitControls

轨道控制器，实例化之后添加到scene中，便可以拖拽物体进行查看

![img.png](/imgs/visual/threejs/box-geom-1.png)
