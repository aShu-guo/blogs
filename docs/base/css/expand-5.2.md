# 常见颜色混合/复合算法（按类别组织）

## 1. alpha 复合（Compositing / Porter-Duff）

**用途**：最基础的“前景覆盖背景”逻辑，所有 UI 半透明和图层合成的基础。
**核心思想**：把前景（source）按其 alpha 覆盖在背景（destination）上，常见操作是 `source-over`（即 CSS/HTML 的默认）。

### 概念

- `src = (r_s,g_s,b_s,α_s)`，`dst = (r_d,g_d,b_d,α_d)`
- 输出 alpha: `α_out = α_s + α_d*(1-α_s)`
- 输出颜色（非 premultiplied）：

  ```
  C_out = (C_s * α_s + C_d * α_d * (1 - α_s)) / α_out
  ```

- 如果背景是完全不透明（α_d = 1）则简化为：

  ```
  C_out = C_s * α_s + C_d * (1 - α_s)
  ```

  （这里 C 表示通道值，注意：**应在线性光 (linear-light) 空间中进行**）

### Premultiplied alpha（重要）

涉及将颜色值与透明度值提前相乘，这样可以提高图像操作性能

- 用 premultiplied 表示：`C_s' = C_s * α_s`、`C_d' = C_d * α_d`，这样合成为：

  ```
  C_out' = C_s' + C_d' * (1 - α_s)
  α_out = α_s + α_d*(1-α_s)
  ```

- 避免边缘晕影（halo）、更稳定的数值，GPU 通常使用 premultiplied alpha。
  - 合成公式中没有除法（除非最后要把预乘颜色还原为非预乘），数值更稳定，避免除以很小的 α 导致噪声。
- 简化并加速合成（compositing）运算：合成公式在预乘下变得更简单、更稳定（无除法或少除法）。
- 更适合 GPU 的硬件混合模式（硬件一般以 premultiplied 为优先/默认实现）。

#### 转换

- 从非预乘到预乘

```js
// srgb或linear都适用（注意：转换应在同一色彩空间下）
function premultiply([r, g, b, a]) {
  return [r * a, g * a, b * a, a];
}
```

- 从预乘到非预乘

```js
function unpremultiply([r_p, g_p, b_p, a]) {
  if (a === 0) return [0, 0, 0, 0];
  return [r_p / a, g_p / a, b_p / a, a];
}
```

:::warning
注意：当 a 非常小/0 时除法会造成数值不稳定或 NaN，需要做分支处理或 epsilon 限制。
:::

## 2. 线性插值（LERP）与 gamma/linear 的差别

**用途**：最简单的“在两个颜色之间做插值”——常用于渐变、动画。

- 线性插值（在数值通道上）：

  ```
  C = C0 * (1 - t) + C1 * t
  ```

- 关键：在 sRGB（gamma 编码）上直接 LERP 会产生视觉错误（看起来并非线性亮度变化）。正确方法是：
  1. sRGB → linear-light（解 gamma）
  2. 在 linear 空间 LERP
  3. linear → sRGB（编码）

- 更感知一致的方法：在感知空间（如 Oklab）中插值可得到更自然的色彩过渡。

## 3. 基本算术混合（Channel-wise operators）

这些是图像工具中最常见的图层混合模式（Photoshop、CSS `mix-blend-mode` 部分实现）。多数按每通道计算（通常在 linear-light 或 gamma 空间，取决于实现）。

### Multiply（正片叠底）

```
C = C_a * C_b
```

效果：更暗，类似滤镜把光减掉。物理上近似把透光率相乘。

### Screen（滤色）

```
C = 1 - (1 - C_a) * (1 - C_b)
```

效果：更亮，Multiply 的互补。

### Overlay（叠加）

组合 multiply 和 screen：以背景亮度决定使用哪一式：

```
if C_b <= 0.5:
  C = 2 * C_a * C_b
else:
  C = 1 - 2 * (1 - C_a) * (1 - C_b)
```

### Darken / Lighten

```
Darken:  C = min(C_a, C_b)
Lighten: C = max(C_a, C_b)
```

### Color Dodge / Color Burn

