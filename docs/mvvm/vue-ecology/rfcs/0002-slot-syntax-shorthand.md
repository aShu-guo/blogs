# slot语法的简写

## 概要

新增`v-slot`的简写语法，请确保先阅读[rfc-0001](/vue-ecology/rfcs/0001-new-slot-syntax.md)。

## 基本示例

```html

<foo>
    <template #header="{ msg }">
        Message from header: {{ msg }}
    </template>

    <template #footer>
        A static footer
    </template>
</foo>
```

## 动机

简写，顾名思义，主要目的是提供更简洁的语法。

在Vue中，我们只对两个指令提供了简写：

```html

<div v-bind:id="id"></div>
<div :id="id"></div>

<button v-on:click="onClick"></button>
<button @click="onClick"></button>
```

`v-bind`和`v-on`
经常在同一个元素上重复使用，并使用多个相同指令而指令参数不同时，代码会变得非常冗长。因此，简写可以通过缩短重复的部分（`v-xxx`
）来突出不同的部分，提高信噪比。

在使用多个slot时，新语法`v-slot`也会遇到同样的问题：

```html

<TestComponent>
    <template v-slot:one="{ name }">Hello {{ name }}</template>
    <template v-slot:two="{ name }">Hello {{ name }}</template>
    <template v-slot:three="{ name }">Hello {{name }}</template>
</TestComponent>
```

其中实际不同的时插槽名称，但是`v-slot`重复了多次。

简写有助于清楚插槽名称：

```html

<TestComponent>
    <template #one="{ name }">Hello {{ name }}</template>
    <template #two="{ name }">Hello {{ name }}</template>
    <template #three="{ name }">Hello {{name }}</template>
</TestComponent>
```

## 详细设计

简写遵循与`v-bind`和`v-on`非常类似的规则：将`v-slot:`替换为`#`。

```html
<!-- full syntax -->
<foo>
    <template v-slot:header="{ msg }">
        Message from header: {{ msg }}
    </template>

    <template v-slot:footer>
        A static footer
    </template>
</foo>

<!-- shorthand -->
<foo>
    <template #header="{ msg }">
        Message from header: {{ msg }}
    </template>

    <template #footer>
        A static footer
    </template>
</foo>
```

与`v-bind`和`v-on`类似，简写只有在被传入参数时才会有效。这意味着`v-slot`不能被简写为`#`，对于默认插槽，可以使用`v-slot`
或者`default`表示：

```html

<foo v-slot="{ msg }">
    {{ msg }}
</foo>

<foo #default="{ msg }">
    {{ msg }}
</foo>
```

选择`#`作为简写的原因是基于RFC中收集到的反馈，它和CSS中的id选择器类似，并且可以更好的理解为slot的名称：

在真实库（vue-promised）中的一些示例用法：

```html

<Promised :promise="usersPromise">
    <template #pending>
        <p>Loading...</p>
    </template>

    <template #default="users">
        <ul>
            <li v-for="user in users">{{ user.name }}</li>
        </ul>
    </template>

    <template #rejected="error">
        <p>Error: {{ error.message }}</p>
    </template>
</Promised>
```

## 缺点

- 有些人可能会认为插槽并不常用，因此不需要为它提供简写，这样会增加初学者的学习成本，对此：
    - 对于构建高拓展性和可组合性的第三方组件而言，我认为作用域插槽是一个重要的机制。在未来，我想我们可以看到很多依赖slot构建出高拓展性和可组合性的组件库。对于使用这样的组件库用户而言，简写将会变得更加有价值。
    - v-slot的简写简单明了，与现有的简写规范保持一致。如果用户了解了语法的基本工作原理，对于简写的理解只是一个工作量最少的额外步骤。

## 可替代方案

之前的RFC中，讨论和介绍了一些替代符号。唯一具有类似积极兴趣的是`&`：

```html

<foo>
    <template &header="{ msg }">
        Message from header: {{ msg }}
    </template>

    <template &footer>
        A static footer
    </template>
</foo>
```

## 采取的策略

这应该是新语法`v-slot`的拓展。理想情况下，我们希望在介绍`v-slot`
基础用法的同时也介绍指令的简写，以便用户可以同时学习。如果稍晚介绍简写方式，那么可能导致一些仅学习了`v-slot`
基础语法的用户看到其他人代码时感到困惑。 













