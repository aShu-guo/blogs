# 2.2 代码分割与懒加载

## 问题场景

### 一体化项目现状

**项目规模**：
- 组件数量：647 个 Vue 组件
- 构建产物：93MB
- 首屏 JS：约 8MB（未压缩）
- 页面文件：home/index.vue 达 5,343 行

**用户影响**：
```
用户访问流程：
1. 请求 index.html           100ms
2. 下载 main.js (8MB)        3-5s (3G网络)  ← 瓶颈
3. 解析 JavaScript           1-2s           ← 瓶颈
4. 执行初始化代码             500ms-1s       ← 瓶颈
5. 渲染首屏                  200ms
-------------------------------------------
总计：5-9s 才能看到内容
```

**核心问题**：
- 所有 647 个组件都打包到首屏 JS
- 弹窗、Tab、条件组件也在首屏加载
- Cesium、OpenLayers、ECharts 等大库全量加载
- 用户可能永远不会使用某些功能，但代码已下载

## 原理分析

### 代码分割的本质

**传统打包（无分割）**：
```javascript
// 所有代码打包到一个文件
main.js (8MB)
├── Vue 核心
├── 路由 (所有页面)
├── 组件 (647个)
├── 第三方库 (Cesium, OpenLayers, ECharts...)
└── 业务代码
```

**代码分割后**：
```javascript
// 按需加载，分成多个文件
main.js (500KB)              ← 首屏必需
├── Vue 核心
├── 路由配置
└── 首屏组件

home.js (200KB)              ← 访问首页时加载
operations.js (150KB)        ← 访问运营页时加载
cesium.js (800KB)            ← 使用3D地图时加载
echarts.js (400KB)           ← 显示图表时加载
device-dialog.js (100KB)     ← 打开弹窗时加载
```

### 分割策略

| 策略 | 适用场景 | 收益 | 实施难度 |
|------|---------|------|---------|
| 路由级分割 | 不同页面 | ⭐⭐⭐ | 简单 |
| 组件级分割 | 弹窗、Tab | ⭐⭐⭐ | 简单 |
| 库级分割 | 大型第三方库 | ⭐⭐⭐ | 中等 |
| 功能级分割 | 可选功能模块 | ⭐⭐ | 中等 |

## 优化方案

### 方案 1：路由级代码分割 ⭐⭐⭐

**当前问题**：所有路由页面都在首屏加载

```typescript
// router/index.ts - 不好的做法
import Home from '@/pages/home/index.vue'
import Operations from '@/pages/operations/index.vue'
import Resources from '@/pages/resources/index.vue'
// ... 导入所有页面

const routes = [
  { path: '/', component: Home },
  { path: '/operations', component: Operations },
  { path: '/resources', component: Resources },
  // ...
]
```

**优化方案**：使用动态导入

```typescript
// router/index.ts - 推荐做法
const routes = [
  {
    path: '/',
    name: 'Home',
    component: () => import('@/pages/home/index.vue'),
    meta: {
      title: '首页',
      preload: true, // 标记为预加载
    },
  },
  {
    path: '/operations',
    name: 'Operations',
    component: () => import('@/pages/operations/index.vue'),
    meta: {
      title: '运营管理',
    },
  },
  {
    path: '/resources',
    name: 'Resources',
    component: () => import('@/pages/resources/index.vue'),
    meta: {
      title: '资源管理',
    },
  },
  {
    path: '/demands',
    name: 'Demands',
    component: () => import('@/pages/demands/index.vue'),
    meta: {
      title: '需求管理',
    },
  },
  // ... 其他路由
]
```

**Vite 配置优化**：

```typescript
// vite.config.ts
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          // 路由页面单独分包
          if (id.includes('/pages/home/')) {
            return 'page-home'
          }
          if (id.includes('/pages/operations/')) {
            return 'page-operations'
          }
          if (id.includes('/pages/resources/')) {
            return 'page-resources'
          }
          // ... 其他页面
        },
      },
    },
  },
})
```

**效果评估**：
- 首屏 JS：8MB → 1.5MB（↓81%）
- 路由切换延迟：~200ms（首次），0ms（缓存后）
- 用户只下载访问的页面

### 方案 2：组件级代码分割 ⭐⭐⭐

**场景 A：弹窗组件懒加载**

