# 响应式基础

1. 响应式基础

- 基本数据类型：ref
    - 修改变量时需要使用.value （注意：还可以通过ref为引用数据类型添加响应式）
    - 在template中可以直接引用

- 引用数据类型：reactive
    - 声明是建议通过const，可以直接修改变量，不能直接修改变量的引用(这也是建议使用const声明的原因)
    - 在template中可以直接引用
    - 如果没有使用setup语法糖，如果希望在template中不使用obj.name，可以通过toRefs()解包，得到对象中的响应式属性；即使不这样做，obj.name也是响应式的

- 联动reactive对象与ref对象：toRef
    - 基于reactive对象中某一个属性新建一个ref对象，两者响应性

```js
const student = reactive({
    age: 23,
    name: 'xiaoming'
})

// 此时student.name的改动也会同步到name上
const name = toRef(student, 'name')

const student2 = reactive({
    age: 23,
    name: 'xiaohuang'
})

// 并不会同步到name2上，仅仅是拿个一个值
const name2 = ref(student2.name)
```

- 解构reactive对象并且不会丢失响应性：toRefs

```js
const student = reactive({
    age: 23,
    name: 'xiaoming'
})

// refs中每个属性都是ref对象
const refs = toRefs(student)

```

- 浅响应性：shallowRef、shallowReactive
    - 只对顶层添加响应性，减少响应性能损耗
    - 触发响应性是需要替换整个根状态（修改整个对象的引用）


2. 组件传值

- 父子组件传值
    - 父组件通过传值到子组件，子组件通过props接下，再emit出来，父组件监听变化
    - 也可以通过provide inject传值，但是vue2中的provide的属性是不具备响应性的；vue3中是具有响应性的，所以建议只在provide处修改值，可以通过readonly强制约束子组件不可修改
      provide('location', readonly(location))

> 术语

- 解包：ref解包，取值时不用.value调用
    - 自动解包的情况
        - 在template中调用
        - 赋值给reactive对象中的一个属性
    - 不会自动解包的情况
        - 作为map或者array中的一个元素时

> watchEffect、watch、computed区别

watchEffect:立刻执行一个副作用函数，并响应式的追踪函数体中的依赖
watch:默认懒执行，追踪一个或多个响应式变量，可以知道变量的新值和旧值
computed:追踪函数体中的依赖，可以自定义getter和setter

> Q&A

- reactive对象解包后失效的原因
    - 解包后是局部变量，无法触发reactive对象中属性的get和set方法

