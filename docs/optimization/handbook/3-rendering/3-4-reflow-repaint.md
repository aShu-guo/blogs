# 3.4 重排重绘优化

## 触发源
- 读取布局属性后立即写入（layout thrash）
- 大量 DOM 插入/删除
- 动画使用非 GPU 属性

## 优化
- 批量 DOM 更新：DocumentFragment / requestAnimationFrame 合并
- 读写分离：先读后写；使用 `getBoundingClientRect` 结果缓存
- 使用虚拟列表替代长列表；懒加载不可见节点
- 合成层隔离高频动画；`contain` 限定影响范围

## 场景
- 告警列表滚动：虚拟列表 + 懒加载图片
- 地图面板开关动画：仅变更 `transform/opacity`
- 大量标记点更新：使用 Canvas/WebGL 渲染批量点位

## 验证
- DevTools Rendering：Paint Flashing、Layout Shift Regions
- Performance：Layout/Style 事件耗时
