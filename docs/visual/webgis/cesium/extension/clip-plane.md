# Cesium 裁剪平面（Clipping Plane）详解

## 概述

裁剪平面（Clipping Plane）是Cesium中用于裁剪3D几何体的重要功能。本文档详细介绍了在虚拟驾驶舱（Virtual Cockpit）中使用裁剪平面来裁剪视锥体（Frustum）在地表以下部分的实现原理。

## 应用场景

在虚拟驾驶舱中，我们需要显示相机的视锥体，但不希望视锥体穿透地表显示在地下。使用裁剪平面可以实现：

- 只显示地表以上的视锥体部分
- 提升视觉真实感
- 避免地下几何体的渲染

```
        视锥体（完整）
          /|\
         / | \
        /  |  \
       /   |   \
━━━━━━━━━━━━━━━━━  ← 地表（裁剪平面）
      ✂️裁剪掉这部分
```

## 代码实现

### 完整代码

```typescript
// 位置：src/common/composables/useVirtualCockpit/frustum-layer.ts

// 1. 计算相机位置投影到地表的点
const cartographic = Cartographic.fromCartesian(options.cameraPosition);
cartographic.height = 0; // 地表
const surfacePoint = Ellipsoid.WGS84.cartographicToCartesian(cartographic);

// 2. 计算地表法向量
const normal = Ellipsoid.WGS84.geodeticSurfaceNormal(
  surfacePoint,
  new Cartesian3(),
);

// 3. 计算平面到原点的距离
const distance = -Cartesian3.dot(normal, surfacePoint);

// 4. 创建裁剪面
const clippingPlane = new ClippingPlane(normal, distance);
const clippingPlanes = new ClippingPlaneCollection({
  planes: [clippingPlane],
  unionClippingRegions: true,
});

// 5. 应用到视锥体primitive
this.frustumPrimitive = new Primitive({
  geometryInstances: [instanceGeo],
  appearance: new PerInstanceColorAppearance({
    closed: true,
    flat: true,
  }),
  asynchronous: false,
});
(this.frustumPrimitive as any).clippingPlanes = clippingPlanes;
```

## 分步详解

### 步骤1：计算地表投影点

```typescript
const cartographic = Cartographic.fromCartesian(options.cameraPosition);
cartographic.height = 0; // 地表
const surfacePoint = Ellipsoid.WGS84.cartographicToCartesian(cartographic);
```

**目的：** 获取相机位置在地表上的投影点

**过程：**

1. 将相机位置从笛卡尔坐标（世界坐标系）转换为地理坐标（经度、纬度、高度）
2. 将高度设置为0，表示地表高度
3. 再将地理坐标转回笛卡尔坐标，得到地表投影点

**示例：**

```typescript
// 假设相机在北京上空1000米
// 输入：cameraPosition = {x: -2175033, y: 4392098, z: 4071623}
// 输出：surfacePoint = {x: -2169511, y: 4385890, z: 4066234} (地表)
```

### 步骤2：计算地表法向量

```typescript
const normal = Ellipsoid.WGS84.geodeticSurfaceNormal(
  surfacePoint,
  new Cartesian3(),
);
```

**目的：** 获取地表在该点的法向量（垂直于地表向上的方向）

**关键点：**

- 法向量是相对于**地心（世界坐标原点）**的向量
- 法向量从地心指向地表该点，延伸到天空
- 法向量是归一化的（长度为1）

**坐标系说明：**

Cesium使用**ECEF坐标系（Earth-Centered, Earth-Fixed）**：

```
         Z轴 (北极)
          ↑
          |
          |
    ------+------→ X轴 (本初子午线)
         /|
        / |
       /
      ↙
    Y轴 (东经90°)
```

**法向量的几何意义：**

```
                天空
                 ↑  normal (世界坐标向量)
                 |
                 |
    ━━━━━━━━━━━━●━━━━━━━━━━━ 地表（椭球面）
         surfacePoint

                 |
                 |
                 ○  地心（原点）
               (0, 0, 0)
```

**为什么法向量相对于地心？**

1. **Cesium的所有计算在世界坐标系中进行**
2. **地球是椭球体**，不同位置的"向上"方向在世界坐标系中指向不同
3. **统一的坐标系**便于不同对象之间的几何计算

**示例：**

