# Intrinsic Sizing 和 Extrinsic Sizing 详解

## 概述

`Intrinsic Sizing` 和 `Extrinsic Sizing` 是 CSS 中两种不同的元素尺寸计算方式，它们决定了元素如何确定自己的大小。

## Intrinsic Sizing（内在尺寸）

### 定义
**Intrinsic Sizing** 是指元素根据其内容来确定自己的尺寸，而不依赖于外部约束。

### 特点
- 元素的大小由内容决定
- 不受父容器或其他外部因素影响
- 通常用于文本、图片等有自然尺寸的内容
- 内容不会被裁剪

### 代码示例

<!-- 文本元素使用内在尺寸 -->
<div class="w-auto h-auto">
  这是一段文本，div 的宽度会根据文本长度自动调整
</div>

<!-- 图片使用内在尺寸 -->
<img src="/imgs/visual/threejs/textures/alpha.jpg" class="w-auto h-auto" alt="图片会保持原始尺寸">

```html
<!-- 文本元素使用内在尺寸 -->
<div class="w-auto h-auto">
  这是一段文本，div 的宽度会根据文本长度自动调整
</div>

<!-- 图片使用内在尺寸 -->
<img src="/imgs/visual/threejs/textures/alpha.jpg" class="w-auto h-auto" alt="图片会保持原始尺寸">
```

<!-- 内联元素天然使用内在尺寸 -->
<span class="inline">内联元素</span>

## Extrinsic Sizing（外在尺寸）

### 定义
**Extrinsic Sizing** 是指元素根据外部约束（如父容器、CSS 规则等）来确定自己的尺寸，而不考虑内容。

### 特点
- 元素的大小由外部约束决定
- 内容可能会被裁剪或溢出
- 通常用于布局容器、固定尺寸的元素
- 提供精确的布局控制

### 代码示例

<!-- 固定尺寸 -->
<div class="w-75px h-50px bg-red color-#3c3c3c">
  这段文本可能会溢出，因为容器有固定尺寸
</div>

<!-- 百分比尺寸 -->
<div class="w-1/2 h-full">
  这个容器会占据父容器 50% 的宽度
</div>

<!-- Flexbox 中的外在尺寸 -->
<div class="flex">
  <div class="flex-1">项目1</div>
  <div class="flex-1">项目2</div>
  <div class="flex-1">项目3</div>
</div>

<!-- Grid 中的外在尺寸 -->
<div class="grid grid-cols-3 gap-4">
  <div class="col-span-1">列1</div>
  <div class="col-span-2">列2</div>
  <div class="col-span-1">列3</div>
</div>

```html
<!-- 固定尺寸 -->
<div class="w-75 h-50 overflow-hidden bg-red color-#3c3c3c">
  这段文本可能会溢出，因为容器有固定尺寸
</div>

<!-- 百分比尺寸 -->
<div class="w-1/2 h-full">
  这个容器会占据父容器 50% 的宽度
</div>

<!-- Flexbox 中的外在尺寸 -->
<div class="flex">
  <div class="flex-1">项目1</div>
  <div class="flex-1">项目2</div>
  <div class="flex-1">项目3</div>
</div>

<!-- Grid 中的外在尺寸 -->
<div class="grid grid-cols-3 gap-4">
  <div class="col-span-1">列1</div>
  <div class="col-span-2">列2</div>
  <div class="col-span-1">列3</div>
</div>
```

## 实际应用场景

### Intrinsic Sizing 适用于

| 场景 | 示例 | 说明 |
|------|------|------|
| 按钮文字 | `w-auto min-w-25 px-4 py-2` | 根据文字长度调整按钮宽度 |
| 图片展示 | `w-auto h-auto` | 保持原始比例 |
| 内联元素 | `inline` | 天然适应内容 |
| 表格单元格 | `w-auto` | 根据内容调整列宽 |

### Extrinsic Sizing 适用于

| 场景 | 示例 | 说明 |
|------|------|------|
| 布局容器 | `w-75 h-50 p-4` | 固定宽高的卡片、面板 |
| 响应式设计 | `w-1/2 h-screen` | 百分比、视口单位 |
| Flexbox/Grid | `flex-1` 或 `col-span-2` | 精确控制空间分配 |
| 固定组件 | `w-full h-16` | 导航栏、侧边栏 |

## 混合使用示例

在实际开发中，通常会混合使用这两种方式：

```html
<!-- 卡片组件：固定宽度，自适应高度 -->
<div class="w-75 h-auto p-5 bg-white rounded-lg shadow-md">
  <h3 class="text-lg font-bold mb-2">卡片标题</h3>
  <p class="text-gray-600">卡片内容会根据文字长度自动调整高度</p>
</div>

<!-- 按钮组件：最小宽度，内容自适应 -->
<button class="min-w-25 w-auto px-5 py-2 h-10 bg-blue-500 text-white rounded">
  按钮文字
</button>

<!-- 响应式图片容器 -->
<div class="w-full h-50 overflow-hidden rounded">
  <img src="image.jpg" class="w-full h-auto object-cover" alt="响应式图片">
</div>

<!-- 导航栏：固定高度，自适应宽度 -->
<nav class="w-full h-16 bg-gray-800 flex items-center justify-between px-4">
  <div class="w-auto h-auto">
    <span class="text-white text-xl font-bold">Logo</span>
  </div>
  <div class="flex space-x-4">
    <a href="#" class="text-white hover:text-gray-300">首页</a>
    <a href="#" class="text-white hover:text-gray-300">关于</a>
    <a href="#" class="text-white hover:text-gray-300">联系</a>
  </div>
</nav>

<!-- 表格：固定列宽，内容自适应 -->
<table class="w-full border-collapse">
  <thead>
    <tr class="bg-gray-100">
      <th class="w-32 p-2 text-left border">ID</th>
      <th class="w-auto p-2 text-left border">名称</th>
      <th class="w-24 p-2 text-left border">状态</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td class="p-2 border">001</td>
      <td class="p-2 border">这是一个很长的名称</td>
      <td class="p-2 border">活跃</td>
    </tr>
  </tbody>
</table>
```

## 常用 UnoCSS 原子类对照

### 尺寸相关
- `w-auto` / `h-auto` - 自动尺寸（内在）
- `w-full` / `h-full` - 100% 尺寸（外在）
- `w-1/2` / `h-1/2` - 50% 尺寸（外在）
- `w-75` / `h-50` - 固定像素尺寸（外在）
- `min-w-25` / `max-w-50` - 最小/最大尺寸约束

### 布局相关
- `flex` / `grid` - 弹性/网格布局
- `flex-1` / `flex-auto` - 弹性项目尺寸
- `col-span-1` / `row-span-2` - 网格项目尺寸
- `inline` / `block` - 显示模式

### 溢出处理
- `overflow-hidden` - 隐藏溢出
- `overflow-auto` - 自动滚动
- `text-ellipsis` - 文本省略

## 总结

| 特性 | Intrinsic Sizing | Extrinsic Sizing |
|------|------------------|------------------|
| **尺寸决定因素** | 内容 | 外部约束 |
| **内容处理** | 完全显示 | 可能被裁剪 |
| **布局控制** | 灵活 | 精确 |
| **适用场景** | 内容展示 | 布局控制 |
| **响应式** | 内容驱动 | 容器驱动 |

理解这两种尺寸计算方式是掌握 CSS 布局的关键，结合 UnoCSS 的原子类可以快速实现各种布局需求。
