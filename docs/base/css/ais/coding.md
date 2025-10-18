# 代码实现

角色
你是一位精通Vue 3和Element-Plus的资深前端工程师，代码风格严谨，追求高质量交付。

核心任务
根据“组件详细设计说明书”和“页面UI布局描述”，生成该Vue组件的完整、可直接使用的代码。

代码生成规则
技术栈：使用Vue 3 <script setup> 语法糖和Element-Plus 3.2。
接口处理：接口调用部分使用 // TODO: 调用后端接口 注释标记，并直接返回Mock数据。
样式：只实现布局相关的CSS，不覆盖组件库的默认样式，请使用unocss原子类框架。
单元测试：为所有计算和格式化函数编写Jest单元测试，确保核心逻辑分支覆盖率达到90%以上。
命名规范：函数和变量使用小驼峰（camelCase），事件监听器请以on开头，例如@click="onChange"。
注释规范：
所有函数声明必须有JSDoc风格的详细注释。
函数体内部的关键步骤需要有单行注释。
重要：注释必须独立成行，不能与代码在同一行。
正确示例:
// 获取用户信息
const user = getUser();
错误示例:
const user = getUser(); // 获取用户信息

代码风格：统一使用单引号，行末不加分号。
国际化 (i18n)：代码中所有面向用户的文本（如按钮文字、标签、提示信息等），都必须使用一个假设已存在的国际化函数 t() 进行包裹，并为其分配合理的key。
（国际化要求按需添加）
正确示例: <button>{{ t('common.submit') }}</button> 或 const msg = t('errors.network');
错误示例: <button>提交</button> 或 const msg = '网络错误';

输出要求
最终产物：你提供的回答只应包含以下两项内容
一个完整的Vue组件代码块，用 ```vue 包裹。不要在代码块前后添加任何解释或说明。
一份Jest单元测试代码文件。

参考信息
以下所有文本都是组件的详细设计说明书：

```text
# 组件清单（按“被依赖项优先”）

1. `ArrowNav` — 左右箭头导航（复用）
2. `ScrollableRow` — 可左右滚动的行，超出宽度展示`ArrowNav`
3. `StatusTag` — 状态展示小件（多态，支持不同设备状态映射）
4. `DeviceCard` — 设备卡片（通用，支持 Drone/Dock/Payload/Pilot）
5. `DeviceTypeSelector` — 顶部四类卡片行（水平、图片背景、选中样式）
6. `DeviceTree` — 左侧机构树（默认选中第一个节点，节点选中事件）
7. `DeviceList` — 右侧设备列表（接收树节点与设备类型，渲染`DeviceCard`）
8. `DeviceDetailPanel` — 右侧/下方详情面板（显示选中设备详情）
9. `HomeDevicePage` — 页面入口组件（组合上述组件、管理状态/调用接口）
10. `pinia` store（`useDeviceStore`）— 全局共享状态与异步请求封装

---

# 全局约定 / 类型

* 使用 Element-Plus 3.2 组件库（例如 `el-button`、`el-card`、`el-tree`、`el-image`、`el-spinner` 等）
* TypeScript + Vue 3 (Composition API)
* 推荐状态管理：**Pinia**（store 名称 `useDeviceStore`）
* 设备类型枚举（来自需求）

```ts
export const DeviceType = {
  Drone: 1,
  Dock: 2,
  Payload: 3,
  Pilot: 4,
} as const;
export type DeviceType = 1|2|3|4;
```

* 各类状态常量同需求文档定义
* 所有 API 调用应有 loading、error、empty 三态处理并暴露给上层组件

---

# 组件详细设计

## 1. ArrowNav

**用途**：左右箭头按钮，供水平溢出行滚动使用。
**UI 元素**：

* `el-button`（icon）两种方向：`left` / `right`
* 可选禁用样式（当到头或尾时禁用）

**Props**

```ts
props: {
  direction: { type: String as () => 'left'|'right', required: true },
  disabled: { type: Boolean, default: false },
  size: { type: String, default: 'small' } // Element-Plus size
}
```

**对外 API / Emits**

