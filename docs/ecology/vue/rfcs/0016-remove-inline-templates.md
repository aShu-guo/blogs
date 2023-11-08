# 移除inline-template

## 概要

移除inline-template支持

## 动机

`inline-template`最初引入到Vue中的目的是解决使用Vue逐步增强传统服务端渲染的程序的情况（例如使用 Rails、Django 或
Laravel）。允许用户直接在父组件模板中直接定义子组件。

这最大的问题是`inline-template`使作用域变得很难理解。在没有使用`inline-template`
时，一个简单的假设是任何出现在template中的变量都是由它自身提供（译者注：暂时不考虑mixin），或者通过指令引入作用域变量（例如：v-for或者v-slot）。使用`inline-template`
会造成多个作用域混合在一个template来打破这个假设。

```vue

<div>
{{ parentMsg }}
<child-comp inline-template>
  {{ parentMsg }}
</child-comp>
</div>
```

一个包含slot的组件，`{{ parentMsg }}`应该会被放置在默认slot的位置。但是使用了`inline-template`
之后，便不会像预想的那样运行。类似的使用`v-for`+`inline-template`也不会像预期那样运行：

```vue

<child-comp inline-template v-for="item in list">
{{ item.msg }}
</child-comp>
```

在这个行内模板中的`item`并不指向父作用域，而是指向的是子组件作用域中的`this.item`。

## 采取的策略

### 替换方式1：`<script>`标签

`inline-template`的大多用例假设是没有构建步骤的，所有的template直接写在HTML页面。这种情况下应该使用`<script>`标签作为一个可选择类型：

```vue

<script type="text/html" id="my-comp-template">
<div>
{{ hello }}
</div>
</script>
```

并且在组件中，使用id选择器指向这个模板：

```js
const MyComp = {
    template: '#my-comp-template',
    // ...
}
```

这不需要任何构建步骤，可以在所有浏览器中运行，而且不受 DOM 内 HTML
解析警告的约束（例如：你可以使用camelCase命名方法），大多数IDE都可以提供合适的语法高亮。在传统的服务端渲染框架中，这些模板可以拆分成服务器模板部分（包含在主
HTML 模板中）以实现更好的可维护性。

### 替换方式2：默认slot

先前使用`inline-template`的组件可以转换为使用默认slot，这样不仅保留内联编写子内容的便利性而且data的作用域也更加精确。

```vue
<!-- before -->
<my-comp inline-template :msg="parentMsg">
{{ msg }} {{ childState }}
</my-comp>

<!-- after -->
<my-comp v-slot="{ childState }">
{{ parentMsg }} {{ childState }}
</my-comp>
```

子组件无需提供template便可以渲染在默认slot上（注意在v3中，由于支持了代码片段，所以可以在template中无需根结点也可以写slot）

```vue
<!--
  in child template, render default slot while passing
  in necessary private state of child.
-->
<slot :childState="childState"/>
```