- Color Dodge: `C = C_b / (1 - C_a)`（带阈值/夹紧）
- Color Burn: `C = 1 - (1 - C_b) / C_a`（需防除零）
  效果非常强烈，用于高亮/阴影增强。

### Difference / Exclusion

- Difference: `abs(C_a - C_b)`
- Exclusion: `C_a + C_b - 2*C_a*C_b`（更柔和）

### Additive（线性加法）

```
C = C_a + C_b
```

常见于光叠加（stage lights、HDR 加法合成），通常需要裁剪或色域映射。

## 4. 几何/感知空间混合（HSL/HSV / Lab / Oklab）

**为何？** 在不同空间插值得到的感知效果差异巨大。

### 在 HSL/HSV 上插值

- 插值色相时要注意环绕（360° wrap-around）。
- 插值饱和度与亮度通常不能保证感知线性（会看到色相漂移或亮度不均）。

### 在 CIE Lab / Lch / Oklab 上插值

- 这些是“感知”或“接近感知线性”的空间，适合做颜色过渡/渐变。
- Oklab 被认为对人眼更均匀、更稳定（近年来推荐用于 UI 渐变与色彩插值）。

```text
流程：sRGB -> linear -> RGB-> XYZ -> Lab/Oklab -> LERP -> 回转
```

## 5. 光学/物理混合（Additive vs Subtractive vs Spectral）

- **Additive（加色）**：RGB 屏幕、光源叠加是相加（或更准确是能量叠加，在线性光下加）。因此光学合成常用线性加法。
- **Subtractive（减色）**：印刷/颜料混合（CMY）是减色，混合规则与 RGB 直接相乘或减法不同，通常用 Kubelka–Munk / CMYK 转换或模拟吸收谱。
- **Spectral（光谱）渲染**：最准确的颜色混合模式，逐波长计算光的相互作用，代价高但适用于科学/高保真渲染。

## 6. 色彩空间与 gamut mapping（色域映射）

当混合后的颜色落在目标设备不可显示区域时，必须做 gamut mapping。常见策略：

- 剪裁（clip to gamut）——简单但可能丢失细节/饱和度
- 压缩（perceptual mapping）——保持总体外观但改变全部分量
- 相对色度图（relative colorimetric）等 ICC 渠道策略

## 7. 数值实现细节（精度/premultiplied/8-bit vs float）

- **Premultiplied alpha** 推荐：避免边缘问题、便于 GPU 或快速合成。
- **浮点 vs 8-bit**：在 8-bit 下每步量化会累积误差。对物理正确要求高的场景尽量使用浮点缓冲（WebGL / offscreen canvas / linear-srgb）。
- **混合顺序**：不是可交换的，`A over B` ≠ `B over A`。
- **颜色空间**：务必明确是在 sRGB（gamma 编码）还是 linear-light 下计算。

## 8. GPU 固定功能混合与可编程混合

- GPU 中存在固定的硬件混合（blendfunc），例如 OpenGL 的 `glBlendFunc(GL_ONE, GL_ONE_MINUS_SRC_ALPHA)` 对应 premultiplied `source-over` 行为。
- 若需更复杂的 blend-modes（像 Photoshop 的 overlay/dodge），通常用片元着色器实现（或在现代管线用扩展支持）。

## 9. CSS 中的混合（实践与标准）

- CSS（Color 4）规定：`mix-blend-mode`、`opacity` 等复合在 **linear-light** 下执行（这就是与许多历史实现差异的根源）。
- `background-blend-mode`, `mix-blend-mode` 提供多种算术混合（multiply, screen, overlay, etc.）。

## 公式汇总（常用一览，假设通道值归一化到 [0,1]）

- **Source-over（α_b = 1 简化）**:

  ```
  C = C_s * α_s + C_b * (1 - α_s)
  ```

- **LERP (t in [0,1])**:

  ```
  C = (1 - t) * C0 + t * C1
  ```

- **Multiply**:

  ```
  C = C_a * C_b
  ```

- **Screen**:

  ```
  C = 1 - (1 - C_a) * (1 - C_b) = C_a + C_b - C_a*C_b
  ```

- **Overlay**:

  ```
  C = C_b <= 0.5 ? (2 * C_a * C_b) : (1 - 2*(1-C_a)*(1-C_b))
  ```

