# 8.4 数据可视化大屏优化案例（假想一体化场景）

## 背景
- Vue 3 + Vite + ECharts/Three.js
- 问题：首屏脚本大、图表渲染慢、交互卡顿

## 痛点
- ECharts/3D 库体积大、一次性加载
- 大数据渲染阻塞主线程
- 布局抖动（CLS）和动画卡顿

## 优化动作
- 路由分包：大屏单独 chunk；图表组件懒加载
- 资源优化：图片/字体压缩，背景图 AVIF + 占位
- 数据分批：大数据按片段 setOption，开启 `useDirtyRect`、`lazyUpdate`
- Worker：数据预处理/聚合放 Worker
- 动画：减少高频动画，使用 GPU 属性；降低帧率或暂停后台动画
- 缓存：静态配置/字典预加载并缓存；接口结果 SWR

## 指标对比（示例）
- 首屏 JS：1.2MB → 480KB
- 图表首次渲染：1.6s → 800ms
- INP：190ms → 120ms

## 验证
- Lighthouse/WPT：LCP、INP、CLS
- Performance：长任务、Paint/Composite
- RUM：`chart_first_paint` 自定义指标
