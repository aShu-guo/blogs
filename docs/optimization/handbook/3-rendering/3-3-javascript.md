# 3.3 JavaScript 执行优化

## 原则
- 减少主线程占用，拆分长任务，按需加载。

## 技巧
- 长任务拆分：将 >50ms 的计算切片（setTimeout/MessageChannel/requestIdleCallback）
- Web Worker：路径规划、数据聚合、GeoJSON 解析放 Worker
- 事件优化：滚动/resize 节流，输入防抖；避免匿名函数重复创建
- 状态管理：减少全局响应式/Store 体积，切片 store，懒注册模块
- 去重依赖：统一版本，避免多份 polyfill

## 场景
- 地图量测/空间计算：Worker + transferable objects 传递 typed array
- 视频列表轮询：合并请求、批量处理，避免高频 setInterval
- ECharts 大数据：使用 `useDirtyRect`、`lazyUpdate`，分批 setOption

## 验证
- Performance Profile：长任务分布、函数调用栈
- Memory：监听泄漏（Detached DOM、Listener 泄漏）
- Coverage：未用 JS 比例
