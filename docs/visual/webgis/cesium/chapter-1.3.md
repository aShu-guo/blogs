# CameraEventAggregator：输入合帧与惯性基础

`CameraEventAggregator` 位于 `packages/engine/Source/Scene/CameraEventAggregator.js`，负责把 `ScreenSpaceEventHandler` 在`element（默认为viewer.scene.canvas）`上的用户操作带来的原始输入转成相机控制可直接消费的运动描述。

## 初始化

在构造函数中：

- 创建 `ScreenSpaceEventHandler` 实例。
- 为 `WHEEL`、`LEFT_DRAG`、`RIGHT_DRAG`、`PINCH` 等事件注册监听，并针对不同键盘修饰符（Ctrl/Shift/Alt）重复登记。
- 为每种 `CameraEventType` 预置 `_movement`、`_lastMovement`、`_pressTime`、`_releaseTime` 等缓存。

## 运动数据结构

每个事件键（由 `CameraEventType` + 可选修饰符组成）都维护：

- `movement.startPosition` / `movement.endPosition`：汇总后的起止位置（`Cartesian2`）。
- `lastMovement`：上一帧的原始运动，用于惯性计算。
- `pressTime` / `releaseTime`：按键按下与松开的时间戳，配合控制器判断是否启用惯性。

### 滚轮特殊处理

`listenToWheel` 在触发时会：

- 把滚动增量转换成弧长 `arcLength = 7.5 * CesiumMath.toRadians(delta)`，存入 `movement.endPosition.y`。
- 立即记录 `pressTime` 和 `releaseTime`，因为滚轮不会像鼠标那样有明确的“按下/抬起”。


#### 为什么是7.5

7.5 是经验系数

常见鼠标滚轮一次刻度是 ±120。toRadians(120°) 约 2.094，如果直接拿这个数，缩放会显得很迟缓；乘一个约 7.5 的系数后得到 ≈15.7，再除以 800 像素的画布高度，得到 ~0.02 的画布比例，配合后续 zoomFactor 等
参数就能让缩放速度和旧版行为保持一致。这是 Cesium 为了“手感”调出的经验常量，兼顾不同设备/浏览器的滚轮步进差异。


## 查询接口

控制器常用的接口包括：

- `isMoving(type, modifier)`：当前帧该事件是否有数据。
- `getMovement(type, modifier)`：获取合并后的运动对象。
- `getStartMousePosition(type, modifier)`：返回事件开始时的屏幕坐标，滚轮则返回当前鼠标位置。
- `getLastMovement(type, modifier)`：用于在惯性阶段继续沿着上一帧的方向运动。

## 重置与状态管理

每次渲染帧结束时，`ScreenSpaceCameraController.update()` 会调用 `aggregator.reset()`，将 `_update[key]` 置为 `true`，表示需要等待下一次输入触发才算“有运动”。

聚合器本身不直接修改相机，它只是提供了一个“本帧想要做什么”的数据源，核心逻辑在 `ScreenSpaceCameraController` 中完成。

## 典型实现代码

```js
// packages/engine/Source/Scene/CameraEventAggregator.js#L133
function listenToWheel(aggregator, modifier) {
  const key = getKey(CameraEventType.WHEEL, modifier);

  const pressTime = aggregator._pressTime;
  const releaseTime = aggregator._releaseTime;

  const update = aggregator._update;
  update[key] = true;

  let movement = aggregator._movement[key];
  if (!defined(movement)) {
    movement = aggregator._movement[key] = {};
  }

  let lastMovement = aggregator._lastMovement[key];
  if (!defined(lastMovement)) {
    lastMovement = aggregator._lastMovement[key] = {
      startPosition: new Cartesian2(),
      endPosition: new Cartesian2(),
      valid: false,
    };
  }

  movement.startPosition = new Cartesian2();
  Cartesian2.clone(Cartesian2.ZERO, movement.startPosition);
  movement.endPosition = new Cartesian2();

  aggregator._eventHandler.setInputAction(
    function (delta) {
      const arcLength = 7.5 * CesiumMath.toRadians(delta);
      pressTime[key] = releaseTime[key] = new Date();
      movement.endPosition.x = 0.0;
      movement.endPosition.y = arcLength;
      Cartesian2.clone(movement.endPosition, lastMovement.endPosition);
      lastMovement.valid = true;
      update[key] = false;
    },
    ScreenSpaceEventType.WHEEL,
    modifier,
  );
}
```

```js
// packages/engine/Source/Scene/CameraEventAggregator.js#L440
CameraEventAggregator.prototype.getMovement = function (type, modifier) {
  //>>includeStart('debug', pragmas.debug);
  if (!defined(type)) {
    throw new DeveloperError('type is required.');
  }
  //>>includeEnd('debug');

  const key = getKey(type, modifier);
  const movement = this._movement[key];
  return movement;
};
```
