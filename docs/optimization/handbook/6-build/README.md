# 6. 构建优化

> 优化构建流程，提升开发和生产效率

## 本章概述

构建优化关注从源代码到生产产物的整个构建过程。低空政务平台使用 Vite 作为构建工具，面临 93MB 构建产物、647 个组件的挑战。合理的构建配置能够显著减少构建时间和产物体积。本章将深入探讨 Vite 和现代构建工具的优化策略。

## 章节列表

### [6.1 Vite 配置优化](./6-1-vite-config.md) ⭐⭐⭐

**核心内容**：
- Vite 构建配置
- Rollup 插件优化
- 代码拆分策略
- 构建缓存机制

**一体化项目场景**：
- 93MB 构建产物的优化
- 开发服务器启动速度
- HMR 热更新性能
- 生产构建时间优化

**学习目标**：
- 掌握 Vite 配置技巧
- 理解 Rollup 打包原理
- 学会优化构建性能

---

### [6.2 代码分割策略](./6-2-code-splitting.md) ⭐⭐⭐

**核心内容**：
- 入口点拆分
- 动态导入拆分
- 公共模块提取
- Vendor 拆分策略

**一体化项目场景**：
- Cesium/OpenLayers 库的拆分
- ECharts 模块的按需加载
- Vue 生态库的拆分
- 业务代码的模块化

**学习目标**：
- 掌握代码拆分配置
- 理解 chunk 生成规则
- 学会优化拆分粒度

---

### [6.3 Tree Shaking](./6-3-tree-shaking.md) ⭐⭐

**核心内容**：
- Tree Shaking 原理
- sideEffects 配置
- ES Module 优化
- 无用代码消除

**一体化项目场景**：
- lodash 的按需引入
- UI 组件库的 Tree Shaking
- 工具函数的优化
- 第三方库的优化

**学习目标**：
- 理解 Tree Shaking 原理
- 掌握 sideEffects 配置
- 学会编写 Tree Shaking 友好的代码

---

### [6.4 压缩与混淆](./6-4-minification.md) ⭐⭐

**核心内容**：
- Terser vs esbuild 压缩
- CSS 压缩优化
- HTML 压缩
- Source Map 配置

**一体化项目场景**：
- JS 代码的压缩混淆
- CSS 代码的压缩
- 生产环境的 Source Map
- 构建产物的体积优化

**学习目标**：
- 掌握代码压缩配置
- 理解压缩工具的差异
- 学会平衡压缩率和速度

---

### [6.5 依赖优化](./6-5-dependencies.md) ⭐⭐⭐

**核心内容**：
- 依赖分析工具
- 重复依赖消除
- 依赖版本管理
- Monorepo 优化

**一体化项目场景**：
- 分析 93MB 构建产物
- 识别重复依赖
- 优化依赖版本
- 减少依赖体积

**学习目标**：
- 掌握依赖分析方法
- 学会优化依赖结构
- 理解依赖对性能的影响

---

### [6.6 构建性能优化](./6-6-build-performance.md) ⭐⭐

**核心内容**：
- 并行构建
- 增量构建
- 构建缓存
- 持久化缓存

**一体化项目场景**：
- 开发环境构建速度
- 生产环境构建时间
- CI/CD 构建优化
- 本地构建体验

**学习目标**：
- 掌握构建性能优化技巧
- 理解构建缓存机制
- 学会配置并行构建

---

## 学习路径

### 新手路径
1. 先学习 [6.1 Vite 配置优化](./6-1-vite-config.md)，掌握基础配置
2. 再学习 [6.2 代码分割策略](./6-2-code-splitting.md)，优化产物结构
3. 最后学习 [6.5 依赖优化](./6-5-dependencies.md)，减少依赖体积

### 进阶路径
1. 深入学习 [6.3 Tree Shaking](./6-3-tree-shaking.md)，消除无用代码
2. 结合 [6.4 压缩与混淆](./6-4-minification.md)，优化产物体积
3. 学习 [6.6 构建性能优化](./6-6-build-performance.md)，提升构建速度

## 实战练习

### 练习 1：分析构建产物
使用 rollup-plugin-visualizer 分析：
```javascript
// vite.config.js
import { visualizer } from 'rollup-plugin-visualizer';

export default {
  plugins: [
    visualizer({
      open: true,
      gzipSize: true,
      brotliSize: true,
    })
  ]
}
```

### 练习 2：优化代码拆分
配置 Vite 代码拆分：
```javascript
// vite.config.js
export default {
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vue-vendor': ['vue', 'vue-router', 'pinia'],
          'map-vendor': ['cesium', 'ol'],
          'chart-vendor': ['echarts'],
          'ui-vendor': ['element-plus']
        }
      }
    }
  }
}
```

### 练习 3：配置 Tree Shaking
优化 lodash 引入：
```javascript
// 优化前
import _ from 'lodash';
_.debounce(fn, 300);

// 优化后
import debounce from 'lodash-es/debounce';
debounce(fn, 300);
```

配置 package.json：
```json
{
  "sideEffects": [
    "*.css",
    "*.scss"
  ]
}
```

## 关键概念

### 构建优化清单

| 优化项 | 技术方案 | 预期收益 | 优先级 |
|--------|----------|----------|--------|
| 代码拆分 | manualChunks | 减少 50% 首屏体积 | 高 |
| Tree Shaking | ES Module | 减少 20% 代码体积 | 高 |
| 依赖优化 | 分析 + 替换 | 减少 30% 依赖体积 | 高 |
| 压缩优化 | esbuild | 减少 40% 代码体积 | 中 |
| 构建缓存 | 持久化缓存 | 提升 3x 构建速度 | 中 |

### 代码拆分策略

```
构建产物拆分
├─ 框架代码（vue-vendor）
│   └─ Vue、Vue Router、Pinia
├─ UI 库（ui-vendor）
│   └─ Element Plus
├─ 地图库（map-vendor）
│   └─ Cesium、OpenLayers
├─ 图表库（chart-vendor）
│   └─ ECharts
├─ 工具库（utils-vendor）
│   └─ lodash、dayjs
└─ 业务代码（按路由拆分）
    ├─ home.js
    ├─ map.js
    └─ dashboard.js
```

### 构建优化流程

```
源代码
  ↓
Tree Shaking（消除无用代码）
  ↓
Code Splitting（代码拆分）
  ↓
Minification（压缩混淆）
  ↓
Compression（Gzip/Brotli）
  ↓
构建产物
```

### 低空政务平台构建优化目标

| 优化项 | 当前状态 | 目标状态 | 优化方案 |
|--------|----------|----------|----------|
| 构建产物 | 93MB | < 10MB | 代码拆分 + Tree Shaking |
| 首屏 JS | 待测量 | < 500KB | 按需加载 |
| 构建时间 | 待测量 | < 2min | 并行构建 + 缓存 |
| Vendor 体积 | 待测量 | < 2MB | 依赖优化 |

## 下一步

完成构建优化学习后，建议继续学习：
- [2. 加载优化](../2-loading/README.md) - 优化加载策略
- [7. 监控与分析](../7-monitoring/README.md) - 监控构建效果
- [8. 实战案例](../8-cases/README.md) - 完整优化案例

---

[返回手册首页](../README.md)
