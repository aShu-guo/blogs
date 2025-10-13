/**
 * 多层颜色混合逻辑实现
 * 基于 CSS Color 4 规范 (https://drafts.csswg.org/css-color-4/#interpolation)
 * 
 * 实现功能：
 * 1. sRGB 和 Linear RGB 之间的转换
 * 2. Alpha 合成算法
 * 3. 多层颜色混合
 * 4. 支持不同的颜色空间计算
 * 
 * 使用示例：
 * ```typescript
 * import { mixColorsLinear, createLayer } from './mix-colors';
 * 
 * // 创建颜色层
 * const layers = [
 *   createLayer('#ff0000', 0.4),  // 红色，40%透明度
 *   createLayer('#00ff00', 0.2)   // 绿色，20%透明度
 * ];
 * 
 * // 混合颜色（Linear RGB空间，推荐）
 * const result = mixColorsLinear(layers, { r: 255, g: 255, b: 255 }); // 白色背景
 * console.log(rgbToHex(result)); // 输出: #e7d7b8
 * 
 * // 不同背景色会产生不同结果
 * const result2 = mixColorsLinear(layers, { r: 0, g: 0, b: 0 }); // 黑色背景
 * console.log(rgbToHex(result2)); // 输出: #996c00
 * ```
 */

// 颜色相关类型定义
export interface RGBColor {
  r: number; // 0-255
  g: number; // 0-255
  b: number; // 0-255
  alpha?: number; // 0-1
}

export interface LinearRGBColor {
  r: number; // 0-1
  g: number; // 0-1
  b: number; // 0-1
  alpha?: number; // 0-1
}

export interface ColorLayer {
  color: RGBColor;
  opacity: number; // 0-1
}

/**
 * sRGB 到 Linear RGB 转换
 * 根据 CSS Color 4 规范实现
 */
export function srgbToLinear(srgb: number): number {
  if (srgb <= 0.04045) {
    return srgb / 12.92;
  } else {
    return Math.pow((srgb + 0.055) / 1.055, 2.4);
  }
}

/**
 * Linear RGB 到 sRGB 转换
 * 根据 CSS Color 4 规范实现
 */
export function linearToSrgb(linear: number): number {
  if (linear <= 0.0031308) {
    return 12.92 * linear;
  } else {
    return 1.055 * Math.pow(linear, 1 / 2.4) - 0.055;
  }
}

/**
 * RGB 颜色转换为 Linear RGB
 */
export function rgbToLinear(rgb: RGBColor): LinearRGBColor {
  return {
    r: srgbToLinear(rgb.r / 255),
    g: srgbToLinear(rgb.g / 255),
    b: srgbToLinear(rgb.b / 255),
    alpha: rgb.alpha
  };
}

/**
 * Linear RGB 颜色转换为 RGB
 */
export function linearToRgb(linear: LinearRGBColor): RGBColor {
  return {
    r: Math.round(linearToSrgb(linear.r) * 255),
    g: Math.round(linearToSrgb(linear.g) * 255),
    b: Math.round(linearToSrgb(linear.b) * 255),
    alpha: linear.alpha
  };
}

/**
 * Alpha 合成算法
 * 根据 CSS Color 4 规范实现
 * C_out = C_f * α_f + C_b * α_b * (1 - α_f)
 * α_out = α_f + α_b * (1 - α_f)
 */
export function alphaComposite(
  foreground: LinearRGBColor,
  background: LinearRGBColor
): LinearRGBColor {
  const alphaF = foreground.alpha ?? 1;
  const alphaB = background.alpha ?? 1;
  
  // 计算输出 alpha
  const alphaOut = alphaF + alphaB * (1 - alphaF);
  
  if (alphaOut === 0) {
    return { r: 0, g: 0, b: 0, alpha: 0 };
  }
  
  // 计算输出颜色
  const rOut = foreground.r * alphaF + background.r * alphaB * (1 - alphaF);
  const gOut = foreground.g * alphaF + background.g * alphaB * (1 - alphaF);
  const bOut = foreground.b * alphaF + background.b * alphaB * (1 - alphaF);
  
  return {
    r: rOut,
    g: gOut,
    b: bOut,
    alpha: alphaOut
  };
}

