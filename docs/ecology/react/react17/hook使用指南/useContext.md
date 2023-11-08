> useContext 使用指南 🧭

提供一个共享上下文，组件之间可以共享状态

解决以下问题：

- props需要跨组件传递，中间组件会声明多余的props。
- 多个组件需要访问同一个变量的数据

`在vue中通过$listeners或则provide inject实现props跨组件传递，主要在高阶组件中使用`

> 使用方式

1.方式一

```js
// app-context.js
// 在组件外部声明一个context上下文
const AppContext = createContext({})
export default AppContext
```

```jsx
import AppContext from './app-context.js'

export default () => {
    return (
        <AppContext.Provider value={{student: {age: 25, name: 'xiaoming'}}}>
            <Foo></Foo>
            <Bar></Bar>
        </AppContext.Provider>
    )
}
```

```jsx
// foo.jsx
import AppContext from './app-context.js'

export default () => {
    const {student} = useContext(AppContext)
    return (
        <div>
            <span>{student.name}</span>
            <span>{student.age}</span>
        </div>
    )
}
```

2.方式二：搭配Consumer使用

不用再声明一个组件，直接消费即可

- 需要一个函数作为子元素，并且需要返回一个React节点
- 消费的上下文的值从距离消费者最近的context中获取（父子关系）
- 没有provider时，值为默认值

```jsx
// 其他jsx
import AppContext from './app-context.js'

export default () => {
    return (
        <AppContext.Consumer>
            {
                value => {
                }/* 基于 context 值进行渲染*/
            }
        </AppContext.Consumer>
    )
}
```

