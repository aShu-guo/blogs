# 数据格式与转换

gis开发中涉及到的数据格式以及之间的转换

## 数据格式

### WMTS

WMTS：OpenGIS Web Map Tile Service

OGC（开放地理空间协会，英语：Open Geospatial Consortium，缩写OGC）提出的缓存技术标准的WMTS服务，通过缓存技术来替代实时对数据进行可视化用以提高地图响应能力。

#### 原理

WMTS规定使用瓦片矩阵集（Tile Matrix Set）来表示切割后的地图

- 不同瓦片矩阵具有不同的比例尺（分辨率），每个瓦片矩阵由瓦片矩阵标识符（一般为瓦片矩阵的序号）进行标识。
- 分辨率最低的一层为第0层，依次向上排

![img.png](/imgs/visual/gis/index-2.png)

![img.png](/imgs/visual/gis/index-1.png)

#### wms wmts xyz加载对比

- WMS（Web Map Service）

  - 描述：WMS是一种动态生成地图图像的服务，它根据请求的参数（如经纬度范围、图层、样式等）在服务器端生成图像，并将其返回给客户端。
  - 特点：
    - 动态生成：每次请求都会动态生成图像，因此可以根据用户的请求进行实时更新。
    - 高定制性：可以根据不同的参数定制生成的地图图像，比如更改图层样式、显示或隐藏特定数据。
    - 较慢的性能：由于图像是在请求时生成的，响应速度可能较慢，尤其是在大范围或高分辨率请求时。
  - 使用场景：适合需要实时渲染、动态更新数据或显示复杂地图样式的场景。

- WMTS（Web Map Tile Service）

  - 描述：WMTS是一种基于瓦片的地图服务，它将地图预先切割成小块的瓦片，并通过标准化的URL请求这些瓦片。
  - 特点：
    - 预生成瓦片：瓦片通常是在数据发布前预生成的，因此响应速度较快。
    - 标准化URL：WMTS服务使用标准化的Z/X/Y瓦片索引，可以方便地集成到各种地图应用中。
    - 静态数据：瓦片数据通常是静态的，适合不需要频繁更新的地图数据。
    - 较快的性能：由于瓦片是预生成的，客户端加载速度更快，特别是在大范围或高缩放级别时。
  - 使用场景：适合大规模、固定地图数据的展示，如基础地图层或历史地图数据。

- 直接加载（XYZ）
  - 描述：直接加载通常是指通过XYZ URL格式加载瓦片的方式，这种方式使用简单的URL模式/{z}/{x}/{y}请求瓦片。
  - 特点：
    - 简单易用：通过标准的URL模式加载瓦片，通常不需要额外的配置或元数据。
    - 适合静态瓦片：通常用于加载已经切割好的静态瓦片，比如卫星图像或预渲染的地图。
    - 缺乏动态能力：由于是静态瓦片，无法实时更新数据或进行复杂的样式渲染。
    - 高性能：加载速度快，适合需要快速展示大范围地图的应用场景。
    - 使用场景：常用于展示基础地图层、卫星图像或其他静态地图数据

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

cesium提供的一种高性能加载地图大量数据一种格式，用于流式传输大规模异构3D地理空间数据集的开放规范。为了扩展Cesium的地形和图像流，3D
Tiles将用于流式传输3D内容，包括建筑物，树木，点云和矢量数据。

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
