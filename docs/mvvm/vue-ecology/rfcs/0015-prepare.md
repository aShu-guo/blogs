# 准备篇

filter提供了文本格式化的功能，而且支持多个过滤器。

## filter是如何使用？

1. 首先在options中定义filter

```vue

<script>
const StatusEnum = {
  '1': '通过',
  '2': '拒绝'
}
export default {
  data: () => {
    return {
      status: '1'
    }
  },
  filter: {
    statusFilter(value) {
      return StatusEnum[value]
    },
    formatFilter(value) {
      return value ? value : '-'
    }
  }
}
</script>
```

2. 在template中引入使用

```vue

<template>
  <div>
    <span>审核状态</span>
    <span>{{status|statusFilter}}</span>
  </div>
</template>
```

3. 串联fitler

```vue

<template>
  <div>
    <span>审核状态</span>
    <span>{{status|statusFilter|formatFilter}}</span>
  </div>
</template>
```

其中`statusFilter`的被定义为接收一个参数的函数，入参为`status`，`formatFilter`接收前一个`filter`返回的结果并格式化。
