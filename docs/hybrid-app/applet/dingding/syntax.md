# 语法

这里不再一一列举语法的具体使用方式，具体使用方法可参考钉钉开发文档，本文主要列举对应开发过程中遇到的一些坑以及解决方案

## 页面与组件

### 页面

约定：页面全部存放在pages目录下，并且有一个名为index的页面

小程序页面提供了4个页面相关的文件：`index.js` `index.acss` `index.axml` `index.json`

其中`index.js`和`index.axml`是必要的，此外小程序还提供了另外一种js文件格式：`sjs`这点会在后续博客中说明。`index.json`

可用于配置页面导航栏、背景色等（这点钉钉小程序开发文档中说明较少，具体参考支付宝小程序开发文档，虽然部分支付宝小程序中的页面配置属性可以在钉钉小程序中使用，但是还是需要关注基础库版本）

在data中声明变量（注意是类型是对象，而不是函数），在根下声明方法

```js
Page({
    data: {
        student: {name: '', age: 23}
    },
    sayHello() {
        console.log('hello ' + this.data.student.name)
    }
})
```

### 组件

约定：页面全部存放在components目录下，并且有一个名为student-card的组件

同样提供了3个相关的文件：`index.js` `index.acss` `index.axml`

```js
Component({
    data: {
        visible: false
    },
    props: {
        item: {},
        onTap: () => {
        }
    },
    methods: {
        onConfirm() {
            this.props.onTap()
        }
    }
})
```

:::warning

- 组件的方法声明在methods中，页面的方法声明在根下
- 处理事件的方法必须以`on`开头
    - 事件默认处理冒泡事件，`on`开头的事件则正常处理，`catch`开头的事件则阻止冒泡

:::

#### 父子组件传值

代码类似react

1. 子组件声明onChange props
2. 父组件将事件处理器onChange作为子组件的props传递
3. 在需要触发事件回调时，执行：`this.props.onChange()`

#### 兄弟组件传值

1. 通过父组件做中转
2. 通过纯js第三方库[mitt](https://github.com/developit/mitt)解决，这也是vue3官方推荐的替代bus总线的方案

```js
// app.js
import mitt from 'mitt'

App({
    emitter: mitt()
})

// 消费者
const {emitter} = getApp()
emitter.on('foo', (value) => {
    console.log(value)
})


// 生产者
const {emitter} = getApp()
emitter.emit('foo', 'hello mitt!')
```

#### 跨页面传值

1. 跳转的页面是tabbar页面

```js
dd.switchTab({url: '/pages/index/index',});
```

2. 跳转的页面是普通页面

```js
// 保留当前页面栈
dd.navigateTo({url: '/pages/detail/index?tab=1&id=11111'});
// 清除当前页面栈
dd.redirectTo({url: '/pages/apply/index'})
```

:::warning
钉钉小程序最大页面栈为5
:::

## 插槽

钉钉小程序根据是否提供名称可分为：默认插槽和具名插槽，当然也提供了作用域插槽

默认插槽和具名插槽使用方式与vue相同，但是作用域插槽不太相同而且偶尔会表现出怪异行为

### slot-scope

在做for循环渲染element时，需要注意slot-scope的暴露的变量名不要与`a:for-item`提供的变量同名，可能会产生代码时而有效，时而失效的现象

假设：card-item有两个插槽：默认插槽和具名插槽-backup，并且在backup插槽上传递了一个名为item的props

❌错误示例：

```html

<card-item a:for="{{cardList}}">
    <view slot="backup" slot-scope="item">
        {{item.name}}
    </view>
</card-item>     
```

存在问题：

a:for循环时，数组中的默认变量名为item，这与具名插槽导出的变量名重复了

```html

<card-item a:for="{{cardList}}" a:for-item="item">
</card-item>
```

✅正确示例：

```html
<!-- 方法1 -->
<card-item a:for="{{cardList}}" a:for-item="card">
    <view slot="backup" slot-scope="item">
        {{item.name}}
    </view>
</card-item>

<!-- 方法2 -->
<card-item a:for="{{cardList}}">
    <view slot="backup" slot-scope="item2">
        {{item2.name}}
    </view>
</card-item>
```

## 其他替代方案

### 全局状态

钉钉小程序提供了`getApp`方法，那么我们可以如下操作（这里并没有强制约束state的生产者和消费者遵循单向数据流）：

1. 在`app.js`文件中声明全局变量`globalData`

```js
App({
    globalData: {
        userInfo: {
            dept: [], // 所属部门
            roleName: '', // 角色名称
            id: '', // 数据id
            userId: '', // 用户id
            name: '', // 用户名
            nickName: '', // 昵称
            serviceDept: [], // 驾驶员专属字段：服务部门
        },
    },
})
```

2. 修改`globalData`

```js
const {globalData} = getApp()
globalData.userInfo.roleName = 'admin'
```

3. 获取`globalData`

```js
const {globalData} = getApp()
console.log(globalData.userInfo.roleName)
```

4. 持久化方案

```js
// 在设置值之后需要存储到storage中
dd.setStorageSync({key, data: userInfo});

// 从storage中恢复到app中：将恢复逻辑放置在app.js中的onShow方法中
App({
    onShow() {
        // todo restore cache
    }
})
```

### watch

在组件中监听子组件的更新，可以在didUpdate钩子中，判断新值与旧值是否相同来执行逻辑，但是需要注意的是：

- 不仅是子组件通过setData更改值会触发didUpdate钩子，父组件setData时也会触发
- 在didUpdate中执行多次setData会导致爆栈
- 基本数据类型判断比较新旧值容易，但是复杂引用数据类型较困难

:::warning

在支付宝小程序的文档中提到了数据变化观测器：[observers](https://opendocs.alipay.com/mini/04y1n6?pathHash=8dedc947)
，但是需要小程序基础库2.8.1版本支持，目前钉钉小程序基础库版本为1.25.7。所以这个功能只能通过上述方式实现。
:::






