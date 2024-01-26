# 继承的2种实现方式

实现继承需要满足的3个`必要`要求：

- 子类可以访问父类的属性和方法
- `instanceof`行为正确
- `construct`指向正确
  - 子类的`__proto__`属性指向构造函数的`prototype`

:::info
`__proto__`属性是对象独有的，`prototype`属性是函数所独有的，又因为函数是对象，所以函数既有`__proto__`属性，又有`prototype`属性；

:::

其他需要满足的可选条件：

- 实例化子类时，可以传递参数给父构造函数

## 组合继承

<<< @/base/js/codes/extends.ts{21,32-33}

### 缺点

- 需要调用两次父类的构造函数

## 寄生组合继承

将上述修改为`寄生组合继承`只需要将`new Device`修改为`Object.create(Device.prototype)`

```js
Airport.prototype = new Device('DJIxxxx-xxxx', '98kg', '60%'); // [!code --]
Airport.prototype = Object.create(Device.prototype); // [!code ++]
```

`Object.create()`做了哪些操作呢？

```ts
function create(obj) {
  function F() {} // 新的构造函数
  F.prototype = obj; // 继承传入的参数obj
  return new F(); // 返回新的函数对象
}
```

当然也可以替换为`Object.setPrototypeOf`

```js
Airport.prototype = new Device('DJIxxxx-xxxx', '98kg', '60%'); // [!code --]
Object.setPrototypeOf(Airport.prototype, Device.prototype); // [!code ++]
```
