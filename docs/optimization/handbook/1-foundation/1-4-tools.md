# 1.4 性能测量工具与流程

## Lab 工具
- **Lighthouse / LHCI**：CI 阈值守护（LCP/INP/CLS/Bundle）
- **WebPageTest**：多网络/机型对比，长尾分析
- **Chrome DevTools**：Performance（长任务/布局/脚本）、Memory（泄漏）、Coverage（未用代码）
- **Bundle 分析**：vite-plugin-visualizer / source-map-explorer

## RUM 工具
- **web-vitals** 库：LCP/INP/CLS 上报
- 自研埋点：路由切换耗时、地图首屏渲染、视频首帧、接口耗时、错误率
- Sentry/阿里ARMS 等：前端错误 + 性能 Trace

## 诊断 SOP（15 分钟内定位）
1. Lighthouse / WPT 跑分，锁定劣化指标
2. Network 瀑布定位阻塞资源（首屏脚本/样式、慢接口）
3. Performance Trace：长任务、Layout/Style 热点、重复渲染
4. Bundle 分析：识别大依赖、重复依赖、可懒加载模块
5. 给出 2-3 条可执行优化 + 预期收益，提交 PR 前后对比

## CI 集成示例
```bash
lhci autorun \
  --collect.url=http://localhost:4173 \
  --assert.preset=lighthouse:recommended \
  --assert.assertions.'largest-contentful-paint'='<=2500' \
  --assert.assertions.'cumulative-layout-shift'='<=0.1'
```

## 快速检查清单
- [ ] 有基线报告与对比记录（p75/p95）
- [ ] 长任务 < 200ms；INP < 200ms
- [ ] Bundle 可视化报告无异常大依赖
- [ ] 关键业务指标已埋点并可观测
