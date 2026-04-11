# 6.1 Vite配置优化

## 问题场景

### 低空政务平台构建现状

**项目规模**:
- 组件数量: 647 个 Vue 组件
- 依赖库: Cesium (800KB), OpenLayers (450KB), ECharts (400KB), Element Plus (200KB)
- 构建产物: 93MB (未压缩)
- 构建时间: 8-10 分钟
- 构建内存: 峰值 6GB

**构建问题**:
```
构建流程分析:
1. 依赖预构建              2-3min    ← 瓶颈
2. 模块转换                3-4min    ← 瓶颈
3. 代码压缩                2-3min    ← 瓶颈
4. 资源输出                30s
-------------------------------------------
总计: 8-10min

内存占用:
- 依赖预构建: 1.5GB
- 模块转换: 2GB
- Terser 压缩: 2.5GB (峰值)  ← 瓶颈
-------------------------------------------
峰值: 6GB
```

**核心问题**:
- Legacy 插件生成额外的 ES5 代码,增加 40% 构建时间
- 依赖预构建未优化,每次都重新构建大型库
- 未配置 manualChunks,所有代码打包到少数几个文件
- 使用 Terser 压缩,速度慢且内存占用高
- 缺少构建缓存,每次都是全量构建

## 原理分析

### Vite 构建流程

**开发模式 (Dev)**:
```javascript
// 按需编译,不打包
浏览器请求 → Vite 拦截 → 转换单个文件 → 返回 ESM

优势:
- 启动快 (无需打包)
- 热更新快 (只更新改变的模块)
- 内存占用低
```

**生产模式 (Build)**:
```javascript
// 使用 Rollup 打包
依赖预构建 → 模块转换 → 代码分割 → 压缩 → 输出

步骤详解:
1. 依赖预构建: 将 CommonJS/UMD 转为 ESM
2. 模块转换: Vue/TS/JSX → JS
3. 代码分割: 按 manualChunks 配置分包
4. 压缩: esbuild/terser 压缩代码
5. 输出: 生成最终产物
```

### 构建性能瓶颈

| 阶段 | 耗时占比 | 内存占比 | 优化空间 |
|------|---------|---------|---------|
| 依赖预构建 | 25% | 25% | ⭐⭐⭐ |
| 模块转换 | 35% | 30% | ⭐⭐ |
| 代码压缩 | 30% | 40% | ⭐⭐⭐ |
| 资源输出 | 10% | 5% | ⭐ |

## 优化方案

### 方案 1: 移除 Legacy 插件 ⭐⭐⭐

**问题**: Legacy 插件生成 ES5 代码,增加 40% 构建时间和产物体积

```typescript
// vite.config.ts - 不好的做法
import legacy from '@vitejs/plugin-legacy'

export default defineConfig({
  plugins: [
    vue(),
    legacy({
      targets: ['defaults', 'not IE 11'], // 支持旧浏览器
      additionalLegacyPolyfills: ['regenerator-runtime/runtime'],
    }),
  ],
})

// 构建产物:
// dist/assets/index-abc123.js (现代浏览器)
// dist/assets/index-legacy-def456.js (旧浏览器) ← 额外 40% 体积
```

**优化方案**: 移除 Legacy 插件,只支持现代浏览器

```typescript
// vite.config.ts - 推荐做法
export default defineConfig({
  plugins: [vue()],
  build: {
    target: 'es2015', // 或 'esnext'
    // 不再生成 legacy 代码
  },
})

// 浏览器支持:
// Chrome 51+, Firefox 54+, Safari 10+, Edge 15+
// 覆盖 95%+ 用户
```

**效果评估**:
- 构建时间: 8-10min → 5-6min (↓40%)
- 产物体积: 93MB → 65MB (↓30%)
- 内存占用: 6GB → 4.5GB (↓25%)

### 方案 2: 优化依赖预构建 ⭐⭐⭐

**问题**: 大型库 (Cesium, OpenLayers) 每次都重新预构建

```typescript
// vite.config.ts - 优化前
export default defineConfig({
  optimizeDeps: {
    // 默认配置,自动发现依赖
  },
})
```

**优化方案**: 手动指定需要预构建的依赖

