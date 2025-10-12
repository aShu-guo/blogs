# 必学必会的background属性新特性

## background-size

- cover：保持图片`比例不变`，`完全覆盖`在指定区域中，但是`会被裁剪`
- fill：也是完全覆盖在指定区域，但是`图片比例会改变`，并且`被裁剪`
- contain：保持图片`比例不变`，完全放在指定区域中，但是会出现`两边留白`（除非指定区域的宽高比例恰好与图片比例相同）

1. auto

- 图片是否有内在尺寸
  - 是：则按照图片尺寸
  - 否：则按照比例放在指定区域中

2. 数值或百分比值

background-size属性值无论是数值还是百分比值，都不能是负值。百分比则是相对于`指定区域`计算的，默认为`padding-box`

<div class="w-full h-200px bd-20px_red p-20px" style='background: url("/logo-dark.jpeg");background-size: 100% 100%;background-repeat: no-repeat'></div>

```html
<div
  class="w-full h-200px bd-20px_red p-20px"
  style='background: url("/logo-dark.jpeg");background-size: 100% 100%;background-repeat: no-repeat'
></div>
```

<div class="w-full h-200px bd-20px_red p-20px" style='background-image: url("/logo-dark.jpeg");background-size: 100% 100%;background-origin: content-box;background-repeat: no-repeat;'></div>

```html
<div
  class="w-full h-200px bd-20px_red p-20px"
  style='background-image: url("/logo-dark.jpeg");background-size: 100% 100%;background-origin: content-box;background-repeat: no-repeat;'
></div>
```

## background-clip

最大的作用是控制背景色的`展示范围`，默认为border-box

<div class="w-full h-100px bg-red bg-clip-border bd-10px_dashed_green"></div>

```html
<div class="w-full h-100px bg-red bg-clip-border bd-10px_dashed_green"></div>
```

```text
background-clip: border-box;
background-clip: padding-box;
background-clip: content-box;
background-clip: text; // 用于实现渐变色字体
```

## background-origin

用于控制背景色的`原点`

<div class="w-full h-100px bg-clip-border bd-10px_dashed_blue" style="background: linear-gradient(red,green)"></div>

```html
<div
  class="w-full h-100px bg-clip-border bd-10px_dashed_blue"
  style="background: linear-gradient(red,green)"
></div>
```

```text
background-origin: border-box;
background-origin: padding-box;
background-origin: content-box;
```

如果希望从border-content便开始渐变，则如此设置：

```html
<div
  class="w-full h-100px bg-clip-border bd-10px_dashed_blue"
  style="background: linear-gradient(red,green);background-origin: border-box"
></div>
```

<div
  class="w-full h-100px bg-clip-border bd-10px_dashed_blue"
  style="background: linear-gradient(red,green);background-origin: border-box"
></div>

渐变背景色在边框位置是纯色，只有在过了border之后才开始渐变

:::info
可与`background-position`搭配使用，控制背景色的起始位置
:::

## background-position

支持多个属性值：left、top、center、数值、百分比

```css
div {
  background-position: center center;
}
```

第一个值为距离left的位置，第二个值为距离top的位置，两者组成背景起始位置坐标

## outline

<div class="w-full flex">
<div class="flex-basis-33% hover:outline-blue hover:outline-width-3 hover:outline-solid  bg-red">123</div>
<div class="flex-basis-33% hover:outline-blue hover:outline-width-3 hover:outline-solid  bg-green">123</div>
<div class="flex-basis-33% hover:outline-blue hover:outline-width-3 hover:outline-solid  bg-blue">123</div>
</div>

鼠标hover过元素时，outline被覆盖，可以通过设置`outline-offset`偏移outline，消除覆盖效果

<div class="w-full flex">
<div class="flex-basis-33% hover:outline-blue hover:outline-width-3 hover:outline-offset--3px hover:outline-solid  bg-red">123</div>
<div class="flex-basis-33% hover:outline-blue hover:outline-width-3 hover:outline-offset--3px hover:outline-solid  bg-green">123</div>
<div class="flex-basis-33% hover:outline-blue hover:outline-width-3 hover:outline-offset--3px hover:outline-solid  bg-blue">123</div>
</div>
