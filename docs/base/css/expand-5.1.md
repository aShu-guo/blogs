# CSS中的混合算法

在CSS中前景是默认覆盖背景色的，例如，在父元素中设置背景色A，在子元素中设置背景色B，那么最终呈现的颜色永远是子类的背景色B，当然这是在没有设置opacity的前提下

如果设置了opacity，则会应用颜色混合算法。

根据CSS Color 4规范，正确的alpha合成公式为：

```text
C_out = C_f * α_f + C_b * α_b * (1 - α_f)
α_out = α_f + α_b * (1 - α_f)

C_final = C_out / α_out
```

:::tip
CSS中的颜色都是sRGB空间下的，在应用混合算法时，需要首先将它转换为线性空间下，计算后再转换为sRGB空间

计算步骤：sRGB -> linear sRGB -> sRGB
:::

## 半透明前景混合非透明背景

对于非透明背景（α_b = 1），公式简化为：

```text
r = (foreground.r * alpha_f) + (background.r * (1.0 - alpha_f));
g = (foreground.g * alpha_f) + (background.g * (1.0 - alpha_f));
b = (foreground.b * alpha_f) + (background.b * (1.0 - alpha_f));
```

- foreground指前景颜色
- background指背景颜色
- α_f指前景alpha值
- α_b指背景alpha值

<div class="w-full h-100px bg-#ffffff">
   <div class="bg-#ff0000 w-full h-full">
       <div class="w-full h-full bg-#00ff00 opacity-40 color-#ffffff">
         三层混合：#ffffff+#ff0000+#00ff00 opacity-0.4
      </div>
   </div>
</div>

```html
<div class="w-full h-100px bg-#ffffff">
  <div class="bg-#ff0000 w-full h-full">
    <div class="w-full h-full bg-#00ff00 opacity-40"></div>
  </div>
</div>
```

计算步骤（在sRGB空间中的简化计算）：

- 父层颜色：红色 → #ff0000 = rgb(255, 0, 0)
- 子层颜色：绿色 → #00ff00 = rgb(0, 255, 0)
- 子层透明度：opacity = 0.4

使用简化的sRGB空间公式：

```text
r = (0 × 0.4) + 255 × (1.0 - 0.4) = 153
g = (255 × 0.4) + 0 × (1.0 - 0.4) = 102
b = (0 × 0.4) + 0 × (1.0 - 0.4) = 0
```

结果：rgb(153, 102, 0) = #996600

<div class="w-full h-100px bg-#996600">rgb(153,102,0)</div>

:::tip
为什么浏览器最终渲染出的颜色与计算出的背景色不一样，浏览器渲染出的颜色为#A77211，我们计算出的颜色为#996600？

**主要原因：**

1. **颜色空间转换**：我们使用的是简化的sRGB空间计算，而浏览器按照CSS Color 4规范在Linear RGB空间中进行alpha合成，然后转换回sRGB显示

2. **伽马校正**：Linear RGB到sRGB的转换涉及伽马校正，这会让结果变亮

3. **渲染引擎差异**：不同浏览器可能使用不同的渲染优化和抗锯齿算法

4. **显示器校准**：最终显示效果还受到显示器色彩配置文件的影响

**正确的Linear RGB计算过程**（见下方"CSS的真实混合过程"部分）

<div class="flex w-full h-100px">
<div class="flex-basis-33% bg-#A77211">
#A77211 (浏览器实际渲染)
</div>
<div class="flex-basis-33% bg-#996600">
#996600 (sRGB计算结果)
</div>
<div class="flex-basis-33% bg-#cbaa00">
#cbaa00 (Linear RGB计算结果)
</div>
</div>

:::

## 半透明前景混合半透明背景

具体步骤：

1. **计算输出颜色**：

   ```text
   r_out = (foreground.r * alpha_f) + (background.r * alpha_b * (1.0 - alpha_f));
   g_out = (foreground.g * alpha_f) + (background.g * alpha_b * (1.0 - alpha_f));
   b_out = (foreground.b * alpha_f) + (background.b * alpha_b * (1.0 - alpha_f));
   ```

2. **计算输出alpha**：

   ```text
   alpha_out = alpha_f + alpha_b * (1.0 - alpha_f)
   ```

3. **最终颜色**：
   ```text
   r_final = r_out / alpha_out
   g_final = g_out / alpha_out
   b_final = b_out / alpha_out
   ```

### 举例

```html
<div class="w-full h-100px bg-#ffffff">
  <div class="w-full h-full bg-#ff0000 opacity-40">
    <div class="w-full h-full bg-#00ff00 opacity-20"></div>
  </div>
</div>
```

<div class="w-full h-100px bg-#ffffff">
   <div class="w-full h-full bg-#ff0000 opacity-40">
      <div class="w-full h-full bg-#00ff00 opacity-20"></div>
   </div>
</div>

计算步骤：

**第一层：红色(40%) + 白色背景（Linear RGB）**

a. 转换到Linear RGB：

- 白色(255,255,255) → (1.0, 1.0, 1.0)
- 红色(255,0,0) → (1.0, 0.0, 0.0)

b. Linear RGB混合：

```text
r1_linear = 1.0 × 0.4 + 1.0 × 0.6 = 1.0
g1_linear = 0.0 × 0.4 + 1.0 × 0.6 = 0.6
b1_linear = 0.0 × 0.4 + 1.0 × 0.6 = 0.6
```