- **Additive**:

  ```
  C = C_a + C_b  (后续 clamp 到 [0,1] 或做 HDR tone mapping)
  ```

- **Difference / Exclusion**:

  ```
  Difference:  C = abs(C_a - C_b)
  Exclusion:   C = C_a + C_b - 2*C_a*C_b
  ```

- **Color interpolation in Oklab**（流程）:

  ```
  sRGB -> linear -> to Oklab -> LERP -> from Oklab -> linear -> sRGB
  ```

# 实用建议（什么时候用哪种算法）

- **UI/网页颜色合成（遵循规范）**：尽量遵守 CSS Color 4（线性光混合）；在实现自定义混合时优先使用 linear-light + premultiplied alpha。
- **动画渐变 / 渐变色带**：优先在 Oklab 或 linear-light 中插值以获得视觉上更匀的过渡。
- **图像特效（Photoshop 风格）**：使用 channel-wise blend modes（multiply, screen, overlay…），但注意执行空间（最好在 linear）。
- **光与亮度叠加（比如灯光、光斑）**：使用 additive（线性加法），并使用 HDR / tone-mapping 输出。
- **印刷/颜料混合**：使用减色模型或谱方法，简单 RGB 模拟会很不真实。
- **高保真颜色处理**：使用浮点缓冲、线性空间、并用色彩管理（ICC profile）做 gamut mapping。

# 常见陷阱（实战必看）

1. 在 sRGB（编码）空间直接做 LERP 或 blend，会导致视觉误差（偏暗或偏亮）。
2. 不使用 premultiplied alpha 容易导致边缘错误、采样伪影。
3. 用 HSL 直接插值容易使色相突然跳动（环绕问题）。
4. 8-bit 每步量化会累积误差；长链路合成优先用浮点。
5. 不同浏览器/Canvas 的默认行为不同（Canvas 默认在 sRGB gamma 做混合；CSS 按 linear-light），所以视觉上可能出现不一致。
6. 色域问题：超出显示色域的颜色需要做 gamut mapping，否则看起来会失真或被夹紧。

# 代码示例（关键实现片段）

### Premultiplied source-over（线性空间）

```js
// 输入通道都假设已线性化且在 [0,1]
function compositePremult(srcPremul, srcA, dstPremul, dstA) {
  const outA = srcA + dstA * (1 - srcA);
  return {
    r: srcPremul.r + dstPremul.r * (1 - srcA),
    g: srcPremul.g + dstPremul.g * (1 - srcA),
    b: srcPremul.b + dstPremul.b * (1 - srcA),
    a: outA,
  };
}
// 如果需要非 premult 输出，除以 outA 得到非 premult color
```

### Multiply（伪码，通道在 [0,1]）

```js
function multiply(a, b) {
  return a * b;
}
```

### linear <-→ sRGB（精确）

```js
function srgbToLinear(c) {
  c = c / 255;
  return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}
function linearToSrgb(l) {
  const c = l <= 0.0031308 ? l * 12.92 : 1.055 * Math.pow(l, 1 / 2.4) - 0.055;
  return Math.round(Math.max(0, Math.min(1, c)) * 255);
}
```

### Oklab 插值（流程示意）

- 具体转换公式较长，但思路是：sRGB → linear → 3x3 矩阵→非线性 -> Oklab，插值后逆转回来。建议引用可靠实现或库（如 `color.js` / `culori` / `tinycolor` 支持 Oklab）。

# 小结（一句话）

- **要物理/视觉正确就在线性光或感知空间混合，并使用 premultiplied alpha 与浮点计算**；
- **要兼容历史实现或性能优先可使用 sRGB 混合与 8-bit，但会产生视觉偏差**；
- **选择何种算法取决于目标（视觉一致、物理正确、性能、跨平台一致性）**。

如果你想，我可以：

- 为你把上述若干算法（source-over, multiply, screen, overlay, additive, Oklab 插值）写成一个小 TypeScript 库和 demo 页，支持「选择色彩空间（sRGB/linear/Oklab）」、「是否使用 premultiplied」并能实时对比结果。
  要我直接生成 demo/代码吗？
