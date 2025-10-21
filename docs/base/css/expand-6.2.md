# 渐变色实现原理（基于shader）

渐变色是通过在两个或多个颜色之间平滑过渡来创建视觉效果。本文将深入探讨线性渐变和径向渐变的底层实现原理。

## 线性渐变

线性渐变是沿着一条直线（渐变线）在颜色之间进行插值。渐变线由起点和终点定义，颜色沿着这条线进行过渡。

### 基于shader实现

使用 WebGL 的片段着色器（Fragment Shader）可以实现更高性能的线性渐变，特别适合大面积渲染和动画场景。

**GLSL 实现：**

<<< @/base/css/codes/linear-gradient/frag.glsl

<<< @/base/css/codes/linear-gradient/vert.glsl

<ClientOnly>
    <RenderShader 
        :frag="fragShader" 
        :vert="vertShader" 
        :uniforms="{ 
            u_gradientStart: { value: new THREE.Vector2( 0, 0) },
            u_gradientEnd: { value: new THREE.Vector2( 1, 0) },
            u_color1: { value: new THREE.Color().setRGB( 0, 0, 0 ) },
            u_color2: { value: new THREE.Color().setRGB( 1, 1, 1 ) }
        }"
    />
</ClientOnly>

<script setup lang="ts">
import * as THREE from 'three';
import RenderShader from '/codes/RenderShader.vue';
import fragShader from './codes/linear-gradient/frag.glsl?raw';
import vertShader from './codes/linear-gradient/vert.glsl?raw';
</script>

<div class="w-full h-100px mt-10px" style="background: linear-gradient(to right, #000000, #ffffff)"></div>

:::tip
可以看到基于shader实现的渐变色与css中的渐变色产生的视觉效果是不同的，根本原因是

- shader是在非线性空间中计算的，即sRGB空间
- css有完整的计算流程，sRGB -> linear RGB -> sRGB

:::

**多色标实现：**

对于多个色标的情况，可以使用纹理或条件判断：

```glsl
// 使用纹理存储色标（推荐方式）
uniform sampler2D u_gradientTexture; // 1D 渐变纹理

void main() {
  // ... 计算 t 值 ...

  // 从纹理中采样颜色
  vec4 color = texture2D(u_gradientTexture, vec2(t, 0.5));
  gl_FragColor = color;
}
```

```glsl
// 使用条件判断（适合少量色标）
uniform vec3 u_colors[4]; // 最多4个颜色
uniform float u_stops[4]; // 对应的位置

void main() {
  // ... 计算 t 值 ...

  vec3 color;
  if (t < u_stops[1]) {
    float localT = (t - u_stops[0]) / (u_stops[1] - u_stops[0]);
    color = mix(u_colors[0], u_colors[1], localT);
  } else if (t < u_stops[2]) {
    float localT = (t - u_stops[1]) / (u_stops[2] - u_stops[1]);
    color = mix(u_colors[1], u_colors[2], localT);
  } else {
    float localT = (t - u_stops[2]) / (u_stops[3] - u_stops[2]);
    color = mix(u_colors[2], u_colors[3], localT);
  }

  gl_FragColor = vec4(color, 1.0);
}
```

**JavaScript 调用代码：**

```javascript
// 初始化 WebGL
const canvas = document.getElementById('webgl-canvas');
const gl = canvas.getContext('webgl');

// 编译着色器并创建程序（省略标准代码）
const program = createProgram(gl, vertexShaderSource, fragmentShaderSource);

// 设置渐变参数
const startLoc = gl.getUniformLocation(program, 'u_gradientStart');
const endLoc = gl.getUniformLocation(program, 'u_gradientEnd');
const color1Loc = gl.getUniformLocation(program, 'u_color1');
const color2Loc = gl.getUniformLocation(program, 'u_color2');

gl.uniform2f(startLoc, 0.0, 0.0); // 起点
gl.uniform2f(endLoc, 1.0, 0.0); // 终点（水平渐变）
gl.uniform3f(color1Loc, 1.0, 0.0, 0.0); // 红色
gl.uniform3f(color2Loc, 0.0, 0.0, 1.0); // 蓝色

// 绘制
gl.drawArrays(gl.TRIANGLES, 0, 6);
```

## 径向渐变

径向渐变从中心点向外辐射，颜色沿着半径方向进行过渡。可以创建圆形或椭圆形的渐变效果。

### 基于shader实现

使用片段着色器实现径向渐变可以获得更好的性能和灵活性。

**基础圆形渐变（同心圆）：**

```glsl
// 片段着色器
precision mediump float;

varying vec2 v_position;
uniform vec2 u_center; // 渐变中心
uniform float u_innerRadius; // 内半径
uniform float u_outerRadius; // 外半径
uniform vec3 u_innerColor; // 内圈颜色
uniform vec3 u_outerColor; // 外圈颜色

void main() {
  // 计算当前像素到中心的距离
  float distance = length(v_position - u_center);

  // 计算渐变位置比例
  float t = (distance - u_innerRadius) / (u_outerRadius - u_innerRadius);
  t = clamp(t, 0.0, 1.0);

  // 线性插值颜色
  vec3 color = mix(u_innerColor, u_outerColor, t);

  gl_FragColor = vec4(color, 1.0);
}
```

**椭圆渐变：**

