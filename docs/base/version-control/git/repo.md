# 仓库相关操作

## 仓库结构

git仓库分为4个部分：工作区 -> 暂存区 -> 本地仓库 -> 远程仓库

![img.png](/imgs/base/respo-flow.png)

## 基础操作

### 变动代码提交

工作区可以理解为IDE开发环境，在IDE中变更代码

```shell
# 将变动代码提交到暂存区
git add .
# 将变动代码提交到本地仓库
git commit -m "feat:提交测试"
# 拉取最新代码
git pull
# 如果有冲突，则解决冲突，解决完之后提交代码到远程仓库
git push origin feature
# 可选的简写：前提是远程分支对应的是origin
git push
```

![img.png](/imgs/base/git-commit.gif)

重复执行上述代码，将本地仓库中的变更提交到远程仓库，远程仓库中`feature`分支新增节点并前进。

### 丢弃代码

```shell
# 改动了工作区的文件，但是希望丢弃掉

# 丢弃工作区指定文件的代码
git checkout file_path
# 丢弃所有工作区的代码
git checkout .

# 已经提交到暂存区的文件希望回退变动文件到工作区中

# 回退暂存区指定文件的代码到工作区
git reset file_path
# 回退所有暂存区的代码
git reset .

# 已经提交到本地仓库的改动希望丢弃代码

# 回滚代码到上一个版本
git reset --head HEAD^
# 回滚代码到n个版本
git reset --head HEAD~n

# 已经提交到远程仓库的改动希望丢弃代码

# 首先查看logId
git log
# 回退本地仓库到指定logId
git reset --hard logId
# 强推到远程仓库
git push --force origin HEAD
```

![img.png](/imgs/base/git-reset.gif)

### 代码暂存

```shell
# 在开发需求时，需要修改其他分支的bug时，可以先暂存工作区的改动

# 暂存当前工作区代码
git stash
# 改完bug之后再恢复工作区改动代码
git stash pop
```

> 删除分支

```shell
首先切到其他分支，并删除本地分支：git branch -d 分支名

删除远程分支：git push origin --delete 分支名
```

### 回滚

```shell
查看日志，获取需要回滚的logid

git rebase -i logid

将commit中需要删除的“pick”修改为“drop”，然后保存
```

### 回滚到上一提交

```shell
git reset --hard HEAD^

git push origin HEAD --force
```

### 暂存

```shell
git stash

git stash list

git stash pop = git stash apply + git stash drop
```

### 合并时出现偏离

```shell
git fetch

git merge FETCH_HEAD
```

### 添加子模块

```shell
git submodule add <url> <path>
```

### 子模块

```shell
1.先更新子模块，更新之后切到主项目再次提交更新子模块
git submodule foreach git checkout release-test/v1.0.0
git submodule foreach git pull
2.在每个主项目中，即使每个子模块的分支相同，在其他主项目更新完子模块也不会影响其他主项目中的子模块，仍然需要做操作'1'
```

### 更新.gitignore

```shell
git rm -r --cached .
git add .
git commit
```

### 新建git仓库 上传文件

```shell
cd existing_folder
git init
git remote add origin git@gitlab.com:zxpo/test.git
git add .
git commit
git push -u origin master
```

### 找回git stash丢弃的改动

```shell
git fsck --lost-found（只关注commit的logid）
git show commitLogId
git merge commitLogId
```

### 设置alias

```shell
git config --global alias.ck checkout
```

### 设置remote

```shell
git remote add origin https://github.com/GuoChengLi-A/uview-input-bug.git
```


tag

```shell
git tag -a v1.2
git tag v1.2 -d
git push origin v1.2
```
