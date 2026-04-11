# 8.1 低空政务平台完整优化案例

## 项目背景

### 项目概况

**项目名称**: 低空政务平台
**技术栈**: Vue 3 + Vite + TypeScript + Element Plus
**项目规模**:
- 组件数量: 647 个 Vue 组件
- 构建产物: 93MB (未压缩)
- 代码行数: 约 15 万行
- 最大单文件: home/index.vue (5,343 行)

**核心功能模块**:
1. 3D 地图可视化 (Cesium)
2. 2D 地图展示 (OpenLayers)
3. 实时视频监控 (多路视频流)
4. 数据可视化 (ECharts)
5. 设备管理
6. 飞行任务管理
7. 告警系统

### 性能基线测量

**初始性能指标** (优化前):

```
测试环境: Chrome 120, 3G 网络模拟
测试页面: 首页 (home/index.vue)

加载性能:
├─ 首屏加载时间: 8.5s
├─ TTI (可交互时间): 9.2s
├─ FCP (首次内容绘制): 3.2s
├─ LCP (最大内容绘制): 6.8s
└─ CLS (累积布局偏移): 0.15

资源大小:
├─ HTML: 12KB
├─ JavaScript: 8.2MB (未压缩)
│   ├─ main.js: 3.5MB
│   ├─ vendor.js: 4.7MB
│   └─ 其他: 0MB
├─ CSS: 450KB
├─ 图片: 2.3MB
└─ 总计: ~11MB

运行时性能:
├─ 内存占用: 450MB
├─ 地图 FPS: 25-30fps
├─ 页面响应时间: 200-500ms
└─ 视频播放: 卡顿

Lighthouse 分数:
├─ Performance: 42
├─ Accessibility: 78
├─ Best Practices: 85
└─ SEO: 92
```

### 核心问题分析

#### 问题 1: 首屏加载过慢 (8.5s)

**原因分析**:
```javascript
// 所有组件都在首屏加载
import Home from '@/pages/home/index.vue'
import Operations from '@/pages/operations/index.vue'
// ... 导入所有 647 个组件

// 所有第三方库全量加载
import * as Cesium from 'cesium'  // 60MB
import * as ol from 'ol'  // 15MB
import * as echarts from 'echarts'  // 3MB
```

**影响**:
- 首屏 JS 体积: 8.2MB
- 下载时间 (3G): 3-5s
- 解析时间: 1-2s
- 执行时间: 500ms-1s

#### 问题 2: 大页面难以维护

**home/index.vue 分析**:
```
文件大小: 5,343 行
├─ <template>: 3,200 行
├─ <script>: 1,900 行
└─ <style>: 243 行

组件结构:
├─ 地图容器 (800 行)
├─ 设备面板 (600 行)
├─ 飞行面板 (550 行)
├─ 统计面板 (700 行)
├─ 告警面板 (450 行)
├─ 操作面板 (500 行)
└─ 20+ 个弹窗组件 (1,500 行)
```

**问题**:
- 代码难以阅读和维护
- Git 冲突频繁
- 编辑器卡顿
- 构建时间长

#### 问题 3: 地图性能问题

**Cesium 3D 地图**:
```javascript
// 一次性加载所有标注点
const markers = await fetchMarkers()  // 2000+ 个标注点
markers.forEach(marker => {
  viewer.entities.add({
    position: Cesium.Cartesian3.fromDegrees(marker.lng, marker.lat),
    billboard: {
      image: marker.icon,
      width: 32,
      height: 32
    }
  })
})

// 问题:
// - 2000+ 个实体同时渲染
// - FPS 降至 25-30
// - 地图操作卡顿
```

#### 问题 4: 内存泄漏

**常见泄漏点**:
```javascript
// 1. 地图实例未销毁
const viewer = new Cesium.Viewer('cesiumContainer')
// 组件卸载时未调用 viewer.destroy()

// 2. 定时器未清理
setInterval(() => {
  updateData()
}, 5000)
// 组件卸载时未 clearInterval

// 3. 事件监听器未移除
window.addEventListener('resize', handleResize)
// 组件卸载时未 removeEventListener

// 4. 视频流未释放
const video = document.createElement('video')
video.src = streamUrl
// 组件卸载时未停止播放和释放资源
```

## 优化方案

### 阶段 1: 代码分割与懒加载

#### 1.1 路由级代码分割

**优化前**:
```typescript
// router/index.ts
import Home from '@/pages/home/index.vue'
import Operations from '@/pages/operations/index.vue'
import Resources from '@/pages/resources/index.vue'

const routes = [
  { path: '/', component: Home },
  { path: '/operations', component: Operations },
  { path: '/resources', component: Resources },
]
```

