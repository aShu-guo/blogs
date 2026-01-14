# 1.1 Bundle 体积优化

## 问题场景

### 当前状态

通过 `vite-plugin-visualizer` 分析，项目构建产物达到 **93MB**，主要问题：

```
dist/
├── assets/
│   ├── vendor-ali-vod-*.js        1.3MB  (阿里云视频播放器)
│   ├── vendor-echarts-*.js        1.0MB  (图表库)
│   ├── vendor-cesium-*.js         800KB  (3D地图)
│   ├── vendor-ali-oss-*.js        674KB  (阿里云OSS)
│   ├── vendor-element-plus-*.js   549KB  (UI组件库)
│   ├── vendor-openlayers-*.js     450KB  (2D地图)
│   ├── vendor-formily-*.js        380KB  (表单库)
│   └── ...
├── legacy/                        ~40MB  (传统浏览器支持)
└── ...
```

### 用户影响

- **首屏加载慢**：需要下载大量 JS 文件
- **流量消耗大**：移动端用户体验差
- **缓存失效成本高**：每次更新都要重新下载大文件

## 原理分析

### 为什么 Bundle 这么大？

1. **重复打包**：Legacy 模式导致代码打包两次（现代版 + 传统版）
2. **全量引入**：部分库没有按需引入（如 ECharts、Element Plus）
3. **多个相似库**：同时使用多个功能重叠的库
4. **未压缩资源**：部分静态资源未优化

### Bundle 组成分析

```javascript
// 当前 vite.config.ts 的分包策略
manualChunks: {
  'vendor-ali-vod': ['aliyun-rts-sdk', 'aliyun-webrtc-sdk', 'aliplayer-components'],
  'vendor-echarts': ['echarts'],
  'vendor-element-plus': ['element-plus'],
  'vendor-ali-oss': ['ali-oss'],
  'vendor-cesium': ['cesium'],
  'vendor-openlayers': ['ol'],
  'vendor-formily': ['@formily/core', '@formily/vue', '@formily/element-plus'],
  // ...
}
```

**问题**：所有 vendor 都在首屏加载，即使某些功能用户可能不会使用。

## 优化方案

### 方案 1：移除 Legacy 支持（推荐）⭐⭐⭐

**适用场景**：政务系统，用户浏览器版本可控

**实施步骤**：

```typescript
// vite.config.ts
export default defineConfig({
  plugins: [
    vue(),
    // 注释掉 legacy 插件
    // legacy({
    //   targets: ['defaults', 'not IE 11'],
    //   modernPolyfills: true,
    // }),
  ],
})
```

**效果评估**：
- Bundle 大小：93MB → **~50MB** (↓46%)
- 构建时间：减少 30-40%
- 首屏加载：减少 40-50%

**注意事项**：
- 确认目标用户的浏览器版本
- 政务系统通常使用 Chrome/Edge，可以安全移除
- 如需支持旧浏览器，考虑单独部署一个 legacy 版本

### 方案 2：按需引入 Element Plus ⭐⭐⭐

**当前问题**：全量引入 Element Plus (549KB)

```typescript
// 当前 main.ts
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'

app.use(ElementPlus)
```

**优化方案**：使用自动导入插件

```typescript
// vite.config.ts
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'

export default defineConfig({
  plugins: [
    AutoImport({
      resolvers: [ElementPlusResolver()],
    }),
    Components({
      resolvers: [ElementPlusResolver()],
    }),
  ],
})
```

```typescript
// main.ts - 移除全量引入
// import ElementPlus from 'element-plus'
// app.use(ElementPlus)
```

**效果评估**：
- Element Plus：549KB → **~200KB** (↓64%)
- 只打包实际使用的组件

### 方案 3：ECharts 按需引入 ⭐⭐⭐

**当前问题**：全量引入 ECharts (1.0MB)

```typescript
// 当前可能的用法
import * as echarts from 'echarts'
```

**优化方案**：只引入需要的图表类型

