# 6.4 构建分析

## 工具
- **vite-plugin-visualizer**：生成交互式依赖图
- **source-map-explorer**：查看单个 bundle 组成
- **rollup output logs**：监控 chunk 数量/大小

## 流程
1. 打开可视化，标记前 10 大 chunk/依赖
2. 检查重复依赖、CJS 阻塞、未懒加载的重组件
3. 制定拆分/替换方案并复测体积

## 场景
- 大型地图/视频/图表依赖：拆分到独立 chunk，路由级懒加载
- UI 库：按需引入或定制构建

## 验证
- 产物大小变化（93MB → 目标 < 50MB）
- chunk 数量合理，无极端碎片化
