# axml 视图层

## 数据绑定

使用`{{}}`绑定变量到模板中，其中支持三元运算、逻辑判断、算术运算等，但是不支持逻辑处理

❌错误示例：

```js
Page({
    data: {
        cardList: []
    },
})
```

```html
<!-- index.axml -->
<view>
    {{cardList.map(item=>item.name)}}
</view>
```

✅正确示例

```js
Page({
    data: {
        cardList: [],
        finalList: []
    },
    onReady() {
        this.setData({
            finalList: this.cardList.map(item => item.name)
        })
    }
})
```

```html
<!-- index.axml -->
<view>
    {{finalList}}
</view>
```

## 绑定具体值

### 数组

```html

<view a:for="{{[0, 1, 2, 3, 4]}}"> {{item}}</view>
```

### 对象

```html

<foo data="{{a: 1, b: 2}}"></foo>
```

:::warning

这里是2个中括号，而不是3个
:::
