# 1.2 浏览器渲染原理（速览）

## 关键渲染路径
HTML → DOM → CSSOM → Render Tree → Layout → Paint → Composite

## 性能瓶颈定位
- **布局 thrash**：频繁读取/写入布局属性（offsetWidth/scrollTop）导致强制同步布局
- **长任务**：Main 线程 > 50ms；优先拆分/调度
- **重排重绘热点**：高频动画/滚动区域未隔离到合成层
- **阻塞资源**：未内联关键 CSS、JS 未延迟/按需

## 一体化场景
- 地图/三维场景：WebGL 独占线程，避免同时在主线程做重计算；使用 requestAnimationFrame 控制刷新
- 大数据表格/图表：虚拟列表、分片渲染；渐进式加载
- 弹窗/浮层：提前渲染骨架，避免 CLS；动画用 transform/opacity

## 优化要点
- 关键 CSS 内联，JS `type="module"` + `defer`
- 合成层：对高频动画元素添加 `will-change: transform, opacity`
- 事件节流防抖：滚动、resize、鼠标移动
- 分片渲染：使用 `requestIdleCallback`/微任务切分重计算
- Worker：将重计算（路径规划、地理栅格处理）移出主线程

## 验证方法
- Performance 面板：长任务、JS Profile、Layout/Style 热点
- Layers/Rendering 面板：合成层、Paint Flashing
- Coverage：识别未使用的 JS/CSS
