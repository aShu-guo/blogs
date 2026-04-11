# 5. 资源优化

> 优化图片、字体、视频等静态资源

## 本章概述

资源优化是性能优化的重要组成部分。低空政务平台包含大量静态资源：地图瓦片、视频流、数据可视化图表、图标字体等。合理的资源优化策略能够显著减少带宽消耗，提升加载速度。本章将深入探讨各类资源的优化技巧。

## 章节列表

### [5.1 图片优化](./5-1-images.md) ⭐⭐⭐

**核心内容**：
- 图片格式选择（WebP、AVIF、SVG）
- 图片压缩技术
- 响应式图片（srcset、picture）
- 图片懒加载

**一体化项目场景**：
- 地图标注点图标优化
- 视频缩略图优化
- 用户头像处理
- 背景图片优化

**学习目标**：
- 掌握各种图片格式的特点
- 学会选择合适的图片格式
- 理解响应式图片的实现

---

### [5.2 字体优化](./5-2-fonts.md) ⭐⭐

**核心内容**：
- 字体格式选择（WOFF2、WOFF）
- 字体子集化（Font Subsetting）
- font-display 策略
- 图标字体 vs SVG

**一体化项目场景**：
- 中文字体的优化
- 图标字体的使用
- 自定义字体加载
- 字体闪烁问题

**学习目标**：
- 理解字体加载对性能的影响
- 掌握字体优化技巧
- 学会使用 font-display

---

### [5.3 视频优化](./5-3-videos.md) ⭐⭐⭐

**核心内容**：
- 视频编码格式（H.264、H.265、VP9）
- 自适应码率（ABR）
- 视频预加载策略
- 流媒体协议（HLS、DASH）

**一体化项目场景**：
- 视频流的实时播放
- 视频缩略图生成
- 多路视频同时播放
- 视频录制和上传

**学习目标**：
- 理解视频编码和传输
- 掌握视频优化技巧
- 学会实现自适应播放

---

### [5.4 第三方脚本管理](./5-4-third-party.md) ⭐⭐

---

## 学习路径

### 新手路径
1. 先学习 [5.1 图片优化](./5-1-images.md)，掌握最常见的优化
2. 再学习 [5.2 字体优化](./5-2-fonts.md)，避免闪烁与阻塞
3. 最后学习 [5.3 视频优化](./5-3-videos.md)，处理大资源

### 进阶路径
1. 深入学习 [5.4 第三方脚本管理](./5-4-third-party.md)，降低外部依赖风险
2. 结合 [5.2 字体优化](./5-2-fonts.md)，优化文字渲染
3. 持续迭代视频/图片策略并监控命中率

## 实战练习

### 练习 1：图片格式转换
使用 WebP 格式优化图片：
```bash
# 安装 cwebp 工具
brew install webp

# 批量转换图片
for file in *.jpg; do
  cwebp -q 80 "$file" -o "${file%.jpg}.webp"
done
```

在代码中使用：
```html
<picture>
  <source srcset="image.webp" type="image/webp">
  <source srcset="image.jpg" type="image/jpeg">
  <img src="image.jpg" alt="fallback">
</picture>
```

### 练习 2：字体子集化
提取常用汉字子集：
```bash
# 安装 fonttools
pip install fonttools

# 提取子集
pyftsubset font.ttf \
  --text-file=chars.txt \
  --output-file=font-subset.woff2 \
  --flavor=woff2
```

### 练习 3：配置 Brotli 压缩
Nginx 配置：
```nginx
http {
  # 启用 Brotli 压缩
  brotli on;
  brotli_comp_level 6;
  brotli_types text/plain text/css application/json application/javascript text/xml application/xml image/svg+xml;

  # 启用 Gzip 作为后备
  gzip on;
  gzip_types text/plain text/css application/json application/javascript text/xml application/xml image/svg+xml;
}
```

## 关键概念

### 资源优化决策表

| 资源类型 | 推荐格式 | 压缩方案 | 加载策略 |
|----------|----------|----------|----------|
| 照片 | WebP/AVIF | 有损压缩 | 懒加载 |
| 图标 | SVG | SVGO | 内联/Sprite |
| 字体 | WOFF2 | 子集化 | preload |
| 视频 | H.264 | 自适应码率 | 预加载 |
| 音频 | AAC/Opus | 有损压缩 | 按需加载 |

### 图片格式选择

```
图片类型判断
├─ 矢量图形 → SVG
├─ 简单图标 → SVG/WebP
├─ 照片
│   ├─ 支持 AVIF → AVIF
│   ├─ 支持 WebP → WebP
│   └─ 后备方案 → JPEG
└─ 透明背景
    ├─ 支持 WebP → WebP
    └─ 后备方案 → PNG
```

### 压缩算法对比

| 算法 | 压缩率 | 速度 | 浏览器支持 | 适用场景 |
|------|--------|------|------------|----------|
| Gzip | 中 | 快 | 100% | 通用压缩 |
| Brotli | 高 | 中 | 96%+ | 静态资源 |
| Zopfli | 高 | 慢 | 100% | 构建时压缩 |

### 低空政务平台资源优化目标

| 优化项 | 当前状态 | 目标状态 | 优化方案 |
|--------|----------|----------|----------|
| 图片格式 | JPEG/PNG | WebP | 格式转换 |
| 图片体积 | 待测量 | 减少 60% | 压缩 + 懒加载 |
| 字体加载 | 待优化 | < 100ms | 子集化 + preload |
| 视频加载 | 待优化 | 自适应 | ABR 策略 |
| 资源压缩 | Gzip | Brotli | 服务器配置 |

## 下一步

完成资源优化学习后，建议继续学习：
- [2. 加载优化](../2-loading/README.md) - 资源加载策略
- [6. 构建优化](../6-build/README.md) - 构建时优化
- [8. 实战案例](../8-cases/README.md) - 完整优化案例

---

[返回手册首页](../README.md)