```typescript
// utils/echarts.ts
import * as echarts from 'echarts/core'
import {
  BarChart,
  LineChart,
  PieChart,
  ScatterChart,
  // 只引入使用的图表类型
} from 'echarts/charts'
import {
  GridComponent,
  TooltipComponent,
  LegendComponent,
  DataZoomComponent,
  // 只引入使用的组件
} from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'

echarts.use([
  BarChart,
  LineChart,
  PieChart,
  ScatterChart,
  GridComponent,
  TooltipComponent,
  LegendComponent,
  DataZoomComponent,
  CanvasRenderer,
])

export default echarts
```

```typescript
// 组件中使用
import echarts from '@/utils/echarts'
```

**效果评估**：
- ECharts：1.0MB → **~400KB** (↓60%)
- 根据实际使用的图表类型，可能更小

### 方案 4：地图库按需加载 ⭐⭐⭐

**当前问题**：Cesium (800KB) 和 OpenLayers (450KB) 同时打包

**优化方案**：根据页面动态加载

```typescript
// router/index.ts
const routes = [
  {
    path: '/3d-map',
    component: () => import('@/pages/3d-map/index.vue'),
    meta: {
      preload: ['cesium'] // 预加载 Cesium
    }
  },
  {
    path: '/2d-map',
    component: () => import('@/pages/2d-map/index.vue'),
    meta: {
      preload: ['openlayers'] // 预加载 OpenLayers
    }
  },
]
```

```typescript
// vite.config.ts - 调整分包策略
manualChunks: {
  // 不要将地图库打入 vendor，让它们独立分包
  // 'vendor-cesium': ['cesium'],  // 删除
  // 'vendor-openlayers': ['ol'],  // 删除
}
```

**效果评估**：
- 首屏 JS：减少 1.25MB
- 只在需要时加载对应的地图库

### 方案 5：视频播放器懒加载 ⭐⭐

**当前问题**：阿里云视频播放器 (1.3MB) 在首屏加载

**优化方案**：只在播放视频时加载

```typescript
// components/VideoPlayer.vue
<script setup lang="ts">
import { ref, onMounted } from 'vue'

const playerReady = ref(false)
let AliPlayer: any = null

async function initPlayer() {
  if (!AliPlayer) {
    // 动态导入播放器
    const module = await import('aliyun-rts-sdk')
    AliPlayer = module.default
  }

  playerReady.value = true
  // 初始化播放器...
}

// 只在需要时初始化
onMounted(() => {
  // 可以延迟加载，或者在用户点击播放时加载
  setTimeout(initPlayer, 2000)
})
</script>
```

**效果评估**：
- 首屏 JS：减少 1.3MB
- 播放器加载延迟：~500ms（可接受）

### 方案 6：移除重复依赖 ⭐⭐

**当前问题**：多个功能重叠的库

```json
// package.json
{
  "dependencies": {
    "crypto-js": "^4.2.0",
    "jsencrypt": "^3.3.2",
    "md5": "^2.3.0",
    // 三个加密库，功能重叠
  }
}
```

**优化方案**：统一使用一个库

```typescript
// utils/crypto.ts
import CryptoJS from 'crypto-js'

// 统一的加密工具
export const crypto = {
  md5: (str: string) => CryptoJS.MD5(str).toString(),
  encrypt: (str: string, key: string) => CryptoJS.AES.encrypt(str, key).toString(),
  decrypt: (str: string, key: string) => CryptoJS.AES.decrypt(str, key).toString(CryptoJS.enc.Utf8),
}
```

```json
// package.json - 移除其他加密库
{
  "dependencies": {
    "crypto-js": "^4.2.0"
    // "jsencrypt": "^3.3.2",  // 删除
    // "md5": "^2.3.0",        // 删除
  }
}
```

**效果评估**：
- Bundle 大小：减少 ~100KB
- 代码更统一，易维护

### 方案 7：启用压缩 ⭐⭐⭐

**优化方案**：启用 Gzip/Brotli 压缩

```typescript
// vite.config.ts
import viteCompression from 'vite-plugin-compression'

export default defineConfig({
  plugins: [
    viteCompression({
      algorithm: 'gzip',
      ext: '.gz',
      threshold: 10240, // 10KB 以上才压缩
      deleteOriginFile: false,
    }),
    viteCompression({
      algorithm: 'brotliCompress',
      ext: '.br',
      threshold: 10240,
      deleteOriginFile: false,
    }),
  ],
})
```