```vue
<!-- pages/home/index.vue -->
<script setup lang="ts">
import { defineAsyncComponent } from 'vue'

// ❌ 不好：同步导入弹窗
// import DeviceDetailDialog from '@/components/device-detail-dialog/index.vue'

// ✅ 好：异步导入弹窗
const DeviceDetailDialog = defineAsyncComponent(() =>
  import('@/components/device-detail-dialog/index.vue')
)

const FlightDetailDialog = defineAsyncComponent(() =>
  import('@/components/flight-detail-dialog/index.vue')
)

const AlarmDialog = defineAsyncComponent(() =>
  import('@/components/alarm-dialog/index.vue')
)

// 添加加载状态
const LoadingComponent = {
  template: '<div class="loading">加载中...</div>',
}

const ErrorComponent = {
  template: '<div class="error">加载失败</div>',
}

const DeviceDetailDialogWithState = defineAsyncComponent({
  loader: () => import('@/components/device-detail-dialog/index.vue'),
  loadingComponent: LoadingComponent,
  errorComponent: ErrorComponent,
  delay: 200,
  timeout: 10000,
})
</script>

<template>
  <div class="home-page">
    <!-- 只在需要时才加载弹窗组件 -->
    <DeviceDetailDialog v-if="showDeviceDialog" />
    <FlightDetailDialog v-if="showFlightDialog" />
    <AlarmDialog v-if="showAlarmDialog" />
  </div>
</template>
```

**场景 B：Tab 组件懒加载**

```vue
<!-- components/StatisticsPanel.vue -->
<script setup lang="ts">
import { defineAsyncComponent, computed } from 'vue'

const activeTab = ref('flight')

// 异步加载 Tab 内容
const FlightStatistics = defineAsyncComponent(() =>
  import('./tabs/FlightStatistics.vue')
)
const DeviceStatistics = defineAsyncComponent(() =>
  import('./tabs/DeviceStatistics.vue')
)
const AlarmStatistics = defineAsyncComponent(() =>
  import('./tabs/AlarmStatistics.vue')
)

const currentComponent = computed(() => {
  const map = {
    flight: FlightStatistics,
    device: DeviceStatistics,
    alarm: AlarmStatistics,
  }
  return map[activeTab.value]
})
</script>

<template>
  <div class="statistics-panel">
    <el-tabs v-model="activeTab">
      <el-tab-pane label="飞行统计" name="flight" />
      <el-tab-pane label="设备统计" name="device" />
      <el-tab-pane label="告警统计" name="alarm" />
    </el-tabs>

    <!-- 使用 KeepAlive 缓存已加载的 Tab -->
    <KeepAlive :max="3">
      <component :is="currentComponent" />
    </KeepAlive>
  </div>
</template>
```

**效果评估**：
- 每个弹窗组件：50-200KB
- 首屏减少：10-20 个弹窗 = 1-3MB
- 打开延迟：100-300ms（首次）

### 方案 3：第三方库按需加载 ⭐⭐⭐

**场景 A：地图库按需加载**

```typescript
// composables/useMap.ts
import { ref } from 'vue'

const cesiumLoaded = ref(false)
const openLayersLoaded = ref(false)

export function useMap(type: '2d' | '3d') {
  async function loadCesium() {
    if (cesiumLoaded.value) {
      return window.Cesium
    }

    const Cesium = await import('cesium')
    cesiumLoaded.value = true
    window.Cesium = Cesium
    return Cesium
  }

  async function loadOpenLayers() {
    if (openLayersLoaded.value) {
      return window.ol
    }

    const ol = await import('ol')
    openLayersLoaded.value = true
    window.ol = ol
    return ol
  }

  return {
    loadMap: type === '3d' ? loadCesium : loadOpenLayers,
  }
}
```

```vue
<!-- components/MapContainer.vue -->
<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useMap } from '@/composables/useMap'

const props = defineProps<{
  mapType: '2d' | '3d'
}>()

const mapContainer = ref<HTMLElement>()
const mapReady = ref(false)
const { loadMap } = useMap(props.mapType)

onMounted(async () => {
  // 动态加载地图库
  const MapLib = await loadMap()

  // 初始化地图
  if (props.mapType === '3d') {
    // 初始化 Cesium
    const viewer = new MapLib.Viewer(mapContainer.value!)
  } else {
    // 初始化 OpenLayers
    const map = new MapLib.Map({ target: mapContainer.value! })
  }

  mapReady.value = true
})
</script>
```

**场景 B：ECharts 按需引入**

```typescript
// utils/echarts.ts
import * as echarts from 'echarts/core'

// 只引入使用的图表类型
import {
  BarChart,
  LineChart,
  PieChart,
  ScatterChart,
} from 'echarts/charts'

// 只引入使用的组件
import {
  GridComponent,
  TooltipComponent,
  LegendComponent,
  DataZoomComponent,
  TitleComponent,
} from 'echarts/components'

// 使用 Canvas 渲染器
import { CanvasRenderer } from 'echarts/renderers'

// 注册必需的组件
echarts.use([
  BarChart,
  LineChart,
  PieChart,
  ScatterChart,
  GridComponent,
  TooltipComponent,
  LegendComponent,
  DataZoomComponent,
  TitleComponent,
  CanvasRenderer,
])

export default echarts
```

