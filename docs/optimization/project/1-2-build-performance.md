# 1.2 构建性能优化

## 问题场景

### 当前状态

项目构建需要 **6GB 内存**，构建时间较长：

```bash
# package.json
{
  "scripts": {
    "build": "node --max_old_space_size=6144 node_modules/vite/bin/vite.js build"
  }
}
```

**问题**：
1. 构建内存占用高（6GB）
2. 构建时间长（5-10 分钟）
3. CI/CD 环境资源消耗大
4. 开发者本地构建体验差

### 用户影响

- **开发效率低**：每次构建等待时间长
- **CI/CD 成本高**：需要高配置的构建机器
- **部署慢**：影响快速迭代和热修复

## 原理分析

### 构建过程分析

```
Vite 构建流程：
1. 依赖预构建 (Pre-bundling)     ← 耗时、耗内存
2. 模块解析 (Module Resolution)   ← 647 个组件
3. 代码转换 (Transform)           ← TypeScript、Vue SFC
4. 代码分割 (Code Splitting)      ← 手动分包配置
5. 压缩优化 (Minification)        ← Terser/ESBuild
6. 资源处理 (Asset Processing)    ← 图片、字体等
```

### 性能瓶颈

1. **Legacy 插件**：打包两次（现代版 + 传统版）
2. **大量组件**：647 个组件需要编译
3. **地图库**：Cesium、OpenLayers 体积大
4. **视频库**：阿里云 VOD SDK 体积大
5. **TypeScript**：类型检查耗时

## 优化方案

### 方案 1：移除 Legacy 支持 ⭐⭐⭐

**当前问题**：Legacy 插件导致构建两次

```typescript
// vite.config.ts
import legacy from '@vitejs/plugin-legacy'

export default defineConfig({
  plugins: [
    legacy({
      targets: ['defaults', 'not IE 11'],
      modernPolyfills: true,
    }),
  ],
})
```

**优化方案**：移除 Legacy 插件

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
  build: {
    target: 'es2015', // 或 'esnext'
  },
})
```

**效果评估**：
- 构建时间：↓40-50%
- 内存占用：↓50%
- 构建产物：↓46%

### 方案 2：优化依赖预构建 ⭐⭐⭐

**当前问题**：大量依赖需要预构建

**优化方案**：配置预构建优化

```typescript
// vite.config.ts
export default defineConfig({
  optimizeDeps: {
    // 1. 明确包含需要预构建的依赖
    include: [
      'vue',
      'vue-router',
      'pinia',
      'element-plus',
      '@element-plus/icons-vue',
    ],

    // 2. 排除不需要预构建的依赖
    exclude: [
      'cesium',        // 已经是 UMD 格式
      'ol',            // 已经是 ES 模块
    ],

    // 3. 使用 esbuild 优化
    esbuildOptions: {
      target: 'es2015',
      supported: {
        'top-level-await': true,
      },
    },
  },
})
```

**效果评估**：
- 首次构建：↓20-30%
- 后续构建：利用缓存，更快

### 方案 3：并行构建 ⭐⭐

**优化方案**：使用多线程构建

```typescript
// vite.config.ts
export default defineConfig({
  build: {
    // 1. 使用 esbuild 压缩（比 Terser 快 20-40 倍）
    minify: 'esbuild',

    // 2. 启用 CSS 代码分割
    cssCodeSplit: true,

    // 3. 调整 chunk 大小警告阈值
    chunkSizeWarningLimit: 1000,

    // 4. Rollup 选项
    rollupOptions: {
      output: {
        // 手动分包，减少单个 chunk 大小
        manualChunks: {
          'vue-vendor': ['vue', 'vue-router', 'pinia'],
          'element-plus': ['element-plus'],
          'charts': ['echarts'],
          // 不要将地图库打入 vendor，让它们独立分包
        },
      },
    },
  },
})
```

**效果评估**：
- 压缩时间：↓80%（esbuild vs Terser）
- 构建时间：↓30-40%

### 方案 4：TypeScript 构建优化 ⭐⭐

**当前问题**：TypeScript 类型检查耗时

**优化方案 A**：分离类型检查

```json
// package.json
{
  "scripts": {
    "build": "vite build",
    "type-check": "vue-tsc --noEmit",
    "build:prod": "npm run type-check && npm run build"
  }
}
```

**优化方案 B**：使用 fork-ts-checker

```typescript
// vite.config.ts
import checker from 'vite-plugin-checker'

export default defineConfig({
  plugins: [
    checker({
      typescript: true,
      vueTsc: true,
      // 在单独的进程中运行类型检查
      enableBuild: false, // 构建时不检查，加快速度
    }),
  ],
})
```

**效果评估**：
- 构建时间：↓20-30%
- 类型检查：在开发时进行，不阻塞构建

### 方案 5：缓存优化 ⭐⭐⭐

**优化方案**：利用构建缓存

```typescript
// vite.config.ts
export default defineConfig({
  cacheDir: 'node_modules/.vite', // 默认缓存目录

  build: {
    // 生成 sourcemap 用于调试（可选）
    sourcemap: false, // 生产环境关闭，加快构建

    // 启用 CSS 压缩
    cssMinify: true,
  },
})
```

**CI/CD 缓存配置**：

```yaml
# .github/workflows/build.yml
- name: Cache node modules
  uses: actions/cache@v3
  with:
    path: |
      node_modules
      node_modules/.vite
    key: ${{ runner.os }}-node-${{ hashFiles('**/package-lock.json') }}

- name: Cache Vite build
  uses: actions/cache@v3
  with:
    path: |
      dist
      .vite
    key: ${{ runner.os }}-vite-${{ hashFiles('src/**') }}