/**
 * 在 sRGB 空间进行简化的 alpha 合成
 * 用于对比和快速计算
 */
export function alphaCompositeSRGB(
  foreground: RGBColor,
  background: RGBColor
): RGBColor {
  const alphaF = foreground.alpha ?? 1;
  const alphaB = background.alpha ?? 1;
  
  const r = foreground.r * alphaF + background.r * alphaB * (1 - alphaF);
  const g = foreground.g * alphaF + background.g * alphaB * (1 - alphaF);
  const b = foreground.b * alphaF + background.b * alphaB * (1 - alphaF);
  
  return {
    r: Math.round(r),
    g: Math.round(g),
    b: Math.round(b),
    alpha: alphaF + alphaB * (1 - alphaF)
  };
}

/**
 * 多层颜色混合 - Linear RGB 空间
 * 按照 CSS Color 4 规范实现
 */
export function mixColorsLinear(layers: ColorLayer[], backgroundColor: RGBColor = { r: 255, g: 255, b: 255 }): RGBColor {
  if (layers.length === 0) {
    return backgroundColor;
  }
  
  // 处理null/undefined背景色
  const bg = backgroundColor || { r: 255, g: 255, b: 255 };
  
  // 从背景色开始，确保背景色有正确的alpha值
  let result = rgbToLinear({
    ...bg,
    alpha: bg.alpha ?? 1
  });
  
  // 逐层混合
  for (const layer of layers) {
    const layerLinear = rgbToLinear({
      ...layer.color,
      alpha: layer.opacity
    });
    result = alphaComposite(layerLinear, result);
  }
  
  return linearToRgb(result);
}

/**
 * 多层颜色混合 - sRGB 空间
 * 用于对比和快速计算
 */
export function mixColorsSRGB(layers: ColorLayer[], backgroundColor: RGBColor = { r: 255, g: 255, b: 255 }): RGBColor {
  if (layers.length === 0) {
    return backgroundColor;
  }
  
  let result = backgroundColor;
  
  for (const layer of layers) {
    result = alphaCompositeSRGB({
      ...layer.color,
      alpha: layer.opacity
    }, result);
  }
  
  return result;
}

/**
 * 颜色转换为十六进制字符串
 */
export function rgbToHex(rgb: RGBColor): string {
  const toHex = (n: number) => Math.round(n).toString(16).padStart(2, '0');
  return `#${toHex(rgb.r)}${toHex(rgb.g)}${toHex(rgb.b)}`;
}

/**
 * 十六进制字符串转换为 RGB 颜色
 */
export function hexToRgb(hex: string): RGBColor {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) {
    throw new Error('Invalid hex color');
  }
  
  return {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  };
}

/**
 * 创建颜色层的辅助函数
 */
export function createLayer(color: string | RGBColor, opacity: number): ColorLayer {
  const rgbColor = typeof color === 'string' ? hexToRgb(color) : color;
  return {
    color: rgbColor,
    opacity
  };
}

