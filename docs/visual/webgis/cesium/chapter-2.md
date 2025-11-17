# Viewer实例化流程

## 1. 顶层对象：Viewer
- 构造函数负责创建 DOM、`CesiumWidget` 与本地 `EventHelper`，并把 `clock.onTick`、`HomeButton` 等事件交给 helper 管理（`packages/widgets/Source/Viewer/Viewer.js:396-520`）。
- 对外暴露 `viewer.dataSourceDisplay`、`viewer.entities`、`viewer.dataSources` 等 getter，只是直接返回 `CesiumWidget` 中的 `DataSourceDisplay`、默认 `EntityCollection` 和 `DataSourceCollection`（`packages/widgets/Source/Viewer/Viewer.js:1126-1161`）。
- `_onTick` 中会调用 `dataSourceDisplay.getBoundingSphere` 来更新选中实体的 UI，因此 `Viewer` 对 `DataSourceDisplay` 是一个“读取/查询”关系（`packages/widgets/Source/Viewer/Viewer.js:1807-1865`）。

## 2. 数据源集合：DataSourceCollection
- 负责维护 `DataSource` 列表并暴露 `dataSourceAdded/Removed/Moved` 三个事件；`add/remove/move` 等操作都会 raise 对应事件（`packages/engine/Source/DataSources/DataSourceCollection.js:1-166`）。
- `viewer.dataSources` 实际就是 `cesiumWidget.dataSourceCollection`，也就是这里的实例。

## 3. 实体集合：EntityCollection
- 每个 `DataSource` 都有自己的 `EntityCollection`。集合内部维护 `_addedEntities/_removedEntities/_changedEntities` 三个 `AssociativeArray`，用于批量记录变化并在 `fireChangedEvent` 时一次性触发 `collectionChanged`（`packages/engine/Source/DataSources/EntityCollection.js:1-115`）。
- `Viewer.entities` 等价于 `dataSourceDisplay.defaultDataSource.entities`，因此 `Viewer` 间接依赖 `EntityCollection`。
- `ModelVisualizer` 等 visualizer 会监听 `collectionChanged` 来决定何时创建/销毁 primitive（`packages/engine/Source/DataSources/ModelVisualizer.js:507-541`）。

## 4. 可视化调度：DataSourceDisplay
- 构造时新建自己的 `EventHelper`，注册 `DataSourceCollection` 的三个事件以及 `scene.postRender`（`packages/engine/Source/DataSources/DataSourceDisplay.js:34-118`）。
- 当新增数据源时会创建对应的 `PrimitiveCollection`、`Visualizer` 集合，并加入 `scene.primitives`；默认还创建一个 `CustomDataSource` 作为 `viewer.entities` 的来源。
- `update(time)` 每帧驱动所有数据源的 visualizer，`getBoundingSphere` 则聚合每个 visualizer 的包围球结果供 `Viewer`、`CesiumWidget` 使用（`packages/engine/Source/DataSources/DataSourceDisplay.js:288-360`）。

## 5. 事件工具：EventHelper
- `EventHelper.add` 包装 `event.addEventListener`，把移除回调保存在 `_removalFunctions`，并返回一个可单独移除的函数（`packages/engine/Source/Core/EventHelper.js:1-63`）。
- `Viewer`、`DataSourceDisplay` 都用它来成批注册/销毁监听，保证组件销毁时不遗漏事件。

## 6. 实例化过程详解
- **Viewer**
  1. 解析 DOM 容器、创建外层结构（容器、toolbar 等）。
  2. 创建或接管 `Clock`/`ClockViewModel`，随后 new `CesiumWidget`，把场景配置与（可选）`DataSourceCollection` 传入。
  3. new 一个 `EventHelper`，把 clock tick、HomeButton 之类 UI 事件注册进去；销毁时统一 removeAll。
  4. 将 `CesiumWidget` 暴露的 `dataSourceDisplay`、默认 `entities`、`dataSources` 映射为自身 getter。
- **DataSourceDisplay**
  1. 构造函数 new `EventHelper`，监听 `DataSourceCollection` 的 add/remove/move 以及 `scene.postRender`。
  2. 创建 `PrimitiveCollection`/`OrderedGroundPrimitiveCollection` 并按需加入 `scene`；如集合初始为空，则延迟到首个实体或数据源出现。
  3. 遍历现有数据源调用 `_onDataSourceAdded`，并 new 默认 `CustomDataSource`（即 `viewer.entities` 对应的数据源）。
  4. 保存 `visualizersCallback`、ready 状态及延迟移除监听所需的函数句柄。
- **DataSourceCollection**
  1. 构造时仅初始化 `_dataSources` 数组和 `dataSourceAdded/Removed/Moved` 三个 `Event`。
  2. `add` 支持 Promise，resolve 后 push 并 raise `dataSourceAdded`；`remove/removeAll` 会 raise 对应事件并可 destroy 数据源。
- **EntityCollection**
  1. 初始化 `_entities` 及 `_added/_removed/_changed` 三个 `AssociativeArray`，还有 `collectionChanged` 事件与全局 guid。
  2. `add/remove` 会更新这些集合；若处于 `suspendEvents` 状态，则暂存到数组里，`resumeEvents` 时 `fireChangedEvent` 一次性触发。
- **EventHelper**
  1. 构造函数只初始化 `_removalFunctions`。
  2. `add` 将 `event.addEventListener` 返回的移除函数存储并返回一个包装闭包；`removeAll` 逐个调用后清空。

## 6. 典型调用链
1. `viewer.entities.add({ model: ... })`
2. → `EntityCollection.add` 记录实体，并通过 `collectionChanged` 通知监听者。
3. → `ModelVisualizer._onCollectionChanged`（在 `DataSourceDisplay` 初始化时注册）把实体加入 `_entitiesToVisualize`。
4. → `DataSourceDisplay.update` 每帧调用 `ModelVisualizer.update`，首次需要时 `createModelPrimitive` 触发 `Model.fromGltfAsync`，最终将 `Model` primitive 加入 `scene.primitives`。

## 7. UML 概览（文本）
```
Viewer --> DataSourceDisplay (经由 CesiumWidget)
Viewer --> EventHelper (管理 clock/UI 事件)
DataSourceDisplay *-- EventHelper (内部监听管理)
DataSourceDisplay o--> DataSourceCollection (监听 add/remove/move)
DataSourceDisplay ..> EntityCollection (监听默认数据源的 entities)
DataSourceCollection --> EntityCollection (每个数据源持有)
EntityCollection ..> EventHelper (监听者可通过 helper 注册)
```

该 UML 概括了五个核心模块之间的持有、监听与调用关系：`Viewer` 经 `CesiumWidget` 访问 `DataSourceDisplay` 与 `DataSourceCollection`；`DataSourceDisplay` 依赖 `EventHelper` 管理事件，并驱动 visualizer 监听 `EntityCollection`；`EntityCollection` 的事件又被 `ModelVisualizer` 等消费，最终生成绘制所需的 Cesium `Model`、`Primitive` 等对象。
