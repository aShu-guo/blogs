let map = new Map();

let proxy = new Proxy(map, {
  get(target, p, receiver) {
    let value = Reflect.get(...arguments);
    // console.log('>>>>value:', value === target.get);
    // console.log('>>>>value:', value === map.get);

    return typeof value === 'function' ? value.bind(target) : value;
  },
});

proxy.set('test', 1); // Error
