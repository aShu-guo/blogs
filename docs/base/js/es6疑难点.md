1.module的导入和导出

```js
//export.js
export function sayHello(){
    console.log('hello')
}

export default {
    readme(){
        console.log('README.md')
    }
}


//import.js
import * as fun from './export'
import mod from './export'
fun.sayHello()
mod.readme()
```

将一个大的程序拆分成多个小的模块，使用的时候可以方便的组装起来；

export default 配合import xxxx使用

export function|class|let|const|var|{xxx,xxx}| 配合import xxx|{xxx,xxx}|* as xxx|  使用

