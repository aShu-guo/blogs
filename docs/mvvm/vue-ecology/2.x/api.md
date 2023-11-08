# api行为记录

记录下在业务开发过程中不常用的api，但是这在库开发中比较常用。

## $listener & $attrs

- `$listener`
    - 在vue-2.x版本中，是包含传入当前组件所有非native事件的对象。
    - 在vue-3.x版本中废弃了。合并到`$attrs`中了
- `$attrs`
    - 在vue-2.x版本中，包含了父组件传递给当前组件，但是在当前组件没有声明的所有`props`，不包括`listener`、`class`、`style`
    - 在vue-3.x版本中，包含当前组件没有声明的所有`props`，而且包括`listener`

### 使用场景

1. 使用场景，存在这样一个逻辑：爷组件 -> 父组件 -> 子组件。从爷组件传递props到子组件，爷组件监听子组件事件爷组件希望传递props到子组件，爷组件希望监听子组件事件

2. 对组件二次封装，不希望传递多个props。这在高等级的组件中很有效。但是这需要足够的文档说明包含哪些`props`，否则维护起来非常麻烦。

## inheritAttrs

`attrs：未定义的props以及html的属性构成的并集`

- true：传入attrs会绑定到template的根节点上；重名则覆盖，class、styles则合并

- false：传入attrs不会绑定到template的根节点上；重名不会覆盖，class、styles则合并

**确定未定义的attrs的行为**

`但是$attrs可以突破 inheritAttrs:false 的限制，将未定义的attrs通过v-bind绑定在非根元素上 `

## watch

设置为立即执行时，被设置了`v-if`和`v-show`组件中的watch执行顺序不同

v-if：符合条件后重新挂载，后执行watch中的逻辑

v-show：符合条件后visible设置为可见，但是watch立执行的逻辑是在挂载父组件时便执行了