* `@click`（native） — 点击事件（外部监听即可）

**内部状态**

* 无复杂内部状态，仅原生事件触发

**内部函数（含异常处理）**

* `handleClick()`：如果 `disabled` 为 `true`，直接 `return`；否则 emit click

    * 错误处理：无网络依赖，仅防抖（可选）以避免高频点击

**依赖关系**

* 被 `ScrollableRow` 使用

---

## 2. ScrollableRow

**用途**：在水平排列的卡片行中处理溢出与箭头控制（用于 `DeviceTypeSelector` 与 `DeviceList` 的横向场景）。
**UI 元素**

* 外层容器 `div`（overflow hidden）
* 内容容器 `div`（display: flex; white-space: nowrap）
* `ArrowNav` 左/右
* 可选分页指示器（小圆点，可选）

**Props**

```ts
props: {
  autoHideArrows: { type: Boolean, default: true },
  gap: { type: Number, default: 12 },
  showDots: { type: Boolean, default: false }
}
```

**Slots**

* `default`：行内内容（卡片集合）

**对外 API / Emits**

* `@scroll` — 向外暴露滚动位置信息
* `scrollToIndex(index: number)` — 公共方法（通过 `ref` 调用）

**内部状态**

* `canScrollLeft: boolean`
* `canScrollRight: boolean`
* `containerWidth`, `contentWidth`, `scrollLeft`

**内部函数（含异常处理）**

* `updateScrollState()`：计算是否需要显示箭头（在 resize / slot 改变后执行）

    * 捕获异常：当 DOM 未就绪时保护性判断，不抛出
* `onArrowClick(direction)`：执行平滑滚动，支持防抖与节流

    * 异常：若滚动 API 不支持，使用 `scrollLeft` fallback
* `scrollToIndex(i)`：定位到第 i 个元素（try/catch，若索引越界则 clamp）

**依赖关系**

* 使用 `ArrowNav`
* 被 `DeviceTypeSelector` 使用

---

## 3. StatusTag

**用途**：对设备状态的视觉化（small badge / tag），支持不同设备 type 的状态映射与 color 映射。
**UI 元素**

* `el-tag` 或自定义小圆角 Badge
* 可选 tooltip 显示更详细状态描述

**Props**

```ts
props: {
  deviceType: { type: Number as () => DeviceType, required: true },
  status: { type: [Number, String], required: true }, // 状态码或描述
  size: { type: String, default: 'small' },
  showTooltip: { type: Boolean, default: false }
}
```

**对外 API**

* 无

**内部状态**

* `label: string`（映射后的显示文本）
* `visualType: 'success'|'warning'|'danger'|'info'`（映射后用于样式）

**内部函数（含异常处理）**

* `mapStatus()`：把不同设备状态 map 到标签文案与颜色（内置映射表）

    * 如果遇到未知状态，返回 `Unknown` 并设置 `visualType='info'`
* `maybeShowTooltip()`：当 `showTooltip` 且 label 较长时显示 `el-tooltip`

**依赖关系**

* 被 `DeviceCard`、`DeviceList` 使用

---

## 4. DeviceCard

**用途**：渲染单个设备卡片（通用）。必须适配 4 类设备显示信息差异。卡片背景与选中背景均为图片。
**UI 元素**

* `el-card` 或自定义 `div` 卡片容器
* 背景图片 `el-image`（cover）
* 左上或右上 `StatusTag`
* 名称（text）
* 子文本（例如：电量 / 拥有的执飞设备等）
* 选中阴影/边框（切换背景图片为选中图）
* 点击 hover / active 效果
* 可显示 loading、error（占位图）

**Props**

```ts
props: {
  device: { type: Object as () => DeviceModel, required: true },
  deviceType: { type: Number as () => DeviceType, required: true },
  selected: { type: Boolean, default: false },
  showControls: { type: Boolean, default: false }, // 额外交互（如操作按钮）
  imgSize: { type: String, default: '120x80' } // 用于图片占位
}
```

`DeviceModel`（示例）

