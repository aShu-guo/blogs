# 全局API变更

## 概要

重新设计app引导程序和全局API。

- 全局改变Vue行为的全局API现在被迁移到通过`createApp`方法创建的**app示例**上，并且它们的作用只会在app实例中体现。
- 没有改变Vue行为的全局API（例如：nextTick和[高阶响应式API](https://github.com/vuejs/rfcs/pull/22)
  ）现在通过[具名导出](./0004-global-api-treeshaking.html)

## 基础用例

### 之前

```js
import Vue from 'vue'
import App from './App.vue'

Vue.config.ignoredElements = [/^app-/]
Vue.use(/* ... */)
Vue.mixin(/* ... */)
Vue.component(/* ... */)
Vue.directive(/* ... */)

Vue.prototype.customProperty = () => {
}

new Vue({
    render: h => h(App)
}).$mount('#app')
```

### 之后

```js
import {createApp} from 'vue'
import App from './App.vue'

const app = createApp(App)

app.config.isCustomElement = tag => tag.startsWith('app-')
app.use(/* ... */)
app.mixin(/* ... */)
app.component(/* ... */)
app.directive(/* ... */)

app.config.globalProperties.customProperty = () => {
}

app.mount(App, '#app')
```

## 动机

目前Vue中的一些全局API和配置会永远改变全局状态。这会导致一些问题：

- 在测试时，全局配置很容易偶然污染其他测试用例。用户需要小心存储原始的全局配置，并且在每次测试之后恢复（
  例如：重置`Vue.config.errorHandler`
  ）。一些API（例如：`Vue.use`,`Vue.mixin`）甚至没有一种途径可以消除它的影响。这使得涉及插件的测试特别棘手。

    - `vue-test-utils`必须实现一个特殊的API`createLocalVue`来处理上述问题
- 在相同页面但是多个不同配置的"app"中，很难共享同一份`Vue`副本：

```js
// 会影响到所有Vue实例
Vue.mixin({ /* ... */})

const app1 = new Vue({el: '#app-1'})
const app2 = new Vue({el: '#app-2'})
```

## 详细设计

从技术上来说，Vue2并没有"app"这个概念。我们定义的一个app只是通过`new Vue()`创建的一个简单Vue实例。任何通过相同Vue构造函数创建出得根实例都会共享同一个配置。

在这个提议中，我们介绍一种新的全局API，`createApp`：

```js
import {createApp} from 'vue'

const app = createApp({
    /* root component definition */
})
```

调用`createApp`会返回一个app实例。一个app实例提供一个app上下文。挂载在app实例上的全部组件树共享相同的app上下文，而且提供跟之前Vue2.x全局配置相同的配置。

### 全局API映射

app实例暴露出一个当前全局API的子集。基础的规则是任何全局改变Vue行为的API都迁移到app实例上。这包括：

- 全局配置
    - `Vue.config` 变更为 `app.config`
        - 移除`config.productionTip`。
        - `config.ignoredElements` 变更为 `config.isCustomElement`。
        - 移除`config.keyCodes`。
        - 调整`config.optionMergeStrategies`的行为
    - 资产注册API（Asset registration APIs）
        - `Vue.component` 变更为 `app.component`。
        - `Vue.directive` 变更为 `app.directive`。
    - 扩展API的行为（Behavior Extension APIs ）
        - `Vue.mixin` 变更为 `app.mixin`。
        - `Vue.use` 变更为 `app.use`。

另外没有全局改变行为的全局API现在建议通过[具名导出](./0004-global-api-treeshaking.html)。

唯一的例外是`Vue.extend`。因为全局`Vue`不再是一个新能力的构造函数，`Vue.extend`作为构造函数的拓展也不再有意义。

- 对于继承一个基础组件，应该使用`extends`选项来替代。
- 对于类型系统，使用新的全局API`defineComponent`。

```js
import {defineComponent} from 'vue'

const App = defineComponent({
    /* Type inference provided */
})
```

需要注意的是`defineComponent`实现上没有做任何事情 -
只是简单的返回传入的对象。但是，在Typescript中，返回值具有手写render函数的构造函数的合成类型，通过TSX和IDE工具支持。这种不匹配是一种有意的权衡。

## 挂载app实例

app实例可以使用mount函数挂载根实例。与2.x `vm.$mount()`工作原理类似，并且返回被挂载根组件的实例：

```js
const rootInstance = app.mount(App, '#app')

```

`mount`也接收通过第三个参数传递到根组件实例上的props：

```js
app.mount(App, '#app', {
    // 传递给根实例的props
})
```

### 与2.x挂载行为不一致的地方

当使用包含编译器的构建版本并挂载一个自身没有template的跟组件，Vue将会尝试使用挂载的目标元素内容作为template。需要注意是3.x和2.x行为上的不同：

- 在2.x，根实例使用目标元素的`outerHtml`作为template，并且整体替换目标元素。
- 在3.x，根实例使用目标元素的`innerHtml`作为template，并且仅替换目标元素中的子节点。

在大多数用例中，这个改动并不会对你的app行为造成印象，仅有的会造成影响的情况是如果目标元素有多个子节点，根实例将会作为代码片段挂载并且它的`this.$el`
会指向开始锚点的代码片段（一个DOM注释节点）。

在Vue3中，由于代码片段的可用性，建议直接使用template直接访问DOM节点而不是依赖`this.$el`。

## Provide/Inject

一个app实例也可以提供到可由app中的任意组件注入的依赖：

```js
// in the entry
app.provide({
    [ThemeSymbol]: theme
})

// in a child component
export default {
    inject: {
        theme: {
            from: ThemeSymbol
        }
    },
    template: `<div :style="{ color: theme.textColor }" />`
}
```

这在2.x的根实例中的选项类似。

## 移除`config.productionTip`

在3.0中，"使用生产版本构建"的提示只会在使用"开发版本+完整构建"时（包含运行时编译器并有警告的构建版本）出现。

对于构建ES模块，因为它们与打包器一起使用，并且在多数情况下在生产环境合理配置了CLI或者样板文件，所以这个提示没必要出现。

## `config.ignoredElements` 变更为 `config.isCustomElement`

引入这个选项配置意图是支持原生自定义标签元素，因此这次重命名与他的功能更匹配。这个新选项也是一个函数类型，这可以提供相比之前字符串类型/正则表达式类型更好的灵活性：

```js
// before
Vue.config.ignoredElements = ['my-el', /^ion-/]

// after
const app = Vue.createApp({ /* ... */})
app.config.isCustomElement = tag => tag.startsWith('ion-')
```

**重要的：** 在3.0，在代码编译阶段移除元素是否为组件的检查，因此这个配置只会在使用运行时编译器生效（译者注：即完整版本）。
如果你使用Vue仅运行时的版本，`isCustomElement`
必须在构建时传递给`@vue/compiler-dom` - 例如，传递`compilerOptions`到`vue-loader`中。

- 如果在使用仅运行时版本的情况下，赋值了`config.isCustomElement`选项，将会抛出指导用户传递选项到构建配置中的警告。
- 这在Vue CLI配置中将是一个新的顶级配置。

## `config.optionMergeStrategies`行为变更

虽然仍然支持，由于Vue3改变了内部实现，内置选项不再需要合并策略，因此它们不再暴露出来。`app.config.optionMergeStrategies`
的默认值是一个空对象。这意味着：

- 用户必须提供他们自己的合并策略，而不能再复用内置策略（
  例如：你不能再这样使用：`config.optionMergeStrategies.custom = config.optionMergeStrategies.props`）。
- 重写内置选项的合并策略成为不可能。

### 附加实例全局共享属性

在2.x中，注入全局共享属性到实例上是通过将它们简单添加到`Vue.prototype`上。

在Vue3中，因为全局Vue不再是一个构造函数，这也就不再支持上述新增属性方式。相反，共享的实例属性应该添加到实例的`config.globalProperties`
上：

```js
// Before
Vue.prototype.$http = () => {
}

// After
const app = createApp()
app.config.globalProperties.$http = () => {
}
```

## 缺点

### 插件自动安装

更多的Vue2.x的库和插件在UMD产物中提供自动安装，例如`vue-router`：

```js
<script src="https://unpkg.com/vue"></script>
<script src="https://unpkg.com/vue-router"></script>
```

依赖`Vue.use`的自动安装不再可用。这应该是一个相对简单的迁移，并且我们可以为`Vue.use`公开一个存根并发出警告。

## 可选的方案

N/A

## 采取的策略

- 这个转换是直接明了的（就像在基础用例中看到的一样）。
- 迁移的方法会用抛出指向引导迁移方案的警告来替换。
- 提供一个代码模版。
- `config.ingoredElements`会在兼容版本中支持。
- `config.optionMergeStrategies`会在兼容版本中支持内置策略。
