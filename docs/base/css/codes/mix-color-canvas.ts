// 在页面上放两个相同的层结构然后读取中心像素
const getMixColor = () => {
  const canvas = document.createElement('canvas');
  canvas.width = 1;
  canvas.height = 1;
  const ctx = canvas.getContext('2d');

  // 背景红
  ctx.fillStyle = '#ff0000';
  ctx.fillRect(0, 0, 1, 1);

  // 前景半透明绿 (alpha=0.4)
  ctx.fillStyle = 'rgba(0,255,0,0.4)';
  ctx.fillRect(0, 0, 1, 1);

  // 返回的是非预乘 (unpremultiplied) sRGBA 值（按规范，API 给开发者的是解 premult 后的常见表示）。（实现细节可能有差异，但这是规范行为）
  // 如果你在 JS 中拿到 getImageData() 并在 CPU 上做合成，推荐把值转换为 线性空间并预乘 alpha 做进一步处理（特别是多步处理或插值），然后在最后编码回 sRGB 并写回 canvas
  const p = ctx.getImageData(0, 0, 1, 1).data;
  console.log('canvas pixel (r,g,b,a):', p[0], p[1], p[2], p[3]);
  // 打印 hex
  const hex =
    '#' +
    [p[0], p[1], p[2]].map((v) => v.toString(16).padStart(2, '0')).join('');
  console.log('canvas hex:', hex);
};
