# 5.2 字体优化

## 策略
- 子集化：仅保留所需字符集；拆分中英文
- 传输：使用 WOFF2；CDN 缓存
- 展示：`font-display: swap/optional`，提供系统字体回退
- 预加载：首屏所需字体使用 `preload`

## 场景
- 图标字体 vs SVG：小规模图标建议 SVG sprite；大规模仍可 iconfont + 子集
- 政务专用字体：子集化 + CDN 分发，避免阻塞首屏

## 验证
- Network：字体体积、缓存命中
- CLS：是否有占位/回退
