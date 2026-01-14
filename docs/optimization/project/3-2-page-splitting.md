# 3.2 大页面拆分

## 问题场景

### 当前状态

**home/index.vue** 文件达到 **5,343 行**，包含：

```vue
<!-- pages/home/index.vue -->
<script setup lang="ts">
// 1. 大量导入 (100+ 行)
import { ref, reactive, computed, watch, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
// ... 50+ 个导入

// 2. 大量状态管理 (200+ 行)
const flightData = ref([])
const deviceData = ref([])
const alarmData = ref([])
// ... 50+ 个状态

// 3. 大量业务逻辑 (1000+ 行)
function handleFlightClick() { /* ... */ }
function handleDeviceClick() { /* ... */ }
function handleAlarmClick() { /* ... */ }
// ... 100+ 个函数

// 4. 大量 API 调用 (500+ 行)
async function fetchFlightData() { /* ... */ }
async function fetchDeviceData() { /* ... */ }
// ... 50+ 个 API 函数

// 5. 大量生命周期 (200+ 行)
onMounted(() => { /* ... */ })
watch(() => flightData.value, () => { /* ... */ })
// ... 20+ 个生命周期钩子
</script>

<template>
  <!-- 6. 大量模板代码 (3000+ 行) -->
  <div class="home-page">
    <!-- 地图容器 (500 行) -->
    <div class="map-container">...</div>

    <!-- 飞行面板 (800 行) -->
    <div class="flight-panel">...</div>

    <!-- 设备面板 (600 行) -->
    <div class="device-panel">...</div>

    <!-- 统计面板 (500 行) -->
    <div class="statistics-panel">...</div>

    <!-- 告警面板 (400 行) -->
    <div class="alarm-panel">...</div>

    <!-- 其他面板 (200 行) -->
  </div>
</template>

<style scoped>
/* 7. 大量样式 (500+ 行) */
</style>
```

### 问题分析

1. **可维护性差**：5,343 行代码难以理解和修改
2. **协作困难**：多人修改同一文件容易冲突
3. **性能问题**：所有代码一次性加载和解析
4. **测试困难**：难以进行单元测试
5. **复用性差**：逻辑耦合，难以复用

## 原理分析

### 大页面的性能影响

```
加载流程：
1. 下载 home.js (包含 5,343 行代码)  ← 耗时长
2. 解析 JavaScript                  ← 耗时长
3. 执行初始化逻辑                    ← 耗时长
4. 创建所有组件实例                  ← 内存占用高
5. 渲染 DOM                         ← 耗时长
```

### 拆分的收益

| 维度 | 拆分前 | 拆分后 | 收益 |
|------|--------|--------|------|
| 文件大小 | 5,343 行 | 10+ 个文件，每个 200-500 行 | 可维护性 ⭐⭐⭐ |
| 首屏加载 | 全部加载 | 按需加载 | 性能 ⭐⭐⭐ |
| 代码复用 | 难以复用 | 独立组件，易复用 | 复用性 ⭐⭐⭐ |
| 团队协作 | 容易冲突 | 独立文件，减少冲突 | 协作 ⭐⭐⭐ |

## 优化方案

### 方案 1：按功能模块拆分 ⭐⭐⭐

**拆分策略**：将 home/index.vue 拆分成多个功能模块

```
pages/home/
├── index.vue                    # 主页面 (200 行)
├── components/
│   ├── MapContainer.vue         # 地图容器 (500 行)
│   ├── FlightPanel.vue          # 飞行面板 (800 行)
│   ├── DevicePanel.vue          # 设备面板 (600 行)
│   ├── StatisticsPanel.vue      # 统计面板 (500 行)
│   ├── AlarmPanel.vue           # 告警面板 (400 行)
│   └── ...
├── composables/
│   ├── useFlightData.ts         # 飞行数据逻辑 (200 行)
│   ├── useDeviceData.ts         # 设备数据逻辑 (200 行)
│   ├── useStatistics.ts         # 统计逻辑 (150 行)
│   └── ...
└── types/
    └── index.ts                 # 类型定义 (100 行)
```

