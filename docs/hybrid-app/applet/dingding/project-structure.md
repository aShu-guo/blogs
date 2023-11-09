# 项目结构

## 概览

- 介绍全局文件`app.json`、`app.js`、`app.acss`、`mini.project.json`
- 第三方依赖引入方式

## 全局配置

- `app.json`
    - 应用的全局配置，如果页面没有自定义配置，那么则取全局配置
    - 仅支持3个属性：window、pages、tabBar
- `app.js`
    - 用于注册小程序，提供了应用级别的生命周期
- `mini.project.json`（没有在钉钉文档中提及，但是是可用的，
  需要参考支付宝提供的[文档](https://opendocs.alipay.com/mini/03dbc3?pathHash=e876dc50)，
  如果相同的代码在不同的手机系统版本表现出不同的行为，那么需要优先考虑是不是小程序引擎在低版本手机系统的兼容问题）
    - 项目配置，用于自定义项目编译、开发的功能
    - 提供了编译less变量的能力，可用于自定义UI框架的主题
    -
- `env.js`
    - 钉钉小程序只暴露出两个环境：`development`和`production`两个开发环境，所以用户只能定义这两个环境的变量。
    - 这里在开发过程中并没有前端生态中常用dot来配置变量，而是是通过新建了`env.js`来根据`process.env.NODE_ENV`的不同值来导出。

## 第三方依赖引入

需要自行初始化`package.json`文件

注意⚠️：引入的第三方依赖不能依赖`window`、`global`等浏览器提供的全局变量
