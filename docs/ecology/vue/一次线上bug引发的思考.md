> 一次线上bug引发的思考（使用index作为key导致的问题）

- 场景：

基于uniapp开发的无人机运送核酸的项目，在首页有一个列表来展示不同状态运单数据。
由于需要保证数据实时性，前端通过`setInterval`定时轮询`列表接口`来获取最新的数据。
获取到最新的数据之后，在运单list中遍历出每一个item，渲染出对应的卡片。
在卡片上有`重新申请`的操作，点击`重新申请`时会出现一个时间控件弹出层，让用户选择申请时间

![img.png](/imgs/prod-bug-01.png)

```vue
<!-- 简要代码 -->
<template>
  <div>
    <Card v-for="(item,index) in list" :key="index">{{item}}</Card>
  </div>
</template>

<script>
import Card from './card.vue'

export default {
  components: {Card},
  data() {
    return {
      list: []
    }
  },
}
</script>
```

首先说明在动态列表中仍要使用index作为key的原因：

项目时基于uniapp开发的，在进入列表页时，在钩子函数中请求接口获取数据。
但是拿到对应的list开始渲染时，如果使用运单号作为key，在`H5`端页面控制台没有报错信息，打包成`Android`包时，控制台报：

```text
TypeError: Invalid attempt to destructure non-iterable instance.
```

在uniapp官方社区搜索相关信息之后，用`index`做`key`可以解决上诉问题，谁成想这才是噩梦的开始。🤷‍♂️

在接下来的描述中，一定要记得前提条件时：使用`index`做`key`

由于同一个无人机运行企业下面的成员可以看到的数据列表会存在相同的运单等待处理

假设A，B都所属于企业Y，那么运单号为xxxx的运单可能会同时存在于A，B的列表中，所会存在同时操作同一个运单的可能

复现步骤：

1.用户A操作运单号为xxxx的运单卡片，点击`重新申请`，弹出时间组件

2.与此同时，用户B点击`取消飞行`，这条数据在用户B的列表中消失，那么也意味着也会在用户A的列表中消失。

3.在用户A准备`重新申请`飞行时间时，此时有定时任务触发，列表数据更新了，对应的`index`也发生了改变

```text
触发流程：

`index`改变 --> 触发渲染watcher --> diff比较新VDOM与旧VDOM（此时key发生了变化） --> 触发重新渲染

```

此时时间组件处于展开状态，我们本想操作的是运单号为xxxx的运单，但是此时组件重新渲染了(重新实例化了一个新组件)
，相同index位置的数据发生了改变，变成了运单号为yyyy的数据，所以实际被操作的数据其实是运单号为yyyy的运单

所以为了解决上述出现的问题，又回到了原点，用`运单号`做key，再次打包之后又不报错了。🤷‍♂️

> 拓展

- diff