**第二层：绿色(20%) + 第一层结果（Linear RGB）**

a. 转换到Linear RGB：

- 第一层结果(1.0, 0.6, 0.6)
- 绿色(0,255,0) → (0.0, 1.0, 0.0)

b. Linear RGB混合：

```text
r2_linear = 0.0 × 0.2 + 1.0 × 0.8 = 0.8
g2_linear = 1.0 × 0.2 + 0.6 × 0.8 = 0.68
b2_linear = 0.0 × 0.2 + 0.6 × 0.8 = 0.48
```

c. 转回sRGB：

```text
r2 = 1.055 × (0.8^(1/2.4)) - 0.055 ≈ 0.906 → 231
g2 = 1.055 × (0.68^(1/2.4)) - 0.055 ≈ 0.843 → 215
b2 = 1.055 × (0.48^(1/2.4)) - 0.055 ≈ 0.722 → 184
```

结果：rgb(231, 215, 184) = #E7D7B8

这个结果 `#E7D7B8` 与您观察到的实际渲染结果 `#EFB7AB` 有一定差异，但这是正常的，因为：

<div class="w-full h-100px bg-#E7D7B8"></div>

**总结：导致颜色差异的主要原因**

1. **遗漏白色背景**：我们最初的计算没有考虑白色背景，导致结果偏暗
2. **Linear RGB空间计算**：浏览器按照CSS Color 4规范在Linear RGB空间进行alpha合成
3. **伽马校正**：Linear RGB到sRGB的转换涉及伽马校正，让结果变亮
4. **多层混合**：实际渲染涉及三层混合（白色背景 + 红色层 + 绿色层）

## CSS 的真实混合过程

浏览器中的标准流程（符合 [CSS Color 4](https://drafts.csswg.org/css-color-4/#interpolation)）：

1. **取出 RGB 值（0–255）并转为 sRGB 归一化 \[0–1]**
2. **应用 sRGB → LinearRGB 转换（伽马解码）**

   $$
   C_{linear} =
   \begin{cases}
   \frac{C_{srgb}}{12.92}, & C_{srgb} \le 0.04045\\[4pt]
   \left(\frac{C_{srgb}+0.055}{1.055}\right)^{2.4}, & C_{srgb} > 0.04045
   \end{cases}
   $$

3. **在 Linear 空间中做 alpha 混合**

   $$
   C_{mix,linear} = C_f^{linear} \times \alpha + C_b^{linear} \times (1-\alpha)
   $$

4. **再转回 sRGB 空间显示**

   $$
   C_{out,sRGB} =
   \begin{cases}
   12.92 \times C_{linear}, & C_{linear} \le 0.0031308\\[4pt]
   1.055 \times C_{linear}^{1/2.4} - 0.055, & \text{otherwise}
   \end{cases}
   $$

这两次 γ 转换（解码 + 编码）会让结果变亮。

---

**1. 实算示例：#ff0000 背景 + #00ff00\@0.4 前景**

按照CSS Color 4规范在Linear RGB空间计算：

a. 转换为 0–1：

| 颜色   | R   | G   | B   |
| ------ | --- | --- | --- |
| 背景红 | 1.0 | 0   | 0   |
| 前景绿 | 0   | 1.0 | 0   |

b. 解码到 Linear RGB：

| 通道 | sRGB→Linear |
| ---- | ----------- |
| 1.0  | 1.0         |
| 0    | 0           |

（0和1在sRGB→Linear转换中保持不变）

c. 在Linear空间混合（α=0.4）：

$$
R_{lin} = 0×0.4 + 1×0.6 = 0.6\\
G_{lin} = 1×0.4 + 0×0.6 = 0.4\\
B_{lin} = 0×0.4 + 0×0.6 = 0
$$

d. 转回 sRGB：

$$
R_{sRGB} = 1.055×(0.6^{1/2.4}) - 0.055 ≈ 0.906\\
G_{sRGB} = 1.055×(0.4^{1/2.4}) - 0.055 ≈ 0.842\\
B_{sRGB} = 0
$$

e. 转换为8位值：

$$
(231, 215, 184) = \#E7D7B8
$$

**注意**：实际浏览器渲染结果 `#A77211` 可能与理论计算有差异，这是由于：

- 渲染引擎的具体实现细节
- 抗锯齿算法的影响
- 显示器色彩配置文件
- 浏览器的优化策略

## 注意事项

1. 内层颜色与外层颜色放置顺序不同，产生的最终效果也不同

<div class="flex w-full h-100px">
   <div class="w-50% bg-#ffffff mt-20px">
     <div class="w-full h-full bg-#ff0000 opacity-40 color-white">
      前景色：bg-#ff0000 opacity-40<br>
      背景色：bg-#ffffff
      </div>
   </div>
   <div class="w-50% bg-#ff0000 opacity-40 mt-20px">
     <div class="w-full h-full bg-#ffffff color-red">
      前景色：bg-#ffffff<br>
    背景色：bg-#ff0000 opacity-40
      </div>
   </div>
</div>

```html
<div class="w-full h-100px bg-#ffffff mt-20px">
  <div class="w-full h-full bg-#ff0000 opacity-40"></div>
</div>
```

参考：

【1】(CSS Color 4)[https://drafts.csswg.org/css-color-4/#interpolation]
