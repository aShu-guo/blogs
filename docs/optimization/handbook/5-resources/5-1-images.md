# 5.1 图片优化

## 策略
- WebP/AVIF 优先，必要时 JPEG/PNG 回退
- 响应式图片：`srcset` + `sizes`，按 DPR/视口加载
- 懒加载：`loading="lazy"`，首屏关键图除外
- 体积控制：压缩、裁剪、去除 EXIF
- 占位：LQIP/blur 占位，避免 CLS

## 场景
- 地图标注/底图切片：sprite/矢量优先；小图标内联 base64 或 iconfont
- 大屏背景/封面：AVIF + LQIP，占位提前渲染

## 验证
- Network：图片格式/体积/缓存
- CLS：首屏图片是否带宽高或占位