```typescript
// vite.config.ts - 优化后
export default defineConfig({
  optimizeDeps: {
    include: [
      // 大型库手动指定
      'cesium',
      'ol',
      'ol/layer',
      'ol/source',
      'ol/geom',
      'echarts',
      'echarts/core',
      'echarts/charts',
      'echarts/components',
      'echarts/renderers',
      // Element Plus 按需引入
      'element-plus',
      'element-plus/es',
      'element-plus/es/components/button/style/css',
      'element-plus/es/components/dialog/style/css',
      // 其他常用库
      'vue',
      'vue-router',
      'pinia',
      'axios',
    ],
    exclude: [
      // 排除不需要预构建的
      '@iconify/json',
    ],
  },
})
```

**进阶: 强制预构建缓存**

```typescript
export default defineConfig({
  optimizeDeps: {
    include: ['cesium', 'ol', 'echarts'],
    // 强制使用缓存,除非依赖版本变化
    force: false,
  },
  // 缓存目录
  cacheDir: 'node_modules/.vite',
})
```

**效果评估**:
- 首次构建: 无变化
- 二次构建: 2-3min → 30s (↓80%)
- 缓存命中率: 95%+

### 方案 3: 配置 manualChunks 分包 ⭐⭐⭐

**问题**: 所有代码打包到少数几个文件,导致单文件过大

```typescript
// vite.config.ts - 优化前
export default defineConfig({
  build: {
    rollupOptions: {
      // 未配置 manualChunks
    },
  },
})

// 构建产物:
// index-abc123.js (8MB) ← 包含所有代码
```

**优化方案**: 按库和功能分包

```typescript
// vite.config.ts - 优化后
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          // 1. 第三方库分包
          if (id.includes('node_modules')) {
            // Cesium 单独分包
            if (id.includes('cesium')) {
              return 'vendor-cesium'
            }
            // OpenLayers 单独分包
            if (id.includes('ol')) {
              return 'vendor-openlayers'
            }
            // ECharts 单独分包
            if (id.includes('echarts')) {
              return 'vendor-echarts'
            }
            // Element Plus 单独分包
            if (id.includes('element-plus')) {
              return 'vendor-element-plus'
            }
            // Vue 全家桶
            if (id.includes('vue') || id.includes('pinia') || id.includes('vue-router')) {
              return 'vendor-vue'
            }
            // 其他第三方库
            return 'vendor-common'
          }

          // 2. 业务代码分包
          // 页面级分包
          if (id.includes('/pages/home/')) {
            return 'page-home'
          }
          if (id.includes('/pages/operations/')) {
            return 'page-operations'
          }
          if (id.includes('/pages/resources/')) {
            return 'page-resources'
          }
          if (id.includes('/pages/demands/')) {
            return 'page-demands'
          }

          // 3. 组件分包
          // 地图组件
          if (id.includes('/components/map/')) {
            return 'comp-map'
          }
          // 图表组件
          if (id.includes('/components/chart/')) {
            return 'comp-chart'
          }
          // 弹窗组件
          if (id.includes('/components/dialog/')) {
            return 'comp-dialog'
          }
        },
        // 控制分包大小
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
      },
    },
  },
})
```

**进阶: 动态分包策略**

```typescript
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          // 按包大小动态分包
          if (id.includes('node_modules')) {
            const packageName = id.split('node_modules/')[1].split('/')[0]

            // 大型库 (>500KB) 单独分包
            const largePackages = ['cesium', 'ol', 'echarts', 'element-plus']
            if (largePackages.some(pkg => packageName.includes(pkg))) {
              return `vendor-${packageName}`
            }

            // 中型库 (100-500KB) 按类型分包
            const uiPackages = ['element-plus', '@element-plus']
            if (uiPackages.some(pkg => packageName.includes(pkg))) {
              return 'vendor-ui'
            }

            // 小型库 (<100KB) 合并
            return 'vendor-common'
          }
        },
      },
    },
  },
})
```

**效果评估**:
```
优化前:
index-abc123.js (8MB)

优化后:
vendor-vue.js (200KB)           ← Vue 全家桶
vendor-cesium.js (800KB)        ← Cesium
vendor-openlayers.js (450KB)    ← OpenLayers
vendor-echarts.js (400KB)       ← ECharts
vendor-element-plus.js (200KB)  ← Element Plus
vendor-common.js (300KB)        ← 其他库
page-home.js (200KB)            ← 首页
page-operations.js (150KB)      ← 运营页
...
```

