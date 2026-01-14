# 3.1 组件懒加载

## 问题场景

### 当前状态

项目包含 **647 个 Vue 组件**，分布在：

```
src/
├── components/        # 42 个组件目录
│   ├── ability-card/
│   ├── achievement-card/
│   ├── alarm-panel/
│   ├── device-monitor/
│   ├── flight-track/
│   ├── video-player/
│   └── ...
└── pages/
    └── home/
        └── index.vue  # 5,343 行，引用大量组件
```

**问题**：
1. 所有组件在首屏一次性加载
2. 部分组件只在特定条件下显示（如弹窗、Tab 切换）
3. 首屏 JS 包含大量未使用的组件代码

### 用户影响

```
首屏加载流程：
1. 下载 main.js (包含所有组件)  ← 耗时长
2. 解析 JS                      ← 耗时长
3. 执行组件初始化                ← 耗时长
4. 渲染页面                     ← 用户才能看到内容
```

- **首屏加载慢**：需要下载和解析大量未使用的代码
- **TTI 延迟**：JavaScript 执行时间长，页面可交互时间延迟
- **内存占用高**：所有组件实例都在内存中

## 原理分析

### 组件加载的性能影响

```javascript
// 同步导入（当前方式）
import HeavyComponent from './HeavyComponent.vue'

// 打包结果：
// main.js 包含 HeavyComponent 的所有代码
// 即使 HeavyComponent 不在首屏显示，也会被下载和解析
```

```javascript
// 异步导入（优化方式）
const HeavyComponent = defineAsyncComponent(() =>
  import('./HeavyComponent.vue')
)

// 打包结果：
// main.js 不包含 HeavyComponent
// HeavyComponent 被分割到独立的 chunk
// 只在需要时才下载和解析
```

### 懒加载的收益

| 组件类型 | 同步加载 | 异步加载 | 收益 |
|---------|---------|---------|------|
| 首屏组件 | 立即加载 | 立即加载 | 无 |
| 弹窗组件 | 立即加载 | 点击时加载 | ⭐⭐⭐ |
| Tab 组件 | 立即加载 | 切换时加载 | ⭐⭐⭐ |
| 条件组件 | 立即加载 | 条件满足时加载 | ⭐⭐ |

## 优化方案

### 方案 1：路由级别懒加载 ⭐⭐⭐

**当前问题**：部分路由使用同步导入

```typescript
// router/index.ts - 不好的做法
import Home from '@/pages/home/index.vue'
import Operations from '@/pages/operations/index.vue'

const routes = [
  { path: '/', component: Home },
  { path: '/operations', component: Operations },
]
```

**优化方案**：所有路由使用异步导入

```typescript
// router/index.ts - 推荐做法
const routes = [
  {
    path: '/',
    component: () => import('@/pages/home/index.vue'),
  },
  {
    path: '/operations',
    component: () => import('@/pages/operations/index.vue'),
  },
  {
    path: '/resources',
    component: () => import('@/pages/resources/index.vue'),
  },
  // ... 其他路由
]
```

**进阶：路由分组**

```typescript
// 相关的路由打包到同一个 chunk
const routes = [
  {
    path: '/operations',
    component: () => import(
      /* webpackChunkName: "operations" */
      '@/pages/operations/index.vue'
    ),
  },
  {
    path: '/operations/detail',
    component: () => import(
      /* webpackChunkName: "operations" */
      '@/pages/operations/detail.vue'
    ),
  },
]
```

**效果评估**：
- 首屏 JS：减少 60-80%
- 路由切换延迟：~200ms（可接受）

### 方案 2：弹窗组件懒加载 ⭐⭐⭐

**当前问题**：弹窗组件在页面加载时就导入

```vue
<!-- pages/home/index.vue - 不好的做法 -->
<script setup lang="ts">
import DeviceDetailDialog from '@/components/device-detail-dialog/index.vue'
import FlightDetailDialog from '@/components/flight-detail-dialog/index.vue'
import AlarmDialog from '@/components/alarm-dialog/index.vue'
// ... 10+ 个弹窗组件

const showDeviceDialog = ref(false)
</script>

<template>
  <div>
    <!-- 弹窗默认不显示，但代码已加载 -->
    <DeviceDetailDialog v-if="showDeviceDialog" />
  </div>
</template>
```

**优化方案**：使用 defineAsyncComponent

