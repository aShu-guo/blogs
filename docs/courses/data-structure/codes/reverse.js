/**
 * 逆置算法：要求时间复杂度为O(1)
 */
const reverseList = (arr) => {
  for (let i = 0; i < arr.length / 2; i++) {
    arr[i] = arr[arr.length - i - 1];
  }
};

const arr = [1, 2, 3, 4];
reverseList(arr);
console.log(arr);



