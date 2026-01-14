# Vite 构建性能优化实践

## 背景

在 Vue 3 + Vite 6 项目中，原始构建时间约为 2 分 33 秒，最大 vendor chunk 达到 7.6MB。通过一系列优化措施，将构建时间降低至约
50 秒（提升 68%），最大 vendor chunk 降至 2.4MB。

## 优化措施

### 1. 插件环境差异化

根据不同构建环境（dev/test/prod）启用不同插件，避免不必要的开销。

#### Legacy 插件仅在生产环境启用

```typescript
// config/plugins/index.ts
ConfigLegacyPlugin(options.isBuild && options.buildEnv === 'prod')
```

原因：Legacy 插件会生成额外的 polyfill 代码，在开发和测试环境中不需要。

#### Visualizer 的 brotli 计算仅在生产环境启用

```typescript
// config/plugins/visualizer.ts
export function ConfigVisualizerConfig(buildEnv: 'prod' | 'test' | false) {
  if (!buildEnv) return [];
  return visualizer({
    filename: './node_modules/.cache/visualizer/stats.html',
    open: true,
    gzipSize: true,
    brotliSize: buildEnv === 'prod', // 只在生产环境计算 brotli
  });
}
```

原因：brotli 压缩计算非常耗时，测试环境只需要 gzip 即可。

### 2. manualChunks 细粒度拆分

将大型依赖拆分为独立 chunk，提高缓存命中率和并行加载效率。

```typescript
// vite.config.ts
build: {
  rollupOptions: {
    output: {
      manualChunks(id) {
        if (id.includes('node_modules')) {
          // Vue 生态
          if (id.includes('vue') || id.includes('@vue') || id.includes('pinia') || id.includes('vue-router')) {
            return 'vendor-vue';
          }
          // Element Plus
          if (id.includes('element-plus') || id.includes('@element-plus')) {
            return 'vendor-element';
          }
          // Cesium
          if (id.includes('cesium') || id.includes('@cesium')) {
            return 'vendor-cesium';
          }
          // ECharts
          if (id.includes('echarts') || id.includes('zrender')) {
            return 'vendor-echarts';
          }
          // 其他
          return 'vendor-other';
        }
      }
    }
  }
}
```

### 3. LightningCSS 优化

使用 LightningCSS 替代默认的 CSS 压缩器。

```typescript
// vite.config.ts
build: {
  cssMinify: 'lightningcss',
}
```

**注意**：不要同时配置 `css.transformer: 'lightningcss'`，会与 UnoCSS 的 `@apply` 指令冲突。

### 4. 并行文件操作数

增加 Rollup 的并行文件操作数。

```typescript
// vite.config.ts
build: {
  rollupOptions: {
    maxParallelFileOps: 10, // 默认为 5
  }
}
```

### 5. 大型依赖动态导入

对于不常用的大型依赖，使用动态导入延迟加载。

```typescript
// 示例：pdfmake
const pdfMake = await import('pdfmake/build/pdfmake');
const pdfFonts = await import('pdfmake/build/vfs_fonts');

// 示例：html2canvas
const html2canvas = (await import('html2canvas')).default;

// 示例：fabric
const { fabric } = await import('fabric');
```

## 遇到的问题与解决方案

### 问题 1：d3 循环依赖错误

**错误信息**：

```
Uncaught ReferenceError: Cannot access 'Xr' before initialization
```

**原因**：d3 内部模块存在循环依赖，单独拆分会导致初始化顺序问题。

**解决方案**：不要将 d3 单独拆分，让其合并到 `vendor-other` 中。

```typescript
// 错误做法
if (id.includes('d3')) {
  return 'vendor-d3';
}

// 正确做法：不单独拆分 d3
```

### 问题 2：video.js 初始化错误

**错误信息**：

```
Uncaught TypeError: Cannot set properties of undefined (setting 'exports')
```

**原因**：video.js 及其插件存在复杂的模块依赖关系，单独拆分会破坏初始化顺序。

**解决方案**：不要将 video.js 单独拆分，让其合并到 `vendor-other` 中。

```typescript
// 错误做法
if (id.includes('video.js') || id.includes('videojs')) {
  return 'vendor-video';
}

// 正确做法：不单独拆分 video.js
```

### 问题 3：LightningCSS 与 UnoCSS @apply 冲突

**现象**：使用 `css.transformer: 'lightningcss'` 后，UnoCSS 的 `@apply` 指令生成的样式（如 `skew-x-150`）不生效。

**原因**：LightningCSS transformer 会在 UnoCSS 处理之前介入，导致 `@apply` 指令无法正确解析。

**解决方案**：只使用 `build.cssMinify: 'lightningcss'`，不使用 `css.transformer`。

```typescript
// 错误做法
css: {
  transformer: 'lightningcss',
},
build: {
  cssMinify: 'lightningcss',
}

// 正确做法
build: {
  cssMinify: 'lightningcss',
}
```

## 验证方法

### 1. 构建时间验证

```bash
# 测试环境构建
npm run build:test

# 生产环境构建
npm run build:prod
```

对比优化前后的构建时间。

### 2. 产物体积验证

使用 rollup-plugin-visualizer 生成的报告查看各 chunk 大小：

```bash
# 构建后自动打开 stats.html
open ./node_modules/.cache/visualizer/stats.html
```

### 3. 运行时验证

```bash
# 预览构建产物
npm run preview
```

检查控制台是否有运行时错误，页面功能是否正常。

### 4. 样式验证

检查使用了 UnoCSS `@apply` 指令的组件样式是否正常显示。

## 最终配置参考

```typescript
// vite.config.ts
export default defineConfig({
  build: {
    target: 'es2022',
    cssMinify: 'lightningcss',
    chunkSizeWarningLimit: 1500,
    rollupOptions: {
      maxParallelFileOps: 10,
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('vue') || id.includes('@vue') || id.includes('pinia') || id.includes('vue-router')) {
              return 'vendor-vue';
            }
            if (id.includes('element-plus') || id.includes('@element-plus')) {
              return 'vendor-element';
            }
            if (id.includes('cesium') || id.includes('@cesium')) {
              return 'vendor-cesium';
            }
            if (id.includes('echarts') || id.includes('zrender')) {
              return 'vendor-echarts';
            }
            // 注意：d3、video.js 不单独拆分
            return 'vendor-other';
          }
        }
      }
    }
  }
});
```

## 优化效果

| 指标       | 优化前    | 优化后   | 提升  |
|----------|--------|-------|-----|
| 构建时间     | 2m 33s | ~50s  | 68% |
| 最大 chunk | 7.6MB  | 2.4MB | 68% |

## 总结

1. **环境差异化**：根据构建环境启用不同插件，避免不必要的开销
2. **合理拆分**：并非所有依赖都适合单独拆分，需要考虑循环依赖问题
3. **工具兼容性**：使用新工具（如 LightningCSS）时需要验证与现有工具链的兼容性
4. **渐进式优化**：每次优化后都要验证功能正常，避免引入新问题
