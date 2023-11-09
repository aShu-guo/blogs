# 特殊的类型

在ts中除了基本类型之外，还有5个特殊的类型：`any`、`unknown`、`never`、`null`、`undefined`

## any

ts对类型为`any`的变量不会做类型检查、智能提示等帮助，虽然有上述缺点，但是在处理过去设计漏洞时很有帮助。

如果没有显式设置类型，而且ts没有推断出类型，那么变量的类型会被设置为`any`

```ts
let a: any = true
a = 'xiaoming' // 如果不显式指定变量a为any类型，那么ts会自动推断变量a为boolean类型，再次赋值为string类型的值会报错
```

## unknown

unknown与any类似，但是却更加安全。当不知道一个变量的类型是什么时，可以将它的类型设置为`unknown`。

而且ts将会阻止使用`未推断为具体类型`的`unknown`变量

```ts
let a: unknown = true
a = 'hello world'

a = {
    run: () => {
        console.log('hello world')
    }
} as { run: () => void }

// a.run() // Error: 'a' is of type 'unknown'.ts(18046)
if (typeof a === 'object' && a !== null) {
    (a as { run: Function }).run()
}
```

与`any`相比，在使用`unknown`类型的变量时ts仍会进行类型校验，如果想不抛出ts异常，那么在使用时必须断言为正确的类型

## never

never类型的变量，只要赋值给它便会抛出异常。

当`类型收敛`之后没有其他类型可能时，ts会将自动将类型推断为`never`

[是否需要在类型收敛函数中添加详尽性判断？](https://www.typescriptlang.org/docs/handbook/2/narrowing.html#exhaustiveness-checking)

```ts
let name: never = '123' //Error: Type 'string' is not assignable to type 'never'
```

never很少使用，尤其是单独使用，它的主要用途是高级泛型

## undefined && null

undefined 与 null对应js中的 undefined 和 null

ts有更强大的系统处理null和undefined类型的值

### 可选链

optional chain 是ES7的内容，而且ts支持。是一种访问对象中`可选的属性`的兼容语法

```ts
interface Student {
    name: string,
    age: number,
    sex?: {
        male: boolean,
        female: boolean
    }
}

const introduce = (student: Student) => {
    console.log(`name: ${student.name}, age: ${student.age}, sex: ${student.sex?.male}`)
}
```

### 空值合并

也是ES7的内容，而且ts支持。适用于访问可能为`null`或者`undefined`的属性，语法为：`??`

```ts
function printMileage(mileage: number | null | undefined) {
    console.log(`Mileage: ${mileage ?? 'Not Available'}`);
}

printMileage(null); // Prints 'Mileage: Not Available'
printMileage(0); // Prints 'Mileage: 0'
```

注意与`&&`的区别：

- A && B: 当A为`false`、`0`、`''`、`null`、`undefined`时，才可以访问B
- A ?? B: 当A为`null`、`undefined`时，才可以访问B

### 空值断言

ts的推断系统并不完美，可能推断的值并不准确。一种简单的方式是类型转换，但是也可以使用`!`，告诉ts这个变量一定不会是`null`
或者`undefined`

```ts
function getValue(): string | undefined {
    return 'hello';
}

let value = getValue();
console.log('value length: ' + value!.length);
```

注意：这与类型转换一样，并不安全



