# attribute强制行为

## 概览

- 废弃内置的`enumerated attributes`的概念，将这些属性作为普通非布尔类型的attribute来处理。
- 如果属性值为false，则不再移除这个属性。而是设置为`attr='false'`。想要移除属性时，需要设置为`null`或者`undefined`。

## 动机

在2.x版本，对于v-bind绑定的属性值我们采用的是以下策略：

- 对于attribute/element结对出现时，Vue使用相关的IDL attribute（property）：类似 `<input>`, `<select>`, `<progress>`
  标签的value属性
- 对于布尔类型的attribute和xlinks，如果它们的值为`falsy`（null || undefined || false）则会移除它们，反之则添加。
- 对于`enumerated attributes`（目前包括：`contenteditable`, `draggable` 和 `spellcheck`
  ），vue试图强制改写它们为字符串（目前对`contenteditable`做了特殊处理，来接收用户传入合法的`contenteditable`
  值而不是转为`contenteditable='true'`）
- 对于其他attribute，如果它们的值为`falsy`则会移除，反之则按set原值。

在v2.x版本中，我们添加了`enumerated attributes`的概念，表示只能接收`'true'`或`'false'`
的属性，这在技术上是有缺陷的。而且相对于其他非布尔类型的attribute的行为是不同的，这也对用户造成了困惑。下面的table描述了`enumerated attributes`
的属性与普通非布尔类型attributes的不同点：

| Binding expr.       | `foo` <sup>normal</sup> | `draggable` <sup>enumerated</sup> |
|---------------------|-------------------------|-----------------------------------|
| `:attr="null"`      | /                       | `draggable="false"`               |
| `:attr="undefined"` | /                       | /                                 |
| `:attr="true"`      | `foo="true"`            | `draggable="true"`                |
| `:attr="false"`     | /                       | `draggable="false"`               |
| `:attr="0"`         | `foo="0"`               | `draggable="true"`                |
| `attr=""`           | `foo=""`                | `draggable="true"`                |
| `attr="foo"`        | `foo="foo"`             | `draggable="true"`                |
| `attr`              | `foo=""`                | `draggable="true"`                |

我们从上面这个table得知，目前的实现是将true强制设置为了`'true'`，但是为`false`
时会移除attribute。这造成了用法上的不连贯，而且在很普遍的用例中，例如`aria-*`：`aria-selected`, `aria-hidden`等，
要求用户手动将值从boolean类型更改为string类型。

## 详细设计

- 我们计划移除`enumerated attributes`的概念，并且将它们作为普通非布尔类型的HTML attribute对待。

这解决了`enumerated attributes`和普通非布尔类型的attribute之间的不一致性。这样也就可以去使用其他值，而不仅仅是`'true'`
和 `'false'`，甚至尚未确定的关键字。

- 对于非布尔类型的HTML attribute，如果值为false时不再移除，而是设置为`'false'`。

这解决了值为`true`和`false`如何set attribute的不一致性，而且更容易输出`aria-*` attribute。

下面这个表格描述了新的行为：

| Binding expr.       | `foo` <sup>normal</sup>    | `draggable` <sup>enumerated</sup> |
|---------------------|----------------------------|-----------------------------------|
| `:attr="null"`      | /                          | / <sup>†</sup>                    |
| `:attr="undefined"` | /                          | /                                 |
| `:attr="true"`      | `foo="true"`               | `draggable="true"`                |
| `:attr="false"`     | `foo="false"` <sup>†</sup> | `draggable="false"`               |
| `:attr="0"`         | `foo="0"`                  | `draggable="0"` <sup>†</sup>      |
| `attr=""`           | `foo=""`                   | `draggable=""` <sup>†</sup>       |
| `attr="foo"`        | `foo="foo"`                | `draggable="foo"` <sup>†</sup>    |
| `attr`              | `foo=""`                   | `draggable=""` <sup>†</sup>       |

<small>†: changed</small>

对于布尔类型attribute的行为与之前保持一致。

## 缺点

该提案引入了以下重大更改：

- 对于`enumerated attributes`：
    - 值为`null`时才会移除attribute，而不是设置为`'false'`
    - `'true'` 和 `'false'`以外的number类型和string类型的值都不在强制转换为`'true'`
- 对于所有非布尔类型的attribute，值为`false`时不会移除它，而是会被设置为`'false'`

最重大的变更是用户不应该再依赖值为false时移除attribute，而是应该使用null或者undefined。但是布尔类型的attribute并不受影戏，这个变更更多影响的是值为`'false'`
或者不传递值
的`enumerated attributes`，例如`aria-checked`。这也可能影响如`[foo]`的css选择器。

## 可选的方案

N/A

## 采取的策略

不太可能为该用例提供一个有帮助的代码模板。我们应该在迁移指引中提供详细的信息，并且在v3.x版本的档案中记录下。

### enumerated attributes

移除`enumerated attributes`的概念和`attr='false'`可能造成不同的IDL attribute值（这将会反映在真实的值上），描述如下：

| Absent enumerated attr | IDL attr & value                     |
|------------------------|--------------------------------------|
| `contenteditable`      | `contentEditable` &rarr; `'inherit'` |
| `draggable`            | `draggable` &rarr; `false`           |
| `spellcheck`           | `spellcheck` &rarr; `true`           |

为了保证旧行为有效，我们将会将`false`强制转换为`'false'`，在3.x版本中对于通过v-bind传递给`contenteditable`
和 `spellcheck`的值，开发者需要手动将`false`处理为`'false'`。

在2.x版本中，对于enumerated attributes所有非法的属性值都会被转换为`true`
。这通常是无意的，不太可能被大规模依赖。在3.x，`true`或者`'true'`需要精确指定。

### 将`false`转换为`'false'`而不是移除attribute

在3.x版本中，移除attribute需要指定值为`null`或`undefined`

### 2.x版本和3.x版本中的行为比较

<table>
  <thead>
    <tr>
      <th>Attribute</th>
      <th><code>v-bind</code> value <sup>2.x</sup></th>
      <th><code>v-bind</code> value <sup>3.x</sup></th>
      <th>HTML output</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td rowspan="3">2.x “Enumerated attrs”<br><small>i.e. <code>contenteditable</code>, <code>draggable</code> and <code>spellcheck</code>.</small></td>
      <td><code>undefined</code>, <code>false</code></td>
      <td><code>undefined</code>, <code>null</code></td>
      <td><i>removed</i></td>
    </tr>
    <tr>
      <td>
        <code>true</code>, <code>'true'</code>, <code>''</code>, <code>1</code>,
        <code>'foo'</code>
      </td>
      <td><code>true</code>, <code>'true'</code></td>
      <td><code>"true"</code></td>
    </tr>
    <tr>
      <td><code>null</code>, <code>'false'</code></td>
      <td><code>false</code>, <code>'false'</code></td>
      <td><code>"false"</code></td>
    </tr>
    <tr>
      <td rowspan="2">Other non-boolean attrs<br><small>eg. <code>aria-checked</code>, <code>tabindex</code>, <code>alt</code>, etc.</small></td>
      <td><code>undefined</code>, <code>null</code>, <code>false</code></td>
      <td><code>undefined</code>, <code>null</code></td>
      <td><i>removed</i></td>
    </tr>
    <tr>
      <td><code>'false'</code></td>
      <td><code>false</code>, <code>'false'</code></td>
      <td><code>"false"</code></td>
    </tr>
  </tbody>
</table>

## 未解决的问题

N/A

