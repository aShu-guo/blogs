> ### threejs常见概念



> #### 名词

```js
1.透视相机（人眼相机，远小近大） 正投影相机（适用于工程、建筑图纸，远近相同）
	视角变小，物体变大；投影在近平面上的图形即是屏幕上的图形
  
2.四个主要的概念
	scene：场景
  camera：perspectiveCamera--透视相机、orthographicCamera--正交投影相机
  renderer：渲染器
  mesh：网格
  	geometry：几何结构
    material：材质 

```



> #### 常见camera--观察坐标系 (0,0,0)表示相机位置；z轴指向屏幕内

```js
正投影相机（orthographicCamera）：平行光照射物体；远近大小相同；'视景体'
const camera = new THTEE.OrthographicCamera(left,right,top,bottom,near,far)

透视投影相机（perspectiveCamera）：从一点照射物体；远小近大；只能看到视椎体内物体。'视锥体'
const camera = new THREE.PerspectiveCamera(45, width / height, 1, 10000);
fov--视角：视角越大，场景越大，物体相对于整个场景更小
near--相机位置到近平面的垂直距离

up：垂直于快门的方向（默认y轴正方向） 方向与数值的大小无关？？？
	camera.up.x=0
	camera.up.y=1
	camera.up.z=0

lookAt：镜头射出一条线指向的位置（默认z轴负方向）
'up方向必须与lookAt方向垂直'
```



> #### 常用material--材质（材料和质感的结合）

```js
MeshNormalMaterial:
PointsMaterial:
LineBasiceMaterial:

```



> #### 常用geometry

```js
BoxGeometry:

```



> #### 常用mesh

```js
BoxGeometry:

```