```ts
type DeviceModel = {
  id: string;
  name: string;
  status: number | string;
  battery?: number; // 0-100
  imgUrl?: string;
  extra?: Record<string, any>; // 负载设备可能携带类型字段
}
```

**对外 API / Emits**

* `@click` -> `select` emit：`(deviceId: string)`
* `@action` -> `action` emit：可触发卡片内的操作（如远程唤醒）

**内部状态**

* `isLoading: boolean`
* `imgLoaded: boolean`
* `imgError: boolean`

**内部函数（含异常处理）**

* `onClick()`：emit select，若卡片处于 loading/disabled，则阻断
* `loadImage()`：预加载背景图（处理 `onerror` 回退为占位图片）

    * 错误策略：记录 `imgError`，展示默认占位图，并写 log（可上报）
* `formatSecondaryText()`：根据 `deviceType` 返回卡片次要信息（例如：电量 -> `${battery}%` 或 `执飞设备: Drone-001`，若数据缺失展示 `—`）
* `handleAction(actionType)`：执行内置 action（含 try/catch 并触发 `action` emit 包含 `error`）
* 可选 keyboard accessible handlers（Enter / Space）

**依赖关系**

* 使用 `StatusTag`
* 被 `DeviceList`、`DeviceDetailPanel`（preview）使用

---

## 5. DeviceTypeSelector

**用途**：顶部四张卡片（无人机、机库、负载设备、操控员），水平排列且不换行；每张卡片背景图，选中态背景替换图片。
**UI 元素**

* 使用 `ScrollableRow` 包裹四张 `DeviceCard`（或轻量模板）
* 每张卡片呈现图 + 文本 + 选中态阴影
* 对应设备类型图与选中图两张地址（或 CSS class 切换）

**Props**

```ts
props: {
  value: { type: Number as () => DeviceType, required: true }, // v-model: selected deviceType
  items: { type: Array as () => Array<{type:number, title:string, img:string, selectedImg?:string}>, required: true },
  compact: { type: Boolean, default: false }
}
```

**Emits**

* `update:value` (deviceType)
* `select` (deviceType)

**内部状态**

* `localSelected`（受 `v-model` 控制）
* `showArrows`（来自 `ScrollableRow`）

**内部函数（含异常处理）**

* `onSelect(type)`：更新 `v-model` 并 emit `select`
* `ensureVisible(type)`：当选择项不在可见区域时通过 `ScrollableRow.scrollToIndex` 滚动到可见

    * 错误处理：若 scroll 方法不可用，忽略并留下可访问的焦点

**依赖关系**

* 使用 `ScrollableRow`、`DeviceCard`（轻量样式）
* 被 `HomeDevicePage` 使用

---

## 6. DeviceTree

**用途**：左侧机构树组件，展示树结构，默认选中第一个节点；选择节点时 emit 事件以触发右侧设备刷新。
**UI 元素**

* `el-tree`（带图标/自定义节点插槽）
* 可搜索小输入框（可选）
* 加载占位 / 空态提示

**Props**

```ts
props: {
  treeData: { type: Array as () => TreeNode[], required: true },
  loading: { type: Boolean, default: false },
  selectedKey: { type: [String, Number], default: null },
  showSearch: { type: Boolean, default: true }
}
```

`TreeNode` 示例：

```ts
type TreeNode = {
  id: string;
  label: string;
  children?: TreeNode[];
}
```

**Emits**

* `select(nodeId: string)` — 用户选择节点
* `ready()` — 当组件渲染并且完成默认选中后发出（方便上层触发首个设备请求）

**内部状态**

* `internalSelected`（当前选中节点 id）
* `filterText`（搜索输入）
* `flattenedNodes`（索引加速）

**内部函数（含异常处理）**

* `selectFirstNode()`：在 `treeData` 加载后自动选择第一个可用节点并 emit `select`

    * 错误处理：若 `treeData` 为空，emit 空态通知
* `onNodeSelect(node)`：更新 `internalSelected` 并 emit `select`
* `filterTree(text)`：tree 的本地前端筛选（防止服务端请求过多）

    * 若树过大（>1000 节点），建议上层服务端支持搜索（组件会发出特殊事件 `search`）
