# 代码撤销

## 工作区


### 删除所有变更

```shell
git checkout .
```

### 删除指定变更

```shell
# path 为指定文件的相对目录
git checkout [path]
```

## 暂存区



### 删除所有变更

### 删除指定变更

:::tip
提交代码到暂存区后，如果

1. 还有部分代码没有提交
2. comment中信息错误

则可以通过`git comment --amend`修改提交信息，而且会将上次提交记录覆盖，不再生成新节点
:::

## revert 撤销指定的版本

```shell
revert 普通提交
git revert logId
revert merge操作：必须要带-m参数，告诉git保留哪个分支的修改 1-保存当前分支的修改 2-保留其他分支的修改
git revert mergeLogId -m 1

git commit -m ""
git push
```
