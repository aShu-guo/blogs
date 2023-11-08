> JSX

jsx本质上是一个语法糖，等价于

```js
React.createElement(component, props, ...children)
```

在vue生态中，类似render函数

```js
render(tag, {}, [])
```

`注意事项：`

- 首字母必须大写
- 使用单层大括号`{}`包裹js表达式（vue使用`{{}}`）
- 标签名也支持Function类型的变量 🆕
- React必须在jsx作用域内或者作为全局变量引入
- 可以使用点语法

```js
<Story.Provide></Story.Provide>
```

- 不能是表达式，但是可以将变量首先赋值给一个首字母大写的变量（动态组件）

```js
import React from 'react';
import {PhotoStory, VideoStory} from './stories';

const components = {
    photo: PhotoStory,
    video: VideoStory
};

function Story(props) {
    // 正确！JSX 类型可以是大写字母开头的变量。
    const SpecificStory = components[props.storyType];
    return <SpecificStory story={props.story}/>;
}
```

`props相关`

- 字符串字面量

```js
<TreeView title='设备树'></TreeView>
// 等价于
<TreeView title={'设备树'}></TreeView>
```

- boolean类型

```js
<TreeView is-default-expand></TreeView>
// 等价于
<TreeView is-default-expand={true}></TreeView>
```

- 支持表达式

```js
<TreeView is-default-expand={!isShow}></TreeView>
```

- 支持es6展开（$listener、$attrs）

```js
const props = {
    isDefaultExpand: true,
    title: '设备树'
}

<TreeView {...props}></TreeView>
```

`子元素:props.children`

被开始标签和结束标签包裹的为组件的子元素

- 静态文本作为子元素等价于html标签
- 表达式作为子元素

```js
export default () => {
    const uavList = [
        {uavNum: 'xxx1', uavName: '大疆01'},
        {uavNum: 'xxx2', uavName: '大疆02'}
    ].map(item => (<div key={item.uavNum}>{item.uavName}</div>))

    return (
        <div>
            {uavList}
        </div>
    )
}


```

- 函数作为子元素 🆕

```js
function Repeat(props) {
    const items = []
    for (var i = 0; i < props.numTimes; i++) {
        items.push(props.children(i))
    }
    return (
        <>{items}</>
    )
}

export default () => {
    return (
        <Repeat numTimes={10}>
            {index => (<div key={index}>line+{index + 1}</div>)}
        </Repeat>
    )
}
```
