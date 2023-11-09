1.元字符

2.重复限定符

3.分组：()

4.转义：\

5.条件或：|

6.区间：[]表示区间条件，被包裹的特殊字符不表示正则中的元字符

7.捕获组？



```js
regexp:\[[^\[]*\]
     
// 2021年11月01日 YYYY年mm月dd日
```



> #### 等价

```js
1.特殊字符 ? 与 {0,1} 是相等的，它们都代表着： 0个或1个前面的内容 或 前面的内容是可选的 。
2.特殊字符 * 与 {0,} 是相等的，它们都代表着 0 个或多个前面的内容 。
3.特殊字符 + 与 {1,} 是相等的，表示 1 个或多个前面的内容 
```



> #### 规则

```js
1.[0-9] 匹配0-9的字符;[^0-9]匹配非0-9的任意字符
```



> #### string replace

```js
replace(pattern,replacement)
pattern 可以是字符串，也可以是正则表达式
replacement 可以是字符串，也可以是函数
	如果是函数时，第一个参数是匹配模式的字符串，后面的参数是子表达式匹配的字符串
  返回值是替换字符串
  
例子：
let str = '<p><img style="width: 604px;" src="http://xxts-fm-oss.dingtax.cn/test/id9ee2f73d7e4243b6b25e6681f7d525fb.png"><span></span><br></p>'
str.replace(/<img.*?(style="[^"]*").*?(src="[^"]*").*?/g, (a, b, c) => {
  console.log(a)
  console.log(b)
  console.log(c)
})

```

output：

![image-20220107111935390](/Users/ifugle/Library/Application Support/typora-user-images/image-20220107111935390.png)
