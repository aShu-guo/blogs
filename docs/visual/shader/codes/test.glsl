void circle(vec2 pt, vec2 center, float radius) {
  //  color.r=1.0-step(pow(radius,2.0)-pow(v_position.y,2.0),pow(v_position.x,2.0));
  //  color.g=1.0-step(pow(radius,2.0)-pow(v_position.x,2.0),pow(v_position.y,2.0));
  vec2 p = pt - center;
  float inCircle = 1.0 - step(0.5, length(p));
}

void main() {
  vec3 color = vec3((sin(u_time) + 1) / 2, 0.0, (cos(u_time) + 1) / 2);

  gl_FragColor = vec4(color, 1.0);
}
