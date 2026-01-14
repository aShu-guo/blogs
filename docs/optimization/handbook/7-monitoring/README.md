# 7. 监控与分析

> 建立性能监控体系，持续追踪优化效果

## 本章概述

性能监控是性能优化的闭环关键。没有监控就无法量化优化效果，也无法及时发现性能退化。对于低空政务平台这样的大型应用，建立完善的性能监控体系至关重要。本章将深入探讨性能监控的方法、工具和最佳实践。

## 章节列表

### [7.1 性能指标采集](./7-1-metrics-collection.md) ⭐⭐⭐

**核心内容**：
- Performance API 使用
- Web Vitals 采集
- 自定义指标定义
- 用户体验指标

**一体化项目场景**：
- 首屏加载时间监控
- 地图渲染性能追踪
- 视频播放流畅度监控
- API 请求耗时统计

**学习目标**：
- 掌握 Performance API
- 学会采集 Web Vitals
- 理解自定义指标设计

---

### [7.2 错误监控](./7-2-error-monitoring.md) ⭐⭐⭐

**核心内容**：
- JavaScript 错误捕获
- Promise 异常处理
- 资源加载失败监控
- 错误上报机制

**一体化项目场景**：
- 地图加载失败监控
- 视频播放错误追踪
- API 请求失败统计
- 组件渲染错误捕获

**学习目标**：
- 掌握错误捕获方法
- 学会设计错误上报
- 理解错误分析技巧

---

### [7.3 用户行为分析](./7-3-user-behavior.md) ⭐⭐

**核心内容**：
- 页面访问统计
- 用户操作追踪
- 热力图分析
- 用户路径分析

**一体化项目场景**：
- 地图操作行为分析
- 功能使用频率统计
- 页面停留时间分析
- 用户流失点识别

**学习目标**：
- 掌握行为追踪方法
- 学会分析用户路径
- 理解用户体验优化

---

### [7.4 性能监控平台](./7-4-monitoring-platform.md) ⭐⭐⭐

**核心内容**：
- 监控平台选型
- 数据上报策略
- 告警机制设计
- 性能报表分析

**一体化项目场景**：
- 实时性能监控大盘
- 性能异常告警
- 性能趋势分析
- 优化效果评估

**学习目标**：
- 掌握监控平台使用
- 学会设计上报策略
- 理解告警机制

---

### [7.5 真实用户监控（RUM）](./7-5-rum.md) ⭐⭐⭐

**核心内容**：
- RUM vs 合成监控
- 真实用户数据采集
- 性能分位值分析
- 地域/设备性能对比

**一体化项目场景**：
- 不同地区的加载性能
- 不同设备的渲染性能
- 不同网络的传输性能
- 真实用户体验评估

**学习目标**：
- 理解 RUM 的价值
- 掌握数据采集方法
- 学会分析真实用户数据

---

### [7.6 性能预算](./7-6-performance-budget.md) ⭐⭐

**核心内容**：
- 性能预算制定
- 预算监控机制
- CI/CD 集成
- 性能退化预警

**一体化项目场景**：
- 首屏加载时间预算
- 构建产物体积预算
- API 响应时间预算
- 内存占用预算

**学习目标**：
- 掌握性能预算制定
- 学会集成到 CI/CD
- 理解预算管理策略

---

## 学习路径

### 新手路径
1. 先学习 [7.1 性能指标采集](./7-1-metrics-collection.md)，掌握数据采集
2. 再学习 [7.2 错误监控](./7-2-error-monitoring.md)，建立错误监控
3. 最后学习 [7.4 性能监控平台](./7-4-monitoring-platform.md)，搭建监控体系

### 进阶路径
1. 深入学习 [7.5 真实用户监控](./7-5-rum.md)，分析真实数据
2. 结合 [7.3 用户行为分析](./7-3-user-behavior.md)，优化用户体验
3. 学习 [7.6 性能预算](./7-6-performance-budget.md)，建立长效机制

## 实战练习

