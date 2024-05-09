# 大屏自适应方案

看了网上的各种方案，目前大家采用的大概有 3 种👇，这些方案对于`纯数据`大屏展示有较好的效果，但是对于`包含交互`的大屏效果不佳。

<table>
  <thead>
    <tr>
      <th>方案</th>
      <th>实现方式</th>
      <th>优点</th>
      <th>缺点</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><strong>vw vh</strong></td>
      <td>
        1.按照设计稿的尺寸，将<code>px</code>按比例计算转为<code>vw</code>和<code>vh</code>
      </td>
      <td>
        1.可以动态计算图表的宽高，字体等，灵活性较高<br />2.当屏幕比例跟 ui
        稿不一致时，不会出现两边留白情况
      </td>
      <td>1.每个图表都需要单独做字体、间距、位移的适配，比较麻烦</td>
    </tr>
    <tr>
      <td><strong>scale</strong></td>
      <td>
        1.通过 <code>scale</code> 属性，根据屏幕大小，对图表进行整体的等比缩放
      </td>
      <td>
        1.代码量少，适配简单<br />2.一次处理后不需要在各个图表中再去单独适配
      </td>
      <td>
        1.因为是根据 ui 稿等比缩放，当大屏跟 ui
        稿的比例不一样时，会出现周边留白情况
        <br />2.当缩放比例过大时候，字体会有一点点模糊，就一点点
        <br />3.当缩放比例过大时候，事件热区会偏移。
      </td>
    </tr>
    <tr>
      <td><strong>rem + vw vh</strong></td>
      <td>
        1.获得 rem 的基准值<br />2.动态的计算<code>html根元素的font-size</code
        ><br />3.图表中通过 vw vh 动态计算字体、间距、位移等
      </td>
      <td>1.布局的自适应代码量少，适配简单</td>
      <td>
        1.因为是根据 ui 稿等比缩放，当大屏跟 ui
        稿的比例不一样时，会出现周边留白情况<br />2.图表需要单个做字体、间距、位移的适配
      </td>
    </tr>
  </tbody>
</table>

以上 3 种方案在实际应用中该怎么选择视具体情况而定，也有看到大家说自适应在地图的适配中会有一些兼容问题，我这边还没有实践过。

- 如果想简单，客户能同意留白，选用 `scale` 即可，而且它是3种方案中工作量最少的。
- 如果需要兼容不同比例的大屏，并且想在不同比例中都有比较好的效果，图表占满屏幕，类似于移动端的响应式，可以采用 vw vh 的方案
- 至于 rem，个人觉得就是 scale 和 vw vh 的综合，最终的效果跟 `scale` 差不多
- 使用的图表框架，例如Echarts中仍没有内置rem解决方案，因此在设置font-size、padding等值时需要提供js逻辑，与所选择方案中的适配逻辑保持一致

这3种方案仍存在以下问题：

1. 对于select、date-picker、model等弹出层，如果挨个修改字体大小、宽高等太折磨，仍没有较好的解决方案

## img自适应

1. 设置padding-top为百分比值，相对于父元素宽度计算的。例如一张照片的宽度为400px，高度为600px，那么计算出的百分比值为：600/400=120%
2. 图片width写百分比，但height不能写百分比

<script setup>
import ImgWrap from './codes/img-wrap.vue'
</script>

<ClientOnly>
    <ImgWrap></ImgWrap>
</ClientOnly>
