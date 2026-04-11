# 3.2 CSS 优化

## 减少阻塞
- 关键样式内联，非关键按路由拆分
- 避免 @import 链
- 使用 `media` 属性延迟非首屏样式

## 性能实践
- 选择器简短，避免深层通配符；减少重排热区的复杂选择器
- 动画首选 `transform/opacity`，避免 `top/left/width/height`
- `will-change` 只在需要时开启，避免过多合成层
- 自定义字体：`font-display: swap/optional`，提供占位

## 场景
- 地图悬浮工具栏：使用 GPU 友好动画；隐藏时 `opacity`+`pointer-events`
- 大屏滚动列表：使用 `contain: layout paint` 隔离影响范围

## 验证
- Rendering 面板开启 Paint Flashing
- Layers 查看合成层数量
