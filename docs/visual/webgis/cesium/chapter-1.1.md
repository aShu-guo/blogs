# Cesium 事件体系概览

本文概述 Cesium 中屏幕输入在渲染主循环里的流转路径，帮助快速定位各模块职责。更细节的实现请参考同目录的其他事件文档。

## 事件传输链路

1. **ScreenSpaceEventHandler**  
   收听浏览器原生的鼠标、触摸和滚轮事件，并统一转换成 Cesium 内部的增量值或姿态量。

2. **CameraEventAggregator**  
   通过 `ScreenSpaceEventHandler.setInputAction` 收集这些增量，将同一帧内的多次输入合并为一次移动/缩放/旋转运动，并记录时间戳以支持惯性。

3. **ScreenSpaceCameraController**  
   每帧调用 `reactToInput` 读取聚合的结果，根据场景模式（2D、Columbus View、3D）选择合适的相机操作函数，实现平移、缩放、旋转等交互。

## 关键特性

- **统一增量单位**：滚轮、拖拽、触摸缩放等输入在事件层被规范化，控制器可以用一致的逻辑解释这些数据。
- **输入与状态分离**：聚合器只关心“用户想要的运动”，具体如何驱动相机由控制器决定，便于扩展不同模式下的策略。
- **惯性与碰撞**：控制器在消费输入时会结合时间差做指数衰减；同时依赖地形/碰撞检测信息避免相机穿透地表。

## 阅读顺序建议

- 首次了解事件机制：先看本篇，然后阅读 `events-screen-space-event-handler.md` 和 `events-camera-event-aggregator.md`。
- 需要深入相机控制算法：参考 `events-screen-space-camera-controller.md`，其中涵盖缩放、旋转、地下模式等特殊逻辑。

