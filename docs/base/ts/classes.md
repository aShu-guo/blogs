# class

ts相较于js的`class`添加了`类型声明`和`可见性修饰符`。

## 类型声明

`class`声明成员变量时可以分配为它分配类型

```ts
class Student {
    name: string
}

const student = new Student()
student.name = 'xiaoming'
```

## 可见性

提供了三个修饰符：`public`、`private`、`protected`，默认为`public`，其中与Java的区别如下：

其中Java引入了`Package`的概念

|           | TypeScript   | Java           |
|-----------|--------------|----------------|
| public    | 允许任何地方可见     | 允许从任何地方可见      |
| private   | 只允许class内部可见 | 只允许class内部可见   |
| protected | 当前class和子类可见 | 当前package和子类可见 |
| default   | 无            | 当前package可见    |

### private keyword vs private field

`private`关键字与`#field`私有字段，后者仍处于提案阶段

#### private keyword

`private`关键字仅作用于编译时，而且可以绕过私有检查

```ts
class Student {
    private name: string

    constructor(name) {
        this.name = name
    }
}

const student = new Student()
(student as any).name
```

编译成的js代码仅是作为一个普通属性：

```js
"use strict";

class Student {
    constructor(name) {
        this.name = name;
    }
}
```

#### private field

- 可以命名于非`#`字段`同名`的私有属性
- 无法被`JSON.stringify`序列化
- 无法`Object.getOwnPropertyNames`或者类似的方法访问

```ts
class Person {
    age: number
    #age: number
}
```

需要运行时检查私有属性时可以使用后者，但是大多数情况下都是默认使用前者

## 构造参数

ts提供了一种更便利的添加可见性修饰符的方式：直接标注在构造函数的参数上

注意⚠️：这是ts独有的，在js中非法

```ts
class Student {
    constructor(private name: string) {
    }

    introduce() {
        console.log('i am ' + this.name)
    }
}

```

### readonly

与数组类似，添加`readonly`关键字到成员属性上，添加之后属性变为只读

```ts
class Student {
    constructor(private readonly name: string) {
    }

    introduce() {
        console.log('i am ' + this.name)
    }
}
```

## 扩展

### implements

`interface`可以定义`class`的形状，并且通过`implements`实现`interface`的成员属性

```ts
interface People {
    name: string,
    introduce: () => void
}

class Student implements People {
    name: string

    introduce() {

    }
}
```

当然可以实现多个`interface`：`class C implements A, B {}`

### extends

class可以通过`extends`相互扩展，但是必须是一个`class`

```ts
interface Shape {
    getArea: () => number;
}

class Rectangle implements Shape {
    public constructor(protected readonly width: number, protected readonly height: number) {
    }

    public getArea(): number {
        return this.width * this.height;
    }
}

class Square extends Rectangle {
    public constructor(width: number) {
        super(width, width);
    }

    // getArea gets inherited from Rectangle
}
```

### override

在通过`extends`扩展成员属性时，同时又希望覆盖它的成员方法，可以通过`override`重写方法

有`优先于`、`伸展在…的上面`的意思

```ts
interface Shape {
    getArea: () => number
}

class Rectangle implements Shape {
    constructor(protected width: number, protected height: number) {

    }

    public getArea(): number {
        return this.height * this.width
    }
}

class Square extends Rectangle {
    public override getArea(): number {
        return 1
    }
}
```

默认覆盖时可不添加`override`关键字，但是建议添加，可在`tsconfig`中设置`noImplicitOverride`强制重写时必须添加`override`

### abstract

`abstract class`既可以包含具体的成员实现，又可以包含未实现的成员。介于`interface`和`class`之间，但是子类只能通过`extends`
继承，并且要实现未实现的方法。

- 对于未实现的成员函数需要添加`abstract`
- 无法被实例化，因为它还会包含未实现的成员函数

```ts
abstract class Polygon {
    public abstract getArea(): number;

    public toString(): string {
        return `Polygon[area=${this.getArea()}]`;
    }
}

class Rectangle extends Polygon {
    public constructor(protected readonly width: number, protected readonly height: number) {
        super();
    }

    public getArea(): number {
        return this.width * this.height;
    }
}
```
