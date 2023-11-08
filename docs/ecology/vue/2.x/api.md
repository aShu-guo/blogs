# APIs

记录下在业务开发过程中使用的api以及细节，方便后续复习。

基于Vue2.7和Vue3.0讨论

## $listener 和 $attrs

### vue-2.x

$listener: 包含传入当前组件所有`非native`事件的对象。
$attrs: 包含了父组件传递给当前组件但在当前组件没有声明的`props`，不包括`class`、`style`

<iframe src="https://codesandbox.io/embed/busy-mcclintock-7gg85t?fontsize=14&hidenavigation=1&theme=dark" style="width:100%; height:300px; border:0; border-radius: 4px; overflow:hidden;" title="busy-mcclintock-7gg85t" allow="accelerometer; ambient-light-sensor; camera; encrypted-media; geolocation; gyroscope; hid; microphone; midi; payment; usb; vr; xr-spatial-tracking" sandbox="allow-forms allow-modals allow-popups allow-presentation allow-same-origin allow-scripts">
</iframe>

### vue-3.x

$listener: 包含当前组件没有声明的所有`props`，而且包括`listener`
$attrs: 废弃了，合并到`$attrs`中了

<iframe src="https://codesandbox.io/embed/gracious-noyce-34sx3r?fontsize=14&hidenavigation=1&theme=dark" style="width:100%; height:300px; border:0; border-radius: 4px; overflow:hidden;" title="gracious-noyce-34sx3r" allow="accelerometer; ambient-light-sensor; camera; encrypted-media; geolocation; gyroscope; hid; microphone; midi; payment; usb; vr; xr-spatial-tracking" sandbox="allow-forms allow-modals allow-popups allow-presentation allow-same-origin allow-scripts">
</iframe>

:::warning
需要注意`kebab-case`方式传入的props，vue3并不会将它转换为`camelCase`形式，而是保留了原来格式的命名方式。
:::

### 使用场景

2.x版本和3.x版本的区别是： 在2.x版本中将listener和attrs区分开了，但是在3.x版本中将两者合并成为了attrs。

可以将attrs看作`筛子`，只有在当前作用域里没有的props才会继续向下传递。

这主要在高层组件库或者对组件二次封装时使用，省去了中间层组件命名props的重复工作，但是这需要足完整的、清晰的文档说明，否则维护起来非常麻烦。

## inheritAttrs

用于配置未声明属性的透传行为

- true：传入attrs会绑定到template的根节点上；重名则覆盖，class、styles则合并

- false：传入attrs不会绑定到template的根节点上；重名不会覆盖，class、styles则合并

```html
<div data-v-d3b0fe76="" class="hello" three="three" four="four" five="five">...</div>
```

:::tip
$attrs可以突破 inheritAttrs:false 的限制，将未定义的attrs通过v-bind绑定在非根元素上
:::

## watch

设置为立即执行时，被设置了`v-if`和`v-show`组件中的watch执行顺序不同，这跟组件是否重新挂载有关。

- v-if：满足条件时挂载组件后立刻执行watch，改变条件后会重新挂载并再次执行

- v-show：只会在初次挂载时执行watch，后续即使改变条件也不会重新执行

<iframe src="https://codesandbox.io/embed/eager-proskuriakova-62psx4?fontsize=14&hidenavigation=1&theme=dark" style="width:100%; height:500px; border:0; border-radius: 4px; overflow:hidden;" title="eager-proskuriakova-62psx4" allow="accelerometer; ambient-light-sensor; camera; encrypted-media; geolocation; gyroscope; hid; microphone; midi; payment; usb; vr; xr-spatial-tracking" sandbox="allow-forms allow-modals allow-popups allow-presentation allow-same-origin allow-scripts">
</iframe>

## Vue.extend

用来新建一个组件构造器

```js
// Profile是Vue的子类构造器
var Profile = Vue.extend({
  template: '<p>{{extendData}}实F例传入的数据为:{{propsExtend}}</p>', // template对应的标签最外层必须只有一个标签
  data: function () {
    return {
      extendData: '这是extend扩展的数据',
    };
  },
  props: ['propsExtend'],
});

// 挂载到指定容器
new Profile({ el: '#container' });
// 挂载到body上
new Profile().$mount();
```

