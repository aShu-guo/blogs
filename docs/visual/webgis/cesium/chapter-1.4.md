# ScreenSpaceCameraController：相机交互与惯性策略

`ScreenSpaceCameraController` 位于 `packages/engine/Source/Scene/ScreenSpaceCameraController.js`，是 Cesium 默认的屏幕交互控制器。它读取 `CameraEventAggregator` 提供的数据，将其转化为相机的平移、缩放、旋转等操作。

## 初始化要点

- 定义 `translateEventTypes`、`zoomEventTypes`、`rotateEventTypes`、`tiltEventTypes` 等映射，默认包括拖拽、滚轮、PINCH 等输入。
- 维护与惯性相关的 `_lastInertia*Movement`，并通过 `_inertiaDisablers` 控制某些动作触发时需要关闭其它惯性（例如缩放时禁用旋转惯性）。
- 记录一系列 Scratch 变量（`Cartesian2/3`、`Ray` 等）减少内存分配开销。

## 每帧更新流程

1. 调整 `_globe`、`_ellipsoid` 引用，以处理是否存在相机变换矩阵的情况。
2. 根据场景模式调用 `update2D`、`updateCV` 或 `update3D`。
3. 在对应的更新函数中，通过 `reactToInput` 读取聚合器的运动数据，并调用 `translate2D`、`zoom3D`、`tilt3D` 等操作函数。
4. 若开启碰撞检测，最后执行 `adjustHeightForTerrain`，确保相机高度安全。

## 滚轮缩放的实现

- `reactToInput` 检测到 `CameraEventType.WHEEL` 的运动后，会调用 `zoom2D` / `zoomCV` / `zoom3D`。
- 这些函数计算合适的“距离尺度”：2D 模式直接取相机模长；Columbus/3D 模式通过拾取射线与地形（或深度贴图）的交点。
- 交给 `handleZoom`：
  - 使用屏幕高度归一化滚轮弧长，乘以 `zoomFactor` 与与目标表面的距离得到最终的 `distance`。
  - 根据 `minimumZoomDistance`、`maximumZoomDistance`、碰撞检测状态做裁剪。
  - 尝试拾取 `_zoomWorldPosition`，在地面/模型上缩放时保持焦点稳定；若拾取失败，则退回直线 `zoomIn(distance)`。
  - 在地下模式或与地表夹角过小时改为沿射线平移，避免相机穿透地形。

## 惯性

- `maintainInertia` 根据滚轮停止后的时间差执行指数衰减，持续调用 `handleZoom`，直到增量足够小或被其他输入打断。
- `activateInertia` 会在实际触发动作后重置相关的惯性状态，确保多种操作不会相互叠加产生奇怪的效果。

### 详细设计

1. **惯性触发条件**  
   `reactToInput` 在检测到真实的滚轮运动时，会先执行 `zoom*` 操作，然后调用 `activateInertia`，重新启用当前动作的惯性状态，并按 `_inertiaDisablers` 禁用其它惯性，防止多个惯性叠加。同时，只有当滚轮按下到抬起的时间差小于 `inertiaMaxClickTimeThreshold (0.4s)` 时才会触发惯性，避免长按滚轮仍产生惯性漂移。

2. **运动快照**  
   `CameraEventAggregator.listenToWheel` 会把最后一次滚轮增量保存到 `_lastMovement[key]`，并记录 `_pressTime`、`_releaseTime`。`maintainInertia` 就是基于这些缓存生成衰减运动，所以只有当历史运动存在且没有被其它操作覆盖时才会继续。

3. **指数衰减算法**  
   通过 `decay(fromNow, inertiaZoom)` 计算衰减系数 `d = exp(-(1 - inertiaZoom) * 25 * Δt)`（默认 `inertiaZoom = 0.8`），越靠近事件发生时惯性越明显。再用 `_lastMovement` 的位移向量（乘 0.5 调整幅度）与 `d` 相乘得到新的终点，若结果过小（< 0.5像素）或出现 NaN，即认为惯性能量耗尽。

