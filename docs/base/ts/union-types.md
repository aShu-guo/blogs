# 联合类型

当变量包含多个类型时使用联合类型，当使用联合类型时，ts只会只能提示联合类型中所有类型`共有`的属性。

设计联合类型的原则：首先声明meta类型，后再组合为联合类型

## 语法

使用`|`表示：可能是...，又可能是...，又可能是...

```ts
let a: string | number
a.toString()
```

![img.png](/imgs/typescript/union-types.png)

:::tip
在未使用ts的vue中声明props时：`id: { type: [String, Number], required: true }`，注意不要与ts联合类型语法混淆了。
:::

## 类型收敛

如果未声明meta类型，而直接声明`interface`来等价于组合类型

```ts
interface Shape {
    kind: 'circle' | 'square',// 根据kind属性判断Shape是哪种类型
    radius?: number, // 必须设置为可选的，因为square类型并没有半径
    sideLength?: number// 必须设置为可选的，因为circle类型并没有边框
}
```

在调用计算面积函数时，需要区分不同的kind添加不同的计算逻辑，但是由于每个kind包含的属性不同，所以又必须在添加计算逻辑时将独有的属性断言为一定存在的。

```ts
function getArea(shape: Shape) {
    // oops!
    if (shape.kind === "circle") {
        return Math.PI * shape.radius! ** 2
    }
}
```

但是这并不安全。

如果设计Shape时，首先声明不同类型的interface，后组成联合类型便不会出现上述问题：

```ts
interface Circle {
    kind: "circle";
    radius: number;
}

interface Square {
    kind: "square";
    sideLength: number;
}

type Shape = Circle | Square;
```

在调用计算面积函数时，便可以根据`kind`添加不同计算逻辑

```ts
function getArea(shape: Shape) {
    switch (shape.kind) {
        case "circle":
            return Math.PI * shape.radius ** 2;
        case "square":
            return shape.sideLength ** 2;
    }
}
```

所以在设计联合类型时需要遵循：首先声明meta类型，后再组合为联合类型