## extends

拓展组件的功能，跟mixins类似，主要是为了便于扩展单文件组件

## Vue.filter与filters

全局注册

```js
Vue.filter('myFilter', function (value) {
  if (!value) {
    return '';
  } else {
    return value.toString().toUpperCase();
  }
});
//从全局注册的filter中取出自定义filter
var myFilter = Vue.filter('myFilter');
```

局部注册

```js
export default {
  filters: {
    capitalize(value) {
      if (!value) {
        return '';
      } else {
        return value.toString().toUpperCase();
      }
    },
  },
};
```

使用方式

```vue
<!--在双花括号中使用 -->
<span>{ { name | capitalize; } }</span>

<!--在v-bind中使用-->
<div v-bind:id="rawId | formatId"></div>
```

与watch的区别：

- filter是在入值时会对值做一些格式化处理

- watch是在值发生改变的时候，添加一些业务逻辑处理

:::warning
filter在vue3中废弃，因为这与methods的能力冲突，官方建议使用method替代
:::

## 父子组件间的传值

### .sync

本质是语法糖，在编译阶段将`.sync`修饰符编译为

```html
<son :age.sync="age"></son>
```

```js
function render() {
  with (this) {
    return _c('son', {
      attrs: {
        age: age,
      },
      on: {
        'update:age': function ($event) {
          age = $event;
        },
      },
    });
  }
}
```

:::warning
在Vue3中废弃，因为支持了多props的v-model用法，.sync与它提供的能力冲突，故被废弃。
:::

## v-for与v-if的同时使用

官方不建议同时使用，那么可以事先处理好数据，再通过v-for渲染模板

[v-if优先级高于v-for](https://cn.vuejs.org/guide/essentials/list.html#v-for-with-v-if)

## $on，$once可以监听所有生命周期函数

监听$emit抛出来的事件名，既包含自定义事件名，也包含生命周期事件名

```vue
<template>
  <customer-select @hook:updated="dataUpdatedHandler" />
</template>

<script !src="">
export default {
  created() {
    this.$on('hook:destoryed', function () {});
  },
};
</script>
```

:::warning
在Vue3中废弃$on、$once。即使不废弃也不建议这样使用，最好将监听子组件生命周期事件的handler逻辑放在该放的位置：即子组件对应生命周期中，这样的代码具有跟好的可读性、可维护性
:::

## 事件委托

适用于v-for，无需在每个子元素中绑定事件，减少性能损耗。因为当list发生改变时，需要重复对子元素绑定/解绑事件监听器

```vue
<template>
  <div>
    <div v-for="(v, i) of list" :key="i" :data-index="i" @click="clickHandler">
      <div>
        {{ v }}
      </div>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      list: [
        { id: 10001, name: 'xiaoming' },
        { id: 10002, name: 'huangxiaoming' },
      ],
    };
  },
  methods: {
    clickHandler(e) {
      let index = e.target.dataset.index;
    },
  },
};
</script>
```

## scoped

不加scoped时，如果没有打开当前单页面组件并不会影响全局样式，但是反之则会污染全局样式

## 开发中遇到的一些问题

### cdn加速

服务端为了防止xss攻击，开启了CSP限制script加载源默认为本地加载，而vue.js 是通过cdn引入，导致vue项目无法正常运行

```text
Content-Security-Policy: 指令1 指令1的值1 指令1的值2 指令1的值3; 指令2 指令2的值1 指令2的值2

ex:
// host 精确匹配、通配符匹配
Content-Security-Policy: script-src 'unsafe-inline' www.baidu.com;

```

解决方案：

服务端上线CSP策略没有事先通过report-uri报告资源加载失败，导致前端项目无法正常使用；

1.规范化流程，上线策略之前先通过report-uri观察资源加载失败的情况

2.逐步开放资源加载失败的url
