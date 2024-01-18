const stats = (function () {
  const sum = (x, y) => x + y;

  function mean(data) {
    return data.reduce(sum) / data.length;
  }
  return { mean };
})();

console.log(stats.mean([1, 3, 5, 7, 9]));
