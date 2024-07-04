const test = function(arr1, x) {
  let i;

  for (i = 0; i < arr1.length; i++) {
    if (arr1[i] === x) {
      if (arr1[i] === arr1[i + 1]) break;

      let tmp = arr1[i];
      arr1[i] = arr1[i + 1];
      arr1[i + 1] = tmp;
      break;
    }
  }
};
