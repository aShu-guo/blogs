# styleFunction

在ol中支持多种style形式：

1. StyleLike

支持Style对象、Style对象的数据或StyleFunction（需要返回一个或一组Style对象）

2. FlatStyleLike

ol@10.0新支持的类型

---

传入单个Style对象很容易理解，如果传入的是一组Style对象，那么最终的效果是这组对象的叠加展示，例如：

```js
const styles = {};
const white = [255, 255, 255, 1];
const blue = [0, 153, 255, 1];

styles['LineString'] = [
  new Style({
    stroke: new Stroke({
      color: white,
      width: width + 2,
    }),
  }),
  new Style({
    stroke: new Stroke({
      color: blue,
      width: width,
    }),
  }),
];
```

而styleFunction则是将所有feature都传入，并且为每个feature绑定styleFunction的返回结果

可能传入的feature：线段以及线段的顶点，面以及面的顶点

## Modify

执行时机：

- 改变Feature时

## Layer

执行时机：

- 图层上的features发生改变时
- view放缩时
- view被拖拽时



