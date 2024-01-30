let map = new Map();

let proxy = new Proxy(map, {
  get(target, p, receiver) {
    let value = Reflect.get(...arguments);
    return typeof value === 'function' ? value.bind(target) : value;
  },
});

proxy.set('test', 1);
