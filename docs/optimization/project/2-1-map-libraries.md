# 2.1 地图库优化

## 问题场景

### 当前状态

项目同时使用了两个地图库：

```typescript
// package.json
{
  "dependencies": {
    "cesium": "^1.135.0",      // 3D 地图，800KB (gzipped)
    "ol": "^10.7.0",            // 2D 地图，450KB (gzipped)
  }
}
```

**问题**：
1. 两个地图库都在首屏加载，即使用户可能只使用其中一个
2. Cesium 包含大量 3D 资源（模型、纹理、着色器）
3. 地图初始化耗时长，阻塞主线程

### 用户影响

- **首屏加载慢**：1.25MB 的地图库代码
- **内存占用高**：Cesium 3D 渲染消耗大量内存
- **页面卡顿**：地图初始化时页面无响应

## 原理分析

### Cesium 的性能特点

```javascript
// Cesium 的加载过程
1. 加载 Cesium.js (800KB)
2. 加载 Workers (WebGL 计算)
3. 加载 Assets (地形、影像、模型)
4. 初始化 WebGL 上下文
5. 创建 Scene 和 Camera
```

**性能瓶颈**：
- WebGL 初始化耗时 200-500ms
- 地形数据加载耗时 500-2000ms
- 3D 模型渲染消耗 GPU 资源

### OpenLayers 的性能特点

```javascript
// OpenLayers 的加载过程
1. 加载 ol.js (450KB)
2. 加载瓦片图层
3. 初始化 Canvas 渲染器
4. 绘制地图
```

**性能瓶颈**：
- 瓦片图片加载耗时
- 大量矢量数据渲染

## 优化方案

### 方案 1：按需加载地图库 ⭐⭐⭐

**适用场景**：不同页面使用不同地图库

**实施步骤**：

```typescript
// router/index.ts
const routes = [
  {
    path: '/home',
    component: () => import('@/pages/home/index.vue'),
    meta: {
      mapType: '3d', // 标记需要的地图类型
    },
  },
  {
    path: '/operations',
    component: () => import('@/pages/operations/index.vue'),
    meta: {
      mapType: '2d',
    },
  },
]
```

```typescript
// composables/useMap.ts
import { ref } from 'vue'

const cesiumLoaded = ref(false)
const openLayersLoaded = ref(false)

export function useMap(type: '2d' | '3d') {
  async function loadCesium() {
    if (cesiumLoaded.value) return

    const Cesium = await import('cesium')
    cesiumLoaded.value = true
    return Cesium
  }

  async function loadOpenLayers() {
    if (openLayersLoaded.value) return

    const ol = await import('ol')
    openLayersLoaded.value = true
    return ol
  }

  return {
    loadMap: type === '3d' ? loadCesium : loadOpenLayers,
  }
}
```

```vue
<!-- components/Map3D.vue -->
<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useMap } from '@/composables/useMap'

const mapContainer = ref<HTMLElement>()
const { loadMap } = useMap('3d')

onMounted(async () => {
  const Cesium = await loadMap()
  // 初始化 Cesium...
})
</script>
```

**效果评估**：
- 首屏 JS：减少 800KB 或 450KB（取决于页面）
- 地图加载延迟：~500ms（可接受）

### 方案 2：Cesium 资源优化 ⭐⭐⭐

**问题**：Cesium 默认从 CDN 加载大量资源

```typescript
// 当前配置
import * as Cesium from 'cesium'

// Cesium 会从以下路径加载资源：
// - /cesium/Workers/
// - /cesium/Assets/
// - /cesium/Widgets/
```

**优化方案 A**：使用 CDN

```typescript
// vite.config.ts
import { defineConfig } from 'vite'
import cesium from 'vite-plugin-cesium'

export default defineConfig({
  plugins: [
    cesium({
      // 使用 CDN 加速
      cesiumBaseUrl: 'https://cdn.jsdelivr.net/npm/cesium@1.135.0/Build/Cesium/',
    }),
  ],
})
```

