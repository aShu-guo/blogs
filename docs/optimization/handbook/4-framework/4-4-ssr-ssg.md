# 4.4 SSR / SSG 策略

## 目标
- 提升首屏感知速度、SEO，降低首屏 JS 负荷。

## 策略
- **SSR Streaming**：首屏 HTML 流式输出，优先首屏内容
- **延迟/分片 Hydration**：按路由/区域分块；非交互区域延后
- **数据预取**：服务端注水 critical 数据，客户端增量获取
- **缓存**：SSR 结果按路由/参数缓存（短时），结合 ETag/Redis

## 一体化场景
- 地图首页：SSR 输出骨架 + 基础布局，地图容器占位；Hydration 后加载地图 SDK
- 数据大屏：SSG 预渲染静态部分，实时数据客户端拉取
- 新闻/公告：SSG 生成，CDN 缓存

## 验证
- LCP/TTFB 改善；View Source 是否包含关键内容
- Hydration 时间（DevTools Performance）
- 服务端渲染耗时与缓存命中率
