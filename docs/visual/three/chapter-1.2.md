# dat.gui

轻量级的控制器调试库，配置之后自动在页面生成控制滑轮

![img.png](/imgs/visual/threejs/dat-gui.png)

## 初始化

```js
import * as dat from 'dat.gui';

const gui = new dat.GUI();
```

## 常用方法

### add

添加滑动条控制数值的改变

```js
gui.add(cube.position, 'x').min(0).max(5).step(0.01).name('x轴');
```

![img.png](/imgs/visual/threejs/dat-gui-1.png)

不仅支持滑动条，也支持下拉框

```js
var testObj = {
  type: 'two',
  speed: 50,
};

gui.add(testObj, 'type', ['one', 'two', '三']);
gui.add(testObj, 'speed', { slow: 1, 中速: 20, fast: 50 });
```

![img.png](/imgs/visual/threejs/dat-gui-4.png)

也可以是一个按钮

```js
var testObj = {
  fn: () => {
    console.log('click');
  },
};

gui.add(testObj, 'fn');
```

![img.png](/imgs/visual/threejs/dat-gui-5.png)

### addColor

添加颜色选择器，调整不同的颜色

```js
const params = { color: '#000000' };

gui.addColor(params, 'color').onChange((value) => {
  cube.material.color.set(value);
});
```

![img.png](/imgs/visual/threejs/dat-gui-2.png)

### addFolder

添加文件夹（折叠面板），常用于对选项分类或选项过多时折叠

![img.png](/imgs/visual/threejs/dat-gui-3.png)
