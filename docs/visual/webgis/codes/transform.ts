// 定义一些常量
const x_PI: Readonly<number> = (3.14159265358979 * 3000.0) / 180.0;
const PI: Readonly<number> = 3.141592653589793;
const a: Readonly<number> = 6378245.0;
const ee: Readonly<number> = 0.006693421622965943;

/**
 * 百度坐标系 (BD-09) 与 火星坐标系 (GCJ-02) 的转换
 * 即 百度 转 谷歌、高德
 */
const BD09ToGCJ02 = function BD09ToGCJ02(bd_lng: number, bd_lat: number) {
  const x = bd_lng - 0.0065;
  const y = bd_lat - 0.006;
  const z = Math.sqrt(x * x + y * y) - 0.00002 * Math.sin(y * x_PI);
  const theta = Math.atan2(y, x) - 0.000003 * Math.cos(x * x_PI);
  const gg_lng = z * Math.cos(theta);
  const gg_lat = z * Math.sin(theta);
  return [gg_lng, gg_lat];
};

/**
 * 火星坐标系 (GCJ-02) 与百度坐标系 (BD-09) 的转换
 * 即 谷歌、高德 转 百度
 */
const GCJ02ToBD09 = function GCJ02ToBD09(lng: number, lat: number) {
  const z = Math.sqrt(lng * lng + lat * lat) + 0.00002 * Math.sin(lat * x_PI);
  const theta = Math.atan2(lat, lng) + 0.000003 * Math.cos(lng * x_PI);
  const bd_lng = z * Math.cos(theta) + 0.0065;
  const bd_lat = z * Math.sin(theta) + 0.006;
  return [bd_lng, bd_lat];
};

/**
 * WGS-84 转 GCJ-02
 */
const WGS84ToGCJ02 = function WGS84ToGCJ02(lng: number, lat: number) {
  if (outOfChina(lng, lat)) {
    return [lng, lat];
  } else {
    let dlat = transformLat(lng - 105.0, lat - 35.0);
    let dlng = transformLng(lng - 105.0, lat - 35.0);
    const radlat = (lat / 180.0) * PI;
    let magic = Math.sin(radlat);
    magic = 1 - ee * magic * magic;
    const sqrtmagic = Math.sqrt(magic);
    dlat = (dlat * 180.0) / (((a * (1 - ee)) / (magic * sqrtmagic)) * PI);
    dlng = (dlng * 180.0) / ((a / sqrtmagic) * Math.cos(radlat) * PI);
    const mglat = lat + dlat;
    const mglng = lng + dlng;
    return [mglng, mglat];
  }
};

/**
 * GCJ-02 转换为 WGS-84
 */
const GCJ02ToWGS84 = function GCJ02ToWGS84(lng: number, lat: number) {
  if (outOfChina(lng, lat)) {
    return [lng, lat];
  } else {
    const [mglng, mglat] = WGS84ToGCJ02(lng, lat);
    return [lng * 2 - mglng, lat * 2 - mglat];
  }
};

const transformLat = function transformLat(lng: number, lat: number) {
  let ret = -100.0 + 2.0 * lng + 3.0 * lat + 0.2 * lat * lat + 0.1 * lng * lat + 0.2 * Math.sqrt(Math.abs(lng));
  ret += ((20.0 * Math.sin(6.0 * lng * PI) + 20.0 * Math.sin(2.0 * lng * PI)) * 2.0) / 3.0;
  ret += ((20.0 * Math.sin(lat * PI) + 40.0 * Math.sin((lat / 3.0) * PI)) * 2.0) / 3.0;
  ret += ((160.0 * Math.sin((lat / 12.0) * PI) + 320 * Math.sin((lat * PI) / 30.0)) * 2.0) / 3.0;
  return ret;
};

const transformLng = function transformLng(lng: number, lat: number) {
  let ret = 300.0 + lng + 2.0 * lat + 0.1 * lng * lng + 0.1 * lng * lat + 0.1 * Math.sqrt(Math.abs(lng));
  ret += ((20.0 * Math.sin(6.0 * lng * PI) + 20.0 * Math.sin(2.0 * lng * PI)) * 2.0) / 3.0;
  ret += ((20.0 * Math.sin(lng * PI) + 40.0 * Math.sin((lng / 3.0) * PI)) * 2.0) / 3.0;
  ret += ((150.0 * Math.sin((lng / 12.0) * PI) + 300.0 * Math.sin((lng / 30.0) * PI)) * 2.0) / 3.0;
  return ret;
};

const outOfChina = function outOfChina(lng: number, lat: number) {
  // 纬度 3.86~53.55, 经度 73.66~135.05
  return !(lng > 73.66 && lng < 135.05 && lat > 3.86 && lat < 53.55);
};




const Transform = {
  BD09ToGCJ02,
  GCJ02ToBD09,
  WGS84ToGCJ02,
  GCJ02ToWGS84,
  outOfChina,

};

export default Transform;