### 方案 4: 使用 esbuild 替代 Terser ⭐⭐⭐

**问题**: Terser 压缩速度慢,内存占用高

```typescript
// vite.config.ts - 优化前
export default defineConfig({
  build: {
    minify: 'terser', // 默认使用 Terser
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
    },
  },
})

// 压缩性能:
// 时间: 2-3min
// 内存: 2.5GB (峰值)
```

**优化方案**: 使用 esbuild 压缩

```typescript
// vite.config.ts - 优化后
export default defineConfig({
  build: {
    minify: 'esbuild', // 使用 esbuild
    // esbuild 配置
    esbuildOptions: {
      drop: ['console', 'debugger'],
    },
  },
})

// 压缩性能:
// 时间: 20-30s (↓85%)
// 内存: 800MB (↓68%)
```

**对比: esbuild vs Terser**

| 指标 | Terser | esbuild | 提升 |
|------|--------|---------|------|
| 压缩时间 | 2-3min | 20-30s | 6x |
| 内存占用 | 2.5GB | 800MB | 3x |
| 压缩率 | 100% | 98% | -2% |
| 兼容性 | 完美 | 良好 | - |

**注意**: esbuild 压缩率略低 (2%),但速度快 6 倍,适合大多数场景

**进阶: 混合压缩策略**

```typescript
export default defineConfig({
  build: {
    minify: 'esbuild', // 默认使用 esbuild
    rollupOptions: {
      output: {
        // 关键文件使用 Terser 深度压缩
        plugins: [
          {
            name: 'selective-terser',
            async generateBundle(options, bundle) {
              for (const [fileName, chunk] of Object.entries(bundle)) {
                // 只对大文件使用 Terser
                if (chunk.type === 'chunk' && chunk.code.length > 500000) {
                  const { minify } = await import('terser')
                  const result = await minify(chunk.code, {
                    compress: { drop_console: true },
                    mangle: true,
                  })
                  chunk.code = result.code
                }
              }
            },
          },
        ],
      },
    },
  },
})
```

**效果评估**:
- 构建时间: 8-10min → 3-4min (↓60%)
- 内存占用: 6GB → 3.5GB (↓42%)
- 产物体积: 增加 2% (可接受)

### 方案 5: 启用构建缓存 ⭐⭐

**问题**: 每次构建都是全量构建,未利用缓存

```typescript
// vite.config.ts - 优化前
export default defineConfig({
  // 未配置缓存
})
```

**优化方案**: 启用多级缓存

```typescript
// vite.config.ts - 优化后
export default defineConfig({
  // 1. 依赖预构建缓存
  cacheDir: 'node_modules/.vite',

  build: {
    // 2. Rollup 缓存
    rollupOptions: {
      cache: true,
    },
  },

  // 3. esbuild 缓存
  esbuild: {
    keepNames: true, // 保留函数名,提高缓存命中率
  },
})
```

**进阶: 持久化缓存**

```typescript
// vite.config.ts
import { defineConfig } from 'vite'
import { createHash } from 'crypto'
import fs from 'fs'

export default defineConfig({
  plugins: [
    {
      name: 'persistent-cache',
      buildStart() {
        // 生成缓存 key
        const packageJson = fs.readFileSync('package.json', 'utf-8')
        const hash = createHash('md5').update(packageJson).digest('hex')

        // 检查缓存
        const cacheFile = `node_modules/.vite/build-cache-${hash}.json`
        if (fs.existsSync(cacheFile)) {
          console.log('使用构建缓存')
        }
      },
    },
  ],
})
```

**效果评估**:
- 首次构建: 无变化
- 二次构建: 8-10min → 2-3min (↓70%)
- 缓存命中率: 80%+

### 方案 6: 优化资源处理 ⭐⭐

**问题**: 图片、字体等资源未优化

```typescript
// vite.config.ts - 优化前
export default defineConfig({
  build: {
    assetsInlineLimit: 4096, // 默认 4KB
  },
})
```

**优化方案**: 优化资源处理策略