**实施步骤**：

#### 步骤 1：提取组件

```vue
<!-- pages/home/components/FlightPanel.vue -->
<script setup lang="ts">
import { useFlightData } from '../composables/useFlightData'

const { flightList, loading, handleFlightClick } = useFlightData()
</script>

<template>
  <div class="flight-panel">
    <div class="panel-header">
      <h3>飞行监控</h3>
    </div>
    <div class="panel-content">
      <el-table :data="flightList" :loading="loading">
        <!-- 表格内容 -->
      </el-table>
    </div>
  </div>
</template>

<style scoped>
.flight-panel {
  /* 样式 */
}
</style>
```

#### 步骤 2：提取 Composables

```typescript
// pages/home/composables/useFlightData.ts
import { ref, onMounted } from 'vue'
import { getFlightList } from '@/apis/flight'

export function useFlightData() {
  const flightList = ref([])
  const loading = ref(false)

  async function fetchFlightList() {
    loading.value = true
    try {
      const res = await getFlightList()
      flightList.value = res.data
    } finally {
      loading.value = false
    }
  }

  function handleFlightClick(flight: any) {
    // 处理点击事件
  }

  onMounted(() => {
    fetchFlightList()
  })

  return {
    flightList,
    loading,
    fetchFlightList,
    handleFlightClick,
  }
}
```

#### 步骤 3：重构主页面

```vue
<!-- pages/home/index.vue - 拆分后 -->
<script setup lang="ts">
import { defineAsyncComponent } from 'vue'

// 首屏必需组件（同步加载）
import MapContainer from './components/MapContainer.vue'

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
    <!-- 地图容器（首屏） -->
    <MapContainer />

    <!-- 其他面板（懒加载） -->
    <FlightPanel />
    <DevicePanel />
    <StatisticsPanel />
    <AlarmPanel />
  </div>
</template>

<style scoped>
.home-page {
  display: flex;
  height: 100vh;
}
</style>
```

**效果评估**：
- 主文件：从 5,343 行降低到 ~200 行
- 可维护性：显著提升
- 首屏 JS：减少 70-80%

### 方案 2：按视图层级拆分 ⭐⭐

**拆分策略**：将页面拆分成布局层、容器层、组件层

```
pages/home/
├── index.vue                    # 布局层 (100 行)
├── containers/
│   ├── LeftSidebar.vue          # 左侧容器 (200 行)
│   ├── MainContent.vue          # 主内容容器 (300 行)
│   └── RightSidebar.vue         # 右侧容器 (200 行)
└── components/
    ├── FlightCard.vue           # 飞行卡片 (100 行)
    ├── DeviceCard.vue           # 设备卡片 (100 行)
    └── ...
```

```vue
<!-- pages/home/index.vue - 布局层 -->
<script setup lang="ts">
import LeftSidebar from './containers/LeftSidebar.vue'
import MainContent from './containers/MainContent.vue'
import RightSidebar from './containers/RightSidebar.vue'
</script>

<template>
  <div class="home-layout">
    <LeftSidebar />
    <MainContent />
    <RightSidebar />
  </div>
</template>
```

```vue
<!-- pages/home/containers/MainContent.vue - 容器层 -->
<script setup lang="ts">
import { defineAsyncComponent } from 'vue'

const MapContainer = defineAsyncComponent(() =>
  import('../components/MapContainer.vue')
)
const FlightPanel = defineAsyncComponent(() =>
  import('../components/FlightPanel.vue')
)
</script>

<template>
  <div class="main-content">
    <MapContainer />
    <FlightPanel />
  </div>
</template>
```

**效果评估**：
- 层次清晰：布局、容器、组件分离
- 易于理解：每层职责明确

### 方案 3：按业务领域拆分 ⭐⭐⭐

**拆分策略**：将页面拆分成独立的业务模块

