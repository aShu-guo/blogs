# 更改v-model API

## 概要

调整在自定义组件上v-model API的使用方式。

这次变动建立在RFC[#5](./0005-replace-v-bind-sync-with-v-model-argument.md)上（用`v-model`参数替换`v-bind`
的`.sync`修饰符）。

## 基础用例

N/A

## 动机

在此之前，组件上的`v-model="foo"`大概编译成如下：

```js
h(Comp, {
    value: foo,
    onInput: value => {
        foo = value
    }
})
```

但是，当出于其他的目的希望暴露出组件的`value`props时，这仍然要求通过v-model绑定属性的组件需要使用value作为props传递。（译者注：两者相冲突了）

在2.2中，我们在组件选项中引入了`model`选项来自定义`v-model`需要的prop以及事件。但是，这仍然只允许在组件上使用一个`v-model`
。在实践中，我们看到一些组件需要同步许多属性的值，并且这些属性必须通过`v-bind.sync`
来同步值。我们注意到，从根本上来讲`v-model`
和`v-bind.sync`
是在做同样的事情，并且可以通过允许v-model接收参数来合并到同一个结构中（像[#5](./0005-replace-v-bind-sync-with-v-model-argument.md)
提议的那样）。

## 详细设计

在3.0中，`model`选项将会被移除。组件上的`v-model="foo"`（无参数形式）将会编译成如下格式：

```js
h(Comp, {
    modelValue: foo,
    'onUpdate:modelValue': value => (foo = value)
})
```

如果一个组件想要支持无参数形式的`v-model`，它应该声明一个名称为`modelValue`
的props。为了同步值回父组件，子组件应该抛出一个名为`"update:modelValu"`
的事件（参考[render函数API变更](./0008-render-function-api-change.md)中的新VNode数据结构中的更多细节）。

props和事件的默认编译前缀`model`可以避免与其他props和事件冲突。

[RFC 5#](./0005-replace-v-bind-sync-with-v-model-argument.md)
建议支持v-model接收参数的能力。使用这个参数时，意味着`v-model`应该绑定一个props。`v-model:value="foo"`被编译成：

```js
h(Comp, {
    value: foo,
    'onUpdate:value': (value) => (foo = value)
})
```

在这个用例中，子组件需要接收一个名为`value`的props并且抛出`update:value`的事件来同步值。

注意的是这支持在同一个组件上绑定多个`v-model`，同步每个不同的props并不需要组件中额外的选项：

```js
<InviteeForm
    v-model:name="inviteeName"
    v-model:email="inviteeEmail"
/>
```

### 处理修饰符

在2.x中，我们通过硬编码支持组件上`v-model`的修饰符。但是，如果组件支持自定义修饰符是很有用的。在v3中，添加在组件`v-model`
上的修饰符将会通过`modelModifiers`提供到组件上。

```js
<Comp v-model.foo.bar="text"/>

```

将会被编译为：

```js
h(Comp, {
    modelValue: text,
    'onUpdate:modelValue': value => (text = value),
    modelModifiers: {
        foo: true,
        bar: true
    }
})
```

对于带参数的`v-model`，生成的修饰符名称为`arg+'Modifiers'`：

```js
<Comp
    v-model:foo.trim="text"
    v-model:bar.number="number"/>
```

将会被编译为：

```js
h(Comp, {
    foo: text,
    'onUpdate:foo': value => (text = value),
    fooModifiers: {trim: true},
    bar: number,
    'onUpdate:bar': value => (bar = value),
    barModifiers: {number: true},
})
```

### 在原生元素上使用

另一方面，`v-model`可以在原生元素上使用。在2.x中，编译器根据不同的元素类型上的`v-model`
生成不同的代码。例如，它在`<input type="text">`和`<input type="checkbox">`上会编译出不同的代码。但是，这个策略并不能很好的处理动态元素和input类型：

```vue
<input :type="dynamicType" v-model="foo">

```

编译器无法在编译期猜测出正确的props/event组合形式，因此需要非常冗余的代码来覆盖可能用例。

在3.0中，在原生元素上的v-model会像组件上的一样被编译出确切的输出。例如，`<input v-model="foo">`会被编译为：

```js
h('input', {
    modelValue: foo,
    'onUpdate:modelValue': value => {
        foo = value
    }
})
```

负责为web平台打补丁的模块将会动态的决定如何实际应用它们。这尽可能的让编译器输出最少的冗余代码。

## 缺点

TODO

## 可选的方案

N/A

## 采取的策略

TODO

## 还未解决的问题

### 在自定义元素上使用

[issue#7830](https://github.com/vuejs/vue/issues/7830)

在2.x中，在原生自定义元素上使用`v-model`很困难（译者注：例如web
component），因为编译器无法从普通的Vue组件中分辨出原生自定义元素（`Vue.config.ignoredElements`
仅在运行时生效）。在自定义元素上使用v-model将会导致：

```vue

<custom-input v-model="foo"></custom-input>

```

2.x编译器将会根据Vue组件生成代码而不是原生默认`value/input`。

在3.0中，无论是原生元素还是Vue组件，编译器都将一定会生成相同的代码，并且原生自定义元素将会作为原生元素被合适的处理。

其余的问题是第三方自定义元素会有未知的props/event组合，并且不一定遵循Vue同步事件的命名约定。例如如果一个自定义元素期望像checkbox那样工作，Vue并没有信息确定绑定哪个属性合适或者监听哪个事件合适。另一种处理这种情况的可能的方式是使用`type`
属性作为提醒：

```vue

<custom-input v-model="foo" type="checkbox"></custom-input>

```

这告诉Vue绑定`v-model`时，使用`<input type="checkbox">`相同的逻辑，使用`checked`作为`props`并且使用`change`作为事件。

如果这个自定义元素的行为并不像现存的`input`类型，那么可能更好的方式是显式使用`v-bind`和`v-on`。

::: tip 译者注
存在的问题主要指两种情况：

1. web component自定义元素
2. 跨平台框架基于原生元素的第二次封装

在v2中，Vue对待在组件和原生元素上的v-model是两套逻辑：

- 当是组件时，Vue会直接抛出值，并且在处理事件时是在`$event`中取值。
- 当是原生元素时，Vue会从`$event.target.value`取值。

所以在判断逻辑上，除了原生的input组件都会走组件的逻辑来处理`v-model`
值，但是在编译期Vue并不能判断元素是否为组件或者是否为元素。虽然`Vue.config.ignoredElements`
是可以忽略组件的判断，直接走原生元素的判断逻辑。但是`Vue.config.ignoredElements`
是仅运行时生效的选项，所以导致了原生元素从`$event`中取值，与预期的行为不一致。
:::