```vue
<!-- pages/home/index.vue - 推荐做法 -->
<script setup lang="ts">
import { defineAsyncComponent } from 'vue'

// 异步组件
const DeviceDetailDialog = defineAsyncComponent(() =>
  import('@/components/device-detail-dialog/index.vue')
)

const FlightDetailDialog = defineAsyncComponent(() =>
  import('@/components/flight-detail-dialog/index.vue')
)

const AlarmDialog = defineAsyncComponent(() =>
  import('@/components/alarm-dialog/index.vue')
)

const showDeviceDialog = ref(false)
</script>

<template>
  <div>
    <!-- 只在 showDeviceDialog 为 true 时才加载组件 -->
    <DeviceDetailDialog v-if="showDeviceDialog" />
  </div>
</template>
```

**进阶：添加加载状态**

```vue
<script setup lang="ts">
import { defineAsyncComponent, h } from 'vue'
import LoadingSpinner from '@/components/loading-spinner/index.vue'
import ErrorComponent from '@/components/error-component/index.vue'

const DeviceDetailDialog = defineAsyncComponent({
  loader: () => import('@/components/device-detail-dialog/index.vue'),
  loadingComponent: LoadingSpinner,
  errorComponent: ErrorComponent,
  delay: 200,        // 200ms 后显示 loading
  timeout: 10000,    // 10s 超时
})
</script>
```

**效果评估**：
- 首屏 JS：每个弹窗组件减少 50-200KB
- 弹窗打开延迟：~100-300ms（首次）

### 方案 3：Tab 组件懒加载 ⭐⭐⭐

**当前问题**：所有 Tab 内容同时加载

```vue
<!-- 不好的做法 -->
<script setup lang="ts">
import FlightStatistics from './components/FlightStatistics.vue'
import DeviceStatistics from './components/DeviceStatistics.vue'
import AlarmStatistics from './components/AlarmStatistics.vue'

const activeTab = ref('flight')
</script>

<template>
  <el-tabs v-model="activeTab">
    <el-tab-pane label="飞行统计" name="flight">
      <FlightStatistics />
    </el-tab-pane>
    <el-tab-pane label="设备统计" name="device">
      <DeviceStatistics />
    </el-tab-pane>
    <el-tab-pane label="告警统计" name="alarm">
      <AlarmStatistics />
    </el-tab-pane>
  </el-tabs>
</template>
```

**优化方案**：使用 KeepAlive + 异步组件

```vue
<!-- 推荐做法 -->
<script setup lang="ts">
import { defineAsyncComponent, computed } from 'vue'

const activeTab = ref('flight')

// 异步组件
const FlightStatistics = defineAsyncComponent(() =>
  import('./components/FlightStatistics.vue')
)
const DeviceStatistics = defineAsyncComponent(() =>
  import('./components/DeviceStatistics.vue')
)
const AlarmStatistics = defineAsyncComponent(() =>
  import('./components/AlarmStatistics.vue')
)

// 当前激活的组件
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
  <el-tabs v-model="activeTab">
    <el-tab-pane label="飞行统计" name="flight" />
    <el-tab-pane label="设备统计" name="device" />
    <el-tab-pane label="告警统计" name="alarm" />
  </el-tabs>

  <!-- 使用 KeepAlive 缓存已加载的组件 -->
  <KeepAlive>
    <component :is="currentComponent" />
  </KeepAlive>
</template>
```

**效果评估**：
- 首屏 JS：只加载第一个 Tab，减少 66%
- Tab 切换延迟：~200ms（首次），0ms（缓存后）

### 方案 4：条件渲染组件懒加载 ⭐⭐

**当前问题**：根据权限/条件显示的组件也被加载

```vue
<!-- 不好的做法 -->
<script setup lang="ts">
import AdminPanel from './components/AdminPanel.vue'
import UserPanel from './components/UserPanel.vue'

const userStore = useUserStore()
</script>

<template>
  <div>
    <AdminPanel v-if="userStore.isAdmin" />
    <UserPanel v-else />
  </div>
</template>
```

**优化方案**：异步组件 + v-if

```vue
<!-- 推荐做法 -->
<script setup lang="ts">
import { defineAsyncComponent } from 'vue'

const AdminPanel = defineAsyncComponent(() =>
  import('./components/AdminPanel.vue')
)
const UserPanel = defineAsyncComponent(() =>
  import('./components/UserPanel.vue')
)

const userStore = useUserStore()
</script>

<template>
  <div>
    <!-- 只加载需要的组件 -->
    <AdminPanel v-if="userStore.isAdmin" />
    <UserPanel v-else />
  </div>
</template>
```

**效果评估**：
- 首屏 JS：减少 50%（只加载一个分支）

### 方案 5：大组件拆分 + 懒加载 ⭐⭐⭐

**当前问题**：home/index.vue 有 5,343 行

**优化方案**：拆分成多个子组件 + 懒加载

```vue
<!-- pages/home/index.vue - 优化后 -->
<script setup lang="ts">
import { defineAsyncComponent } from 'vue'

// 首屏必需的组件（同步加载）
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
  </div>
</template>
```

