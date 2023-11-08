# 准备篇

## 什么是render函数？

render函数是Vue提供的一种组件实现更加灵活的方式，可以实现动态DOM的效果，任意修改DOM的展示顺序。

render函数不仅可以返回VNodes也可以返回JSX（需要通过babel插件支持）

```vue

<script>
export default {
  render(h) {
    return h('div', 'hello world')
  }
}
</script>
```

其中render函数有3个参数

- 第一个参数是Vue内置的生成VNode的函数`createElement`，一般简写为`h`。
- 第二个参数是组件中相关的依赖：`props`、`事件处理器`以及`原生DOM属性`
  等。详细的对象结构可参考[官方文档](https://v2.cn.vuejs.org/v2/guide/render-function.html#%E6%B7%B1%E5%85%A5%E6%95%B0%E6%8D%AE%E5%AF%B9%E8%B1%A1)
  。第二个参数不需要时可以省略。
- 第三个参数是需要传递的子组件，可以有多种形式：VNode数组、字符串、数值。

