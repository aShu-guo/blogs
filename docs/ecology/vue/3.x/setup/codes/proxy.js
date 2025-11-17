// 测试Object.assign是否会触发源对象的handler
const obj = { class: '123', style: '123' };

const p = new Proxy(obj, {
  get(target, p, receiver) {
    console.log('trigger get handler');
    return target[p];
  },
});

console.log('触发了get', p.class);
console.log('----');

const cloned = Object.assign({}, p);

console.log('Object.assign后是否还会触发handler', cloned.class);
