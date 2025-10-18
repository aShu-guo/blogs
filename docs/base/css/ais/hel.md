### 《用户管理页面AI辅助详细设计输入示例》

#### **一、 软件功能需求**

1. **数据展示**

- 根据低空资源分为无人机、机库、负载设备、操控员。

参考值为：

```ts
export const DeviceType = {
  Drone: 1, // 无人机
  Dock: 2, // 机库
  Payload: 3, // 负载设备
  Pilot: 4, // 操控员
} as const;
export type DeviceType = ConstEnum<typeof DeviceType>;
```

- 不同的设备又具有不同的状态。状态分为选中、未选中

```ts
// 机库状态
export const HomeDockStatus = {
  Online: 0, // 在线
  Idle: 1, // 空闲中
  Charging: 2, // 充电中
  Standby: 3, // 待机
};
export type HomeDockStatus = ConstEnum<typeof HomeDockStatus>;

// 无人机状态
export const HomeDroneStatus = {
  OffOnline: 0, // 离线中
  Online: 1, // 在线
};
export type HomeDroneStatus = ConstEnum<typeof HomeDroneStatus>;

// 负载设备
// 负载设备在这个维度是以类型区分的，例如：喊话器、探照灯、灵嗅设备，所以是动态的，不能通过enum实现

// 操控员状态
export const HomePilotStatus = {
  Flying: 0, // 在飞
  Standby: 1, // 待命
};
export type HomePilotStatus = ConstEnum<typeof HomePilotStatus>;
```

2. **数据操作**

- 低空资源卡片状态分为选中、未选中，点击为toggle操作
  - 例如：如果当前状态为选中，则点击后为未选中
- 选中不同的设备类型展示不同的状态or类型，点击为toggle操作
  - 例如：在低空资源卡片选中无人机卡片时，则展示无人机对应的状态
- 当类型、状态改变时，请求接口获取对应的数据，数据为树结构。需要渲染出不同机构下的设备层级
- 选中树节点时，请求接口获取对应设备列表数据

不同的设备具有不同的状态

```ts
// 机库状态
export const HomeDockStatus = {
  Online: 0, // 在线
  Idle: 1, // 空闲中
  Charging: 2, // 充电中
  Standby: 3, // 待机
};
export type HomeDockStatus = ConstEnum<typeof HomeDockStatus>;

// 无人机状态
export const HomeDroneStatus = {
  OffOnline: 0, // 离线中
  Online: 1, // 在线
};
export type HomeDroneStatus = ConstEnum<typeof HomeDroneStatus>;

// 负载设备
// 负载设备在这个维度是以类型区分的，例如：喊话器、探照灯、灵嗅设备，所以是动态的，不能通过enum实现

// 操控员状态
export const HomePilotStatus = {
  Flying: 0, // 在飞
  Standby: 1, // 待命
};
export type HomePilotStatus = ConstEnum<typeof HomePilotStatus>;
```

#### **二、 UI元素分布**

- 页面整体
  - 采用垂直布局结构。
    - 卡片头部
      - 此区域为固定高度：37px。
      - 引用一张卡片作为背景
      - 内容为左右布局flex-between
        - 左侧为文本
        - 右侧为按钮，点击后跳转详情页面
    - 设备类型卡片（水平排列）
      - 此区域为固定高度：85px。
      - 包含4个设备类型：无人机、机库、负载设备、操控员
      - 每个卡片的宽为90px，高为85px，gap为9px
      - 平铺展示
    - 状态卡片（水平排列）
      - 此区域为固定高度：30px。
      - 根据设备类型展示状态
    - 机构树与设备卡片信息（水平排列）
      - 左侧为机构树
      - 右侧为设备信息卡片