### 练习 1：采集 Web Vitals
使用 web-vitals 库：
```javascript
import { onCLS, onFID, onLCP, onFCP, onTTFB } from 'web-vitals';

function sendToAnalytics(metric) {
  const body = JSON.stringify({
    name: metric.name,
    value: metric.value,
    id: metric.id,
    delta: metric.delta,
  });

  // 使用 sendBeacon 上报
  navigator.sendBeacon('/api/analytics', body);
}

onCLS(sendToAnalytics);
onFID(sendToAnalytics);
onLCP(sendToAnalytics);
onFCP(sendToAnalytics);
onTTFB(sendToAnalytics);
```

### 练习 2：实现错误监控
全局错误捕获：
```javascript
// JavaScript 错误
window.addEventListener('error', (event) => {
  reportError({
    type: 'js-error',
    message: event.message,
    filename: event.filename,
    lineno: event.lineno,
    colno: event.colno,
    stack: event.error?.stack,
  });
});

// Promise 异常
window.addEventListener('unhandledrejection', (event) => {
  reportError({
    type: 'promise-error',
    reason: event.reason,
  });
});

// 资源加载失败
window.addEventListener('error', (event) => {
  if (event.target !== window) {
    reportError({
      type: 'resource-error',
      tagName: event.target.tagName,
      src: event.target.src || event.target.href,
    });
  }
}, true);
```

### 练习 3：自定义性能指标
监控地图加载性能：
```javascript
// 标记开始
performance.mark('map-load-start');

// 加载地图
await loadMap();

// 标记结束
performance.mark('map-load-end');

// 计算耗时
performance.measure('map-load', 'map-load-start', 'map-load-end');

// 获取结果
const measure = performance.getEntriesByName('map-load')[0];
console.log('地图加载耗时:', measure.duration);

// 上报数据
reportMetric({
  name: 'map-load-time',
  value: measure.duration,
});
```

## 关键概念

### 监控指标体系

| 指标类型 | 具体指标 | 目标值 | 监控方式 |
|----------|----------|--------|----------|
| 加载性能 | LCP、FCP、TTI | < 2.5s | Web Vitals |
| 交互性能 | FID、TBT | < 100ms | Performance API |
| 视觉稳定 | CLS | < 0.1 | Web Vitals |
| 业务指标 | 地图加载、视频播放 | 自定义 | 自定义埋点 |

### 监控数据流

```
用户端
  ↓
数据采集（Performance API、Web Vitals）
  ↓
数据上报（sendBeacon、fetch）
  ↓
数据存储（时序数据库）
  ↓
数据分析（聚合、分位值）
  ↓
可视化展示（监控大盘）
  ↓
告警通知（异常检测）
```

### 性能监控架构

```
前端应用
├─ 性能采集 SDK
│   ├─ Web Vitals
│   ├─ 自定义指标
│   └─ 错误监控
├─ 上报策略
│   ├─ 批量上报
│   ├─ 采样上报
│   └─ 实时上报
└─ 本地缓存
    └─ IndexedDB

后端服务
├─ 数据接收
├─ 数据清洗
├─ 数据存储
└─ 数据分析

监控平台
├─ 实时监控
├─ 历史分析
├─ 告警管理
└─ 报表生成
```

### 低空政务平台监控目标

| 监控项 | 当前状态 | 目标状态 | 实施方案 |
|--------|----------|----------|----------|
| Web Vitals | 未监控 | 全量采集 | web-vitals 库 |
| 错误监控 | 未监控 | 全量采集 | 全局错误捕获 |
| 业务指标 | 未监控 | 关键指标 | 自定义埋点 |
| 监控覆盖率 | 0% | 100% | RUM 方案 |
| 告警响应 | 无 | < 5min | 告警机制 |

## 下一步

完成监控与分析学习后，建议继续学习：
- [1. 基础理论](../1-foundation/README.md) - 回顾性能指标
- [8. 实战案例](../8-cases/README.md) - 完整优化案例
- 开始实施监控方案，建立性能基线

---

[返回手册首页](../README.md)