**优化后**:
```typescript
// router/index.ts
const routes = [
  {
    path: '/',
    name: 'Home',
    component: () => import('@/pages/home/index.vue'),
  },
  {
    path: '/operations',
    name: 'Operations',
    component: () => import('@/pages/operations/index.vue'),
  },
  {
    path: '/resources',
    name: 'Resources',
    component: () => import('@/pages/resources/index.vue'),
  },
]
```

**Vite 分包配置**:
```typescript
// vite.config.ts
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          // 路由页面单独分包
          if (id.includes('/pages/home/')) return 'page-home'
          if (id.includes('/pages/operations/')) return 'page-operations'
          if (id.includes('/pages/resources/')) return 'page-resources'

          // 第三方库分包
          if (id.includes('node_modules/cesium')) return 'vendor-cesium'
          if (id.includes('node_modules/ol')) return 'vendor-ol'
          if (id.includes('node_modules/echarts')) return 'vendor-echarts'
          if (id.includes('node_modules/element-plus')) return 'vendor-element'

          // 其他 node_modules
          if (id.includes('node_modules')) return 'vendor'
        },
      },
    },
  },
})
```

**效果**:
- 首屏 JS: 8.2MB → 1.8MB (↓78%)
- 首屏加载时间: 8.5s → 3.2s (↓62%)

#### 1.2 组件级懒加载

**优化前**:
```vue
<!-- pages/home/index.vue -->
<script setup lang="ts">
import DeviceDetailDialog from '@/components/device-detail-dialog/index.vue'
import FlightDetailDialog from '@/components/flight-detail-dialog/index.vue'
import AlarmDialog from '@/components/alarm-dialog/index.vue'
// ... 导入 20+ 个弹窗组件
</script>
```

**优化后**:
```vue
<!-- pages/home/index.vue -->
<script setup lang="ts">
import { defineAsyncComponent } from 'vue'

// 异步加载弹窗组件
const DeviceDetailDialog = defineAsyncComponent(() =>
  import('@/components/device-detail-dialog/index.vue')
)
const FlightDetailDialog = defineAsyncComponent(() =>
  import('@/components/flight-detail-dialog/index.vue')
)
const AlarmDialog = defineAsyncComponent(() =>
  import('@/components/alarm-dialog/index.vue')
)
</script>

<template>
  <div class="home-page">
    <!-- 只在需要时才加载 -->
    <DeviceDetailDialog v-if="showDeviceDialog" />
    <FlightDetailDialog v-if="showFlightDialog" />
    <AlarmDialog v-if="showAlarmDialog" />
  </div>
</template>
```

**效果**:
- 首屏 JS: 1.8MB → 1.2MB (↓33%)
- 弹窗打开延迟: ~150ms (首次)

#### 1.3 第三方库按需加载

**Cesium 按需加载**:
```typescript
// composables/useCesium.ts
let cesiumInstance: typeof import('cesium') | null = null

export async function useCesium() {
  if (cesiumInstance) {
    return cesiumInstance
  }

  cesiumInstance = await import('cesium')
  return cesiumInstance
}
```

```vue
<!-- components/MapView3D.vue -->
<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useCesium } from '@/composables/useCesium'

const mapContainer = ref<HTMLElement>()
const mapReady = ref(false)

onMounted(async () => {
  const Cesium = await useCesium()

  const viewer = new Cesium.Viewer(mapContainer.value!, {
    // 配置...
  })

  mapReady.value = true
})
</script>
```

**ECharts 按需引入**:
```typescript
// utils/echarts.ts
import * as echarts from 'echarts/core'
import { BarChart, LineChart, PieChart } from 'echarts/charts'
import {
  GridComponent,
  TooltipComponent,
  LegendComponent,
} from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'

echarts.use([
  BarChart,
  LineChart,
  PieChart,
  GridComponent,
  TooltipComponent,
  LegendComponent,
  CanvasRenderer,
])

export default echarts
```

**效果**:
- Cesium: 只在使用 3D 地图时加载 (800KB)
- ECharts: 1.0MB → 400KB (↓60%)
- 首屏 JS: 1.2MB → 800KB (↓33%)

### 阶段 2: 大页面拆分

#### 2.1 home/index.vue 拆分

