> Issue-8700：当使用动态组件时，如果组件没有注册，则会抛出异常；
>
> 期望：找不到组件时，不抛出警告

```js
const OptionalComponent = {
	props: ['render'],
  functional: true,
  render: (h, { children, props, parent }) => {
  	let Comp = (parent.$options.components && parent.$options.components[props.render]) || Vue.component(props.render)
  	return Comp ? h(Comp) : children
  }
}
```



```html
<OptionalComponent render="Foo">fallback content here</OptionalComponent>
```

