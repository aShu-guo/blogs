const geval = eval;
let x = 'global',
  y = 'global';

function f() {
  let x = 'local';
  eval('x += "changed"');
  return x;
}

function g() {
  let y = 'local';
  // eval('x += "changed"');
  geval('y += "changed"');
  return y;
}

console.log(f(), x);
console.log(g(), y);
