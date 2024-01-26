# 元编程

在JS这种动态语言中，元编程与常规编程没有明显的界限。常规编程是用代码操控数据，而元编程更像是用代码操控代码。

## 属性的特性

在JS中，属性包含4个特性，分别是：`configurable`、`enumerable`、`writable`、`value`

- configurable：控制属性是否能被删除以及能够更改属性的其他特性，它更像是允许修改属性特性的`开关`
- enumerable：控制属性能否通过`for/in`、`Object.keys()`访问
- writable：控制属性值能否更改
- value：属性的值

JS也提供了许多操控属性描述符（property descriptor）的方法：

- `Object.defineProperty()`定义一个属性的特性
- `Object.defineProperties()`定义一个或多个属性的特性
- `Object.seal()`密封一个属性
- `Object.freeze()`冻结一个属性，是JS提供的最高完整性级别保护措施

也提供了访问属性描述符的方法：

- `Object.getOwnPropertyDescriptor()`访问`自身`一个属性的描述符对象
- `Object.getOwnPropertyDescriptors()`访问`自身`一个或多个属性的描述符对象
- 如果想通过`原型链访问`指定属性描述符，则可以通过`Object.getPrototypeOf()`、`Reflect.getPrototypeOf()`

![img.png](/imgs/base/js/meta.png)