```typescript
// vite.config.ts - 优化后
export default defineConfig({
  build: {
    // 1. 提高内联阈值
    assetsInlineLimit: 8192, // 8KB 以下内联为 base64

    // 2. 资源分类输出
    rollupOptions: {
      output: {
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name.split('.')
          const ext = info[info.length - 1]

          // 按类型分目录
          if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(ext)) {
            return `assets/images/[name]-[hash][extname]`
          }
          if (/woff2?|eot|ttf|otf/i.test(ext)) {
            return `assets/fonts/[name]-[hash][extname]`
          }
          return `assets/[name]-[hash][extname]`
        },
      },
    },

    // 3. 关闭 CSS 代码分割 (小项目)
    cssCodeSplit: false,
  },
})
```

**进阶: 图片压缩**

```typescript
// vite.config.ts
import viteImagemin from 'vite-plugin-imagemin'

export default defineConfig({
  plugins: [
    vue(),
    viteImagemin({
      gifsicle: { optimizationLevel: 3 },
      optipng: { optimizationLevel: 7 },
      mozjpeg: { quality: 80 },
      pngquant: { quality: [0.8, 0.9], speed: 4 },
      svgo: {
        plugins: [
          { name: 'removeViewBox', active: false },
          { name: 'removeEmptyAttrs', active: true },
        ],
      },
    }),
  ],
})
```

**效果评估**:
- 图片体积: ↓30-50%
- 字体加载: 优化目录结构
- CSS 体积: 合并后 ↓20%

### 方案 7: 并行构建优化 ⭐⭐

**问题**: 单线程构建,未充分利用多核 CPU

```typescript
// vite.config.ts - 优化前
export default defineConfig({
  // 默认配置
})
```

**优化方案**: 启用并行处理

```typescript
// vite.config.ts - 优化后
import os from 'os'

export default defineConfig({
  build: {
    // 1. Rollup 并行处理
    rollupOptions: {
      maxParallelFileOps: os.cpus().length,
    },

    // 2. esbuild 并行压缩
    minify: 'esbuild',

    // 3. 关闭 sourcemap (生产环境)
    sourcemap: false,
  },

  // 4. esbuild 并行转换
  esbuild: {
    target: 'es2015',
    // 自动使用多核
  },
})
```

**效果评估**:
- 构建时间: ↓20-30% (取决于 CPU 核心数)
- CPU 利用率: 30% → 80%

## 优化效果对比

### 低空政务平台优化前后

| 指标 | 优化前 | 优化后 | 提升 |
|------|--------|--------|------|
| 构建时间 | 8-10min | <3min | ↓70% |
| 内存占用 | 6GB | <4GB | ↓33% |
| 产物体积 | 93MB | 65MB | ↓30% |
| 产物体积 (Gzip) | 28MB | 18MB | ↓36% |
| 首屏 JS | 8MB | 1.5MB | ↓81% |
| 分包数量 | 3 个 | 15+ 个 | +400% |

### 构建时间分解

```
优化前:
依赖预构建    2-3min  ████████████
模块转换      3-4min  ████████████████
代码压缩      2-3min  ████████████
资源输出      30s     ██
-------------------------------------------
总计: 8-10min

优化后:
依赖预构建    30s     ██
模块转换      1-1.5min ████
代码压缩      30s     ██
资源输出      20s     █
-------------------------------------------
总计: <3min
```

### 内存占用分解

```
优化前:
依赖预构建    1.5GB   ██████
模块转换      2GB     ████████
Terser 压缩   2.5GB   ██████████  ← 峰值
-------------------------------------------
峰值: 6GB

优化后:
依赖预构建    1GB     ████
模块转换      1.5GB   ██████
esbuild 压缩  800MB   ███         ← 峰值
-------------------------------------------
峰值: <4GB
```

## 实施计划

### 第一阶段 (1天) - 快速优化

**任务**:
1. ✅ 移除 Legacy 插件
2. ✅ 切换到 esbuild 压缩
3. ✅ 关闭生产环境 sourcemap

**预期效果**: 构建时间 ↓40%, 内存 ↓25%

### 第二阶段 (2天) - 依赖优化

**任务**:
1. ✅ 配置 optimizeDeps.include
2. ✅ 优化依赖预构建缓存
3. ✅ 配置 manualChunks 分包

**预期效果**: 构建时间 ↓60%, 产物优化

### 第三阶段 (1天) - 缓存优化

