> ### API上的模糊点

1.Vue.extend

用来新建一个组件构造器

```js
//首先通过新建一个组件构造器
var Profile = Vue.extend({
  template: '<p>{{extendData}}实F例传入的数据为:{{propsExtend}}</p>', // template对应的标签最外层必须只有一个标签
  data: function () {
    return {
      extendData: '这是extend扩展的数据',
    }
  },
  props: ['propsExtend']
})
//通过实例中的components获取Vue.component()局部注册或者全局注册

```

2.extends

拓展组件的功能

```js
//新建一个对象
var extendObj = {
  methods: {
    clickHandle () {
      alert('this is clickHandle')
    }
  }
}
//通过extends拓展组件功能
export default{
  extends: extendObj
}
```

3.Vue.filter与filters

与watch的区别：

filter是在入值时会对值做一些格式化处理

watch是在值发生改变的时候，添加一些业务逻辑处理

```js
//全局注册 or 局部注册
Vue.filter('myFilter', function (value) {
  if (!value) {
    return ''
  } else {
    return value.toString().toUpperCase()
  }
})
//从全局注册的filter中取出自定义filter
var myFilter = Vue.filter('myFilter')
//局部注册
export default{
  filters: {
    capitalize (value) {
      if (!value) {
        return ''
      } else {
        return value.toString().toUpperCase()
      }
    }
  }
}
//在双花括号中使用
{{ name | capitalize}}
//在v-bind中使用
<div v-bind:id="rawId | formatId"></div>

```

4.调试template

```js
// 在Vue原型上添加一个函数
Vue.prototype.$log = window.console.log;

// 在template中使用
<div>{{ $log('helloworld') }}</div>

//由此可知通过Vue原型拓展api
```

5.父子组件间的传值：.sync传值

如果是通过.sync传值，需要在父组件中保存一份要传属性的值，父组件会变得庞大

如果是$emit传值，那么不需要保存

```js
// .sync传值的实例
// parent.vue
<div>
	<son :name="name" age="24" :radio1.sync="radio1">
      {{ radio1 }}
    </son>  
</div>
// 会被拓展为
<div>
      // 如果是通过.sync，子组件传来的事件名称固定为：@update:xxx
	<son :name="name" age="24" :radio1"radio1" @update:radio1="val => radio1 = val">
      {{ radio1 }}
    </son>  
</div>


// son.vue
<el-radio-group v-model="radio" @change="handleClick">
      <el-radio-button label="上海"></el-radio-button>
      <el-radio-button label="北京"></el-radio-button>
      <el-radio-button label="广州"></el-radio-button>
      <el-radio-button label="深圳"></el-radio-button>
</el-radio-group>
<slot></slot>

export default {
  props: {
    radio1: {}
  },
  data () {
    return {
      // 给radio默认值
      radio: this.radio1
    }
  },
  watch: {
    // 监听radio的改变修改值，不要修改父组件传来的值
    radio (newVal, oldVal) {
      this.radio = newVal
      console.log(this.radio)
    }
  },
  methods: {
    handleClick () {
      this.$emit('update:radio1', this.radio)
    }
  },
}
```

6.v-for与v-if的同时使用

比起在模板层面管理相关逻辑，更好的办法是通过创建计算属性筛选出列表，并以此创建可见元素。



7.$on，$once可以监听所有生命周期函数

this.$on('hook:destoryed',function(){})

也可以监听子组件的生命周期函数：<customer-select @hook:updated="dataUpdatedHandler"/>



8.watch

使用场景：一个属性依赖其他属性改变，并且需要做一些业务逻辑处理

监视对象中的一个属性时，可以通过deep属性，但是这样性能较差，会监视对象中的所有属性；

提供三种方案选择

```js
// 场景：监视对象escortPageDto的pageNo属性
// 方案一
watch:{
  escortPageDto:{
    handler(val,oldVal){
      
    },
    deep:true
  }
}

// 方案二
watch:{
  'escortPageDto.pageNo':{
    handler(val,oldVal){
      
    },
  }
}

// 方案三
computed: {
  pageNoCompute() {
    return this.escortPageDto.pageNo
  }
},
watch: {
  pageNoCompute(val, oldVal){
    
  }
}
```



9.事件委托

适用于v-for，将item的事件委托为外部容器；

```vue
<template>
	<div>
    <div v-for='(v,i) of list' :key='i' :data-index='i' @click='clickHandler'>
  		<div>
        {{v}}
 			</div>
  	</div>
  </div>
</template>

<script>
export default {
  data(){
    return {
      list: [
        {id:10001,name:'xiaoming'},
        {id:10002,name:'huangxiaoming'}
      ]
    }
  },
  methods:{
    clickHandler(e){
      let index=e.target.dataset.index
    }
  }
}
</script>
```



10.scoped

在style中不加scoped时，当不打开当前单页面组件A时并不会影响全局样式，但是如果打开之后再便会污染全局样式



11.created mounted

```js
mounted: dom已经渲染好？

-----
等dom加载完毕之后，再执行某个方法：利用setTimeout'宏任务'的执行顺序
效果等同于this.$nextTick()???
```



> ### 使用Vue的时候，你遇到了什么问题？

1.服务端为了防止xss攻击，开启了CSP限制script加载源默认为本地加载，而vue.js 是通过cdn引入，导致vue项目无法正常运行

```js
Content-Security-Policy: 指令1 指令1的值1 指令1的值2 指令1的值3; 指令2 指令2的值1 指令2的值2

ex:
// host 精确匹配、通配符匹配
Content-Security-Policy: script-src 'unsafe-inline' www.baidu.com;

```

解决方案：

服务端上线CSP策略没有事先通过report-uri报告资源加载失败，导致前端项目无法正常使用；

1.规范化流程，上线策略之前先通过report-uri观察资源加载失败的情况

2.逐步开放资源加载失败的url





