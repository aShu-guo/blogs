>原生tabbar

1.层级最高，前端无法覆盖原生组件

2.如果tabbar页面为路由表第一个，即使在全局路由中next到其他页面，也会渲染出tabbar

3.tabbar页面一旦渲染之后，便会保存在内存中，第二次进入不会触发onLoad回调

4.跳转时需要使用switchTab



> 自定义tabbar

1.包含tabbar的页面不再是tabbar页，而是一个普通页面，通过navigatorTo跳转

2.tabbar组件层级不再是最高，变成了普通组件，可以被覆盖；但是页面切换时会出现闪烁，虽然可以通过动态组件解决，但是由于仅H5端支持keep-alive，每次切换页面都会重新挂载，性能较差

3.官方提供的custom-tab-bar组件会去读取pages.json，其他组件库是直接提供一个tabbar组件，更加灵活。



> 无法覆盖tabbar解决方案

1.将组件展示在一个新页面上

2.基于nvue开发（必须通过交互触发，不能自动show，否则不覆盖）

3.动态组件