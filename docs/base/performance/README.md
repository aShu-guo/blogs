# 概览

## chrome团队推荐的性能指标

### 2022年以前

| 指标名称                    | 优点         | 缺点        |
|-------------------------|------------|-----------|
| 首次内容绘制（FCP）             | 关注用户体验     | 只捕获最开始的部分 |
| 加载（load）                | 关注页面依赖加载   | 与用户体验无关   |
| DOM加载（DOMContentLoaded） | 关注DOM加载    | 与用户体验无关   |
| 首次有效绘制（FMP）             | 关注页面基础结构加载 | 复杂、难以解释   |
| 速度指数（SI）                |            | 复杂、难以解释   |

### 2022年以后

最大内容绘制（Largest Contentful Paint）：简称LCP，指页面可视区域的最大元素绘制所需要的时间
