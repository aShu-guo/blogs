# 泛型

泛型的本质是`类型变量`，可以在创建`class`、`type alias`、`function`、`interface`时，无需精确指定类型。

泛型易于创建可复用的代码

## 语法

### class

可以通过泛型创建更通用的class

```ts
class NamedValue<T> {
    private _value: T | undefined

    constructor(private name: string) {
    }

    setValue(value: T) {
        this._value = value
    }

    getValue(): T | undefined {
        return this._value
    }

    toString() {
        return `${this.name}: ${this._value}`;
    }
}

const namedValue = new NamedValue('xiaoming')
namedValue.setValue(123)
console.log(namedValue.toString())
```

如果构造函数参数中有泛型，在实例化时，ts会自动推断出泛型的具体类型

### type alias & interface

可以声明更加通用的类型别名和interface

```ts
// type alias
type ValueWrapper<T> = { value: T }

//interface
interface ValueWrapper<T> {
    value: T
}
```

### function

声明包含泛型的函数时，为参数列表和返回值分配类型时都可以使用。

```ts
const useState = function <T>(state: T): [T, (value: T) => void] {
    return [state, (value) => state = value]
}

```

## 默认值

与声明变量时给默认值类似，如果声明了包含泛型的class、type alias等，可以给一个默认的类型

```ts
type ValueWrapper<T = string> = { value: T }
```

## extends

通过`extends`向泛型添加约束，以限制允许的类型，缩小泛型的具体类型

```ts
function createLoggedPair<S extends string | number, T extends string | number>(v1: S, v2: T): [S, T] {
    console.log(`creating pair: v1='${v1}', v2='${v2}'`);
    return [v1, v2];
}
```

可以与默认值组合使用。


