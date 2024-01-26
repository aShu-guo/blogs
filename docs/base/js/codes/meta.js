let a = {};
Object.create(a, {
  name: {
    value: 'hello world',
    writable: true,
    /*get() {
      return this.name;
    },*/
  },
});

console.log(a.name);
