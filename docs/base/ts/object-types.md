# 对象类型

在ts中有声明对象的特殊语法

```ts
const student: { name: string, age: number } = {
    name: 'xiaoming',
    age: 26
}
```

## infer type

像声明包含value的数组一样，如果声明了属性值，那么ts会自动推断出属性的类型。

```ts
const student = {
    name: 'xiaoming'
}

// student.name = 123 // Error: Type 'number' is not assignable to type 'string'.ts(2322)
```

## 可选的属性

使用`?`来表示一个属性是可选的，在赋值时ts不再强制要求属性必须有值

```ts
// Error: Property 'name' is missing in type '{ age: number; }' but required in type '{ name: string; age: number; }'.ts(2741)
const student: { name: string, age: number } = {
    age: 26
}

// 通过检查
const student2: { name?: string, age: number } = {
    age: 26
} 
```

## 索引签名

可用于没有定义属性的对象

```ts
const student: { [index: string]: string } = {}
student.name = 'xiaoming'
// Type 'number' is not assignable to type 'string'.ts(2322)
// student.age = 26
```

也等价于ts提供的实体类型：`Record<string,string>`