```vue
<!-- components/StatisticsChart.vue -->
<script setup lang="ts">
import { onMounted, ref } from 'vue'
// 使用按需引入的 echarts
import echarts from '@/utils/echarts'

const chartContainer = ref<HTMLElement>()

onMounted(() => {
  const chart = echarts.init(chartContainer.value!)
  chart.setOption({
    // 图表配置
  })
})
</script>
```

**效果评估**：
- Cesium：800KB（只在使用 3D 地图时加载）
- OpenLayers：450KB（只在使用 2D 地图时加载）
- ECharts：1.0MB → 400KB（↓60%）

### 方案 4：大页面拆分 + 懒加载 ⭐⭐⭐

**问题**：home/index.vue 有 5,343 行

**优化方案**：拆分成多个子组件 + 懒加载

```vue
<!-- pages/home/index.vue - 拆分后 -->
<script setup lang="ts">
import { defineAsyncComponent } from 'vue'

// 首屏必需组件（同步加载）
import MapContainer from './components/MapContainer.vue'
import HeaderBar from './components/HeaderBar.vue'

// 非首屏组件（异步加载）
const FlightPanel = defineAsyncComponent(() =>
  import('./components/FlightPanel.vue')
)
const DevicePanel = defineAsyncComponent(() =>
  import('./components/DevicePanel.vue')
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
    <!-- 首屏内容 -->
    <HeaderBar />
    <MapContainer />

    <!-- 延迟加载的面板 -->
    <FlightPanel />
    <DevicePanel />
    <StatisticsPanel />
    <AlarmPanel />
    <OperationPanel />
  </div>
</template>
```

**进阶：使用 Intersection Observer 懒加载**

```vue
<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useIntersectionObserver } from '@vueuse/core'

const FlightPanel = defineAsyncComponent(() =>
  import('./components/FlightPanel.vue')
)

const showFlightPanel = ref(false)
const flightPanelTrigger = ref<HTMLElement>()

// 使用 Intersection Observer
useIntersectionObserver(
  flightPanelTrigger,
  ([{ isIntersecting }]) => {
    if (isIntersecting) {
      showFlightPanel.value = true
    }
  },
  { threshold: 0.1 }
)
</script>

<template>
  <div class="home-page">
    <!-- 占位元素 -->
    <div ref="flightPanelTrigger" style="height: 1px"></div>

    <!-- 只在进入视口时加载 -->
    <FlightPanel v-if="showFlightPanel" />
  </div>
</template>
```

**效果评估**：
- home/index.vue：5,343 行 → 200 行（↓96%）
- 首屏 JS：减少 70-80%
- 可维护性：显著提升

### 方案 5：预加载优化 ⭐⭐

**问题**：懒加载导致首次使用有延迟

**优化方案**：在空闲时预加载

```typescript
// composables/usePreload.ts
import { onMounted } from 'vue'

export function usePreload(importFn: () => Promise<any>, delay = 2000) {
  onMounted(() => {
    // 在空闲时预加载
    if ('requestIdleCallback' in window) {
      requestIdleCallback(() => {
        setTimeout(importFn, delay)
      }, { timeout: 5000 })
    } else {
      setTimeout(importFn, delay)
    }
  })
}
```

```vue
<script setup lang="ts">
import { defineAsyncComponent } from 'vue'
import { usePreload } from '@/composables/usePreload'

const DeviceDetailDialog = defineAsyncComponent(() =>
  import('@/components/device-detail-dialog/index.vue')
)

// 预加载常用弹窗
usePreload(() => import('@/components/device-detail-dialog/index.vue'), 3000)
usePreload(() => import('@/components/flight-detail-dialog/index.vue'), 4000)
</script>
```

**路由预加载**：

```typescript
// router/index.ts
import { useRouter } from 'vue-router'

const router = useRouter()

// 预加载下一个可能访问的路由
router.beforeEach((to, from, next) => {
  // 在首页时，预加载运营管理页面
  if (to.path === '/' && from.path !== '/operations') {
    setTimeout(() => {
      import('@/pages/operations/index.vue')
    }, 3000)
  }

  next()
})
```

**效果评估**：
- 首次打开延迟：300ms → 0ms
- 首屏加载：不受影响（延迟预加载）

## 优化效果对比

### 一体化项目优化前后

| 指标 | 优化前 | 优化后 | 提升 |
|------|--------|--------|------|
| 首屏 JS 大小 | ~8MB | ~1.5MB | ↓81% |
| 首屏 JS（Gzip） | ~2.5MB | ~400KB | ↓84% |
| 首屏组件数量 | 647 个 | ~50 个 | ↓92% |
| 首屏加载时间 | 5-9s | 1.5-2.5s | ↓72% |
| TTI | ~8s | ~2s | ↓75% |
| Lighthouse 分数 | ~45 | ~85 | +89% |

### 分包效果