```typescript
// 北京地表点的法向量
const surfacePoint = { x: -2169511, y: 4385890, z: 4066234 };
const normal = { x: -0.337, y: 0.681, z: 0.649 }; // 归一化向量

// 验证归一化：√(x² + y² + z²) = √(0.337² + 0.681² + 0.649²) ≈ 1
```

### 步骤3：计算平面方程的距离参数

```typescript
const distance = -Cartesian3.dot(normal, surfacePoint);
```

**目的：** 计算平面方程中的常数项 `d`

**数学原理：**

3D空间中的平面方程：

```
n·x + d = 0
```

其中：

- `n` 是平面的法向量（normal）
- `x` 是平面上的任意点
- `d` 是常数项
- `·` 表示点乘（dot product）

变换得到：

```
d = -n·x
```

**点乘计算：**

```typescript
// 点乘公式
dot(n, p) = n.x * p.x + n.y * p.y + n.z * p.z

// 具体示例
const surfacePoint = {x: -2169511, y: 4385890, z: 4066234};
const normal = {x: -0.337, y: 0.681, z: 0.649};

const dotProduct = (-0.337) * (-2169511) +
                   0.681 * 4385890 +
                   0.649 * 4066234
                 = 731145 + 2986791 + 2639006
                 = 6356942

const distance = -dotProduct = -6356942;
```

**几何意义：**

`distance` 表示平面到坐标原点（地心）的有向距离，约为地球半径（6371km）

**为什么要加负号？**

在Cesium的 `ClippingPlane` 定义中：

- 平面方程：`n·x + d = 0`
- **保留区域**：`n·x + d ≥ 0` 的点会被保留
- **裁剪区域**：`n·x + d < 0` 的点会被裁剪掉

加负号确保裁剪方向正确：

```
          法向量 n (指向天空)
              ↑
              |
━━━━━━━━━━━━━━━━━━  ← 地表平面
   保留上方 (n·x + d ≥ 0)
━━━━━━━━━━━━━━━━━━
   裁剪下方 (n·x + d < 0)
       ↓
    地心 (原点)
```

**验证示例：**

```typescript
// 对于地表点：
n·surfacePoint + d = 6356942 + (-6356942) = 0 ✓ (在平面上)

// 对于天空中的点 (距地表1000米)：
const skyPoint = {x: -2175033, y: 4392098, z: 4071623};
n·skyPoint + d = 6357942 + (-6356942) = 1000 > 0 ✓ (保留)

// 对于地下点：
const undergroundPoint = {x: -2164000, y: 4379000, z: 4061000};
n·undergroundPoint + d = 6355942 + (-6356942) = -1000 < 0 ✓ (裁剪)
```

### 步骤4：创建裁剪平面

```typescript
const clippingPlane = new ClippingPlane(normal, distance);
const clippingPlanes = new ClippingPlaneCollection({
  planes: [clippingPlane],
  unionClippingRegions: true,
});
```

**参数说明：**

1. **ClippingPlane 构造函数**

   ```typescript
   new ClippingPlane(normal: Cartesian3, distance: number)
   ```

   - `normal`: 平面法向量（世界坐标系）
   - `distance`: 平面方程的常数项 `d`

2. **ClippingPlaneCollection 配置**
   - `planes`: 裁剪平面数组（可以有多个）
   - `unionClippingRegions`:
     - `true`: 使用并集模式（保留所有平面的"保留区域"的并集）
     - `false`: 使用交集模式（保留所有平面的"保留区域"的交集）

**unionClippingRegions 示例：**

```
并集模式 (true):              交集模式 (false):
  保留A ∪ 保留B                 保留A ∩ 保留B

    平面A   平面B                 平面A   平面B
      |       |                     |       |
  ████|   ████|                 ████|   ████|
  ████|   ████|                 ████|   ████|
━━━━━━━━━━━━━━━━            ━━━━━━━━━━━━━━━━
  保留|保留|保留                  |保留|裁剪|裁剪
     |    |                         |   |
```

### 步骤5：应用裁剪平面

```typescript
this.frustumPrimitive = new Primitive({
  geometryInstances: [instanceGeo],
  appearance: new PerInstanceColorAppearance({
    closed: true,
    flat: true,
  }),
  asynchronous: false,
});
(this.frustumPrimitive as any).clippingPlanes = clippingPlanes;
```