* 对 `el-tree` 的 `key` 使用 `id`，保证稳定性

**依赖关系**

* 被 `HomeDevicePage` 使用

---

## 7. DeviceList

**用途**：右侧渲染选中部门下的设备，使用 `DeviceCard` 网格/行展示；默认选中第一个设备（若有），并 emit 选中事件。若设备类型为负载类且数量动态，可横向滚动或分页。
**UI 元素**

* 顶部简易统计（总数 / 在线数 / 筛选）
* `ScrollableRow`（当为横向场景，例如负载设备的动态类型一行展示）
* Grid 布局（`display: grid` 或 Element 的列组件）
* 空态 / loading / 错误提示

**Props**

```ts
props: {
  deviceType: { type: Number as () => DeviceType, required: true },
  nodeId: { type: [String, Number], required: true },
  devices: { type: Array as () => DeviceModel[], default: () => [] },
  loading: { type: Boolean, default: false }
}
```

**Emits**

* `select(deviceId: string)`
* `action(deviceId: string, actionType: string)`

**内部状态**

* `localSelectedDeviceId`
* `page` / `pageSize`（若需要分页）
* `layoutMode`（grid / row，grid 默认）

**内部函数（含异常处理）**

* `selectFirstDevice()`：在 devices 加载后默认选中第一个并 emit

    * 错误处理：若 devices 为空，emit 空态
* `onDeviceClick(device)`：更新本地选中并 emit `select`
* `renderCardByType(device)`：为不同类型传入不同 props（比如 pilot 需要显示执飞设备）
* 数据缺失策略：若 device 中关键字段缺失，使用占位符并记录 telemetry（上报）

**依赖关系**

* 使用 `DeviceCard`、`ScrollableRow`、`StatusTag`
* 被 `HomeDevicePage` 使用

---

## 8. DeviceDetailPanel

**用途**：显示选中设备的详细信息（图片、名称、完整状态、历史/操作按钮等）。对于操控员显示其执飞设备列表。
**UI 元素**

* `el-drawer` 或右侧固定面板（可收缩）
* 头部：名称 + 状态 Tag + 操作按钮（例如：远程入库、刷新）
* 主体：图片大图、信息列表（Key-Value）、如果是 drone/dock 展示电量进度、历史 log 段（lazy load）
* Footer：二次操作（如分配、编辑）

**Props**

```ts
props: {
  deviceId: { type: [String, Number], required: true },
  visible: { type: Boolean, default: true }
}
```

**Emits**

* `close()`
* `action`（执行操作后的结果回调）

**内部状态**

* `detailLoading`
* `detailError`
* `deviceDetail`（完整数据结构）
* `historyLoading`

**内部函数（含异常处理）**

* `fetchDetail()`：调用 `GET /api/device/:id` 拉取详情

    * 错误处理：重试策略（最多 1 次），若失败展示错误面板并提供 `重试` 按钮
    * 成功后格式化日期、数值并更新 UI
* `performAction(actionType)`：发起 action POST 请求，返回 promise，UI 显示 loading 并在失败时回滚本地状态

    * 错误处理：展示具体错误（来自后端 message），并记录失败原因
* `closePanel()`：emit `close`

**依赖关系**

* 被 `HomeDevicePage` 使用作为右侧详情面板

---

## 9. HomeDevicePage（页面入口，最高优先）

**用途**：组合以上组件，负责全局状态、Pinia store 的初始化、以及串联 API（根据选中 deviceType 与 tree node 请求设备列表、设备详情等）。负责把“默认选中第一个节点/设备”的业务规则落地。
**UI 布局**

* 顶部：`DeviceTypeSelector`
* 主体：左右布局

    * 左：`DeviceTree`（宽度固定，如 280px）
    * 右：`DeviceList`（占满剩余宽度），上方可有统计/筛选
* 详情：`DeviceDetailPanel`（Drawer / 右侧面板）

**使用的 Element-Plus 组件**：`el-row`、`el-col`、`el-divider`、`el-spin`、`el-empty` 等

**依赖关系**

