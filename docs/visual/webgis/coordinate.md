# 坐标系

根据《中华人民共和国测绘法》要求，地图提供商必须使用一种称为GCJ-02的坐标系统。而百度地图使用一种BD-09坐标系。
经纬度是什么格式的，就要在什么格式的地图上展示，否则会出现100-700米不等的偏移。
在开发中，国内地图资源主要有百度地图、高德地图两家提供，那么可以经纬度坐标系可以分为以下几种：

## WGS84(EPSG:4326)--地球坐标系

世界大地测量系统（英语：World Geodetic System, WGS），常见于GPS设备系统上，是Google地图以及国际标准的坐标系。坐标系是基于椭球体的，一般按此坐标系存储。

## GCJ-02--火星坐标系

基于国家安全考虑，国内地图提供商按照规范对WGS84坐标系下的经纬度加密后生成的。高德地图使用的便是此坐标系。

## BD-09

百度地图基于GCJ-02坐标系加密再次加密之后的格式。

## CGCS2000坐标系

天地图使用的是该标准，可近似等价于84坐标系

## EPSG:3857

Web墨卡托投影，是墨卡托投影的一种变体，又称为伪墨卡托投影，被Web地图应用业界普遍采纳。由于从三维到二维的转化必然会导致不同程度的失真和变形，使用墨卡托投影时高纬度时的物体会被放大。
所以为了减少投影过程造成的问题，伪墨卡托投影切掉了南北85.051129°纬度以上的地区，以保证整个投影是正方形的。由于它可以将WGS84坐标系投影为正方形的特性，在展示地图不同层级的物体时形状保持不变，
而且一个正方形可以不断的划分为多个正方形来显示更清晰的地图细节，所以它非常适合用于显示地图数据。

参考：

[1][GIS基础知识 - 坐标系、投影、EPSG:4326、EPSG:3857](https://blog.51cto.com/u_15311558/4568283)

[2][Web墨卡托投影](https://zh.wikipedia.org/zh/Web%E5%A2%A8%E5%8D%A1%E6%89%98%E6%8A%95%E5%BD%B1)

[3][中华人民共和国地理数据限制](https://zh.wikipedia.org/wiki/%E4%B8%AD%E5%8D%8E%E4%BA%BA%E6%B0%91%E5%85%B1%E5%92%8C%E5%9B%BD%E5%9C%B0%E7%90%86%E6%95%B0%E6%8D%AE%E9%99%90%E5%88%B6#GCJ-02)

[4][CGCS2000坐标系和WGS84坐标系的区别与联系](https://www.cnblogs.com/88223100/p/difference-between-CGCS2000-WGS84.html)