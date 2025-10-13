/**
 * sRGB (0~1) 转换为线性 RGB (0~1)
 * @param srgb sRGB，每个通道范围 [0,1]
 * @returns 线性 RGB，每个通道范围 [0,1]
 */
function sRGBToLinear(
  srgb: [number, number, number],
): [number, number, number] {
  return srgb.map((c) => {
    if (c <= 0.04045) {
      return c / 12.92;
    } else {
      return Math.pow((c + 0.055) / 1.055, 2.4);
    }
  }) as [number, number, number];
}

/**
 * 线性 RGB (0~1) 转换为 sRGB (0~1)
 * @param linearRGB 线性 RGB，每个通道范围 [0,1]
 * @returns sRGB，每个通道范围 [0,1]
 */
function linearToSRGB(
  linearRGB: [number, number, number],
): [number, number, number] {
  return linearRGB.map((c) => {
    if (c <= 0.0031308) {
      return 12.92 * c;
    } else {
      return 1.055 * Math.pow(c, 1 / 2.4) - 0.055;
    }
  }) as [number, number, number];
}

// 示例用法
const srgb: [number, number, number] = [0.9686, 0.6314, 0.6]; // sRGB 0~1
const linear = sRGBToLinear(srgb);
console.log('Linear RGB:', linear);

const srgbBack = linearToSRGB(linear);
console.log('sRGB back:', srgbBack);
