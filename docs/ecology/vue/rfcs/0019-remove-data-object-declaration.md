# 移除object类型的data声明

## 概要

选项中的data属性接收两种类型：`object`和`function`。最常使用的是`function`
类型声明，因为它为每个组件实例创建了一个新的状态。另一方面，`object`
类型声明的data在所有组件实例中共享状态，并且只在根实例上正常工作。这个RFC主要聚焦移除`object`类型声明的`data`。

## 动机

在根实例上共享状态并没有或者说很少用例使用。即使你想实现这样的用例，通过`function`类型声明的`data`
也能实现。拥有两种类型的声明对初学者来说并不友好，而且在没有合适例子的情况下会造成困惑（在当前文档中并没有这些例子）。`object`
类型声明另外的限制可能是只能在根实例上声明也是会造成困惑的。
拥有一个统一的类型声明，你也可以实现相同的效果而且消除部分疑惑。

## 详细设计

`object`类型声明的data将是非法的，而且会抛出错误信息来解释在根实例上声明data只有function类型才是合法的。错误信息应该包含指向这个API的链接和迁移例子。

之前使用`object`类型的声明：

```js
import {createApp, h} from 'vue'

createApp().mount({
    data: {
        counter: 1,
    },
    render() {
        return [
            h('span', this.counter),
            h('button', {
                onClick: () => {
                    this.counter++
                }
            }),
        ]
    },
}, '#app')
```

之后使用`function`类型的声明：

```js
import {createApp, h} from 'vue'

createApp().mount({
    data() {
        return {
            counter: 1,
        }
    },
    render() {
        return [
            h('span', this.counter),
            h('button', {
                onClick: () => {
                    this.counter++
                }
            }),
        ]
    },
}, '#app')
```

## 缺点

使用`object`类型声明的data需要迁移到`function`类型声明

也不可能拥有顶级共享状态。

使用`object`声明的例子需要改写为`function`类型声明

## 采取的策略

由于在根实例上使用object声明data并不常见，所以迁移时应该是相当容易的。这次迁移造成的影响也会由于v3中根结点挂载API（经常使用根组件的地方）改变而缩小。

直接迁移：

- 将共享数据提取到外部对象中，并将其用作数据中的属性。
- 重写指向共享数据对象的引用，指向新的共享对象

文档的API页面应该包含一个信息块描述object类型的声明已经废弃，而且引导用户如何迁移。

可以提供适配器以保持向后兼容性。
