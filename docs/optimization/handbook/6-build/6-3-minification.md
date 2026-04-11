# 6.3 压缩与混淆

## 设置
- Vite：`build.minify: 'esbuild'`（开发/预发），生产可选 Terser 开启 `compress.drop_console`（按需）
- CSS 压缩：`css.minify`，移除冗余注释
- HTML 压缩：移除注释/空白

## 场景
- 政务环境：注意是否需保留日志，按环境控制 drop_console/drop_debugger
- 大体积地图样式/配置：可做 gzip/brotli 后的体积评估

## 验证
- 产物体积对比，压缩率
- Source map 分离并保护（不随产物发布到公网）
