# OpenLayers

在学习OpenLayers之前，我们需要学习一些空间地理的相关知识，只需要涉及一些基础的地理信息。这些知识，相信在初中地理老师已经教过我们，只是有些遗忘了而已，是时候拾起来了。

在这章中介绍经纬度相关的概念、墨卡托投影以及墨卡托投影中存在的墨卡托失真的问题。

## 经度与纬度

地理坐标系一般是指由经度、纬度和相对高度组成的坐标系，能够标示地球上的任何一个位置。经度和纬度常合称为经纬度。

1. 2D中的经纬度表示

<div style="display: flex;justify-content: center">
    <img style="background: white" src="/imgs/visual/openlayers/index-2.png">
</div>

2. 3D中的经纬度表示

<div style="display: flex;justify-content: center">
    <img style="background: white" src="/imgs/visual/openlayers/index-1.png">
</div>

- λ：经度，线面角
- φ：纬度，二面角

### 纬度

纬度是指某点与`地球球心`的连线和`地球赤道面`所成的`线面角`，其数值在0至90度之间。简写如下

- 位于赤道以北的点的纬度叫北纬，记为N
- 位于赤道以南的点的纬度称南纬，记为S。

<div style="display: flex;justify-content: center;position:relative;">
    <div style="width:300px;height: 1px;position:absolute;top: 50%;left: 50%;background: red;transform: translateX(-50%) translateY(-50%)"></div>
    <img style="background: white" src="/imgs/visual/openlayers/index-3.png">
</div>

### 经度

经度是一种用于确定地球表面上不同点`东西位置`的地理坐标。经度是一种角度量，通常用度来表示，并被记作希腊字母λ(lambda)。

不同于纬度，可以使用赤道作为自然的起点。经度没有自然的起点而使用经过伦敦格林尼治天文台旧址的子午线作为起点。东经180°即西经180°。

按照惯例，本初子午线是经过`伦敦格林威治皇家天文台`
的子午线，是0度经线所在地。其他位置的经度是通过测量其从本初子午向东至180°E向西至180°W，而且东经180°即西经180°，约等同于国际日期变更线，国际日期变更线的两边，日期相差一日。

- 位于子午线以西的点的经度叫西经，记为W
- 位于子午线以东的点的纬度称东经，记为E。

具体来说，某位置的经度是一个通过本初子午线的平面和一个通过南极、北极和该位置的平面所组成的`二面角`。

<div style="display: flex;justify-content: center;position:relative;">
    <div style="width:1px;height: 100%;position:absolute;top: 50%;left: 50%;background: red;transform: translateX(-50%) translateY(-50%)"></div>
    <img style="background: white" src="/imgs/visual/openlayers/index-3.png">
</div>

案例1:

<iframe src="https://www.geogebra.org/3d/hys59svk?embed" width="800" height="600" allowfullscreen style="border: 1px solid #e4e4e4;border-radius: 4px;" frameborder="0"></iframe>

- 黑线表示本初子午线
- B点处的经度为图中黑色夹角

:::info
此案例并不标准，因为经纬度是建模在`扁椭球`上的地理坐标系
:::

### 转换

经度和纬度的每一度被分为60角分，每一分被分为60秒。分为3个单位，分别是度（D）、分（M）、秒（S），常见的几种表示格式如下：

- DD：40.749807, 73.983673
- DMS：40° 44´ 59.305" N 73° 59´ 1.223" E
- DM：40° 44.988416666667" , 73° 59.020383333333"

有时西经被写做负数：-23.45833°。偶尔也有人把东经写为负数，但这相当不常规。

转换方法参考如下：

<<< ./codes/transform.ts

:::info
在`transformDMSFromDD`转换方法中，默认数组中经度在前、纬度在后，在不同的WebGIS框架中并不相同。例如

- OpenLayers：经度在前，纬度在后
- Leaflet：则是纬度在前，经度在后

:::

## 墨卡托投影

### EPSG:3857

Web墨卡托投影（英语：Web Mercator）是墨卡托投影的一种变体，被Web地图应用业界普遍采纳。

