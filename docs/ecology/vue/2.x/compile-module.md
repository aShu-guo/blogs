> #### 编译过程

由于不同的平台对vue的编译使用的基础方法实现不同，导致不同平台编译vue模板的结果不相同；但是开发者希望在不同的平台上编译出来的模板也是相同的，所以提供了多种options；但是又不希望在相同平台下每次都要传入相同的配置，所以使用了偏函数、闭包的思想

```
偏函数：通过固定一个或多个参数，将一个多元函数变为n-x元函数。
```



![img](https://book.penblog.cn/src/img/3.2.png)



> #### 编译实现

```html
<div>
  {{name}}
  <button class="white-block" v-if="name" @click="changeNameHandler">change!!</button>
</div>
```



parse方法解析template，输出ast

```js
// 1.编译template，生成AST
// 2.解析ast，生成render
function AST(){
  /**
  attrsList：会在attrList中移除一些attr；原因是什么？
  
 	*/
}
```





> #### template中的AST对象

```js
1.staticClass:'whi'
2.staticStyle:
attrs:
on:

```




