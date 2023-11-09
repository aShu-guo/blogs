# uni-app
 
> 编译器

1.HbuilderX深度绑定

2.插件虽多，但质量参差不齐

3.必须云打包出APK，浪费时间，而且每天次数有限

4.官方文档质量一般，文档说明没有根据版本说明同步



> 生态

**router**

1.编程式导航可以直接通过navigator替代

2.全局路由守卫（通过代理模式实现）

3.自定义path名称，只能更改目录名称



**store**

1.注意 uni.$on 定义完成后才能接收到 uni.$emit 传递的数据，及时销毁

2.vue项目转uni-app，最好集成之前的框架以及技术体系（uni-app内置）



**vue+ts**

1.可以更好的支持vue2，但是vue3支持度堪忧；那么，vue2也没必要用ts



**拓展**

1.其他一些第三方的工具类：Dayjs、lodash、网络请求（axios、uni.request）

2.埋点

3.icon管理



**css**

1.font-face 引入外部字体

```css
@font-face {
    /* 字体名称，可自定义，就像定义一个class名称一样。*/
    font-family: 'hdjx'; 
    /* 字体文件的路径，除了 url()加载字体，也可以通过 local() 加载本地字体，如果第一个字体加载失败，顺序加载第二个 */
    src: local('aa.ttf'),url('./AA.ttf'),url('./BB.ttf'); 
    /* 字重，就像在普通css中使用它一样，可以选择bold等值 */
    font-weight: normal;
    /* 字体样式 */
    font-style: normal;
}
```



> 兼容问题

1.h5：https://ask.dcloud.net.cn/article/36174

2.差异

-- @tap与@click事件

@tap事件没有延迟，而且自带阻止冒泡时间

@click事件有300ms延迟，

编译到小程序端，@click会被转换成@tap；

3.配置文件没有暴露出来，无法区分多环境配置

4.hb官方基于vue定制了核心库，**但是侵入了核心库**，在使用过程中会存在相同代码、多平台不符的行为



> bug频出

1.通过switchTab跳转到tab页面，onLoad不执行，但是onShow执行，如果在onShow中请求数据，回出现页面闪烁的情况；普通页面onShow、onLoad均正常

3.不同版本HBuilder打出来的包，行为会不一致（HBuilder与云打包版本不一致，在app端会出现弹窗）

4.推送图标，按照文档配置之后无效（降级Hbuilder到3.1 配置完之后再升级到最新版本，否则无效）

**5.mixins合并时 components属性不会合并**（hbuilder打包进去的vue版本与官网vue不同）



> app更新提示模块

1.更新时，客户杀死app进程后续如何操作？

断点续传



2.如何热更新，小版本更新无需重新下载app？

更新方式为两种：整包更新 || 资源热更新（差量升级--指文件的差量）



> 注意事项

1.组件生命周期正常使用vue提供的created、mounted；页面使用onLoad、onShow

而且tabbar页面仅加载一次onLoad