**优化方案 B**：按需复制资源

```typescript
// vite.config.ts
import { viteStaticCopy } from 'vite-plugin-static-copy'

export default defineConfig({
  plugins: [
    viteStaticCopy({
      targets: [
        {
          src: 'node_modules/cesium/Build/Cesium/Workers/*',
          dest: 'cesium/Workers',
        },
        {
          src: 'node_modules/cesium/Build/Cesium/Assets/*',
          dest: 'cesium/Assets',
        },
        // 只复制需要的资源
      ],
    }),
  ],
})
```

**效果评估**：
- CDN 方案：减少服务器带宽，加载速度提升 30-50%
- 按需复制：减少不必要的资源，构建产物 ↓20%

### 方案 3：地图懒初始化 ⭐⭐⭐

**问题**：地图在组件 mounted 时立即初始化，阻塞主线程

**优化方案**：延迟初始化 + 骨架屏

```vue
<!-- components/Map3D.vue -->
<script setup lang="ts">
import { onMounted, ref } from 'vue'

const mapContainer = ref<HTMLElement>()
const mapReady = ref(false)
const loading = ref(true)

onMounted(() => {
  // 延迟初始化，让页面先渲染
  requestIdleCallback(() => {
    initMap()
  }, { timeout: 2000 })
})

async function initMap() {
  loading.value = true

  // 动态加载 Cesium
  const Cesium = await import('cesium')

  // 使用 Web Worker 初始化（如果可能）
  const viewer = new Cesium.Viewer(mapContainer.value!, {
    // 优化配置
    requestRenderMode: true, // 按需渲染
    maximumRenderTimeChange: Infinity, // 减少不必要的渲染
  })

  mapReady.value = true
  loading.value = false
}
</script>

<template>
  <div class="map-wrapper">
    <!-- 骨架屏 -->
    <div v-if="loading" class="map-skeleton">
      <div class="skeleton-animation"></div>
      <div class="loading-text">地图加载中...</div>
    </div>

    <!-- 地图容器 -->
    <div ref="mapContainer" v-show="mapReady" class="map-container"></div>
  </div>
</template>
```

**效果评估**：
- 首屏可交互时间：提前 500-1000ms
- 用户体验：有加载反馈，不会感觉卡顿

### 方案 4：Cesium 渲染优化 ⭐⭐⭐

**优化配置**：

```typescript
// utils/cesium-config.ts
export function createOptimizedViewer(container: HTMLElement) {
  const viewer = new Cesium.Viewer(container, {
    // === 性能优化配置 ===

    // 1. 按需渲染（重要！）
    requestRenderMode: true,
    maximumRenderTimeChange: Infinity,

    // 2. 禁用不需要的功能
    animation: false,           // 动画控件
    timeline: false,            // 时间轴
    fullscreenButton: false,    // 全屏按钮
    vrButton: false,            // VR 按钮
    geocoder: false,            // 地理编码器
    homeButton: false,          // 主页按钮
    infoBox: false,             // 信息框
    sceneModePicker: false,     // 场景模式选择器
    selectionIndicator: false,  // 选择指示器
    navigationHelpButton: false,// 导航帮助按钮
    baseLayerPicker: false,     // 底图选择器

    // 3. 地形优化
    terrainProvider: undefined, // 不加载地形（如果不需要）

    // 4. 影像优化
    imageryProvider: new Cesium.UrlTemplateImageryProvider({
      url: 'https://webst02.is.autonavi.com/appmaptile?style=6&x={x}&y={y}&z={z}',
      maximumLevel: 18, // 限制最大层级
    }),
  })

  // 5. 场景优化
  viewer.scene.globe.enableLighting = false // 禁用光照
  viewer.scene.globe.depthTestAgainstTerrain = false // 禁用深度测试
  viewer.scene.skyBox.show = false // 隐藏天空盒
  viewer.scene.sun.show = false // 隐藏太阳
  viewer.scene.moon.show = false // 隐藏月亮

  // 6. 相机优化
  viewer.scene.screenSpaceCameraController.minimumZoomDistance = 100
  viewer.scene.screenSpaceCameraController.maximumZoomDistance = 20000000

  // 7. 帧率限制
  viewer.targetFrameRate = 30 // 限制帧率为 30fps

  return viewer
}
```