```glsl
precision mediump float;

varying vec2 v_position;
uniform vec2 u_center;
uniform vec2 u_radii; // 椭圆的 x 和 y 半径
uniform vec3 u_innerColor;
uniform vec3 u_outerColor;

void main() {
  // 归一化坐标到椭圆空间
  vec2 normalized = (v_position - u_center) / u_radii;

  // 计算椭圆距离
  float distance = length(normalized);

  // 渐变插值
  float t = clamp(distance, 0.0, 1.0);
  vec3 color = mix(u_innerColor, u_outerColor, t);

  gl_FragColor = vec4(color, 1.0);
}
```

**多色标径向渐变（使用纹理）：**

```glsl
precision mediump float;

varying vec2 v_position;
uniform vec2 u_center;
uniform float u_radius;
uniform sampler2D u_gradientTexture; // 1D 渐变纹理

void main() {
  // 计算距离比例
  float distance = length(v_position - u_center);
  float t = distance / u_radius;
  t = clamp(t, 0.0, 1.0);

  // 从纹理采样颜色
  vec4 color = texture2D(u_gradientTexture, vec2(t, 0.5));

  gl_FragColor = color;
}
```

**偏心径向渐变（两圆）：**

这是最接近 Canvas `createRadialGradient()` 的实现：

```glsl
precision mediump float;

varying vec2 v_position;
uniform vec2 u_start; // 起始圆心
uniform float u_startRadius; // 起始半径
uniform vec2 u_end; // 结束圆心
uniform float u_endRadius; // 结束半径
uniform vec3 u_color1;
uniform vec3 u_color2;

void main() {
  // 计算点到两个圆的关系
  vec2 startVec = v_position - u_start;
  vec2 endVec = v_position - u_end;

  float distToStart = length(startVec);
  float distToEnd = length(endVec);

  // 简化算法：基于到两个圆心距离的加权
  vec2 centerVec = u_end - u_start;
  float centerDist = length(centerVec);

  // 投影到连接两圆心的直线上
  vec2 centerDir = centerDist > 0.0 ? centerVec / centerDist : vec2(1.0, 0.0);
  float projection = dot(v_position - u_start, centerDir);
  float t = projection / centerDist;

  // 考虑半径变化
  float radiusAtT = u_startRadius + (u_endRadius - u_startRadius) * t;
  vec2 pointOnLine = u_start + centerDir * projection;
  float distToLine = length(v_position - pointOnLine);

  // 计算最终的渐变位置
  float gradientT = clamp(distToLine / radiusAtT, 0.0, 1.0);

  // 颜色插值
  vec3 color = mix(u_color1, u_color2, gradientT);

  gl_FragColor = vec4(color, 1.0);
}
```

**高级效果 - 动态径向渐变：**

```glsl
precision mediump float;

varying vec2 v_position;
uniform vec2 u_center;
uniform float u_time; // 时间参数，用于动画
uniform vec3 u_colors[3];

void main() {
  float distance = length(v_position - u_center);

  // 添加动画效果
  float animatedDistance = distance + sin(u_time * 2.0) * 0.1;

  // 创建脉动效果
  float t = fract(animatedDistance * 3.0 - u_time);

  // 多色渐变
  vec3 color;
  if (t < 0.5) {
    color = mix(u_colors[0], u_colors[1], t * 2.0);
  } else {
    color = mix(u_colors[1], u_colors[2], (t - 0.5) * 2.0);
  }

  gl_FragColor = vec4(color, 1.0);
}
```

**JavaScript 使用示例：**

```javascript
const gl = canvas.getContext('webgl');

// 设置 uniform 变量
const centerLoc = gl.getUniformLocation(program, 'u_center');
const innerRadiusLoc = gl.getUniformLocation(program, 'u_innerRadius');
const outerRadiusLoc = gl.getUniformLocation(program, 'u_outerRadius');
const innerColorLoc = gl.getUniformLocation(program, 'u_innerColor');
const outerColorLoc = gl.getUniformLocation(program, 'u_outerColor');

gl.uniform2f(centerLoc, 0.5, 0.5); // 中心点
gl.uniform1f(innerRadiusLoc, 0.1); // 内半径
gl.uniform1f(outerRadiusLoc, 0.5); // 外半径
gl.uniform3f(innerColorLoc, 1.0, 1.0, 1.0); // 白色
gl.uniform3f(outerColorLoc, 1.0, 0.0, 0.0); // 红色

// 渲染
gl.drawArrays(gl.TRIANGLES, 0, 6);

// 动画循环
function animate(time) {
  gl.uniform1f(gl.getUniformLocation(program, 'u_time'), time * 0.001);
  gl.drawArrays(gl.TRIANGLES, 0, 6);
  requestAnimationFrame(animate);
}

requestAnimationFrame(animate);
```

## 总结

**Canvas vs Shader 对比：**

| 特性       | Canvas API     | WebGL Shader            |
| ---------- | -------------- | ----------------------- |
| **易用性** | 简单，API 直观 | 复杂，需要理解 GPU 编程 |
| **性能**   | 适合中小型渲染 | 高性能，适合大量像素    |
| **灵活性** | 功能固定       | 完全可定制              |
| **动画**   | 需要重绘       | 可通过 uniform 实时更新 |
| **兼容性** | 广泛支持       | 需要 WebGL 支持         |

**最佳实践：**

1. **简单场景**：使用 Canvas API，代码简洁易维护
2. **高性能需求**：使用 Shader，特别是大面积渐变或实时动画
3. **复杂效果**：Shader 提供更多控制，可实现各种自定义渐变
4. **优化技巧**：使用纹理存储色标数据，避免在着色器中使用过多条件判断
