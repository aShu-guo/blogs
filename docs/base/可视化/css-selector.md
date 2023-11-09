1.lastchild

为class为main-box下的最后一个div标签添加样式

```css
.main-box div:last-child 
{
  margin-top: 1/@r;
  font-size: 12/@r;
  color: #999999;
  line-height: 17/@r;
}
```



> #### 后代选择器 and 子选择器

```css
1.后代选择器（包含选择器）：空格  '所有后代'
.buttons button{
  class为buttons的所有button标签
}

2.子选择器：>  class为buttons元素中的第一个button标签
.buttons > button{
  第一个class为buttons的所有button标签
}

当class=buttons的元素只有一个时，作用是相同的


& > view:not(:last-child) {
    margin-bottom: 21px;
  }
```