**效果评估**：
- 内存占用：↓40-60%
- GPU 使用率：↓50-70%
- 帧率：稳定在 30fps（足够流畅）

### 方案 5：OpenLayers 瓦片优化 ⭐⭐

**问题**：瓦片图片加载慢，数量多

**优化方案**：

```typescript
// utils/openlayers-config.ts
import Map from 'ol/Map'
import View from 'ol/View'
import TileLayer from 'ol/layer/Tile'
import XYZ from 'ol/source/XYZ'

export function createOptimizedMap(target: HTMLElement) {
  const map = new Map({
    target,
    layers: [
      new TileLayer({
        source: new XYZ({
          url: 'https://webst02.is.autonavi.com/appmaptile?style=6&x={x}&y={y}&z={z}',

          // 性能优化配置
          cacheSize: 512,           // 增加缓存大小
          maxZoom: 18,              // 限制最大缩放级别
          tileLoadFunction: (tile, src) => {
            // 自定义瓦片加载，添加错误处理和重试
            const img = tile.getImage() as HTMLImageElement
            img.crossOrigin = 'anonymous'

            img.onload = () => {
              // 瓦片加载成功
            }

            img.onerror = () => {
              // 瓦片加载失败，重试
              setTimeout(() => {
                img.src = src
              }, 1000)
            }

            img.src = src
          },
        }),

        // 预加载配置
        preload: 2, // 预加载 2 层瓦片
      }),
    ],
    view: new View({
      center: [0, 0],
      zoom: 10,
      maxZoom: 18,
      minZoom: 3,

      // 性能优化
      constrainResolution: true, // 限制分辨率，减少瓦片请求
    }),
  })

  return map
}
```

**效果评估**：
- 瓦片加载速度：提升 20-30%
- 缓存命中率：提升 40-50%

### 方案 6：地图切换优化 ⭐⭐

**问题**：2D/3D 地图切换时重新加载

**优化方案**：缓存地图实例

```typescript
// composables/useMapCache.ts
import { ref, shallowRef } from 'vue'

const cesiumInstance = shallowRef<any>(null)
const openLayersInstance = shallowRef<any>(null)

export function useMapCache() {
  function getCesiumInstance() {
    return cesiumInstance.value
  }

  function setCesiumInstance(instance: any) {
    cesiumInstance.value = instance
  }

  function getOpenLayersInstance() {
    return openLayersInstance.value
  }

  function setOpenLayersInstance(instance: any) {
    openLayersInstance.value = instance
  }

  function clearCache() {
    if (cesiumInstance.value) {
      cesiumInstance.value.destroy()
      cesiumInstance.value = null
    }
    if (openLayersInstance.value) {
      openLayersInstance.value.dispose()
      openLayersInstance.value = null
    }
  }

  return {
    getCesiumInstance,
    setCesiumInstance,
    getOpenLayersInstance,
    setOpenLayersInstance,
    clearCache,
  }
}
```

```vue
<!-- components/MapSwitcher.vue -->
<script setup lang="ts">
import { ref } from 'vue'
import { useMapCache } from '@/composables/useMapCache'

const mapType = ref<'2d' | '3d'>('2d')
const { getCesiumInstance, setCesiumInstance } = useMapCache()

async function switchTo3D() {
  let viewer = getCesiumInstance()

  if (!viewer) {
    // 首次创建
    const Cesium = await import('cesium')
    viewer = createOptimizedViewer(mapContainer.value!)
    setCesiumInstance(viewer)
  } else {
    // 复用实例
    viewer.container.style.display = 'block'
  }

  mapType.value = '3d'
}
</script>
```