**关键点：**

- 将裁剪平面集合应用到 Primitive 上
- 使用类型断言 `as any` 是因为 TypeScript 定义可能不完整
- 裁剪在GPU中自动执行，性能高效

## 数学公式总结

### 平面方程

```
n·x + d = 0
```

展开形式：

```
n.x * x + n.y * y + n.z * z + d = 0
```

### 距离计算

```
d = -n·p
```

其中 `p` 是平面上的已知点（本例中是 `surfacePoint`）

### 点到平面的有向距离

对于空间中任意点 `q`，其到平面的有向距离为：

```
dist = (n·q + d) / |n|
```

由于 `n` 已归一化（`|n| = 1`），简化为：

```
dist = n·q + d
```

- `dist > 0`: 点在平面法向量指向的一侧（保留）
- `dist = 0`: 点在平面上
- `dist < 0`: 点在平面法向量相反的一侧（裁剪）

## 实际应用效果

### 裁剪前后对比

**裁剪前：**

```
        视锥体穿透地表
          /|\
         / | \
        /  |  \
       /   |   \
      /    |    \
     /     |     \
━━━━━━━━━━●━━━━━━━━  地表
    /      |      \
   /       |       \  ← 不真实的地下部分
  /________|________\
```

**裁剪后：**

```
        视锥体止于地表
          /|\
         / | \
        /  |  \
       /   |   \
━━━━━━━━━━●━━━━━━━━  地表（裁剪平面）
  地下部分已被裁剪 ✂️
```

## 常见问题

### Q1: 为什么不使用局部坐标系？

**A:** Cesium的所有几何计算在统一的世界坐标系（ECEF）中进行，这样：

- 不同位置的对象可以正确交互
- 避免坐标系转换的性能开销
- 简化多对象场景的计算

### Q2: 法向量为什么要归一化？

**A:** 归一化后的法向量（长度为1）使得：

- 点到平面的距离计算更简单：`dist = n·p + d`
- 避免浮点运算误差累积
- 符合数学标准定义

### Q3: 可以使用多个裁剪平面吗？

**A:** 可以！例如同时裁剪地表和天空：

```typescript
const groundPlane = new ClippingPlane(groundNormal, groundDistance);
const skyPlane = new ClippingPlane(skyNormal, skyDistance);

const clippingPlanes = new ClippingPlaneCollection({
  planes: [groundPlane, skyPlane],
  unionClippingRegions: false, // 交集：同时满足两个条件
});
```

### Q4: distance 的单位是什么？

**A:** 米（Meter），与Cesium的世界坐标系单位一致。例如 `-6356942` 约等于地球半径（6371km）。

## 性能优化建议

1. **静态裁剪平面缓存**

   ```typescript
   // 如果地表裁剪平面不变，只创建一次
   private static groundClippingPlanes: ClippingPlaneCollection;
   ```

2. **减少裁剪平面数量**
   - 每个裁剪平面都有计算开销
   - 通常1-4个裁剪平面性能良好

3. **按需启用裁剪**
   ```typescript
   // 只在需要时应用裁剪
   if (needClipping) {
     primitive.clippingPlanes = clippingPlanes;
   }
   ```

## 参考资料

- [Cesium ClippingPlane API](https://cesium.com/learn/cesiumjs/ref-doc/ClippingPlane.html)
- [Cesium ClippingPlaneCollection API](https://cesium.com/learn/cesiumjs/ref-doc/ClippingPlaneCollection.html)
- [平面方程 - 维基百科](<https://en.wikipedia.org/wiki/Plane_(geometry)>)
- [ECEF坐标系统](https://en.wikipedia.org/wiki/Earth-centered,_Earth-fixed_coordinate_system)

## 总结

裁剪平面是Cesium中强大的几何裁剪工具，通过理解其数学原理和坐标系统，我们可以：

1. 正确创建裁剪平面
2. 理解法向量和距离参数的含义
3. 应用到实际项目中（如虚拟驾驶舱）
4. 优化性能和视觉效果

关键要点：

- 法向量相对于地心（世界坐标系）
- 距离参数 `d = -n·p` 定义平面位置
- 保留区域：`n·x + d ≥ 0`
- 裁剪区域：`n·x + d < 0`