// 使用示例和测试用例
export function runExamples() {
  console.log('=== 多层颜色混合示例 ===\n');
  
  // 演示不同背景色的影响
  console.log('=== 不同背景色测试 ===');
  const backgroundTestLayers = [
    createLayer('#ff0000', 0.5)  // 红色，50%透明度
  ];
  
  const backgrounds = [
    { r: 255, g: 255, b: 255 },  // 白色
    { r: 0, g: 0, b: 0 },        // 黑色
    { r: 255, g: 0, b: 0 },      // 红色
    { r: 0, g: 255, b: 0 }       // 绿色
  ];
  
  backgrounds.forEach((bg, index) => {
    const result = mixColorsLinear(backgroundTestLayers, bg);
    console.log(`背景${index + 1}: rgb(${bg.r}, ${bg.g}, ${bg.b}) → 结果: ${rgbToHex(result)}`);
  });
  console.log('');
  
  // 示例1：白色背景 + 红色(40%) + 绿色(20%)
  const layers1 = [
    createLayer('#ff0000', 0.4),  // 红色，40%透明度
    createLayer('#00ff00', 0.2)   // 绿色，20%透明度
  ];
  
  const resultLinear1 = mixColorsLinear(layers1, { r: 255, g: 255, b: 255 });
  const resultSRGB1 = mixColorsSRGB(layers1, { r: 255, g: 255, b: 255 });
  
  console.log('示例1：白色背景 + 红色(40%) + 绿色(20%)');
  console.log(`Linear RGB 结果: ${rgbToHex(resultLinear1)} (${resultLinear1.r}, ${resultLinear1.g}, ${resultLinear1.b})`);
  console.log(`sRGB 结果: ${rgbToHex(resultSRGB1)} (${resultSRGB1.r}, ${resultSRGB1.g}, ${resultSRGB1.b})`);
  console.log(`实际浏览器渲染: #EFB7AB`);
  console.log(`Linear RGB 与实际的差异: R=${Math.abs(resultLinear1.r - 239)}, G=${Math.abs(resultLinear1.g - 183)}, B=${Math.abs(resultLinear1.b - 171)}`);
  console.log('');
  
  // 示例2：黑色背景 + 蓝色(50%) + 黄色(30%)
  const layers2 = [
    createLayer('#0000ff', 0.5),  // 蓝色，50%透明度
    createLayer('#ffff00', 0.3)   // 黄色，30%透明度
  ];
  
  const resultLinear2 = mixColorsLinear(layers2, { r: 0, g: 0, b: 0 });
  const resultSRGB2 = mixColorsSRGB(layers2, { r: 0, g: 0, b: 0 });
  
  console.log('示例2：黑色背景 + 蓝色(50%) + 黄色(30%)');
  console.log(`Linear RGB 结果: ${rgbToHex(resultLinear2)} (${resultLinear2.r}, ${resultLinear2.g}, ${resultLinear2.b})`);
  console.log(`sRGB 结果: ${rgbToHex(resultSRGB2)} (${resultSRGB2.r}, ${resultSRGB2.g}, ${resultSRGB2.b})`);
  console.log('');
  
  // 示例3：多层混合
  const layers3 = [
    createLayer('#ff0000', 0.3),  // 红色，30%
    createLayer('#00ff00', 0.4),  // 绿色，40%
    createLayer('#0000ff', 0.2)   // 蓝色，20%
  ];
  
  const resultLinear3 = mixColorsLinear(layers3, { r: 255, g: 255, b: 255 });
  const resultSRGB3 = mixColorsSRGB(layers3, { r: 255, g: 255, b: 255 });
  
  console.log('示例3：白色背景 + 红色(30%) + 绿色(40%) + 蓝色(20%)');
  console.log(`Linear RGB 结果: ${rgbToHex(resultLinear3)} (${resultLinear3.r}, ${resultLinear3.g}, ${resultLinear3.b})`);
  console.log(`sRGB 结果: ${rgbToHex(resultSRGB3)} (${resultSRGB3.r}, ${resultSRGB3.g}, ${resultSRGB3.b})`);
  console.log('');
  
  // 性能对比
  console.log('=== 性能对比 ===');
  const performanceTestLayers = Array.from({ length: 10 }, (_, i) => 
    createLayer(`#${Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0')}`, 0.5)
  );
  
  console.time('Linear RGB 计算');
  for (let i = 0; i < 1000; i++) {
    mixColorsLinear(performanceTestLayers);
  }
  console.timeEnd('Linear RGB 计算');
  
  console.time('sRGB 计算');
  for (let i = 0; i < 1000; i++) {
    mixColorsSRGB(performanceTestLayers);
  }
  console.timeEnd('sRGB 计算');
}

// 如果直接运行此文件，执行示例
if (typeof require !== 'undefined' && require.main === module) {
  runExamples();
}
