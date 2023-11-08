> #### 默认合并策略

得出父子options中相同key的覆盖以及执行顺序

1. data、provide
2. components、filters、directives
3. Props、methods、inject、computed
4. beforeCreate、created、beforeMount、mounted、beforeUpdate、updated、beforeDestory、destoryed



使用vue提供的合并策略，如果无则使用vue默认策略：子组件覆盖父组件





> #### 默认options

![image-20220216104136141](/Users/ifugle/Library/Application Support/typora-user-images/image-20220216104136141.png)



