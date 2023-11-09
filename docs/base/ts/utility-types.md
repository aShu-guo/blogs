# 实体类型

在ts中内置了许多实体类，简化声明类型

## Partial

将对象中的属性都声明为`可选的`

## Required

将对象中的属性都声明为`必须的`

## Record

声明指定类型key和指定类型的value构成对象

```ts
const obj: Record<string, number> = {xiaohua: 23, xiaoming: 26}
// 等价于
const obj2: { [key: string]: number } = {xiaohua: 23, xiaoming: 26}
```

## Omit

忽略对象的属性，第二个类型变量为`union type`

```ts
interface Person {
    name: string;
    age: number;
    location?: string;
}

const a: Omit<Person, 'age'> = {
    name: '',
    location: '',
}
```

## Pick

只取对象中指定属性，第二个类型变量与`Omit`相同为`union type`

## Exclude

去除union type的指定类型

```ts
type Primitive = string | number | boolean
const value: Exclude<Primitive, string> = true
```

## ReturnType

提取函数类型的返回值的类型

```ts
type introduce = () => string
const value: ReturnType<introduce> = '123'
```

## Parameters

提取参数列表的类型，并构成一个array

```ts
type introduce = (name: string, age: number) => void

const nickName: Parameters<introduce>[0] = '123'
```

## Readonly

基于现有类型创建一个属性只读的类型，一旦赋值便无法更改

```ts
interface Person {
    name: string;
    age: number;
}

const person: Readonly<Person> = {
    name: "Dylan",
    age: 35,
};
// TS2540: Cannot assign to 'name' because it is a read-only property.
// person.name = 'Israel'; 
```

