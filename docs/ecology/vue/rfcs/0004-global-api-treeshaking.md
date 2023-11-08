# 全局API tree-shaking

## 概要

尽可能通过具名导出，使Vue运行时被tree-shaking

## 基本示例

```html
import { nextTick, observable } from 'vue'

nextTick(() => {})

const obj = observable({})
```

## 动机

随着Vue的api新增，我们需要时刻平衡新功能和打包大小。我们想尽可能的使Vue足够小，但是也不能因为打包大小而限制性能。（译者注：要追求性能和打包大小之间的平衡）

借助ES module静态分析的友好设计、现代bundler和minifier相结合，可以消除未在bundle中导出的es
modules。我们可以利用这个优点来重构Vue的全局API和内置的API，以便用户只消费他们使用的功能。

另外，对于不使用可选功能的用户而言，这并不会增加最终bundle的大小，因此我们有更多的空间来提供可选的功能。

## 详细设计

在2.x版本，所有的全局API通过单一的Vue对象对外暴露：

```js
import Vue from 'vue'

Vue.nextTick(() => {
})

const obj = Vue.observable({})
```

在3.x版本中，他们只能通过具名导出：

```js
import Vue, {nextTick, observable} from 'vue'

Vue.nextTick // undefined

nextTick(() => {
})

const obj = observable({})
```

通过不再默认导出Vue上挂载所有API，任何未使用的API都会被支持tree-shaking的打包器丢弃，并不会打包到最终的bundle中。

## 受影响的2.x版本的API

- `Vue.nextTick`
- `Vue.observable`
- `Vue.version`
- `Vue.compile`(仅存在完整版本中)
- `Vue.set`(仅存在兼容版本中)
- `Vue.delete`(仅存在兼容版本中)

## 内置的helper

除了公共API，一些其他的内置组件或者helper也要具名导出。编译器才会只导出用到的API，例如：

```html

<transition>
    <div v-show="ok">hello</div>
</transition>
```

编译结果如下（只是处于解释目的，并不是实际输出）：

```js
import {h, Transition, applyDirectives, vShow} from 'vue'

export function render() {
    return h(Transition, [
        applyDirectives(h('div', 'hello'), this, [vShow, this.ok])
    ])
}
```

这意味着，`Transition`组件只会在被实际使用时才会被导出。

**需要注意以上只适用于支持tree-shaking的打包器（bundler）构建出的ES模块产物，- UMD产物仍会包含所有API并且导出Vue的所有全局变量（并且编译器将会输出适当的产物）**

## 缺点

用户不能再单独导出Vue变量来使用API。然而，这对于打包体积而言是有价值的。

### 在插件中使用全局API

一些插件可能依赖原有暴露在Vue上的全局API：

```js
const plugin = {
    install: Vue => {
        Vue.nextTick(() => {
            // ...
        })
    }
}
```

在3.0版本，插件开发者必须直接导出要使用的API：

```js
import {nextTick} from 'vue'

const plugin = {
    install: app => {
        nextTick(() => {
            // ...
        })
    }
}
```

这将会造成一些负担，因为要求库开发者需要合理配置Vue相关的打包配置：

- Vue不应该被打包进库中；
- 对于ES模块构建，应该保留导出的API并最终交给打包器处理；
- 对于UMD/browser构建，应该先尝试`Vue.h`然后再降级`require`处理。

这是React的常见做法，而且也可能存在webpack、rollup中。一些Vue的库也是如此做的。我们仅需要提供合适的文档以及工具支持。

## 可替代方案

N/A

## 采取的策略

应该提供一个code模版作为迁移工具的一部分。




