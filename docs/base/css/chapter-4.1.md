# 透明度控制属性opacity

opacity属性可以让元素表现为半透明，属性计算值范围是0～1，初始值是1.0，没有继承性。

在所有支持CSS过渡和动画的CSS属性中，opacity属性是`性能最高的`

<div class="relative w-full">
    <div class="w-full absolute left-0 top-0 h-10px bg-red opacity-99%"></div>
    <div class="w-full absolute left-0 top-0 h-20px bg-green"></div>
</div>

## opacity属性的叠加计算规则

子元素与父元素都设置了opacity，则叠加值为`opacity * opacity`

<div class="w-full h-100px opacity-40">
    <div class="w-full h-full bg-#00ff00 opacity-20"></div>
</div>

<div class="w-full h-100px mt-20px bg-#00ff00 opacity-8"></div>