* 依赖 `useDeviceStore` Pinia store（详见下文）
* 使用 `DeviceTypeSelector`, `DeviceTree`, `DeviceList`, `DeviceDetailPanel`

**生命周期与核心逻辑**

1. 页面 mount -> load supported device type metadata（若需要）并设置 `selectedType`（默认：Drone 或第一个 items）
2. 当 `selectedType` 变化 -> 调用 `store.fetchTree(selectedType)` 拉取树结构
3. `DeviceTree` 接收到 treeData 并触发 `ready` -> `HomeDevicePage` 根据 store 的 `tree` 默认选择第一个节点
4. 节点选中 -> 调用 `store.fetchDevices(selectedType, nodeId)` 更新设备列表
5. `DeviceList` 加载完成 -> 默认选中第一个设备 -> `store.selectDevice(deviceId)` -> `DeviceDetailPanel` 发起详情请求
6. 用户在 `DeviceTypeSelector` 切换类别 -> 整个流程重跑（tree -> first node -> devices -> first device）

**错误恢复 / UX 说明**

* 若 tree 接口失败：展示左侧 `el-empty` + `重试` 按钮（`store.fetchTree`）
* 若 devices 接口失败：展示右侧 `el-empty` + 具体错误信息 + `重试`
* 所有网络交互显示统一 loading 遮罩（但不阻塞用户切换其它 deviceType）
* 在发生并发切换（快速切换 deviceType）时，使用请求去重/取消（`AbortController` 或 axios cancel token）

---

# Pinia Store 设计：`useDeviceStore`

**职责**：全局管理 deviceType / tree / devices / selected node / selected device / loading / error。对外提供 CRUD 风格的异步方法并处理并发与缓存。

**State**

```ts
state: {
  selectedType: DeviceType | null,
  tree: TreeNode[],
  treeLoading: boolean,
  treeError: string | null,

  selectedNodeId: string | null,

  devicesByNode: Record<string, DeviceModel[]>, // 缓存
  devicesLoading: boolean,
  devicesError: string | null,

  selectedDeviceId: string | null,
  deviceDetailCache: Record<string, DeviceDetail>,
  deviceDetailLoading: boolean,
  deviceDetailError: string | null,

  ui: {
    pageSize: number
  }
}
```

**Actions**

* `setSelectedType(type)`
* `fetchTree(type)` — GET `/api/tree?deviceType=${type}`

    * 并发控制：如果在上一次未完成，取消旧请求或记录最新请求 id，忽略旧结果
    * 错误处理：state.treeError = message；throw error（供调用页面处理）
* `selectNode(nodeId)` — 设置 `selectedNodeId` 并触发 `fetchDevices(nodeId)`
* `fetchDevices(nodeId)` — GET `/api/devices?nodeId=${nodeId}&deviceType=${selectedType}`

    * 支持缓存：若 `devicesByNode[nodeId]` 已有并未过期，则直接返回缓存
    * 错误处理同上
* `selectDevice(deviceId)` — set selectedDeviceId 并（可选）触发 `fetchDeviceDetail(deviceId)`
* `fetchDeviceDetail(deviceId)` — GET `/api/device/${deviceId}`

    * 重试策略（1 次）与错误回显
* `performDeviceAction(deviceId, action, payload)` — POST `/api/device/${id}/action`

    * optimistic update 支持（若 action 有本地可见变更），失败则回滚

**Getters**

* `currentDevices` — 根据 `selectedNodeId` 返回 devices（或 []）
* `selectedDevice` — 返回选中设备基本模型
* `statsForCurrentNode` — 汇总（total/online/count by status）

**错误与监控**

* 所有 action 在捕获异常时都会设置对应 `*Error` 字段；并返回一个标准错误对象 `{ code, message }` 以便组件显示
* store 支持 `clearCache()`，在需要时可清空 `devicesByNode` 或 `deviceDetailCache`

---

# API 约定（示例）

