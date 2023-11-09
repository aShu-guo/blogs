# 函数类型

在ts中声明函数时与js不同，需要显式声明参数类型和返回值类型

## 类型声明

语法为：(参数名: 参数类型) => 返回值类型

```ts
// fn是一个要求参数类型为string，返回值类型为boolean的函数
const doSomething = (fn: (arg: string) => boolean): void => {
    fn('hello world')
}
```

### 通用声明

更加通用的函数类型声明

```ts
type Fun = (...args: any[]) => any

interface Fun2 {
    (...args: any[]): any
}
```

### 带属性的函数声明

但是在js中会存在包含一些属性的函数，即将属性挂到声明的函数类型的变量上

```js
const fn = function (name: string) {
    console.log('hello ' + name)
}
fn.desc = '我是一个函数'
```

在ts中可以如下声明来解决上述问题：

```ts
type fn = {
    desc: string,
    (name: string): void
}

interface fn{
    desc: string,
    (name: string): void
}
```

需要注意的是这与不含属性的函数类型有些许不同，参数类型与返回值类型之间一个是`:`
另一个是`=>`：`(name: string): void` `(arg: string) => boolean`

### 构造函数声明

在js中可以实例化函数，对应的在ts中可以声明如下：

```ts
type Fn = {
    new(s: string): SomeObject;
};

function fn(ctor: Fn) {
    return new ctor("hello");
}
```

:::tip
可以将两者组合使用，日期：Date便是一个例子，既可以实例化，又可以直接调用。
:::

## 返回值类型

可以显示的声明返回值类型，如果没有声明，ts则会尝试自行根据返回值推断类型。

```ts
const getName = (): string => {
    return 'xiaoming'
}
```

只要是ts允许的类型都可以作为返回值类型，只特别介绍`void`类型

### void类型

如果函数没有返回值或者返回`undefined`，则返回值类型为`void`

```ts
const sayHello = (): void => {
    console.log('hello world')
}
```

#### 通过type alias声明的函数

此时`void`表示会忽略返回值

```ts
type voidFunc = () => void;


const f1: voidFunc = () => {
    return true;
};

const f2: voidFunc = () => true;

const f3: voidFunc = function () {
    return true;
};
```

这是为了兼容没有函数体的回调`['1', '2', '3'].forEach( (item) => parseFloat(item))`

`forEach`的返回值类型为void，但是parseFloat的返回值类型是`number`，但是这在ts中并不报错。

#### 字面函数声明

此时不能有返回值或者返回`undefined`

```ts
const f2 = function (): void {
}

const f3 = function (): void {
    return undefined
}
```

## 泛型

为了使函数更加通用，可以传入一个或多个泛型（类型变量），在声明参数类型和返回值类型时可以使用泛型来声明

```ts
// 
function map<Input, Output>(data: Input[], callback: (item: Input, index: number) => Output): Output[] {
    return data.map(callback)
}
```

:::warning
如果返回值类型和参数类型分配了同一个泛型类型，则返回值必须与入参的值的类型必须相同，而不能是其他泛型的子类。
:::

在定义函数的泛型时，根据官方推荐的规则总结出以下判断：

1. 需要声明泛型时，尽量使用它本身，而不是通过extends约束它
2. 尽可能使用少量的类型参数
3. 不要为回调函数声明可选参数，即使是可选的

## 参数类型

为函数的参数列表分配类型，语法类似声明对象属性。如果没有显式声明，ts会默认为`any`

```ts
const sayHello = (name: string) => {
    console.log('i am ' + name)
}
```

### 可选参数

ts默认所有参数都是必须的，但是可以通过`?`表明参数是非必须的

```ts
// 被`?`标记的参数的类型为：number | undefined
function add(a: number, b: number, c?: number) {
    return a + b + (c || 0);
}
```

### 参数默认值

默认值写在参数类型之后

```ts
function add(a: number, b: number, c: number = 10) {
    return a + b + (c || 0);
}
```

### 具名参数

含义等于解构对象参数

```ts
function introduce({name, age}: { name: string, age: number }) {
    console.log(name + ':' + age)
}
```

### 剩余参数

`...`将剩余参数列表归纳为数组，这点与js保存一致，但是需要声明剩余参数列表的类型

```ts
function add(a: number, b: number, ...rest: number[]) {
    return a + b + rest.reduce((p, c) => p + c, 0);
}
```

### 类型别名

为函数类型的变量声明一个类型

```ts
type Introduce = (name: string) => string
const introduce: Introduce = (name) => {
    return name
}
```

## 重载

函数名相同但是参数列表的个数、类型、顺序不同，返回值不同的称为函数的重载

```ts
function makeDate(timestamp: number): Date;
function makeDate(m: number, d: number, y: number): Date;
function makeDate(mOrTimestamp: number, d?: number, y?: number): Date {
    if (d !== undefined && y !== undefined) {
        return new Date(y, mOrTimestamp, d);
    } else {
        return new Date(mOrTimestamp);
    }
}
```

在声明了函数的不同签名时，由于只能有一个实现，所以实现函数时需要兼容不同的版本。

在上面的函数实现中，`d`和`y`为可选参数，在添加函数体时对未传`d`和`y`的情况区分了处理。

:::tip
能使用联合类型时，尽量不要使用函数的重载
:::

## 类型收敛

将宽泛的类型收敛为一个更为精确的类型

### type predicate

语法为：参数名 `is` 类型

当使用类型断言函数作为返回值类型时，返回值类型必须为`boolean`

```ts
function isValidRating(
  rating: any
): rating is Rating {
  if (!rating || typeof rating !== "number") {
    return false;
  }
  return (
    rating === 1 ||
    rating === 2 ||
    rating === 3 ||
    rating === 4 ||
    rating === 5
  );
}
```




