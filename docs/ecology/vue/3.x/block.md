# Block 机制

前文说到在compile阶段，Vue3通过对动静态分析template输出render函数。

在renderer阶段调用render生成VNode，那么在生成VNode时又做了哪些优化呢？

## 大致流程是什么？

1. 调用render
2. 首先打开一个block，来存放当前block的动态VNode
3. 根据compile阶段添加的patchFlag以及子节点的类型（是字符串还是数组）来添加不同的信息位
4. 如果最终集合了子节点的信息`patchFlag > 0`时则会被推入block中
5. 将block数组放在根VNode的`dynamicChildren`属性上

## 如何标记信息位？

```ts
// 可以根据template是否有根节点，分为Fragment和根结点
export const enum PatchFlags {
  // 标记文本内容是动态的
  TEXT = 1,
  // 标记class绑定是动态的
  CLASS = 1 << 1,
  // 标记行内style绑定是动态的
  STYLE = 1 << 2,
  // 标记props是动态的，Vue2中的props和event handler 在Vue3中均归纳为了props
  PROPS = 1 << 3,
  // 标记class、style、props都是动态的，所以diff时直接用新节点替换旧节点
  FULL_PROPS = 1 << 4,
  HYDRATE_EVENTS = 1 << 5,
  STABLE_FRAGMENT = 1 << 6,
  KEYED_FRAGMENT = 1 << 7,
  UNKEYED_FRAGMENT = 1 << 8,
  NEED_PATCH = 1 << 9,
  DYNAMIC_SLOTS = 1 << 10,
  DEV_ROOT_FRAGMENT = 1 << 11,
  HOISTED = -1,
  BAIL = -2,
}
```

可以看到`patchFlag`提供了一些枚举，这些枚举值是通过左移计算出的。

那么为什么要这样设计呢？

比如小明`A`是一个不会任何编程语言的程序员，现在市面上有以下集中变成语言：

<table>
    <tbody>
    <tr>
        <th>PHP</th>
        <th>Python</th>
        <th>Rust</th>
        <th>JavaScript</th>
        <th>Java</th>
        <th>C#</th>
        <th>C++</th>
        <th>C</th>
    </tr>
    <tr>
        <th>0</th>
        <th>0</th>
        <th>0</th>
        <th>0</th>
        <th>0</th>
        <th>0</th>
        <th>0</th>
        <th>0</th>
    </tr>
    </tbody>
</table>

```ts
let xiaoming = 0;

// 当然这样的属性名是不合理的，但是为了更直观的说明才如此声明
const languageFlag = {
  C: 1,
  'C++': 1 << 1,
  'C#': 1 << 2,
  Java: 1 << 3,
  JavaScript: 1 << 4,
  Rust: 1 << 5,
  Python: 1 << 6,
  PHP: 1 << 7,
};
```

<table>
    <tbody>
    <tr>
        <td>C</td>
        <td>0</td>
        <td>0</td>
        <td>0</td>
        <td>0</td>
        <td>0</td>
        <td>0</td>
        <td>0</td>
        <td style="color:red">1</td>
    </tr>
    <tr>
        <td>C++</td>
        <td>0</td>
        <td>0</td>
        <td>0</td>
        <td>0</td>
        <td>0</td>
        <td>0</td>
        <td style="color:red">1</td>
        <td>0</td>
    </tr>
    <tr>
        <td>C#</td>
        <td>0</td>
        <td>0</td>
        <td>0</td>
        <td>0</td>
        <td>0</td>
        <td style="color:red">1</td>
        <td>0</td>
        <td>0</td>
    </tr>
    <tr>
        <td>Java</td>
        <td>0</td>
        <td>0</td>
        <td>0</td>
        <td>0</td>
        <td style="color:red">1</td>
        <td>0</td>
        <td>0</td>
        <td>0</td>
    </tr>
    <tr>
        <td>JavaScript</td>
        <td>0</td>
        <td>0</td>
        <td>0</td>
        <td style="color:red">1</td>
        <td>0</td>
        <td>0</td>
        <td>0</td>
        <td>0</td>
    </tr>
    <tr>
        <td>Rust</td>
        <td>0</td>
        <td>0</td>
        <td style="color:red">1</td>
        <td>0</td>
        <td>0</td>
        <td>0</td>
        <td>0</td>
        <td>0</td>
    </tr>
    <tr>
        <td>Python</td>
        <td>0</td>
        <td style="color:red">1</td>
        <td>0</td>
        <td>0</td>
        <td>0</td>
        <td>0</td>
        <td>0</td>
        <td>0</td>
    </tr>
    <tr>
        <td>PHP</td>
        <td style="color:red">1</td>
        <td>0</td>
        <td>0</td>
        <td>0</td>
        <td>0</td>
        <td>0</td>
        <td>0</td>
        <td>0</td>
    </tr>
    </tbody>
</table>

这时小明通过视频、博客等其他学习途径，熟练掌握了`JavaScript`，那么

```ts
xiaoming |= languageFlag.JavaScript;
// output: xiaoming为 16
```

<table>
    <tbody>
    <tr>
        <th>PHP</th>
        <th>Python</th>
        <th>Rust</th>
        <th>JavaScript</th>
        <th>Java</th>
        <th>C#</th>
        <th>C++</th>
        <th>C</th>
    </tr>
    <tr>
        <th>0</th>
        <th>0</th>
        <th>0</th>
        <th style="color:red">1</th>
        <th>0</th>
        <th>0</th>
        <th>0</th>
        <th>0</th>
    </tr>
    </tbody>