**进阶：使用 Intersection Observer 懒加载**

```vue
<script setup lang="ts">
import { ref, onMounted } from 'vue'

const FlightPanel = defineAsyncComponent(() =>
  import('./components/FlightPanel.vue')
)

const showFlightPanel = ref(false)
const flightPanelTrigger = ref<HTMLElement>()

onMounted(() => {
  const observer = new IntersectionObserver((entries) => {
    if (entries[0].isIntersecting) {
      showFlightPanel.value = true
      observer.disconnect()
    }
  })

  if (flightPanelTrigger.value) {
    observer.observe(flightPanelTrigger.value)
  }
})
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
- home/index.vue：从 5,343 行拆分成 10+ 个小组件
- 首屏 JS：减少 70-80%
- 可维护性：显著提升

### 方案 6：预加载策略 ⭐⭐

**问题**：懒加载会导致首次使用时有延迟

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
      })
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

// 预加载弹窗组件
usePreload(() => import('@/components/device-detail-dialog/index.vue'), 3000)
</script>
```

**效果评估**：
- 首次打开延迟：从 300ms 降低到 0ms
- 首屏加载：不受影响（延迟加载）

## 优化效果对比

### 优化前

| 指标 | 数值 |
|------|------|
| 首屏 JS 大小 | ~8MB |
| 首屏组件数量 | 647 个 |
| TTI | ~8s |
| 内存占用 | ~300MB |

### 优化后

| 指标 | 数值 | 提升 |
|------|------|------|
| 首屏 JS 大小 | ~1.5MB | ↓81% |
| 首屏组件数量 | ~50 个 | ↓92% |
| TTI | ~2s | ↓75% |
| 内存占用 | ~100MB | ↓67% |

## 实施计划

### 第一阶段（1天）- 路由懒加载

1. ✅ 所有路由改为异步导入
2. ✅ 添加路由加载状态

**预期效果**：首屏 JS ↓60%

### 第二阶段（2-3天）- 组件懒加载

1. ✅ 弹窗组件改为异步导入
2. ✅ Tab 组件改为异步导入
3. ✅ 条件组件改为异步导入

**预期效果**：首屏 JS ↓70%

### 第三阶段（1周）- 大页面拆分

1. ✅ home/index.vue 拆分成多个子组件
2. ✅ 其他大页面拆分
3. ✅ 添加 Intersection Observer 懒加载

**预期效果**：首屏 JS ↓80%，可维护性提升

### 第四阶段（可选）- 预加载优化

1. ✅ 添加预加载策略
2. ✅ 优化加载优先级

**预期效果**：用户体验提升，无感知延迟

## 测量与验证

### 性能指标

```typescript
// utils/performance.ts
export function measureComponentLoad(name: string) {
  const start = performance.now()

  return {
    end: () => {
      const duration = performance.now() - start
      console.log(`组件 ${name} 加载耗时: ${duration.toFixed(2)}ms`)
    },
  }
}
```

```vue
<script setup lang="ts">
const DeviceDialog = defineAsyncComponent({
  loader: async () => {
    const measure = measureComponentLoad('DeviceDialog')
    const component = await import('./DeviceDialog.vue')
    measure.end()
    return component
  },
})
</script>
```

### 关键指标

- **First Load JS**：首屏 JS 大小
- **Component Count**：首屏组件数量
- **TTI**：可交互时间
- **Memory Usage**：内存占用
- **Lazy Load Time**：懒加载延迟

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
    template: '<div>组件加载失败，请刷新页面</div>',
  },
  timeout: 10000,
})
</script>
```

### 3. KeepAlive 的内存问题

```vue
<!-- 限制缓存数量 -->
<KeepAlive :max="5">
  <component :is="currentComponent" />
</KeepAlive>
```

## 相关章节

- [3.2 大页面拆分](./3-2-page-splitting.md) - home/index.vue 拆分详解
- [1.3 代码分割策略](./1-3-code-splitting.md) - Vite 分包配置
- [1.1 Bundle 体积优化](./1-1-bundle-size.md) - 整体优化策略

## 总结

组件懒加载是性能优化的关键手段：
1. **路由懒加载**：所有路由使用异步导入
2. **弹窗懒加载**：使用 defineAsyncComponent
3. **Tab 懒加载**：配合 KeepAlive 缓存
4. **大页面拆分**：5,343 行拆分成多个小组件
5. **预加载优化**：在空闲时预加载常用组件

通过这些优化，可以将首屏 JS 从 8MB 降低到 1.5MB（↓81%），TTI 从 8s 降低到 2s（↓75%），显著提升用户体验。
