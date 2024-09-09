# 图片懒加载

## 响应式图片加载

原理：根据不同设备的分辨率、屏幕宽度设置不同的裁剪版本

### 不同的尺寸

```html
<img
  srcset="elva-fairy-480w.jpg 480w, elva-fairy-800w.jpg 800w"
  sizes="(max-width: 600px) 480px,
         800px"
  src="elva-fairy-800w.jpg"
  alt="Elva dressed as a fairy"
/>
```

- srcset：表示图片合集
- sizes：表示展示图片的条件，例如：当`屏幕宽度<=600`则给出的插槽宽度为480，正好对应srcset中的480w，那么则使用`elva-fairy-480w.jpg`

:::warning

1. 图片的固有宽度（以像素为单位）（480w）。注意，这里以 w 为单位，而非你可能期望的 px。
2. 如果srcset中没有与插槽大小相同的图片，则选择第一个大于插槽大小的图片

:::

### 相同的尺寸

设置固定宽度

```css
img {
  width: 320px;
}
```

一种简化的方式，不需要写`sizes`，这里浏览器会自动计算并选择合适的分辨率：在1倍屏下展示`elva-fairy-320w.jpg`，在1.5倍屏下展示`elva-fairy-480w.jpg`，在2倍屏下展示`elva-fairy-640w.jpg`

```html
<img
  srcset="elva-fairy-320w.jpg, elva-fairy-480w.jpg 1.5x, elva-fairy-640w.jpg 2x"
  src="elva-fairy-640w.jpg"
  alt="Elva dressed as a fairy"
/>
```

### 关于UI设计相关

```html
<!-- 如此使用时，就不要在img标签上添加sizes属性 -->
<picture>
  <source media="(max-width: 799px)" srcset="elva-480w-close-portrait.jpg" />
  <source media="(min-width: 800px)" srcset="elva-800w.jpg" />
  <img src="elva-800w.jpg" alt="Chris standing up holding his daughter Elva" />
</picture>
```

一张宽度较大的图片展示在屏幕宽度较小的图片中时，可能会导致图片中的内容被缩放的无法看清，这时可以将图片中重要的内容裁剪出并作为屏幕宽度较小设备的展示图片

![img.png](/imgs/optimization/image-lazy-load-1.png)

![img.png](/imgs/optimization/image-lazy-load-2.png)

## 渐进式图片加载

原理：先加载模糊的图片（缩略图），后逐渐加载出清晰的图片（真正的图片）

![img.png](/imgs/optimization/image-lazy-load-3.gif)

### data-src

```html
<!-- src为缩略图，data-src为真正的图片，在真正的图片资源没有响应回来时展示缩略图 -->
<img src="data/img/placeholder.png" data-src="data/img/SLUG.jpg" alt="NAME" />
```

图片占位符被缩放到和真正的图片一样大小，所以它会占据同样的空间，在真正的图片完成加载后，也不会导致页面重绘。

```js
// 在src中的图片加载完毕之后，将data-src删除data-src属性，展示真正的图片
let imagesToLoad = document.querySelectorAll('img[data-src]');
const loadImages = (image) => {
  // 在src中的图片加载完毕之后，将data-src的值（真正的图片url）赋值给src
  image.setAttribute('src', image.getAttribute('data-src'));
  image.onload = () => {
    // 删除src属性
    image.removeAttribute('data-src');
  };
};
```

### 模糊

一开始用模糊滤镜来渲染图像，然后从模糊到清晰图像的过渡效果

#### css 模糊

```css
article img[data-src] {
  filter: blur(0.2em);
}

article img {
  filter: blur(0em);
  transition: filter 0.5s;
}
```

#### 主色

可以不使用固定颜色作为图像占位符，而是从原始图像中找到主色并将其用作占位符。

![img.png](/imgs/optimization/image-lazy-load-4.webp)

#### LQIP

低质量图像占位符：Low Quality Image Placeholders，但是只适用于项目中的静态图片

![img.png](/imgs/optimization/image-lazy-load-5.gif)

### 按需加载

上面两种方案的问题是，即使在图片加载时实现了过渡的动画，但是它仍然会一次性加载所有的图片。

另外一种方案：基于 Intersection Observer API 实现只加载视口中（能看到的）的图片

## 原生延迟加载

在最近的更新中，Google 在 Chrome 浏览器的最新版本 Chrome 76 中添加了对`原生延迟加载`的支持。所有基于 Chromium 的浏览器，即 Chrome、Edge、Safari 和 Firefox。您可以在[caniuse.com](https://caniuse.com/loading-lazy-attr)上找到有关浏览器对原生延迟加载支持的更多详细信息。

```html
<img src="example.jpg" loading="lazy" alt="..." />
```

可能的值：

- lazy：直到图片在视口中时才加载
- eager：立刻加载

参考：

【1】 [Lazy Loading Images – The Complete Guide](https://imagekit.io/blog/lazy-loading-images-complete-guide/)

【2】 [vite-plugin-lqip](https://github.com/drwpow/vite-plugin-lqip?tab=readme-ov-file)

【3】 [v-lazy-image](https://github.com/alexjoverm/v-lazy-image)

【4】 [Use Responsive Images with v-lazy-image](https://vuedose.tips/use-responsive-images-with-v-lazy-image/)

【5】 [Achieve Max Performance loading your images with v-lazy-image](https://vuedose.tips/achieve-max-performance-loading-your-images-with-v-lazy-image)

【6】 [lazysizes](https://github.com/aFarkas/lazysizes)