</table>

这时小明通过视频、博客等其他学习途径，又熟练掌握了`Python`，那么

```ts
xiaoming |= languageFlag.Python;
// output: xiaoming为 80
```

<table>
    <tbody>
    <tr>
        <th>PHP</th>
        <th>Python</th>
        <th>Rust</th>
        <th>JavaScript</th>
        <th>Java</th>
        <th>C#</th>
        <th>C++</th>
        <th>C</th>
    </tr>
    <tr>
        <th>0</th>
        <th style="color:red">1</th>
        <th>0</th>
        <th style="color:red">1</th>
        <th>1</th>
        <th>0</th>
        <th>0</th>
        <th>0</th>
    </tr>
    </tbody>
</table>

那么如何判断小明具不具备某个编程语言的能力呢？

```js
if (xiaoming & languageFlag.Python) {
  console.log('小明会Python');
} else {
  console.log('小明不会Python');
}

if (xiaoming & languageFlag.C) {
  console.log('小明会C');
} else {
  console.log('小明不会C');
}
// ---- output ----
// 小明会Python
// 小明不会C
```

那么只需要通过xiaoming记录的信息，我们便可以轻松的知道他可以熟练使用哪些编程语言。

回到`patchFlag`上，通过patchFlag上记录了动态props和子节点的信息，我们就可以轻而易举的知道在diff时，**哪些VNode需要diff**、*
*需要diff哪些props**。

## 举个🌰

在例子中为了更好理解，我们将标记了注释节点、动态文件节点、元素节点、动态元素节点等

```html
<div>
  <!-- comment node -->
  text node{{name}}
  <span>element node</span>
  <span>dynamic node：{{name}}</span>
  <span :class="name?'':''"></span>
  <div id="div" @click="onClick">Hello World</div>
  <div :class="name?'':''" :style="name?'':''" onClick="onClick" :title="name">
    {{name}}
    <div :class="name?'':''" :style="name?'':''" onClick="onClick" :title="name">{{name}}</div>
  </div>
</div>
```

通过compile输出的render函数为：

```js
import {
  createCommentVNode as _createCommentVNode,
  toDisplayString as _toDisplayString,
  createElementVNode as _createElementVNode,
  normalizeClass as _normalizeClass,
  normalizeStyle as _normalizeStyle,
  createTextVNode as _createTextVNode,
  openBlock as _openBlock,
  createElementBlock as _createElementBlock,
} from 'vue';

const _hoisted_1 = /*#__PURE__*/ _createElementVNode('span', null, 'element node', -1 /* HOISTED */);
const _hoisted_2 = ['onClick'];
const _hoisted_3 = ['title'];
const _hoisted_4 = ['title'];

export function render(_ctx, _cache, $props, $setup, $data, $options) {
  return (
    _openBlock(),
    _createElementBlock('div', null, [
      _createCommentVNode(' comment node '),
      _createTextVNode(' text node' + _toDisplayString(_ctx.name) + ' ', 1 /* TEXT */),
      _hoisted_1,
      _createElementVNode('span', null, 'dynamic node：' + _toDisplayString(_ctx.name), 1 /* TEXT */),
      _createElementVNode(
        'span',
        {
          class: _normalizeClass(_ctx.name ? '' : ''),
        },
        null,
        2 /* CLASS */,
      ),
      _createElementVNode(
        'div',
        {
          id: 'div',
          onClick: _ctx.onClick,
        },
        'Hello World',
        8 /* PROPS */,
        _hoisted_2,
      ),
      _createElementVNode(
        'div',
        {
          class: _normalizeClass(_ctx.name ? '' : ''),
          style: _normalizeStyle(_ctx.name ? '' : ''),
          onClick: 'onClick',
          title: _ctx.name,
        },
        [
          _createTextVNode(_toDisplayString(_ctx.name) + ' ', 1 /* TEXT */),
          _createElementVNode(
            'div',
            {
              class: _normalizeClass(_ctx.name ? '' : ''),
              style: _normalizeStyle(_ctx.name ? '' : ''),
              onClick: 'onClick',
              title: _ctx.name,
            },
            _toDisplayString(_ctx.name),
            15 /* TEXT, CLASS, STYLE, PROPS */,
            _hoisted_4,
          ),
        ],
        14 /* CLASS, STYLE, PROPS */,
        _hoisted_3,
      ),
    ])
  );
}

// Check the console for the AST
```

对比后发现，对于静态的节点是直接做了作用域提升来reuse，那么我们接下来debugger跟踪这些函数都做了什么？

### \_openBlock

这里首先会打开一个block，根据入参为`currentBlock`赋值并且推入`blockStack`，这里需要注意两个全局变量：

- blockStack：类型为二维数组`[[currentBlock1], [currentBlock2]]`，每个item对应currentBlock
- currentBlock：类型为一维数组，用于存放当前block中的dynamic VNode

```js
// 打开一个block，入参默认为false
function openBlock(disableTracking = false) {
  blockStack.push((currentBlock = disableTracking ? null : []));
}
```

### \_createCommentVNode

顾名思义，创建一个注释节点类型的VNode，必定是一个静态节点所以
