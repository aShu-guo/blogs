# text-align属性相关的新特性

text-align属性支持常用的属性值`left`、`right`、`center`、`justify`，也支持逻辑属性值`start`、`end`，除此之外，还新增了多个其他属性值。

- left

<div class="w-full text-left">
text-align属性支持常用的属性值`left`、`right`、`center`、`justify`，也支持逻辑属性值`start`、`end`，除此之外，还新增了多个其他属性值。
</div>

- right

<div class="w-full text-right">
text-align属性支持常用的属性值`left`、`right`、`center`、`justify`，也支持逻辑属性值`start`、`end`，除此之外，还新增了多个其他属性值。
</div>

- center：行内内容居中。

<div class="w-full text-center">
text-align属性支持常用的属性值`left`、`right`、`center`、`justify`，也支持逻辑属性值`start`、`end`，除此之外，还新增了多个其他属性值。
</div>

- justify：字体向两侧对齐

<div class="w-full text-justify">
text-align属性支持常用的属性值`left`、`right`、`center`、`justify`，也支持逻辑属性值`start`、`end`，除此之外，还新增了多个其他属性值。 Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu
</div>

## match-parent等新属性值

### match-parent

与inherit效果类似，区别在于 start 和 end 的值根据父元素的 direction 确定，并被替换为恰当的 left 或 right 值。

<div id="box1" style="direction: rtl" class="text-end">
<span style="text-align: match-parent">
text-align属性支持常用的属性值`left`、`right`、`center`、`justify`，也支持逻辑属性
</span>
</div>

<div id="box2" style="direction: rtl" class="text-end">
<span>
text-align属性支持常用的属性值`left`、`right`、`center`、`justify`，也支持逻辑属性
</span>
</div>

```js
const box1 = document.getElementById('box1');
console.log(getComputedStyle(box1).textAlign); // output: end

const box2 = document.getElementById('box2');
console.log(getComputedStyle(box2).textAlign); // output: end
```

### justify-all

在justify的基础上实现最后一行的两端对齐，但是目前没有浏览器实现这个属性值

可以借助`text-align-last: justify`实现相同的视觉效果

<div class="w-full" style="text-align-last: justify">
text-align属性支持常用的属性值`left`、`right`、`center`、`justify`，也支持逻辑属性值`start`、`end`，除此之外，还新增了多个其他属性值。
</div>

## text-align属性的字符对齐特性

可以实现参考单个字符进行对齐，但是只能是单个字符，如果写入多个字符则忽略

```css
td {
  text-align: '.' center;
}
```

<table>
<col width="40">
<tr> <th>长途电话费用</th></tr>
<tr> <td> ¥1.30</td></tr>
<tr> <td> ¥2.50</td></tr>
<tr> <td> ¥10.80</td></tr>
<tr> <td> ¥111.01</td></tr>
<tr> <td> ¥85.</td></tr>
<tr> <td> N/A</td></tr>
<tr> <td> ¥.05</td></tr>
<tr> <td> ¥.06</td></tr>
</table>

<style>
td {
  text-align: '.' center;
}
</style>

此时，单元格的数值会按照字符“.”进行对齐

:::danger
浏览器还未实现
:::
