# watch和watchEffect

## watch

- 需要指定依赖源，依赖源改变时执行依赖回调，所以需要缩小依赖源时使用watch更好
- 依赖源与依赖回调**无需强相关**
- 首次渲染时可执行（immediate:true）,也不不执行

## watchEffect

- 会自动收集依赖回调函数中的依赖源
- 依赖源与依赖回调**强相关**时使用
- 首次渲染时会执行

参考：
[1] watch与watchEffect：https://www.zhihu.com/question/462378193
