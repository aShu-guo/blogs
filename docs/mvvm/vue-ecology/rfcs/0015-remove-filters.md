# 移除filter

## 概要

移除filters支持

## 基础用例

```text
<!-- before -->
{{ msg | format }}

<!-- after -->
{{ format(msg) }}
```

## 动机

- filter函数提供的能力可以通过调用method或者computed来实现，因此它更多的是提供语法价值而不是实用价值
- filters必须使用自定义语法，这并是不纯js（增加了学习成本和实现成本）。事实上，这也与js自身的或运算符（`|`）相冲突，导致在解析时变得麻烦。
- filters对于IDE的template支持也造成了额外的复杂性（因为它们并不是js）

## 缺点

- 当使用多个filter时，读起来相对于调用method更容易理解

```text
msg | uppercase | reverse | pluralize
// vs
pluralize(reverse(uppercase(msg)))
```

但是在实践中我们发现很少会有使用多个过滤器，所以丢失部分可读性似乎是可以接受的。

- 与全局注册的过滤器相比，单独导入或定义方法可能更像样板文件。然而，全局过滤器与在`Vue.prototype`
  上注册特别命名的全局`helper`没有根本区别。这种全局注册伴随着权衡：它们使代码依赖关系不那么明确，也使它们难以提供类型推断。

## 可选的方案

在js中有个添加pipeline操作符的第1阶段提案，提供了与filter大致相同的功能：

```js
let transformedMsg = msg |> uppercase |> reverse |> pluralize

```

考虑到这个提案最终落地的可能性，对于框架而言例如Vue并不应该提供类似的可选方案（尤其是与现存js语法相冲突）。

这个提案仍然还在第1阶段，而且有很长时间没有更新，因此并不能确定它什么时候落地，或者落地之后是否会像现在设计的那样。对于Vue而言，选择它作为正式API的一部分是有风险的，因为如果它发生了变更我们也必须同步调整。

在Vue3中，模板语法是使用`@babel/parser`解析的，而且通过添加编译器选项中的`expressionPlugins`
提供对于pipeline操作符的在template中的支持（将会通过传递给`@babel/parser`作为它的`plugins`
选项）。注意Vue模板编译选项仅启用了语法解析（生成的render函数需要交给babel做进一步转换，这将会在新的基于 webpack 的设置中默认启用的）

## 采取的策略

在2.x的兼容版本中仍然支持filters，并抛出警告提示渐进式迁移。
