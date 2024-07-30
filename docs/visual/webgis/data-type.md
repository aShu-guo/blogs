# 数据格式与转换

gis开发中涉及到的数据格式以及之间的转换

## 数据格式

### WMTS

WMTS：OpenGIS Web Map Tile Service

OGC（开放地理空间协会，英语：Open Geospatial Consortium，缩写OGC）提出的缓存技术标准的WMTS服务，通过缓存技术来替代实时对数据进行可视化用以提高地图响应能力。

![img.png](/imgs/visual/gis/index-1.png)

- WMTS：

1. 客户端请求WMTS服务时，返回给客户端是固定大小的瓦片，客户端根据索引号来获取每一张瓦片，而后拼接成地图进行展示
2. 由于瓦片的规则是固定的，服务端可以预先缓存对应的瓦片，客户端需要时直接返回即可，因而WMTS是可缓存的。

- WMS：

1. 客户端请求WMS服务时，返回给客户端是一张完整的图片，客户端取到直接展示
2. 客户端可以请求任意区域，正由于这个任意性和服务端只能返回一张指定范围的图片，复用的概率低之又低，当并发增大，服务端性能就随之大大下降，故WMS仅是重在灵活性。

### 原理

WMTS规定使用瓦片矩阵集（Tile Matrix Set）来表示切割后的地图

- 不同瓦片矩阵具有不同的比例尺（分辨率），每个瓦片矩阵由瓦片矩阵标识符（一般为瓦片矩阵的序号）进行标识。
- 分辨率最低的一层为第0层，依次向上排

![img.png](/imgs/visual/gis/index-2.png)

### GeoJSON

GeoJSON是一种基于JSON的地理空间数据交换格式，它定义了几种类型JSON对象以及它们组合在一起的方法，以表示有关地理要素、属性和它们的空间范围的数据。

定义多种类型：

<div style="display: flex;justify-content: space-between">
  <img src="/imgs/visual/gis/index-3.png">
  <img src="/imgs/visual/gis/index-10.png">
  <img src="/imgs/visual/gis/index-9.png">
  <img src="/imgs/visual/gis/index-8.png">
  <img src="/imgs/visual/gis/index-7.png">
  <img src="/imgs/visual/gis/index-6.png">
  <img src="/imgs/visual/gis/index-5.png">
  <img src="/imgs/visual/gis/index-4.png">
</div>

### KML

是基于XML语法标准的一种标记语言

- 采用标记结构，含有嵌套的元素和属性，
- 用来表达地理标记，显示地理数据（包括点、线、面、多边形，多面体以及模型...）。
- 属于Google生态

### KMZ

KMZ文件是谷歌公司研发的一种地标信息压缩文件。实际上就是KML文件再加上图片压缩而成。

### SHP

ESRI Shapefile（shp），或简称shapefile

- 美国环境系统研究所公司（ESRI）开发的空间数据开放格式。
- 地理信息软件界的开放标准
- 用于描述几何体对象：点、折线与多边形
- 存储井、河流、湖泊等空间对象的几何位置以及属性，例如河流的名字、城市的温度

### 3DTiles

cesium提供的一种高性能加载地图大量数据一种格式

### DWG

AutoCAD导出的专有文件格式

## 数据格式转换

### obj to gltf glb b3dm 3dtiles

1. [obj2gltf](https://github.com/PrincessGod/objTo3d-tiles)

- 基于cesium官方的obj2gltf开发

2. cesium官方的工具 [obj--->gltf](https://github.com/CesiumGS/obj2gltf)

3. cesium官方的转换工具：[glb--->b3dm](https://github.com/CesiumGS/3d-tiles-validator/tree/master/tools)
   （需要自己写tileset.json）

4. [fbx--->gltf](https://github.com/facebookincubator/FBX2glTF/tree/main/npm/fbx2gltf)

- 可以将3dmax导出的fbx格式转为gltf;

5. [gltf--->3dtile](https://github.com/nxddsnc/gltf-to-3dtiles)（c和c++写的，需要vs2015运行）

6. [功能最全的工具](https://github.com/fanvanzh/3dtiles)（程序用C++、C和Rust写的，windows用的时候可能会报c++库缺失的错误）

- Osgb(OpenSceneGraph Binary) 转 3D-Tiles
- Esri Shapefile 转 3D-Tiles
- Fbx、gltf 转 3D-Tiles

7. [OSGB、Shp、GDB等格式转为3DTiles](https://github.com/scially/Cesium3DTilesConverter)（基于fanvanzh/3dtiles修改，用C++和Qt重写）

8. cesiumlab工具

西部科技公司的cesiumlab是最全面的转换工具；

9. [模型压缩工具](https://github.com/CesiumGS/gltf-pipeline)：cesium官方工具，具体用法都有；压缩效果不错；


10. 其他验证和查看工具：

[gltf和glb格式验证和查看](https://pissang.github.io/clay-viewer/editor/)

[gltf和glb格式验证](https://github.khronos.org/glTF-Validator/)

[obj, 3ds, stl, ply, gltf, 3dm, fbx格式查看](https://3dviewer.net/)

参考：

【1】 [WMTS服务初步理解与读取](http://webgis.cn/standard-wmts.html)

【2】[数据转换1-转换工具汇总](https://www.cnblogs.com/tiandi/p/16544823.html)
