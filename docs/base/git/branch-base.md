# 分支基础操作

切记：在进行分支操作之前都必须保持分支上的代码是最新的，意味着每次操作分支之前都必须pull一次

## 新增分支

```shell
# 假设从master分支切出一个新分支：feature/add-branch

# 首先切到mater分支
git checkout master
# 拉取master分支最新代码
git pull
# 切出新分支
git checkout -b feature/branch
# 将本地分支与远程分支关联
git push --set-upstream origin feature/branch
```

![img.png](/imgs/base/git-checkout-b.png)

## 删除分支

```shell
# 假设删除分支：feature/add-branch

# 首先切到另外一个分支master
git checkout master
# 删除本地分支
git branch -d feature/add-branch
# 删除远程分支
git push --delete origin feature/add-branch
```

## 更改分支名称

```shell
# 假设重命名分支：feature/add-branch -> feature/rename-branch

# 首先重命名本地分支
git branch -m feature/add-branch feature/rename-branch
# 删除远程分支
git push --delete origin feature/add-branch
# 推送最新本地分支到远程
git push origin feature/rename-branch
# 将本地分支与远程分支关联
git push --set-upstream origin feature/rename-branch
```

## 查看分支

```shell
# 查看所有远程分支
git branch -v
# 查看所有本地分支
git branch
```

## 合并分支

```shell
# 在协同开发同一版本需求时，开发者A开发功能A，在开发完功能之后需要合并到同一分支
# 开发者A 在分支：feature 上开发

# 切换到需要合并的分支并保持代码最新
git chekcout feature
# 拉取最新代码
git pull
# 切换到最终分支
git checkout master
# 拉取最新代码
git pull
# 合并分支feature
git merge feature
# 解决冲突之后提交
git push
```

![img.png](/imgs/base/merge-animation.gif)