```
优化前：
main.js (8MB)

优化后：
main.js (500KB)           ← 首屏必需
page-home.js (200KB)      ← 首页
page-operations.js (150KB)
page-resources.js (120KB)
cesium.js (800KB)         ← 3D 地图
openlayers.js (450KB)     ← 2D 地图
echarts.js (400KB)        ← 图表
element-plus.js (200KB)   ← UI 组件
...
```

## 实施计划

### 第一阶段（1-2天）- 路由分割

**任务**：
1. ✅ 所有路由改为动态导入
2. ✅ 配置 Vite 路由分包
3. ✅ 测试路由切换

**预期效果**：首屏 JS ↓60%

### 第二阶段（2-3天）- 组件分割

**任务**：
1. ✅ 弹窗组件改为异步导入（10+ 个弹窗）
2. ✅ Tab 组件改为异步导入（5+ 个 Tab 面板）
3. ✅ 条件组件改为异步导入

**预期效果**：首屏 JS ↓70%

### 第三阶段（3-5天）- 第三方库分割

**任务**：
1. ✅ Cesium/OpenLayers 按需加载
2. ✅ ECharts 按需引入
3. ✅ Element Plus 按需引入

**预期效果**：首屏 JS ↓80%

### 第四阶段（1周）- 大页面拆分

**任务**：
1. ✅ home/index.vue 拆分（5,343 行 → 200 行）
2. ✅ 其他大页面拆分
3. ✅ 添加 Intersection Observer 懒加载

**预期效果**：首屏 JS ↓85%，可维护性提升

### 第五阶段（可选）- 预加载优化

**任务**：
1. ✅ 添加预加载策略
2. ✅ 优化加载优先级
3. ✅ 路由预加载

**预期效果**：用户体验提升，无感知延迟

## 测量与验证

### 构建分析

```bash
# 生成 bundle 分析报告
npm run build

# 查看分包情况
ls -lh dist/assets/

# 使用 vite-plugin-visualizer
open dist/stats.html
```

### 性能测试

```bash
# Lighthouse 测试
lighthouse http://localhost:3000 --view

# 或使用 Chrome DevTools
# 1. 打开 DevTools
# 2. Lighthouse 标签
# 3. 生成报告
```

### 关键指标

- **First Load JS**：首屏 JS 大小（目标 < 500KB）
- **Route Load Time**：路由切换时间（目标 < 200ms）
- **Component Load Time**：组件加载时间（目标 < 300ms）
- **TTI**：可交互时间（目标 < 3.5s）

## 注意事项

### 1. 避免过度懒加载

```vue
<!-- ❌ 不好：首屏组件也懒加载 -->
<script setup lang="ts">
const Header = defineAsyncComponent(() => import('./Header.vue'))
</script>

<!-- ✅ 好：首屏组件同步加载 -->
<script setup lang="ts">
import Header from './Header.vue'
</script>
```

### 2. 处理加载失败

```vue
<script setup lang="ts">
const HeavyComponent = defineAsyncComponent({
  loader: () => import('./HeavyComponent.vue'),
  errorComponent: {
    template: '<div>组件加载失败，<button @click="retry">重试</button></div>',
  },
  timeout: 10000,
  onError(error, retry, fail) {
    console.error('Component load failed:', error)
    // 可以选择重试或失败
    if (error.message.includes('timeout')) {
      retry()
    } else {
      fail()
    }
  },
})
</script>
```

### 3. KeepAlive 的内存问题

```vue
<!-- 限制缓存数量，避免内存泄漏 -->
<KeepAlive :max="5">
  <component :is="currentComponent" />
</KeepAlive>
```

### 4. 预加载的时机

```typescript
// ❌ 不好：立即预加载，影响首屏
usePreload(() => import('./Heavy.vue'), 0)

// ✅ 好：延迟预加载，不影响首屏
usePreload(() => import('./Heavy.vue'), 3000)
```

## 相关章节

- [6.1 Vite 配置优化](../6-build/6-1-vite-config.md) - 分包配置详解
- [3.2 大页面拆分](../project/3-2-page-splitting.md) - home/index.vue 拆分案例
- [8.1 低空政务平台优化](../8-cases/8-1-low-altitude.md) - 完整优化案例

## 总结

代码分割是性能优化的核心手段，通过：
1. **路由分割**：按页面分割，减少首屏 JS 60%
2. **组件分割**：弹窗、Tab 懒加载，减少首屏 JS 70%
3. **库分割**：第三方库按需加载，减少首屏 JS 80%
4. **页面拆分**：大页面拆分成小组件，提升可维护性
5. **预加载**：在空闲时预加载，提升用户体验

对于一体化项目，可以将首屏 JS 从 8MB 降低到 1.5MB（↓81%），首屏加载时间从 5-9s 降低到 1.5-2.5s（↓72%），显著提升用户体验。
