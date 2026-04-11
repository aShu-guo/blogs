# 6.2 Tree Shaking

## 原则
- 仅打包被使用的代码，移除死代码与重复依赖。

## 动作
- 确认 ESModule 入口，避免 CommonJS 阻塞摇树
- `sideEffects` 声明：在 package.json 配置，标记无副作用的文件
- 依赖精简：替换重量级库（lodash → lodash-es/按需、moment → dayjs）、移除未用 polyfill
- 组件按需导入：UI 库/图表库按需
- Vite/Rollup 插件：`rollupOptions.treeshake: true`，`build.commonjsOptions.include` 控制 CJS

## 场景
- 地图/视频 SDK：按需引入插件，避免整体打包
- Utils：使用 ES export 的工具函数，避免默认导出聚合

## 验证
- bundle 分析：是否存在重复依赖/大体积未使用模块
- 产物对比：开启/关闭后体积变化
