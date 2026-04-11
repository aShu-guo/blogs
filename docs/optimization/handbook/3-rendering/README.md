# 3. 渲染优化

> 提升运行时性能，打造流畅的用户体验

## 本章概述

渲染优化关注应用运行时的性能表现。对于低空政务平台这样包含大量交互的应用（647个组件、实时地图、视频流、数据可视化），渲染性能直接影响用户体验。本章将深入探讨浏览器渲染机制，帮助你识别和解决渲染性能瓶颈。

## 章节列表

### [3.1 关键渲染路径](./3-1-critical-path.md) ⭐⭐⭐

**核心内容**：
- 重排（Reflow）触发条件
- 重绘（Repaint）优化技巧
- 强制同步布局（Forced Synchronous Layout）
- 批量 DOM 操作

**一体化项目场景**：
- 地图标注点的批量更新
- 实时数据的频繁更新
- 大量 DOM 节点的性能影响
- 动画性能优化

**学习目标**：
- 理解重排和重绘的区别
- 掌握避免强制同步布局的技巧
- 学会批量操作 DOM

---

### [3.2 CSS 优化](./3-2-css.md) ⭐⭐⭐

**核心内容**：
- 合成层（Composite Layer）原理
- will-change 属性使用
- transform 和 opacity 优化
- 层爆炸（Layer Explosion）问题

**一体化项目场景**：
- Cesium 3D 地图的 WebGL 渲染
- 视频播放的硬件加速
- 地图平移缩放动画
- 弹窗和抽屉动画

**学习目标**：
- 理解合成层的工作原理
- 掌握创建合成层的方法
- 避免层爆炸问题

---

### [3.3 JavaScript 执行优化](./3-3-javascript.md) ⭐⭐⭐

**核心内容**：
- 虚拟滚动（Virtual Scrolling）
- 分页加载
- 无限滚动
- 时间分片（Time Slicing）

**一体化项目场景**：
- 地图标注点列表（数千个点位）
- 数据表格的大数据渲染
- 日志列表的实时更新
- 搜索结果的展示

**学习目标**：
- 掌握虚拟滚动的实现原理
- 学会使用 react-window/vue-virtual-scroller
- 理解时间分片技术

---

### [3.4 重排重绘优化](./3-4-reflow-repaint.md) ⭐⭐

## 学习路径

### 新手路径
1. 先学习 [3.1 关键渲染路径](./3-1-critical-path.md)，识别阻塞点
2. 再学习 [3.3 JavaScript 执行优化](./3-3-javascript.md)，减少长任务
3. 最后学习 [3.4 重排重绘优化](./3-4-reflow-repaint.md)，避免布局抖动

### 进阶路径
1. 深入学习 [3.2 CSS 优化](./3-2-css.md)，掌握合成层/动画细节
2. 结合 [3.3 JavaScript 执行优化](./3-3-javascript.md)，拆分长任务
3. 在实际场景（地图/视频/图表）中验证并迭代

## 实战练习

### 练习 1：识别渲染瓶颈
使用 Chrome DevTools 分析渲染性能：
```javascript
// 1. 打开 Performance 面板
// 2. 录制地图操作过程
// 3. 分析 Rendering 和 Painting 时间
// 4. 识别长任务（Long Tasks）

// 查看重排和重绘
performance.mark('start');
// 执行 DOM 操作
performance.mark('end');
performance.measure('DOM Operation', 'start', 'end');
```

### 练习 2：实现虚拟滚动
为地图标注点列表实现虚拟滚动：
```javascript
// 使用 vue-virtual-scroller
<template>
  <RecycleScroller
    :items="markers"
    :item-size="50"
    key-field="id"
    v-slot="{ item }"
  >
    <MarkerItem :marker="item" />
  </RecycleScroller>
</template>

// 目标：支持 10000+ 标注点的流畅滚动
```

### 练习 3：优化地图拖拽
使用节流优化地图拖拽事件：
```javascript
import { throttle } from 'lodash-es';

// 优化前：每次移动都触发
map.on('move', () => {
  updateMarkers();
});

// 优化后：每 100ms 触发一次
map.on('move', throttle(() => {
  updateMarkers();
}, 100));
```

## 关键概念

### 渲染性能指标

| 指标 | 含义 | 目标值 | 优化方向 |
|------|------|--------|----------|
| FPS | 帧率 | 60fps | 减少重排重绘 |
| Frame Time | 帧时间 | < 16.67ms | 优化 JS 执行 |
| Scripting | JS 执行时间 | < 50ms | 代码优化 |
| Rendering | 渲染时间 | < 10ms | 减少 DOM 操作 |

### 渲染流水线

```
JavaScript
    ↓
Style Calculation
    ↓
Layout (Reflow)
    ↓
Paint (Repaint)
    ↓
Composite
```

### 性能优化优先级

```
1. 避免重排（Layout）
   - 使用 transform 代替 top/left
   - 批量读写 DOM
   - 使用 DocumentFragment

2. 减少重绘（Paint）
   - 减少绘制区域
   - 提升到合成层
   - 使用 will-change

3. 优化合成（Composite）
   - 避免层爆炸
   - 合理使用 transform
   - 控制合成层数量
```

### 低空政务平台渲染优化目标

| 优化项 | 当前状态 | 目标状态 | 优化方案 |
|--------|----------|----------|----------|
| 地图 FPS | 待测量 | 60fps | 合成层优化 |
| 列表渲染 | 待测量 | < 100ms | 虚拟滚动 |
| 内存占用 | 待测量 | < 500MB | 内存管理 |
| 交互响应 | 待测量 | < 100ms | 事件优化 |

## 下一步

完成渲染优化学习后，建议继续学习：
- [4. 框架优化](../4-framework/README.md) - Vue 3 特定优化
- [5. 资源优化](../5-resources/README.md) - 图片、字体等资源优化
- [8. 实战案例](../8-cases/README.md) - 完整优化案例

---

[返回手册首页](../README.md)
