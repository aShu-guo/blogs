# 8.2 地图应用优化案例（假想一体化场景）

## 背景
- Vue 3 + Vite + Cesium/Mapbox
- 问题：首屏地图加载慢、瓦片抖动、交互卡顿

## 痛点
- 首屏 JS 过大（地图 SDK +插件）
- 瓦片并发与缓存命中低
- 长列表（图层/标记）渲染卡顿

## 优化动作
- 路由分包：地图页独立 chunk，SDK 懒加载
- 预连接/预加载：CDN 瓦片域 preconnect，首屏样式 preload
- 缓存：瓦片 CDN + Cache-Control；本地存储常用配置
- 虚拟列表：图层列表、告警列表虚拟滚动
- Worker：地理计算/路径规划移到 Worker
- 动画：工具栏/浮层使用 transform/opacity，减少重排

## 指标对比（示例）
- LCP：3.8s → 2.2s
- 首屏 JS：1.6MB → 620KB
- INP：240ms → 150ms

## 验证
- Lighthouse/WPT：LCP、INP、CLS
- Performance：长任务减少，渲染帧稳定
- RUM：地图首屏指标、自定义 `map_first_render`