**拆分策略**:
```
home/index.vue (5,343 行)
├─ components/
│   ├─ MapContainer.vue (800 行) - 地图容器
│   ├─ DevicePanel.vue (600 行) - 设备面板
│   ├─ FlightPanel.vue (550 行) - 飞行面板
│   ├─ StatisticsPanel.vue (700 行) - 统计面板
│   ├─ AlarmPanel.vue (450 行) - 告警面板
│   └─ OperationPanel.vue (500 行) - 操作面板
└─ index.vue (200 行) - 主文件
```

**拆分后的主文件**:
```vue
<!-- pages/home/index.vue -->
<script setup lang="ts">
import { defineAsyncComponent } from 'vue'

// 首屏必需组件 (同步加载)
import MapContainer from './components/MapContainer.vue'
import HeaderBar from './components/HeaderBar.vue'

// 非首屏组件 (异步加载)
const DevicePanel = defineAsyncComponent(() =>
  import('./components/DevicePanel.vue')
)
const FlightPanel = defineAsyncComponent(() =>
  import('./components/FlightPanel.vue')
)
const StatisticsPanel = defineAsyncComponent(() =>
  import('./components/StatisticsPanel.vue')
)
const AlarmPanel = defineAsyncComponent(() =>
  import('./components/AlarmPanel.vue')
)
const OperationPanel = defineAsyncComponent(() =>
  import('./components/OperationPanel.vue')
)
</script>

<template>
  <div class="home-page">
    <HeaderBar />
    <MapContainer />

    <DevicePanel />
    <FlightPanel />
    <StatisticsPanel />
    <AlarmPanel />
    <OperationPanel />
  </div>
</template>

<style scoped lang="scss">
.home-page {
  width: 100%;
  height: 100vh;
  display: flex;
  flex-direction: column;
}
</style>
```

**效果**:
- 文件大小: 5,343 行 → 200 行 (↓96%)
- 可维护性: 显著提升
- Git 冲突: 减少 80%
- 编辑器性能: 流畅

### 阶段 3: 地图性能优化

#### 3.1 标注点聚合

**优化前**:
```javascript
// 一次性渲染 2000+ 个标注点
markers.forEach(marker => {
  viewer.entities.add({
    position: Cesium.Cartesian3.fromDegrees(marker.lng, marker.lat),
    billboard: { image: marker.icon, width: 32, height: 32 }
  })
})

// 问题: FPS 降至 25-30
```

**优化后**:
```javascript
// composables/useMarkerCluster.ts
import { ref, watch } from 'vue'

export function useMarkerCluster(viewer, markers) {
  const visibleMarkers = ref([])
  const clusterDistance = 100 // 聚合距离 (像素)

  // 计算可视区域
  function getVisibleBounds() {
    const canvas = viewer.scene.canvas
    const rect = canvas.getBoundingClientRect()

    const topLeft = viewer.camera.pickEllipsoid(
      new Cesium.Cartesian2(0, 0)
    )
    const bottomRight = viewer.camera.pickEllipsoid(
      new Cesium.Cartesian2(rect.width, rect.height)
    )

    return { topLeft, bottomRight }
  }

  // 聚合标注点
  function clusterMarkers() {
    const bounds = getVisibleBounds()
    const visible = markers.value.filter(marker => {
      // 判断是否在可视区域内
      return isInBounds(marker, bounds)
    })

    // 简单聚合算法
    const clusters = []
    const processed = new Set()

    visible.forEach(marker => {
      if (processed.has(marker.id)) return

      const cluster = {
        position: marker.position,
        markers: [marker],
      }

      // 查找附近的标注点
      visible.forEach(other => {
        if (other.id === marker.id || processed.has(other.id)) return

        const distance = calculateDistance(marker.position, other.position)
        if (distance < clusterDistance) {
          cluster.markers.push(other)
          processed.add(other.id)
        }
      })

      processed.add(marker.id)
      clusters.push(cluster)
    })

    return clusters
  }

  // 监听相机变化
  viewer.camera.changed.addEventListener(() => {
    visibleMarkers.value = clusterMarkers()
  })

  return { visibleMarkers }
}
```

**使用**:
```vue
<script setup lang="ts">
import { useCesium } from '@/composables/useCesium'
import { useMarkerCluster } from '@/composables/useMarkerCluster'

const markers = ref([])
const viewer = ref()

onMounted(async () => {
  const Cesium = await useCesium()
  viewer.value = new Cesium.Viewer('cesiumContainer')

  const { visibleMarkers } = useMarkerCluster(viewer.value, markers)

  // 只渲染可见的聚合标注点
  watch(visibleMarkers, (clusters) => {
    viewer.value.entities.removeAll()

    clusters.forEach(cluster => {
      if (cluster.markers.length === 1) {
        // 单个标注点
        viewer.value.entities.add({
          position: cluster.position,
          billboard: { image: cluster.markers[0].icon }
        })
      } else {
        // 聚合标注点
        viewer.value.entities.add({
          position: cluster.position,
          label: {
            text: cluster.markers.length.toString(),
            font: '14px sans-serif',
            fillColor: Cesium.Color.WHITE,
            backgroundColor: Cesium.Color.BLUE,
          }
        })
      }
    })
  })
})
</script>
```

