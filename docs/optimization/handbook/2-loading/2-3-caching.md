# 2.3 缓存策略

## 静态资源
- `Cache-Control: max-age=31536000, immutable` + 构建产物指纹
- HTML 禁缓存：`no-cache, must-revalidate`
- CDN 缓存：命中率监控，按路径/目录配置

## API/数据
- ETag/Last-Modified 支持，304 回源
- 客户端缓存：SWR 模式（Stale-While-Revalidate），热点接口本地缓存 5~15 分钟
- IndexedDB/LocalStorage：大批量静态字典数据（行政区划、图层配置）

## 一体化场景
- 地图瓦片：CDN + 切片缓存，考虑离线包（特殊政务网络）
- 视频封面/截图：CDN + 短期缓存，过期自动刷新
- 配置/字典：构建时内联或首屏后懒加载并缓存

## 验证
- Response Header 检查缓存头
- 命中率监控：CDN/Service Worker
- 首屏接口耗时是否下降
