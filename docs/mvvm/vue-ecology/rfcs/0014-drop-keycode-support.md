# 移除keycode支持

## 概要

- 移除数值作为v-model修饰符的能力
- 移除`config.keyCodes`

## 基础用例

N/A

## 动机

在vue2中，v-on支持`KeyboardEvent.key`暴露的任意有效按键名转换为`kebab-case`来作为修饰符。例如，当event.key==='PageDown'
时才会触发handler

```html
<input @keyup.page-down="onArrowUp">

```

因此，数值键盘码和`config.keyCodes`
功能与之重复。另外，[KeyboardEvent.keyCode](https://developer.mozilla.org/zh-CN/docs/Web/API/KeyboardEvent/keyCode)
已经被废弃了，Vue也应该停止支持。

## 缺点

N/A

## 可选的方案

N/A

## 采取的策略

- 提供一个可以探测出使用了数值的keyCode修饰符的代码，并且将它等价转换为key的代码模板
- 在兼容版本中，可以支持`config.keyCode`，在运行时如果匹配上了keyCode别名，则发出警告允许轻松迁移。
