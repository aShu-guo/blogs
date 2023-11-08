# 准备篇

## data声明要求（2.x版本）

- 在根结点下可以声明object类型的data属性
- 在非根结点下必须声明data为function类型，并return出一个对象，这样每个组件中都可以持有data对象的副本，而不是原始数据对象。