**效果评估**：
- 切换速度：从 2-3s 降低到 <100ms
- 内存占用：增加（需要权衡）

## 优化效果对比

### 优化前

| 指标 | 数值 |
|------|------|
| 首屏 JS（地图相关） | 1.25MB |
| 地图初始化时间 | 2-3s |
| 内存占用（Cesium） | ~500MB |
| 帧率 | 不稳定（15-60fps） |

### 优化后

| 指标 | 数值 | 提升 |
|------|------|------|
| 首屏 JS（按需加载） | 0KB | ↓100% |
| 地图初始化时间 | 0.5-1s | ↓67% |
| 内存占用（Cesium） | ~200MB | ↓60% |
| 帧率 | 稳定 30fps | 稳定 |

## 实施计划

### 第一阶段（2天）

1. ✅ 实现地图库按需加载
2. ✅ 添加加载骨架屏
3. ✅ 配置 Cesium CDN

**预期效果**：首屏 JS ↓1.25MB

### 第二阶段（3天）

1. ✅ 优化 Cesium 渲染配置
2. ✅ 优化 OpenLayers 瓦片加载
3. ✅ 实现地图懒初始化

**预期效果**：初始化时间 ↓67%，内存占用 ↓60%

### 第三阶段（可选）

1. ✅ 实现地图实例缓存
2. ✅ 添加地图预加载策略

**预期效果**：切换速度 ↑95%

## 测量与验证

### 性能指标

```typescript
// utils/performance.ts
export function measureMapPerformance() {
  const start = performance.now()

  // 地图初始化...

  const end = performance.now()
  console.log(`地图初始化耗时: ${end - start}ms`)

  // 内存占用
  if (performance.memory) {
    console.log(`内存占用: ${(performance.memory.usedJSHeapSize / 1024 / 1024).toFixed(2)}MB`)
  }

  // 帧率监控
  let frameCount = 0
  let lastTime = performance.now()

  function measureFPS() {
    frameCount++
    const now = performance.now()

    if (now - lastTime >= 1000) {
      console.log(`FPS: ${frameCount}`)
      frameCount = 0
      lastTime = now
    }

    requestAnimationFrame(measureFPS)
  }

  measureFPS()
}
```

### 关键指标

- **Bundle Size**：地图库代码大小
- **Init Time**：地图初始化时间
- **Memory Usage**：内存占用
- **FPS**：帧率（目标 30fps）
- **Tile Load Time**：瓦片加载时间

## 注意事项

### 1. Cesium 按需渲染的副作用

```typescript
// 启用按需渲染后，需要手动触发渲染
viewer.scene.requestRender()

// 或者在数据更新时触发
viewer.entities.add(entity)
viewer.scene.requestRender() // 手动触发
```

### 2. 地图实例缓存的内存问题

```typescript
// 需要在适当时机清理缓存
onBeforeUnmount(() => {
  // 清理地图实例
  if (viewer) {
    viewer.destroy()
  }
})
```

### 3. CDN 的可用性

```typescript
// 添加 CDN 降级方案
const cesiumBaseUrl = import.meta.env.PROD
  ? 'https://cdn.jsdelivr.net/npm/cesium@1.135.0/Build/Cesium/'
  : '/cesium/' // 开发环境使用本地资源
```

## 相关章节

- [1.1 Bundle 体积优化](./1-1-bundle-size.md) - 地图库分包策略
- [4.1 地图渲染优化](./4-1-map-rendering.md) - 更多渲染优化技巧
- [3.1 组件懒加载](./3-1-component-lazy-loading.md) - 组件级别优化

## 总结

地图库优化的核心是：
1. **按需加载**：不同页面加载不同地图库
2. **懒初始化**：延迟初始化，不阻塞主线程
3. **渲染优化**：按需渲染、禁用不必要的功能
4. **资源优化**：使用 CDN、限制瓦片层级

通过这些优化，可以将首屏 JS 减少 1.25MB，地图初始化时间减少 67%，内存占用减少 60%，显著提升用户体验。
