// 片段着色器（Fragment Shader）
precision mediump float;

varying vec2 v_position;
uniform vec2 u_gradientStart; // 渐变起点
uniform vec2 u_gradientEnd; // 渐变终点
uniform vec3 u_color1; // 起始颜色
uniform vec3 u_color2; // 结束颜色

void main() {
  // 计算渐变方向向量
  vec2 gradientVec = u_gradientEnd - u_gradientStart;
  float gradientLength = length(gradientVec);
  vec2 gradientDir = normalize(gradientVec);

  // 计算当前像素相对于起点的向量
  vec2 pixelVec = v_position - u_gradientStart;

  // 计算投影：当前像素在渐变线上的位置比例
  float t = dot(pixelVec, gradientDir) / gradientLength;

  // 限制在 [0, 1] 范围内
  t = clamp(t, 0.0, 1.0);

  // 线性插值计算颜色
  vec3 color = mix(u_color1, u_color2, t);

  gl_FragColor = vec4(color, 1.0);
}
