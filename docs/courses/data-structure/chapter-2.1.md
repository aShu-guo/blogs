# 双指针算法

指的是在遍历元素的过程中，不是使用单个指针进行访问，而是使用两个指针进行访问。两个指针可以在循环中做`两件事`
，可以将慢指针想象为一个空白容器

用例：

1. 一个长度为n的顺序表，删除其中所有值为value的元素
2. 对于长度为n的顺序表，去重

### 对撞指针

两个指针方向相反

### 快慢指针

两个指针方向相同，快指针定义为fast，慢指针定义为slow，通常情况下fast默认为1，slow默认为0

fast指针走的比slow指针快，而且只有在满足指定条件下时，才会自增slow

使用场景：对有序数组去重

#### 案例

1. [对非严格有序数组进行去重](https://leetcode.cn/problems/remove-duplicates-from-sorted-array/solutions/728105/shan-chu-pai-xu-shu-zu-zhong-de-zhong-fu-tudo/)
2. 对长度为n的顺序表L，编写一个时间复杂度为 O(n)、空间复杂度为 O(1)的算法，该算法删除顺序表中所有值为x的数据元素。
3. 从顺序表中删除其值在给定值s和t之间（包含s和t，要求`s < t`）的所有元素，若s或t不合理或顺序表为空，则显示出错信息并退出运行。
4. 有序顺序表去重
5. 多个有序顺序表合并

```js
const merge = function(arr1, arr2, arr3) {
  let k = 0, i = 0, j = 0;
  while (i < arr1.length && j < arr2.length) {
    if (arr1[i] < arr2[j]) {
      arr3[k++] = arr1[i++];
    } else {
      arr3[k++] = arr2[j++];
    }
  }


  while (i < arr1.length) {
    arr3[k++] = arr1[i++];
  }
  while (j < arr2.length) {
    arr3[k++] = arr2[j++];
  }
  return arr3
};
```

### 分离双指针

如果两个指针分别属于不同的数组 / 链表

## 拓展

1. 什么是非严格递增序列和严格递增序列？

最重要的区别：两者中是否有重复的数据

- 非严格递增序列：指的就是整个序列是从小到大的，但是里边会有一些数字会在它本身周围有重复。

如->（1，1，1，2，3，4，5，6，6，6，7，8，9）

- 严格递增序列：就是数字没有重复，且是递增的。

如->（1，2，3，4，5，6，7，8，9）