# 1.1 性能指标体系（基于低空一体化平台）

## 目标 & 预算
- LCP < 2.5s（首屏地图/视频首帧）
- INP < 200ms（全局交互）
- CLS < 0.1（地图/表格/图表无抖动）
- 首屏 JS < 500KB，构建产物 < 50MB

## 核心指标
- **LCP**：最大内容绘制（地图容器、首屏大图、首屏视频首帧）
- **INP**：交互响应（图层切换、告警弹窗、表单提交）
- **CLS**：布局稳定（骨架屏、图片/字体占位、广告/浮层避免推挤）
- **TTFB / FCP / TTI / TBT**：协助定位服务器/渲染/长任务问题

## 业务自定义指标
- `map_first_render`：地图瓦片/倾斜摄影首屏渲染时间
- `video_play_ready`：视频流首帧可播放时间
- `chart_first_paint`：关键图表首次绘制时间
- `route_ready`：路由切换完成时间

## 采集与监控
- **RUM**：Web Vitals（web-vitals JS）、自定义埋点上报（fetch/beacon）
- **Lab**：Lighthouse CI、WebPageTest（3G/4G/宽带多档位）、Chrome DevTools
- **CI 门槛**：LCP < 3s、INP < 200ms、包体积 < 50MB 不通过即阻断

## 回归判定
1. 基线对比：相同网络/机型/页面 + p75/p95 指标
2. 显著性：核心指标劣化 > 10% 视为回归
3. 归因：结合瀑布图 + Performance Trace + bundle diff

## 快速检查清单
- [ ] 首页 LCP/INP/CLS 达标
- [ ] 首屏 JS < 500KB（含 polyfill）
- [ ] 长任务 < 50ms；没有 > 200ms 的单任务
- [ ] 关键资源均有缓存头与压缩
- [ ] 地图/视频/图表有占位，避免 CLS
- [ ] 路由切换性能埋点已上报
