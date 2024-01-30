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
  - 允许修改：它只能修改或新增`自身的属性`，无法修改继承来的属性
  - 禁止修改：抛出TypeError
- `Object.defineProperties()`定义一个或多个属性的特性
  - 允许修改：同上也只能修改或新增`自身的属性`
  - 禁止修改：抛出TypeError

也提供了访问属性描述符的方法：

- `Object.getOwnPropertyDescriptor()`访问`自身`一个属性的描述符对象
- `Object.getOwnPropertyDescriptors()`访问`自身`一个或多个属性的描述符对象
- 如果想通过`原型链访问`指定属性描述符，则可以通过`Object.getPrototypeOf()`、`Reflect.getPrototypeOf()`

![img.png](/imgs/base/js/meta.png)

特性遵循的规则如下：

```js
if (Object.isExtensible(obj)) {
  // 新增属性
  if (configurable) {
    // 允许修改configurable、enumerable、writable
  } else {
    // 禁止修改configurable、enumerable
    // 允许将writable 从false -> true，但是禁止从true -> false
    if (writable) {
      // 允许修改值
    } else {
      // 禁止修改值，如果修改了并不会报错，而是不生效
    }
  }
} else {
  // 禁止新增属性
}
```

:::info
`Object.assign()`提供将`源对象`的`可枚举属性（enumerable: true）`复制到`目标对象`的能力，但是它只复制属性和属性值，并不复制属性描述符
:::

## 对象的可拓展性

对象的可拓展性（extensible）表示一个对象是否能添加属性，JS提供了3种方式改变对象的可扩展性，严格程度依次增强：

- `Object.preventExtensions()`禁止对象的可拓展性

```js {8,10}
let student = { name: 'xiaoming' };
Object.preventExtensions(student);

console.log(Object.getOwnPropertyDescriptor(student, 'name'));
/*
{
  value: 'xiaoming',
  writable: true,
  enumerable: true,
  configurable: false
}
 */
```

- `Object.seal()`密封一个对象

```js {8,10}
let student = { name: 'xiaoming' };
Object.seal(student);

console.log(Object.getOwnPropertyDescriptor(student, 'name'));
/*
{
  value: 'xiaoming',
  writable: true,
  enumerable: true,
  configurable: false
}
 */
```

- `Object.freeze()`冻结一个对象，是JS提供的最高完整性级别保护措施

```js {8,10}
let student = { name: 'xiaoming' };
Object.freeze(student);

console.log(Object.getOwnPropertyDescriptor(student, 'name'));
/*
{
  value: 'xiaoming',
  writable: false,
  enumerable: true,
  configurable: false
}
 */
```

如果你不仅想限制指定对象的extension，也想限制它原型的extension，那么可以这样使用：

```js
let o = Object.seal(Object.create(Object.freeze(obj)));
```

## prototype

JS是通过原型链实现继承的，并且提供了2种方式设置对象的原型（本质是设置对象的`__proto__`属性，但是在现代JS中已经废弃了该属性）：

- obj = Object.create(proto)
- Object.setPrototypeOf(obj, proto)

关于原型链只需要记住一句话即可：`实例的__proto__`属性是指向`构造函数的prototype`的

那么如何手动实现继承呢？

- 子类可以访问父类的属性和方法（修改子类中this的指向）
- `instanceof`行为正确（实例的`__proto__属性`指向正确）
- `construct`指向正确（实例的构造函数指向正确）

更多细节可以参考[手动实现继承](/base/js/extends)

## 公共Symbol

JS中也内置了一些公共的Symbol：

- Symbol.iterator：用于自定义迭代操作
- Symbol.asyncIterator：用于自定义异步迭代操作
- Symbol.hasInstance：用于自定义`instanceOf`操作符行为
- Symbol.toStringTag：用于自定义`toString`的行为

```js {6}
function classof(o) {
  return Object.prototype.toString.call(o);
}

class Student {
  get [Symbol.toStringTag]() {
    return 'Student';
  }
}

const student = new Student();
console.log(classof(student));
```

- Symbol.toPrimitive：用于自定义转换为基本数据类型时的行为

在转换为基本数据类型时，会接受一个`hint`参数，hint只有3个取值：`'number' || 'string' || 'default'`

```js {3}
const object1 = {
  [Symbol.toPrimitive](hint) {
    if (hint === 'number') {
      return 42;
    }
    return null;
  },
};

console.log(+object1);
// Expected output: 42
```

## 模版字符串

ES6引入了\`\`，支持`多行`和`带表达式`的字符串。此外还有一种`标签函数`，表现为一个函数表达式后面接一个模版字符串，例如GraphQL查询语言支持gql\`\`，Emotion支持css\`\`

标签函数接收多个参数，模版字符串表现不同，参数不同：

- 第一个参数是数组类型，接收模版字符串的字面量
- 第二个参数接收

总结来说，假如一个模版字符串有n个表达式，那么标签函数的`参数列表`长度为n+1，其中：

- 第一个参数数组的长度为n+1
- 接下来有n个参数

expression省略为ex，假设存在这样一个模版字符串以及模版函数func

```js
`${ex1}str1${ex2}str2${ex3}str3...${exn - 1}strn-1${exn}strn`;
```

那么func的参数列表为

```js
func(['str1', 'str2' ,... ,'strn-1' ,'strn'] ,ex1 ,ex2 ,ex3 ,... ,exn-1 ,exn)
```

如此便可以自定义自己的模版函数

```js
function foo(strings, ...values) {}
```

:::info
JS提供的String.raw也是一个模版函数，用于获取模板字符串的`原始字符串形式`

```js
const filePath = String.raw`C:\Development\profile\aboutme.html`;
console.log(`The file was uploaded from: ${filePath}`);
// The file was uploaded from: C:\Development\profile\aboutme.html
```

:::

## Reflect

与Math类似，定义了一系列方法。它提供了与Proxy中handlers中一一对应的函数
