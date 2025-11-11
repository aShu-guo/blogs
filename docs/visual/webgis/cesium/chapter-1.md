# Cesium 事件体系

Cesium 的屏幕交互经历“事件采集 → 运动合帧 → 相机响应”三层抽象。为了便于查阅，本章节按职责拆分为多个子文档。

## 文档导航

- [事件链路概览](chapter-1.1.md)  
  汇总输入在三个模块之间的流转方式，以及阅读顺序建议。
- [ScreenSpaceEventHandler](chapter-1.2.md)  
  讲解如何监听浏览器原生事件并转换为 Cesium 内部的增量值。
- [CameraEventAggregator](chapter-1.3.md)  
  详细说明输入如何被合并成统一的运动记录，供相机控制器读取。
- [ScreenSpaceCameraController](chapter-1.4.md)  
  展示不同场景模式下的缩放、旋转与惯性策略。

## 快速概述

- 屏幕输入首先由 `ScreenSpaceEventHandler` 捕获，并通过 `setInputAction` 登记成 Cesium 事件。
- `CameraEventAggregator` 对这些事件做汇总，形成“本帧运动”的抽象，同时记录时间戳支持惯性。
- `ScreenSpaceCameraController` 在渲染循环中消费运动数据，根据场景模式选择具体的相机操作函数。

更多代码细节请参考上方子文档。
