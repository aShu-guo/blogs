# 增强position属性

主要介绍粘性定位：sticky，这个效果常用在导航元素上，表现效果是：在滚动到sticky元素抵达顶部时，会自动吸附在顶部

## 区别

在没有出现sticky之前是通过js模拟实现，通过动态更改DOM的position在relative和fixed之前切换，故有许多开发者认为sticky是fixed和relative的组合体，其实不然。

sticky与fixed没有任何关系，它是relative的延伸

| 定位     | 保留原位置 | 创建新的absloute元素包含块 | 偏移计算元素                                                                    | 重叠表现不同                                 |
| -------- | ---------- | -------------------------- | ------------------------------------------------------------------------------- | -------------------------------------------- |
| relative | ✅         | ✅                         | 相对自己                                                                        | 相互独立                                     |
| sticky   | ✅         | ✅                         | 相对`层级最近的可滚动的元素`（overflow 不为 visible 的块，或者根元素 viewport） | 重叠，但在特定布局下会出现相互推开的视觉效果 |

## 堆叠效果

### 重叠

不同的sticky元素在同一dom中

<div class="w-full h-200px overflow-auto bg-#3c3c3c">

<div class="w-[min-content]">主要介绍粘性定位：sticky，这个效果常用在导航元素上，表现效果是：在滚动到sticky元素抵达顶部时，会自动吸附在顶部</div>

<nav class="sticky flex top-0">
<h3>tab11111</h3>
<h3>tab11111</h3>
<h3>tab11111</h3>
</nav>

<div class="w-[min-content]">主要介绍粘性定位：sticky，这个效果常用在导航元素上，表现效果是：在滚动到sticky元素抵达顶部时，会自动吸附在顶部</div>

<nav class="sticky flex top-0">
<h3>tab222222</h3>
<h3>tab222222</h3>
<h3>tab222222</h3>
</nav>

<div class="w-[min-content]">主要介绍粘性定位：sticky，这个效果常用在导航元素上，表现效果是：在滚动到sticky元素抵达顶部时，会自动吸附在顶部</div>

</div>

### 推开

不同的sticky元素在不同dom中，这两个dom必须是紧密连接的。可以实现类似通话录的效果

<div class="w-full h-200px overflow-auto ">

<div class="bg-#3c3c3c">

<div class="w-[min-content]">主要介绍粘性定位：sticky，这个效果常用在导航元素上，表现效果是：在滚动到sticky元素抵达顶部时，会自动吸附在顶部</div>

<nav class="sticky flex top-0">
<h3>tab11111</h3>
<h3>tab11111</h3>
<h3>tab11111</h3>
</nav>

<div class="w-[min-content]">主要介绍粘性定位：sticky，这个效果常用在导航元素上，表现效果是：在滚动到sticky元素抵达顶部时，会自动吸附在顶部</div>

</div>

<div class="bg-#3c3c3c">

<nav class="sticky flex top-0">
<h3>tab222222</h3>
<h3>tab222222</h3>
<h3>tab222222</h3>
</nav>

<div class="w-[min-content]">主要介绍粘性定位：sticky，这个效果常用在导航元素上，表现效果是：在滚动到sticky元素抵达顶部时，会自动吸附在顶部</div>

</div> 
</div>

## 计算规则

1. **确定常规位置**
   - 元素首先按照 `position: relative` 计算常规流内位置（不考虑偏移）。

2. **确定偏移值**
   - 检查四个偏移属性：`top`、`left`、`right`、`bottom`。
   - 如果这些属性都是 `auto`，则 `sticky` = `relative`（没有粘性行为）。

3. **建立粘滞约束矩形**
   - 取最近的滚动容器（scroll container）。
   - 粘滞矩形 = 滚动容器的 **padding box**。
   - 粘性元素的可移动范围被限制在此矩形内。

4. **应用粘滞偏移**
   - 在滚动时，元素尝试保持 **偏移值** 所要求的位置：
     - 如果 `top: 10px`，它会尽量保持距离容器顶部 10px；
     - 如果 `left: 0`，它会尽量保持在容器左侧。

5. **约束检查**
   - 如果维持粘性定位会导致元素超出粘滞矩形边界 → **停止粘性**，元素跟随内容继续滚动。
   - 如果还能保持在矩形内 → 继续处于粘性状态。

6. **最终渲染**
   - 阈值之前：元素在相对位置。
   - 阈值触发：元素固定在边界偏移位置。
   - 碰到容器边界：元素被“释放”，继续滚走。

![img.png](/imgs/base/css/chapter-3-4.png)