4. **执行与终止**  
   惯性阶段构造的 `movementState` 会带上 `inertiaEnabled = true`，`handleZoom` 看到这个标记就保持原有的起点和拾取目标继续缩放。当检测到鼠标键重新按下，或者其它输入触发时，`maintainInertia` 会立即退出，`activateInertia` 也会在别的动作触发时关闭当前惯性。

5. **安全措施**  
   惯性驱动仍会经过 `handleZoom` 中的距离裁剪、碰撞检测以及地下模式限制，确保不会因惯性穿透地表或越界。如果惯性导致镜头越过目标点，`handleZoom` 会重置 `_zoomMouseStart`，迫使下一次重新拾取目标，避免镜头闪动。

## 其他重要逻辑

- **旋转/倾斜限制**：依据 `maximumTiltAngle`、场景模式和地形高度限制相机姿态。
- **地下支持**：若 `scene.cameraUnderground` 为真，缩放、拾取和倾斜逻辑都会切换到地下参数（`_minimumUndergroundPickDistance` 等）。
- **纠偏 Tween**：在 Columbus View 中，如果用户松开所有按键且没有惯性运动，会触发 `camera.createCorrectPositionTween` 回弹至有效视图。

通过拆分不同模式的 zoom、tilt、rotate 函数，`ScreenSpaceCameraController` 将屏幕输入与相机动作解耦，方便根据场景扩展或自定义交互体验。

## 典型实现代码

```js
// packages/engine/Source/Scene/ScreenSpaceCameraController.js#L378
const inertiaMaxClickTimeThreshold = 0.4;

function maintainInertia(
  aggregator,
  type,
  modifier,
  decayCoef,
  action,
  object,
  lastMovementName,
) {
  let movementState = object[lastMovementName];
  if (!defined(movementState)) {
    movementState = object[lastMovementName] = {
      startPosition: new Cartesian2(),
      endPosition: new Cartesian2(),
      motion: new Cartesian2(),
      inertiaEnabled: true,
    };
  }

  const ts = aggregator.getButtonPressTime(type, modifier);
  const tr = aggregator.getButtonReleaseTime(type, modifier);

  const threshold = ts && tr && (tr.getTime() - ts.getTime()) / 1000.0;
  const now = new Date();
  const fromNow = tr && (now.getTime() - tr.getTime()) / 1000.0;

  if (ts && tr && threshold < inertiaMaxClickTimeThreshold) {
    const d = decay(fromNow, decayCoef);

    const lastMovement = aggregator.getLastMovement(type, modifier);
    if (
      !defined(lastMovement) ||
      sameMousePosition(lastMovement) ||
      !movementState.inertiaEnabled
    ) {
      return;
    }

    movementState.motion.x =
      (lastMovement.endPosition.x - lastMovement.startPosition.x) * 0.5;
    movementState.motion.y =
      (lastMovement.endPosition.y - lastMovement.startPosition.y) * 0.5;

    movementState.startPosition = Cartesian2.clone(
      lastMovement.startPosition,
      movementState.startPosition,
    );

    movementState.endPosition = Cartesian2.multiplyByScalar(
      movementState.motion,
      d,
      movementState.endPosition,
    );
    movementState.endPosition = Cartesian2.add(
      movementState.startPosition,
      movementState.endPosition,
      movementState.endPosition,
    );

    if (
      isNaN(movementState.endPosition.x) ||
      isNaN(movementState.endPosition.y) ||
      Cartesian2.distance(
        movementState.startPosition,
        movementState.endPosition,
      ) < 0.5
    ) {
      return;
    }

    if (!aggregator.isButtonDown(type, modifier)) {
      const startPosition = aggregator.getStartMousePosition(type, modifier);
      action(object, startPosition, movementState);
    }
  }
}
```