```
pages/home/
├── index.vue                    # 主页面 (150 行)
├── modules/
│   ├── flight/                  # 飞行模块
│   │   ├── FlightPanel.vue
│   │   ├── FlightDetail.vue
│   │   ├── useFlightData.ts
│   │   └── types.ts
│   ├── device/                  # 设备模块
│   │   ├── DevicePanel.vue
│   │   ├── DeviceDetail.vue
│   │   ├── useDeviceData.ts
│   │   └── types.ts
│   ├── statistics/              # 统计模块
│   │   ├── StatisticsPanel.vue
│   │   ├── useStatistics.ts
│   │   └── types.ts
│   └── alarm/                   # 告警模块
│       ├── AlarmPanel.vue
│       ├── useAlarmData.ts
│       └── types.ts
└── shared/                      # 共享资源
    ├── components/
    ├── composables/
    └── utils/
```

**优势**：
- 模块独立：每个模块可以独立开发、测试、部署
- 易于复用：模块可以在其他页面复用
- 团队协作：不同团队成员负责不同模块

### 方案 4：提取共享逻辑 ⭐⭐⭐

**问题**：多个组件有重复的逻辑

```vue
<!-- FlightPanel.vue -->
<script setup lang="ts">
// 重复的分页逻辑
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)

function handlePageChange(page: number) {
  currentPage.value = page
  fetchData()
}
</script>
```

```vue
<!-- DevicePanel.vue -->
<script setup lang="ts">
// 重复的分页逻辑
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)

function handlePageChange(page: number) {
  currentPage.value = page
  fetchData()
}
</script>
```

**优化方案**：提取 Composable

```typescript
// composables/usePagination.ts
import { ref, computed } from 'vue'

export function usePagination(fetchFn: Function) {
  const currentPage = ref(1)
  const pageSize = ref(10)
  const total = ref(0)

  const offset = computed(() => (currentPage.value - 1) * pageSize.value)

  async function handlePageChange(page: number) {
    currentPage.value = page
    await fetchFn({ offset: offset.value, limit: pageSize.value })
  }

  function reset() {
    currentPage.value = 1
  }

  return {
    currentPage,
    pageSize,
    total,
    offset,
    handlePageChange,
    reset,
  }
}
```

```vue
<!-- FlightPanel.vue - 使用 Composable -->
<script setup lang="ts">
import { usePagination } from '@/composables/usePagination'

const { currentPage, pageSize, total, handlePageChange } = usePagination(fetchFlightList)
</script>
```

**效果评估**：
- 代码复用：减少重复代码 60-80%
- 易于维护：逻辑集中管理

### 方案 5：状态管理优化 ⭐⭐

**问题**：大量状态散落在组件中

```vue
<!-- home/index.vue - 不好的做法 -->
<script setup lang="ts">
const flightData = ref([])
const deviceData = ref([])
const alarmData = ref([])
const statisticsData = ref({})
// ... 50+ 个状态
</script>
```

**优化方案**：使用 Pinia Store

```typescript
// stores/home.ts
import { defineStore } from 'pinia'

export const useHomeStore = defineStore('home', () => {
  // 飞行数据
  const flightData = ref([])
  const flightLoading = ref(false)

  async function fetchFlightData() {
    flightLoading.value = true
    try {
      const res = await getFlightList()
      flightData.value = res.data
    } finally {
      flightLoading.value = false
    }
  }

  // 设备数据
  const deviceData = ref([])
  const deviceLoading = ref(false)

  async function fetchDeviceData() {
    deviceLoading.value = true
    try {
      const res = await getDeviceList()
      deviceData.value = res.data
    } finally {
      deviceLoading.value = false
    }
  }

  return {
    flightData,
    flightLoading,
    fetchFlightData,
    deviceData,
    deviceLoading,
    fetchDeviceData,
  }
})
```

