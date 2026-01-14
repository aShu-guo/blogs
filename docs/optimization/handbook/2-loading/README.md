# 2. 加载优化

> 优化资源加载策略，提升首屏性能

## 本章概述

加载优化是性能优化的第一战场。对于低空政务平台这样的大型应用（93MB 构建产物、647个组件），合理的加载策略能够显著改善用户体验。本章将深入探讨资源加载的各个环节，从代码拆分到预加载策略，帮助你构建高效的加载体系。

## 章节列表

### [2.1 代码拆分策略](./2-1-code-splitting.md) ⭐⭐⭐

**核心内容**：
- 路由级别拆分
- 组件级别拆分
- 第三方库拆分
- 动态导入（Dynamic Import）

**一体化项目场景**：
- 93MB 构建产物的拆分方案
- Cesium/OpenLayers 地图库的按需加载
- ECharts 图表库的模块化加载
- 视频播放器的延迟加载

**学习目标**：
- 掌握 Webpack/Vite 的代码拆分配置
- 学会制定合理的拆分粒度
- 理解 chunk 的生成和加载机制

---

### [2.2 资源预加载](./2-2-preloading.md) ⭐⭐⭐

**核心内容**：
- Preload vs Prefetch vs Preconnect
- 关键资源优先加载
- 预测性预加载
- Service Worker 缓存策略

**一体化项目场景**：
- 地图瓦片的预加载
- 视频流的预缓冲
- 字体文件的预加载
- API 数据的预取

**学习目标**：
- 理解各种预加载技术的适用场景
- 掌握 Resource Hints 的使用
- 学会实现智能预加载策略

---

### [2.3 懒加载技术](./2-3-lazy-loading.md) ⭐⭐

**核心内容**：
- 图片懒加载
- 组件懒加载
- 路由懒加载
- Intersection Observer API

**一体化项目场景**：
- 地图标注点的懒加载
- 数据可视化图表的按需渲染
- 长列表的虚拟滚动
- 视频缩略图的懒加载

**学习目标**：
- 掌握各种懒加载实现方式
- 学会使用 Intersection Observer
- 理解懒加载的性能收益

---

### [2.4 缓存策略](./2-4-caching.md) ⭐⭐⭐

**核心内容**：
- HTTP 缓存（强缓存、协商缓存）
- Service Worker 缓存
- LocalStorage/IndexedDB 缓存
- CDN 缓存策略

**一体化项目场景**：
- 静态资源的长期缓存
- 地图瓦片的本地缓存
- API 数据的离线缓存
- 用户配置的持久化

**学习目标**：
- 理解多层缓存体系
- 掌握缓存更新策略
- 学会实现离线可用的应用

---

### [2.5 网络优化](./2-5-network.md) ⭐⭐

**核心内容**：
- HTTP/2 多路复用
- 域名分片与合并
- 请求合并与批处理
- CDN 加速

**一体化项目场景**：
- 地图瓦片的并发请求优化
- API 请求的批量处理
- 静态资源的 CDN 部署
- WebSocket 长连接优化

**学习目标**：
- 理解 HTTP/2 的优势
- 掌握请求优化技巧
- 学会配置 CDN 加速

---

### [2.6 首屏优化](./2-6-first-screen.md) ⭐⭐⭐

**核心内容**：
- 关键渲染路径优化
- 内联关键 CSS
- SSR/SSG 方案
- 骨架屏设计

**一体化项目场景**：
- 首屏地图的快速渲染
- 关键数据的优先加载
- 骨架屏的设计实现
- 白屏时间的优化

**学习目标**：
- 理解首屏优化的关键点
- 掌握 SSR 的实现方式
- 学会设计优雅的加载体验

---

## 学习路径

### 新手路径
1. 先学习 [2.1 代码拆分策略](./2-1-code-splitting.md)，减少初始加载体积
2. 再学习 [2.3 懒加载技术](./2-3-lazy-loading.md)，延迟非关键资源
3. 最后学习 [2.6 首屏优化](./2-6-first-screen.md)，提升用户体验

### 进阶路径
1. 深入学习 [2.4 缓存策略](./2-4-caching.md)，构建多层缓存体系
2. 结合 [2.2 资源预加载](./2-2-preloading.md)，实现智能加载
3. 优化 [2.5 网络优化](./2-5-network.md)，提升传输效率

## 实战练习

### 练习 1：代码拆分实践
分析低空政务平台的构建产物：
```bash
# 使用 webpack-bundle-analyzer 分析
npm install -D webpack-bundle-analyzer

# 生成分析报告
npm run build -- --report
```

目标：
- 识别体积最大的模块
- 制定拆分方案
- 将首屏加载体积降低 50%

### 练习 2：实现智能预加载
为地图应用实现预加载策略：
```javascript
// 预加载下一级地图瓦片
function preloadNextTiles(currentZoom, currentCenter) {
  const nextZoom = currentZoom + 1;
  const tiles = calculateNearbyTiles(currentCenter, nextZoom);

  tiles.forEach(tile => {
    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = tile.url;
    document.head.appendChild(link);
  });
}
```

### 练习 3：缓存策略实现
实现 Service Worker 缓存：
```javascript
// sw.js
const CACHE_NAME = 'low-altitude-v1';
const STATIC_ASSETS = ['/index.html', '/app.js', '/app.css'];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(STATIC_ASSETS))
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => response || fetch(event.request))
  );
});
```

## 关键概念

### 加载性能指标

| 指标 | 含义 | 目标值 | 优化方向 |
|------|------|--------|----------|
| FCP | 首次内容绘制 | < 1.8s | 内联关键 CSS |
| LCP | 最大内容绘制 | < 2.5s | 优化关键资源 |
| TTI | 可交互时间 | < 3.8s | 减少 JS 执行 |
| FID | 首次输入延迟 | < 100ms | 拆分长任务 |

### 资源加载优先级

```
Critical (关键资源)
  ↓
High (重要资源)
  ↓
Medium (次要资源)
  ↓
Low (可延迟资源)
  ↓
Idle (空闲加载)
```

### 加载策略决策树

```
资源是否首屏必需？
├─ 是 → 内联或预加载
└─ 否 → 是否用户可能访问？
    ├─ 是 → 预取（Prefetch）
    └─ 否 → 懒加载（Lazy Load）
```

### 低空政务平台加载优化目标

| 优化项 | 当前状态 | 目标状态 | 优化方案 |
|--------|----------|----------|----------|
| 首屏 JS | 93MB | < 500KB | 代码拆分 + 懒加载 |
| 首屏时间 | 待测量 | < 2.5s | 关键路径优化 |
| 地图加载 | 待测量 | < 1s | 预加载 + 缓存 |
| 缓存命中率 | 0% | > 80% | Service Worker |

## 下一步

完成加载优化学习后，建议继续学习：
- [3. 渲染优化](../3-rendering/README.md) - 优化运行时性能
- [6. 构建优化](../6-build/README.md) - 优化构建产物
- [8. 实战案例](../8-cases/README.md) - 完整优化案例

---

[返回手册首页](../README.md)