```js
// packages/engine/Source/Scene/ScreenSpaceCameraController.js#L481
function reactToInput(
  controller,
  enabled,
  eventTypes,
  action,
  inertiaConstant,
  inertiaStateName,
) {
  if (!defined(eventTypes)) {
    return;
  }

  const aggregator = controller._aggregator;

  if (!Array.isArray(eventTypes)) {
    scratchEventTypeArray[0] = eventTypes;
    eventTypes = scratchEventTypeArray;
  }

  const length = eventTypes.length;
  for (let i = 0; i < length; ++i) {
    const eventType = eventTypes[i];
    const type = defined(eventType.eventType) ? eventType.eventType : eventType;
    const modifier = eventType.modifier;

    const movement =
      aggregator.isMoving(type, modifier) &&
      aggregator.getMovement(type, modifier);
    const startPosition = aggregator.getStartMousePosition(type, modifier);

    if (controller.enableInputs && enabled) {
      if (movement) {
        action(controller, startPosition, movement);
        activateInertia(controller, inertiaStateName);
      } else if (inertiaConstant < 1.0) {
        maintainInertia(
          aggregator,
          type,
          modifier,
          inertiaConstant,
          action,
          controller,
          inertiaStateName,
        );
      }
    }
  }
}
```

```js
// packages/engine/Source/Scene/ScreenSpaceCameraController.js#L562
function handleZoom(
  object,
  startPosition,
  movement,
  zoomFactor,
  distanceMeasure,
  unitPositionDotDirection,
) {
  let percentage = 1.0;
  if (defined(unitPositionDotDirection)) {
    percentage = CesiumMath.clamp(
      Math.abs(unitPositionDotDirection),
      0.25,
      1.0,
    );
  }

  const diff = movement.endPosition.y - movement.startPosition.y;

  const approachingSurface = diff > 0;
  const minHeight = approachingSurface
    ? object.minimumZoomDistance * percentage
    : 0;
  const maxHeight = object.maximumZoomDistance;

  const minDistance = distanceMeasure - minHeight;
  let zoomRate = zoomFactor * minDistance;
  zoomRate = CesiumMath.clamp(
    zoomRate,
    object._minimumZoomRate,
    object._maximumZoomRate,
  );

  let rangeWindowRatio = diff / object._scene.canvas.clientHeight;
  rangeWindowRatio = Math.min(rangeWindowRatio, object.maximumMovementRatio);
  let distance = zoomRate * rangeWindowRatio;

  if (
    object.enableCollisionDetection ||
    object.minimumZoomDistance === 0.0 ||
    !defined(object._globe)
  ) {
    if (distance > 0.0 && Math.abs(distanceMeasure - minHeight) < 1.0) {
      return;
    }

    if (distance < 0.0 && Math.abs(distanceMeasure - maxHeight) < 1.0) {
      return;
    }

    if (distanceMeasure - distance < minHeight) {
      distance = distanceMeasure - minHeight - 1.0;
    } else if (distanceMeasure - distance > maxHeight) {
      distance = distanceMeasure - maxHeight;
    }
  }

  const scene = object._scene;
  const camera = scene.camera;
  const mode = scene.mode;

  const orientation = scratchZoomViewOptions.orientation;
  orientation.heading = camera.heading;
  orientation.pitch = camera.pitch;
  orientation.roll = camera.roll;

  const sameStartPosition =
    movement.inertiaEnabled ??
    Cartesian2.equals(startPosition, object._zoomMouseStart);
  let zoomingOnVector = object._zoomingOnVector;
  let rotatingZoom = object._rotatingZoom;
  let pickedPosition;

  if (!sameStartPosition) {
    object._zoomMouseStart = Cartesian2.clone(
      startPosition,
      object._zoomMouseStart,
    );

    if (defined(object._globe) && mode === SceneMode.SCENE2D) {
      pickedPosition = camera.getPickRay(
        startPosition,
        scratchZoomPickRay,
      ).origin;
      pickedPosition = Cartesian3.fromElements(
        pickedPosition.y,
        pickedPosition.z,
        pickedPosition.x,
      );
    } else if (defined(object._globe)) {
      pickedPosition = pickPosition(
        object,
        startPosition,
        scratchPickCartesian,
      );
    }

    if (defined(pickedPosition)) {
      object._useZoomWorldPosition = true;
      object._zoomWorldPosition = Cartesian3.clone(
        pickedPosition,
        object._zoomWorldPosition,
      );
    } else {
      object._useZoomWorldPosition = false;
    }

    zoomingOnVector = object._zoomingOnVector = false;
    rotatingZoom = object._rotatingZoom = false;
    object._zoomingUnderground = object._cameraUnderground;
  }

  if (!object._useZoomWorldPosition) {
    camera.zoomIn(distance);
    return;
  }
}
```