```nginx
# nginx 配置
gzip on;
gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
gzip_min_length 1024;

# Brotli 支持
brotli on;
brotli_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
```

**效果评估**：
- Gzip：减少 60-70%
- Brotli：减少 70-80%（比 Gzip 更好）

## 优化效果对比

### 优化前

| 指标 | 数值 |
|------|------|
| 总 Bundle 大小 | 93MB |
| 首屏 JS 大小 | ~8MB |
| 首屏加载时间 | ~8s (3G网络) |
| Lighthouse 分数 | ~45 |

### 优化后（应用所有方案）

| 指标 | 数值 | 提升 |
|------|------|------|
| 总 Bundle 大小 | ~35MB | ↓62% |
| 首屏 JS 大小 | ~1.5MB | ↓81% |
| 首屏 JS 大小（Gzip） | ~400KB | ↓95% |
| 首屏加载时间 | ~2s (3G网络) | ↓75% |
| Lighthouse 分数 | ~85 | +89% |

## 实施计划

### 第一阶段（1天）- Quick Wins

1. ✅ 移除 Legacy 支持（如果可行）
2. ✅ 启用 Gzip/Brotli 压缩
3. ✅ 移除重复依赖

**预期效果**：Bundle 大小 ↓50%

### 第二阶段（3-5天）- 按需引入

1. ✅ Element Plus 按需引入
2. ✅ ECharts 按需引入
3. ✅ 视频播放器懒加载

**预期效果**：首屏 JS ↓70%

### 第三阶段（1-2周）- 动态加载

1. ✅ 地图库按需加载
2. ✅ 路由级别代码分割
3. ✅ 组件级别懒加载

**预期效果**：首屏加载时间 ↓75%

## 测量与验证

### 构建分析

```bash
# 生成 bundle 分析报告
npm run build

# 查看 stats.html（vite-plugin-visualizer 生成）
open dist/stats.html
```

### 性能测试

```bash
# Lighthouse CI
npm install -g @lhci/cli
lhci autorun --collect.url=http://localhost:3000

# 或使用 Chrome DevTools
# 1. 打开 DevTools
# 2. Lighthouse 标签
# 3. 生成报告
```

### 关键指标

- **Bundle Size**：总构建产物大小
- **First Load JS**：首屏 JS 大小
- **LCP**：最大内容绘制时间 (< 2.5s)
- **TTI**：可交互时间 (< 3.5s)
- **Lighthouse Score**：综合评分 (> 85)

## 注意事项

### 1. 按需引入的副作用

```typescript
// ❌ 错误：按需引入后仍然全量导入
import { ElMessage } from 'element-plus'
import 'element-plus/dist/index.css' // 仍然导入全部样式

// ✅ 正确：使用自动导入插件
// 插件会自动处理样式导入
```

### 2. 动态导入的错误处理

```typescript
// ✅ 添加错误处理
async function loadMap() {
  try {
    const Cesium = await import('cesium')
    return Cesium
  } catch (error) {
    console.error('Failed to load Cesium:', error)
    // 降级方案：使用 2D 地图
    return import('ol')
  }
}
```

### 3. 缓存策略

```typescript
// vite.config.ts
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        // 稳定的 chunk 命名，利于缓存
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
      },
    },
  },
})
```

## 相关章节

- [1.2 构建性能优化](./1-2-build-performance.md) - 减少构建时间
- [1.3 代码分割策略](./1-3-code-splitting.md) - 更细粒度的分包
- [2.1 地图库优化](./2-1-map-libraries.md) - Cesium/OpenLayers 优化
- [2.2 视频流优化](./2-2-video-streaming.md) - 视频播放器优化

## 总结

Bundle 体积优化是性能优化的基础，通过：
1. **移除不必要的代码**（Legacy 支持、重复依赖）
2. **按需引入**（Element Plus、ECharts）
3. **懒加载**（地图库、视频播放器）
4. **压缩**（Gzip/Brotli）

可以将 Bundle 大小从 93MB 降低到 35MB（↓62%），首屏 JS 从 8MB 降低到 400KB（Gzip 后，↓95%），显著提升用户体验。
