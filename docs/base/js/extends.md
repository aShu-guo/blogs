# 继承的2种实现方式

实现继承需要满足的3个`必要`要求：

- 子类可以访问父类的属性和方法
- `instanceof`行为正确
- `construct`指向正确

其他需要满足的可选条件：

- 实例化子类时，可以传递参数给父构造函数

## 组合继承

```ts
const Device = function (model, weight, battery) {
    // 型号
    this.model = model
    // 重量
    this.weight = weight
    // 电池容量
    this.battery = battery
    this.introduce = function () {
        console.log(`[{model: ${this.model}, weight: ${this.weight}, battery: ${this.battery}]`)
    }

    this.modifyModel = function (model) {
        this.model = model
        this.introduce()
    }
}

const Airport = function (position, model, weight, battery) {
    Device.call(this, model, weight, battery)
    // 机场位置
    this.position = position
    this.fly = function () {
        console.log('机场')
    }
    this.sendSignal = function (uav) {
        console.log('向无人机:' + uav + '发送信号')
    }
}
Airport.prototype = new Device('DJIxxxx-xxxx', '98kg', '60%')
Airport.prototype.constructor = Airport
```

### 缺点

- 需要调用两次父类的构造函数

## 寄生组合继承

将上述修改为`寄生组合继承`只需要将`new Device`修改为`Object.create(Device.prototype)`

`Object.create()`做了哪些操作呢？

```ts
function object(obj) {
    function F() {
    } // 新的构造函数
    F.prototype = obj;    // 继承传入的参数obj
    return new F();        // 返回新的函数对象    
} 
```
