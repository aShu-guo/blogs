> stylesheet树 🌲

| DOM树 | ---> | stylesheet树 | ---> | renderObject树 |

发生在在DOM树构建之后，renderObject树之前

css的主要来源：浏览器默认样式、行内样式、外联样式以及放在网页中的样式

> 规则匹配

为可视节点匹配样式（display属性不为none的节点）

> 布局计算

每个类型的元素都有自己特定的算法（layout）来计算布局信息

```js
class FrameView {
    needsLayout = false

    layout() {
        // 计算布局位置、元素大小
        if (存在子女节点) {
            this.layout()
        }
    }
}

const frameview = new FrameView()
if (frameview.needsLayout) {
    // 先去计算子女节点的位置以及大小，后去计算当前节点的位置大小（类似vue的生命周期钩子执行顺序）
    frameview.layout()
    if (设置了宽高 && 元素宽高超出了给定的值 && overflow的值为visible或者auto) {
        // 如果被包含元素的宽高超出了给定的值，添加滚动条
    }
}
```

> @开头的css属性

- @import 串行导入css
- @font-face 自定义字体名
- @keyframe 定义关键帧
- @media 媒体查询，用于定义不同屏幕的展示样式
- @page 定义打印机样式