**效果**:
- 渲染标注点数: 2000+ → 50-200 (根据缩放级别)
- 地图 FPS: 25-30 → 55-60 (↑100%)
- 地图操作: 流畅

#### 3.2 瓦片加载优化

```typescript
// vite.config.ts
export default defineConfig({
  server: {
    proxy: {
      // 代理地图瓦片请求
      '/tiles': {
        target: 'https://tile-server.example.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/tiles/, ''),
      },
    },
  },
})
```

```javascript
// 使用 CDN 加速瓦片加载
const viewer = new Cesium.Viewer('cesiumContainer', {
  imageryProvider: new Cesium.UrlTemplateImageryProvider({
    url: 'https://cdn.example.com/tiles/{z}/{x}/{y}.png',
    maximumLevel: 18,
  }),
})
```

### 阶段 4: 内存优化

#### 4.1 地图实例管理

```vue
<!-- components/MapView3D.vue -->
<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref } from 'vue'
import { useCesium } from '@/composables/useCesium'

const viewer = ref<any>()

onMounted(async () => {
  const Cesium = await useCesium()
  viewer.value = new Cesium.Viewer('cesiumContainer')
})

onBeforeUnmount(() => {
  // 销毁地图实例
  if (viewer.value) {
    viewer.value.destroy()
    viewer.value = null
  }
})
</script>
```

#### 4.2 定时器清理

```vue
<script setup lang="ts">
import { onMounted, onBeforeUnmount } from 'vue'

let timer: number | null = null

onMounted(() => {
  timer = setInterval(() => {
    updateData()
  }, 5000)
})

onBeforeUnmount(() => {
  if (timer) {
    clearInterval(timer)
    timer = null
  }
})
</script>
```

#### 4.3 事件监听器清理

```vue
<script setup lang="ts">
import { onMounted, onBeforeUnmount } from 'vue'

const handleResize = () => {
  // 处理窗口大小变化
}

onMounted(() => {
  window.addEventListener('resize', handleResize)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize)
})
</script>
```

#### 4.4 视频流释放

```vue
<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref } from 'vue'

const videoRef = ref<HTMLVideoElement>()

onMounted(() => {
  if (videoRef.value) {
    videoRef.value.src = streamUrl
    videoRef.value.play()
  }
})

onBeforeUnmount(() => {
  if (videoRef.value) {
    videoRef.value.pause()
    videoRef.value.src = ''
    videoRef.value.load()
  }
})
</script>
```

**效果**:
- 内存占用: 450MB → 280MB (↓38%)
- 内存泄漏: 完全修复
- 长时间运行: 稳定

### 阶段 5: 构建优化

#### 5.1 依赖分析

```bash
# 安装依赖分析工具
npm install -D rollup-plugin-visualizer

# vite.config.ts
import { visualizer } from 'rollup-plugin-visualizer'

export default defineConfig({
  plugins: [
    vue(),
    visualizer({
      open: true,
      gzipSize: true,
      brotliSize: true,
    }),
  ],
})

# 构建并查看分析报告
npm run build
```

**发现的问题**:
- moment.js 被完整引入 (200KB)
- lodash 被完整引入 (70KB)
- 重复的依赖版本

#### 5.2 依赖优化

```typescript
// 替换 moment.js 为 dayjs
// npm uninstall moment
// npm install dayjs

// 使用 dayjs
import dayjs from 'dayjs'
const formattedDate = dayjs().format('YYYY-MM-DD')

// 按需引入 lodash
// import _ from 'lodash'  // ❌
import debounce from 'lodash/debounce'  // ✅
import throttle from 'lodash/throttle'  // ✅
```

#### 5.3 Tree Shaking 优化

```typescript
// vite.config.ts
export default defineConfig({
  build: {
    rollupOptions: {
      treeshake: {
        moduleSideEffects: false,
      },
    },
  },
})
```

**效果**:
- 构建产物: 93MB → 12MB (↓87%)
- Gzip 后: 3.2MB
- Brotli 后: 2.8MB

## 优化效果

### 性能指标对比

