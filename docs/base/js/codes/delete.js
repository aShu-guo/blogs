'use strict';
const o = { x: 1, y: 2 };

Object.defineProperty(o, 'z', {
  configurable: false,
  value: 3,
});

console.log(o.z);

console.log(delete o.z);
