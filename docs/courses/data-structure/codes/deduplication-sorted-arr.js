/**
 * @desc 26. 删除有序数组中的重复项
 * @param {number[]} nums
 * @return {number}
 * case:
 * [1,1,2] => [1,2]
 * [0,0,1,1,1,2,2,3,3,4] => [0,1,2,3,4]
 */
var removeDuplicates = function(nums) {
  let p = 0;
  let q = 1;
  while (q < nums.length) {
    if (nums[q] !== nums[p]) {
      console.log('before:',JSON.stringify(nums));

      nums[p + 1] = nums[q];
      console.log('after:',JSON.stringify(nums));

      p++;
    }

    q++;
  }
  return p + 1;
};

const arr=[0, 0, 1, 1, 1, 2, 2, 3, 3, 4]
removeDuplicates(arr);
console.log(arr);