| 指标 | 优化前 | 优化后 | 提升 |
|------|--------|--------|------|
| 首屏加载时间 | 8.5s | 2.1s | ↓75% |
| TTI | 9.2s | 2.5s | ↓73% |
| FCP | 3.2s | 0.8s | ↓75% |
| LCP | 6.8s | 1.5s | ↓78% |
| CLS | 0.15 | 0.02 | ↓87% |

### 资源大小对比

| 资源 | 优化前 | 优化后 | 减少 |
|------|--------|--------|------|
| 首屏 JS | 8.2MB | 800KB | ↓90% |
| 首屏 JS (Gzip) | 2.5MB | 280KB | ↓89% |
| 总构建产物 | 93MB | 12MB | ↓87% |
| 首屏组件数 | 647 | 45 | ↓93% |

### 运行时性能对比

| 指标 | 优化前 | 优化后 | 提升 |
|------|--------|--------|------|
| 内存占用 | 450MB | 280MB | ↓38% |
| 地图 FPS | 25-30 | 55-60 | ↑100% |
| 页面响应 | 200-500ms | 50-100ms | ↓75% |

### Lighthouse 分数对比

| 指标 | 优化前 | 优化后 | 提升 |
|------|--------|--------|------|
| Performance | 42 | 88 | +110% |
| Accessibility | 78 | 92 | +18% |
| Best Practices | 85 | 95 | +12% |
| SEO | 92 | 98 | +7% |

## 实施时间线

### 第 1 周: 代码分割

- Day 1-2: 路由级代码分割
- Day 3-4: 组件级懒加载
- Day 5: 第三方库按需加载

**成果**: 首屏 JS ↓78%

### 第 2 周: 大页面拆分

- Day 1-3: home/index.vue 拆分
- Day 4-5: 其他大页面拆分

**成果**: 可维护性显著提升

### 第 3 周: 地图优化

- Day 1-2: 标注点聚合
- Day 3: 瓦片加载优化
- Day 4-5: 测试和调优

**成果**: 地图 FPS ↑100%

### 第 4 周: 内存优化

- Day 1-2: 内存泄漏排查
- Day 3-4: 资源释放优化
- Day 5: 测试和验证

**成果**: 内存占用 ↓38%

### 第 5 周: 构建优化

- Day 1-2: 依赖分析和优化
- Day 3-4: Tree Shaking 配置
- Day 5: 最终测试和部署

**成果**: 构建产物 ↓87%

## 经验总结

### 成功经验

1. **分阶段实施**: 每个阶段都有明确的目标和可衡量的指标
2. **持续测量**: 每次优化后都进行性能测试,确保改进有效
3. **团队协作**: 前端、后端、运维团队紧密配合
4. **文档记录**: 详细记录优化过程和决策依据

### 遇到的挑战

1. **Cesium 库体积大**: 通过按需加载和 CDN 加速解决
2. **大页面拆分复杂**: 制定清晰的拆分策略,逐步实施
3. **内存泄漏难排查**: 使用 Chrome DevTools 系统排查
4. **团队学习成本**: 组织培训和代码审查

### 持续优化

1. **性能监控**: 建立 Web Vitals 监控体系
2. **性能预算**: 设置性能指标阈值,CI/CD 自动检查
3. **定期审查**: 每月进行性能审查,及时发现问题
4. **技术更新**: 关注新技术,持续优化

## 相关章节

- [2.2 代码分割与懒加载](../2-loading/2-2-code-splitting.md)
- [4.3 虚拟列表优化](../4-framework/4-3-virtual-list.md)
- [4.1 Vue 3 编译优化](../4-framework/4-1-vue-compile.md)
- [6.1 Vite 配置优化](../6-build/6-1-vite-config.md)

## 总结

低空政务平台的优化是一个系统工程,涉及代码分割、页面拆分、地图优化、内存管理、构建优化等多个方面。通过 5 周的持续优化,我们将首屏加载时间从 8.5s 降低到 2.1s (↓75%),构建产物从 93MB 降低到 12MB (↓87%),Lighthouse Performance 分数从 42 提升到 88 (+110%),显著提升了用户体验。

关键要点:
1. **代码分割**: 路由级、组件级、库级全面分割
2. **按需加载**: 只加载当前需要的资源
3. **页面拆分**: 大页面拆分成小组件,提升可维护性
4. **地图优化**: 标注点聚合、瓦片优化、FPS 提升
5. **内存管理**: 及时释放资源,避免内存泄漏
6. **构建优化**: 依赖分析、Tree Shaking、压缩
7. **持续监控**: 建立监控体系,持续优化