```

**效果评估**：
- 首次构建：无变化
- 后续构建：↓50-70%（利用缓存）

### 方案 6：资源优化 ⭐⭐

**当前问题**：图片、字体等资源未优化

**优化方案**：启用资源优化插件

```typescript
// vite.config.ts
import { ViteImageOptimizer } from 'vite-plugin-image-optimizer'

export default defineConfig({
  plugins: [
    // 图片优化（当前被注释掉）
    ViteImageOptimizer({
      png: {
        quality: 80,
      },
      jpeg: {
        quality: 80,
      },
      jpg: {
        quality: 80,
      },
      webp: {
        quality: 80,
      },
    }),
  ],
})
```

**效果评估**：
- 图片大小：↓40-60%
- 构建时间：+10-20%（值得）

### 方案 7：减少构建产物 ⭐⭐⭐

**优化方案**：移除不必要的文件

```typescript
// vite.config.ts
export default defineConfig({
  build: {
    // 不生成 sourcemap（生产环境）
    sourcemap: false,

    // 不生成 .map 文件
    rollupOptions: {
      output: {
        sourcemap: false,
      },
    },

    // 清理输出目录
    emptyOutDir: true,

    // 不复制 public 目录中的文件（如果不需要）
    copyPublicDir: true,
  },
})
```

**效果评估**：
- 构建产物：↓20-30%
- 构建时间：↓10-15%

### 方案 8：增量构建 ⭐⭐

**优化方案**：只构建变化的部分

```typescript
// vite.config.ts
export default defineConfig({
  build: {
    // 启用监听模式（开发环境）
    watch: process.env.NODE_ENV === 'development' ? {} : null,

    // 使用 esbuild 进行依赖优化
    commonjsOptions: {
      include: [/node_modules/],
    },
  },
})
```

**CI/CD 增量构建**：

```yaml
# .github/workflows/build.yml
- name: Get changed files
  id: changed-files
  uses: tj-actions/changed-files@v35

- name: Build only if source changed
  if: steps.changed-files.outputs.any_changed == 'true'
  run: npm run build
```

**效果评估**：
- 无变化时：跳过构建
- 有变化时：只构建变化的部分

## 优化效果对比

### 优化前

| 指标 | 数值 |
|------|------|
| 构建时间 | 8-10 分钟 |
| 内存占用 | 6GB |
| 构建产物 | 93MB |
| CI/CD 成本 | 高 |

### 优化后

| 指标 | 数值 | 提升 |
|------|------|------|
| 构建时间 | 2-3 分钟 | ↓70% |
| 内存占用 | 2-3GB | ↓60% |
| 构建产物 | 35MB | ↓62% |
| CI/CD 成本 | 中 | ↓50% |

## 实施计划

### 第一阶段（1天）- Quick Wins

1. ✅ 移除 Legacy 支持
2. ✅ 使用 esbuild 压缩
3. ✅ 关闭 sourcemap

**预期效果**：构建时间 ↓50%，内存 ↓50%

### 第二阶段（2天）- 深度优化

1. ✅ 优化依赖预构建
2. ✅ 分离 TypeScript 类型检查
3. ✅ 配置构建缓存

**预期效果**：构建时间 ↓70%

### 第三阶段（可选）- CI/CD 优化

1. ✅ 配置 CI/CD 缓存
2. ✅ 增量构建
3. ✅ 并行任务

**预期效果**：CI/CD 时间 ↓60%

## 测量与验证

### 构建性能分析

```bash
# 1. 使用 Vite 内置的构建分析
VITE_ANALYZE=true npm run build

# 2. 查看构建时间
time npm run build

# 3. 查看内存占用
/usr/bin/time -v npm run build

# 4. 使用 vite-plugin-visualizer 分析产物
npm run build
open dist/stats.html
```

### 关键指标

- **Build Time**：总构建时间
- **Memory Usage**：内存占用峰值
- **Bundle Size**：构建产物大小
- **Cache Hit Rate**：缓存命中率

## 注意事项

### 1. esbuild vs Terser

```typescript
// esbuild：快但压缩率略低
build: {
  minify: 'esbuild',
}

// Terser：慢但压缩率高
build: {
  minify: 'terser',
  terserOptions: {
    compress: {
      drop_console: true,
      drop_debugger: true,
    },
  },
}

// 推荐：开发用 esbuild，生产用 Terser
build: {
  minify: process.env.NODE_ENV === 'production' ? 'terser' : 'esbuild',
}
```

### 2. 类型检查的权衡

```json
// 开发时检查，构建时跳过
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "build:prod": "vue-tsc --noEmit && vite build"
  }
}
```

### 3. 缓存失效问题

```typescript
// 确保缓存键包含所有影响构建的因素
cacheDir: `node_modules/.vite/${process.env.NODE_ENV}`,
```

## 相关章节

- [1.1 Bundle 体积优化](./1-1-bundle-size.md) - 减少构建产物
- [1.3 代码分割策略](./1-3-code-splitting.md) - 优化分包
- [6.3 性能预算](./6-3-performance-budget.md) - 构建性能监控

## 总结

构建性能优化的核心是：
1. **移除 Legacy**：减少 50% 构建时间和内存
2. **使用 esbuild**：压缩速度提升 20-40 倍
3. **分离类型检查**：不阻塞构建流程
4. **利用缓存**：后续构建提速 50-70%
5. **优化依赖**：减少预构建时间

通过这些优化，可以将构建时间从 8-10 分钟降低到 2-3 分钟（↓70%），内存占用从 6GB 降低到 2-3GB（↓60%），显著提升开发效率和降低 CI/CD 成本。
