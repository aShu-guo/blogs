# ScreenSpaceEventHandler：屏幕输入归一化

`ScreenSpaceEventHandler` 位于 `packages/engine/Source/Core/ScreenSpaceEventHandler.js`，负责监听浏览器提供的鼠标、键盘、触摸事件，并转换成 Cesium 可以理解的格式。

## 核心职责

- **监听浏览器事件**：在构造函数中为 `wheel`、`mousedown`、`mousemove`、`touchstart` 等事件注册回调。
- **归一化数据**：将浏览器事件附带的像素偏移、滚动量、触摸点坐标转成 Cesium 内部使用的 `Cartesian2`、角度、弧长等值。
- **分发动作**：通过 `setInputAction(callback, ScreenSpaceEventType, modifier)` 机制，把统一后的输入传递给上层（通常是 `CameraEventAggregator`）。

## 滚轮事件示例流程

1. 浏览器触发 `wheel`，调用 `handleWheel`。
2. `handleWheel` 根据 `event.deltaY` / `event.wheelDelta` 等字段计算统一的 `delta`，单位接近传统滚轮刻度。
3. 通过注册在 `ScreenSpaceEventType.WHEEL` 的回调执行 `action(delta)`，并阻止默认事件，防止页面滚动。

对应代码可在 `handleWheel` 和 `ScreenSpaceEventHandler.prototype.setInputAction` 中找到。

## 拖拽与触摸

- 鼠标按下 / 松开：通过 `LeftDown`、`LeftUp` 等事件派发，记录起点并触发点击、双击等逻辑。
- `mousemove`：持续更新当前位置与上一次位置，在有按键按下时阻止浏览器默认行为（例如选中文本）。
- 触摸事件：维护触摸点集合，支持多指缩放 (`PINCH_START/MOVE/END`) 以及长按、点击等手势。

## 与上层的协作

`ScreenSpaceEventHandler` 不关心输入的业务意义，它只提供“某个类型的动作发生了，附带增量/位置数据”。上层可以在不同 `ScreenSpaceEventType` 上注册多个回调，实现自己的交互逻辑。

在默认场景中，`CameraEventAggregator` 会注册滚轮、拖拽、PINCH 等回调，把这些归一化的输入纳入相机控制流程。

## 典型实现代码

```js
// packages/engine/Source/Core/ScreenSpaceEventHandler.js#L414
function handleWheel(screenSpaceEventHandler, event) {
  // currently this event exposes the delta value in terms of
  // the obsolete mousewheel event type.  so, for now, we adapt the other
  // values to that scheme.
  let delta;

  // standard wheel event uses deltaY.  sign is opposite wheelDelta.
  // deltaMode indicates what unit it is in.
  if (defined(event.deltaY)) {
    const deltaMode = event.deltaMode;
    if (deltaMode === event.DOM_DELTA_PIXEL) {
      delta = -event.deltaY;
    } else if (deltaMode === event.DOM_DELTA_LINE) {
      delta = -event.deltaY * 40;
    } else {
      // DOM_DELTA_PAGE
      delta = -event.deltaY * 120;
    }
  } else if (event.detail > 0) {
    // old Firefox versions use event.detail to count the number of clicks. The sign
    // of the integer is the direction the wheel is scrolled.
    delta = event.detail * -120;
  } else {
    delta = event.wheelDelta;
  }

  if (!defined(delta)) {
    return;
  }

  const modifier = getModifier(event);
  const action = screenSpaceEventHandler.getInputAction(
    ScreenSpaceEventType.WHEEL,
    modifier,
  );

  if (defined(action)) {
    action(delta);

    event.preventDefault();
  }
}
```

```js
// packages/engine/Source/Core/ScreenSpaceEventHandler.js#L1025
ScreenSpaceEventHandler.prototype.setInputAction = function (
  action,
  type,
  modifier,
) {
  //>>includeStart('debug', pragmas.debug);
  if (!defined(action)) {
    throw new DeveloperError('action is required.');
  }
  if (!defined(type)) {
    throw new DeveloperError('type is required.');
  }
  //>>includeEnd('debug');

  const key = getInputEventKey(type, modifier);
  this._inputEvents[key] = action;
};
```

## Q&A

### 相同type、modifier只保留1个action

同一个 `ScreenSpaceEventHandler` 实例里，`setInputAction` 只会为每个 (type, modifier) 组合保存 一个 回调。内部实现就是把回调存在一个键值表里：

```js
const key = getInputEventKey(type, modifier);
this._inputEvents[key] = action;
```

如果你之后用相同的 type 和 modifier 再调用一次 `setInputAction`，就会把之前的函数覆盖掉；触发事件时也只会取出这个键对应的最后一次设置的回调。

### 设计模式

ScreenSpaceEventHandler 其实就是标准的 观察者（Observer）/发布-订阅 模式实现：

- 它监听浏览器原生事件，相当于“被观察者”。
- 通过 `setInputAction` 把处理函数登记到 `_inputEvents[key]`，这些函数就是“观察者”。
- 当某类输入发生时（例如 wheel 事件），handleWheel 等内部回调会调用 action(delta)，把事件分发给已经订阅的观察者。
- `removeInputAction` 则是取消订阅。

### 标准化增量

- handleWheel 需要把浏览器提供的滚动量（deltaY、detail、wheelDelta）统一成一个`符号、量级稳定`的数值，保证后续 CameraEventAggregator 能以同一尺度（弧长）驱动缩放。
- 各浏览器在 wheel 事件上的字段差异很大：
  - 现代浏览器使用 deltaY，并且根据 deltaMode 可能是像素、行或者页单位；
  - 老版 Firefox 使用 detail（正负表示方向）；
  - 旧的 DOMMouseScroll / mousewheel 事件使用 wheelDelta，符号和新标准相反。
- 因此源码里对 `deltaY`、`detail`、`wheelDelta` 做了分支处理、并在行/页模式下乘以常量（40、120），把它们近似转换到“像素”刻度，同时用负号让鼠标向前滚时得到正值（与 Cesium 习惯一致）——见 packages/engine/
  Source/Core/ScreenSpaceEventHandler.js#L414。
- 最终得到的 delta 不是真正的物理距离，而是一个统一的滚动增量；聚合器再把它乘上 `7.5 * toRadians(delta)` 换算成弧长，供缩放逻辑使用。这种多层归一化确保不同浏览器、不同硬件下滚轮响应一致，同时保持旧版
  接口兼容。