**任务**:
1. ✅ 启用构建缓存
2. ✅ 优化缓存策略
3. ✅ 配置持久化缓存

**预期效果**: 二次构建 ↓70%

### 第四阶段 (可选) - 进阶优化

**任务**:
1. ✅ 图片压缩
2. ✅ 并行构建
3. ✅ 混合压缩策略

**预期效果**: 进一步优化 10-20%

## 测量与验证

### 构建分析

```bash
# 1. 生成构建报告
npm run build -- --mode analyze

# 2. 查看分包情况
ls -lh dist/assets/

# 3. 使用 rollup-plugin-visualizer
npm install -D rollup-plugin-visualizer
```

```typescript
// vite.config.ts
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
```

### 性能测试

```bash
# 1. 测量构建时间
time npm run build

# 2. 测量内存占用
/usr/bin/time -l npm run build  # macOS
/usr/bin/time -v npm run build  # Linux

# 3. 分析产物大小
du -sh dist/
du -sh dist/assets/*.js
```

### 关键指标

- **构建时间**: 目标 <3min
- **内存占用**: 目标 <4GB
- **产物体积**: 目标 <70MB
- **首屏 JS**: 目标 <2MB
- **分包数量**: 目标 10-20 个

## 注意事项

### 1. esbuild vs Terser 选择

```typescript
// 场景 1: 大多数项目 - 使用 esbuild
export default defineConfig({
  build: {
    minify: 'esbuild', // 快 6 倍,压缩率 -2%
  },
})

// 场景 2: 对体积极度敏感 - 使用 Terser
export default defineConfig({
  build: {
    minify: 'terser', // 慢但压缩率最高
  },
})

// 场景 3: 混合策略 - 关键文件用 Terser
// 见方案 4 的混合压缩策略
```

### 2. manualChunks 的粒度

```typescript
// ❌ 不好: 分包过细
manualChunks(id) {
  // 每个组件都单独分包
  if (id.includes('/components/')) {
    return `comp-${id.split('/components/')[1].split('/')[0]}`
  }
}
// 问题: 产生 100+ 个小文件,HTTP 请求过多

// ✅ 好: 合理分包
manualChunks(id) {
  // 按功能模块分包
  if (id.includes('/components/map/')) {
    return 'comp-map' // 所有地图组件合并
  }
}
// 优势: 10-20 个合理大小的文件
```

### 3. 缓存失效问题

```typescript
// 确保缓存正确失效
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        // 使用 hash 确保缓存失效
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
      },
    },
  },
})
```

### 4. 内存不足处理

```bash
# 增加 Node.js 内存限制
NODE_OPTIONS="--max-old-space-size=8192" npm run build

# 或在 package.json 中配置
{
  "scripts": {
    "build": "NODE_OPTIONS='--max-old-space-size=8192' vite build"
  }
}
```

### 5. CI/CD 环境优化

```yaml
# .github/workflows/build.yml
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      # 缓存依赖
      - uses: actions/cache@v3
        with:
          path: |
            node_modules
            node_modules/.vite
          key: ${{ runner.os }}-build-${{ hashFiles('package-lock.json') }}

      # 增加内存
      - name: Build
        run: NODE_OPTIONS="--max-old-space-size=8192" npm run build
```

## 相关章节

- [2.2 代码分割与懒加载](../2-loading/2-2-code-splitting.md) - 路由和组件分割
- [4.1 Vue 3 编译优化](../4-framework/4-1-vue-compile.md) - Vue 编译优化
- [8.1 低空政务平台优化](../8-cases/8-1-low-altitude.md) - 完整优化案例

## 总结

Vite 配置优化是构建性能优化的核心,通过:
1. **移除 Legacy**: 减少 40% 构建时间和产物体积
2. **优化依赖预构建**: 二次构建提速 80%
3. **manualChunks 分包**: 优化加载性能和缓存策略
4. **esbuild 压缩**: 提速 6 倍,内存降低 68%
5. **构建缓存**: 二次构建提速 70%
6. **资源优化**: 图片、字体、CSS 优化
7. **并行构建**: 充分利用多核 CPU

对于低空政务平台,可以将构建时间从 8-10min 降低到 <3min (↓70%),内存从 6GB 降低到 <4GB (↓33%),产物从 93MB 降低到 65MB (↓30%),显著提升开发和部署效率。