```vue
<!-- components/FlightPanel.vue -->
<script setup lang="ts">
import { useHomeStore } from '@/stores/home'

const homeStore = useHomeStore()
const { flightData, flightLoading } = storeToRefs(homeStore)

onMounted(() => {
  homeStore.fetchFlightData()
})
</script>
```

**效果评估**：
- 状态集中管理：易于调试和维护
- 跨组件共享：避免 props drilling

## 优化效果对比

### 优化前

| 指标 | 数值 |
|------|------|
| 主文件行数 | 5,343 行 |
| 文件数量 | 1 个 |
| 首屏 JS | ~2MB |
| 可维护性 | 差 |
| 协作难度 | 高 |

### 优化后

| 指标 | 数值 | 提升 |
|------|------|------|
| 主文件行数 | ~200 行 | ↓96% |
| 文件数量 | 20+ 个 | 模块化 |
| 首屏 JS | ~400KB | ↓80% |
| 可维护性 | 优 | ⭐⭐⭐ |
| 协作难度 | 低 | ⭐⭐⭐ |

## 实施计划

### 第一阶段（2-3天）- 组件拆分

1. ✅ 识别独立功能模块
2. ✅ 提取组件（FlightPanel、DevicePanel 等）
3. ✅ 更新主页面引用

**预期效果**：主文件 ↓60%

### 第二阶段（2-3天）- 逻辑拆分

1. ✅ 提取 Composables
2. ✅ 提取共享逻辑
3. ✅ 创建 Pinia Store

**预期效果**：代码复用 ↑80%

### 第三阶段（3-5天）- 懒加载优化

1. ✅ 非首屏组件改为异步加载
2. ✅ 添加加载状态
3. ✅ 优化加载顺序

**预期效果**：首屏 JS ↓80%

### 第四阶段（持续）- 持续优化

1. ✅ 代码审查和重构
2. ✅ 性能监控和优化
3. ✅ 文档更新

## 测量与验证

### 代码质量指标

```bash
# 使用 cloc 统计代码行数
cloc pages/home/

# 使用 ESLint 检查代码质量
eslint pages/home/ --ext .vue,.ts

# 使用 SonarQube 分析代码复杂度
```

### 性能指标

- **File Size**：文件大小
- **Lines of Code**：代码行数
- **Cyclomatic Complexity**：圈复杂度
- **Maintainability Index**：可维护性指数

## 注意事项

### 1. 避免过度拆分

```
❌ 不好：拆分过细
components/
├── FlightPanelHeader.vue        (10 行)
├── FlightPanelContent.vue       (20 行)
├── FlightPanelFooter.vue        (10 行)

✅ 好：合理粒度
components/
├── FlightPanel.vue              (200 行)
```

### 2. 保持模块独立性

```typescript
// ❌ 不好：模块间直接依赖
// FlightPanel.vue
import { deviceData } from '../DevicePanel.vue'

// ✅ 好：通过 Store 或 Props 通信
const homeStore = useHomeStore()
const { deviceData } = storeToRefs(homeStore)
```

### 3. 统一命名规范

```
✅ 推荐的命名规范：
- 组件：PascalCase (FlightPanel.vue)
- Composables：use + PascalCase (useFlightData.ts)
- Store：use + PascalCase + Store (useHomeStore.ts)
- 类型：PascalCase (FlightData.ts)
```

## 相关章节

- [3.1 组件懒加载](./3-1-component-lazy-loading.md) - 懒加载实现
- [3.3 状态管理优化](./3-3-state-management.md) - Pinia 优化
- [1.1 Bundle 体积优化](./1-1-bundle-size.md) - 整体优化策略

## 总结

大页面拆分是提升可维护性和性能的关键：
1. **按功能拆分**：将 5,343 行拆分成 20+ 个模块
2. **提取 Composables**：复用业务逻辑
3. **使用 Store**：集中管理状态
4. **懒加载**：非首屏组件异步加载
5. **持续优化**：定期审查和重构

通过这些优化，可以将主文件从 5,343 行降低到 200 行（↓96%），首屏 JS 减少 80%，显著提升可维护性和性能。
