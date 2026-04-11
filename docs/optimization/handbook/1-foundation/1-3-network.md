# 1.3 网络请求流程与优化

## 请求生命周期关键点
- DNS → TCP/TLS → 请求/响应 → 缓存决策 → 解析/执行
- HTTP/2/3：多路复用、头压缩、优先级；确认服务端开启

## 低空一体化场景
- 地图瓦片/倾斜摄影：高并发小文件，需 CDN + HTTP/2，多域名谨慎
- 视频流：HLS/FLV，首包与缓冲控制；边缘节点就近分发
- API：大量查询与聚合；优先批量/分页 + 条件下推

## 优化策略
- **连接**：预连接 `dns-prefetch`/`preconnect` 对主域、CDN 域
- **缓存**：静态资源 `Cache-Control: max-age=31536000, immutable`，主包版本号；API 使用 ETag/Last-Modified
- **压缩**：Brotli/Gzip；图片/字体自带压缩格式
- **优先级**：首屏关键资源 preload，非阻塞脚本 defer/async，路由级预取 prefetch
- **请求数控制**：合并接口、雪碧图/图标字体（或 icon sprite），按需加载组件

## 验证
- Network 瀑布：阻塞链路、队头阻塞、重传
- WebPageTest：首包/握手时间、协议、缓存命中率