* `GET /api/tree?deviceType={deviceType}` → `{ tree: TreeNode[] }`
* `GET /api/devices?nodeId={nodeId}&deviceType={deviceType}` → `{ devices: DeviceModel[] }`
* `GET /api/device/{id}` → `{ device: DeviceDetail }`
* `POST /api/device/{id}/action` body `{ action: string, payload?: any }` → `{ success: boolean, data?: any }`

**网络层实现建议**

* axios + interceptors（统一错误解析）
* 使用请求取消（AbortController / axios cancel token）防止竞速
* 所有请求在 catch 后不直接 alert，而是把 error message 写入 store 对应错误字段

---

# 核心业务流程（Mermaid Graph TD — 页面入口组件流程）

```mermaid
graph TD
A[页面载入 HomeDevicePage] --> B[初始化 selectedType（默认或缓存）];
B --> C[调用 store.fetchTree(selectedType)];
C --> D{tree 请求返回};
D -- 成功 --> E[DeviceTree 渲染，默认选中第一个节点];
D -- 失败 --> F[左侧显示错误/重试按钮];

E --> G[HomeDevicePage 触发 store.selectNode(firstNodeId)];
G --> H[调用 store.fetchDevices(selectedNodeId)];
H --> I{devices 请求返回};
I -- 成功 --> J[DeviceList 渲染设备卡片，并默认选中第一个设备];
I -- 失败 --> K[右侧显示错误/重试按钮];

J --> L[store.selectDevice(firstDeviceId)];
L --> M[DeviceDetailPanel 打开并调用 store.fetchDeviceDetail(deviceId)];
M --> N{deviceDetail 请求返回};
N -- 成功 --> O[DeviceDetailPanel 显示完整信息（图片/电量/操作）];
N -- 失败 --> P[DeviceDetailPanel 显示错误并提供重试];

subgraph 用户交互流程
U1[用户点击顶部 DeviceType 卡片] --> U2[更新 selectedType 并触发 fetchTree];
U2 --> C

U3[用户在 DeviceTree 点击其他节点] --> U4[触发 store.selectNode(nodeId) -> fetchDevices];
U4 --> H

U5[用户点击 DeviceCard] --> U6[store.selectDevice(deviceId) -> 打开 DeviceDetailPanel];
U6 --> M

U7[用户在 DeviceList（负载设备）横向滚动] --> U8[ScrollableRow 显示左右 ArrowNav 按钮]
end
```

---

# 关键 UX & 边界情况处理（要点）

1. **默认选中规则**：树加载成功后 `DeviceTree` 触发 `ready`，`HomeDevicePage` 选择第一个可见节点；设备列表加载成功后默认选中第一个设备并自动打开详情面板（可配置关闭）。
2. **图片/背景**：卡片背景与选中背景都为图片资源，若图片加载失败使用占位图，并在 UI 上用较弱对比度提示“图片加载失败”。
3. **负载设备类型动态**：若负载设备种类超过容器宽度，`ScrollableRow` 显示左右箭头，支持 `next/prev` 平滑滚动。箭头禁用态指示到头。
4. **并发与请求取消**：当用户快速切换 deviceType 或节点时，必须取消旧请求或忽略旧请求返回（以避免旧响应覆盖新数据）。建议使用 `AbortController` 或 axios cancel token。
5. **状态共享**：多个组件（DeviceTypeSelector、DeviceTree、DeviceList、DeviceDetailPanel）共享选中 deviceType/ node / device 状态，推荐使用 Pinia（已设计）。
6. **无过度拆分**：组件拆分以复用为主（例如 `DeviceCard` 通用），避免为每类设备做独立 Card 组件，但在 `DeviceCard` 内通过 `deviceType` 分支渲染不同字段。
7. **可访问性**：卡片支持 keyboard 选择（Enter 激活），箭头可通过 aria-label 标注；`el-tooltip` 提示不可见文本。
8. **错误提示**：后端错误信息应在 UI 中以 human-friendly 文本展示（若后端返回 code + message，则 message 显示给用户并在 console 记录 code）。
9. **性能**：树数据若巨大，推荐后端支持按需加载（懒加载 children）或搜索 API；前端对 device 列表使用虚拟滚动（若单页 > 100）。


