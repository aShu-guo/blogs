# 分支基础操作

日常开发里，分支操作其实就三件事：从对的基线切出来、在对的分支上开发、用完及时合并和清理。

## 场景 1：从主干切一个新功能分支

切分支之前，先确认主干是最新的。

```shell
git switch main
git pull --ff-only
git switch -c feature/login-form
```

如果你还在用老命令，上面三步对应的就是：

```shell
git checkout main
git pull
git checkout -b feature/login-form
```

第一次把这个分支推到远程：

```shell
git push -u origin feature/login-form
```

![img.png](/imgs/base/git-checkout-b.png)

## 场景 2：查看本地分支和远程跟踪关系

```shell
git branch
git branch -v
```

我更常用 `git branch -v`，因为它除了能看本地分支，还能看到每个分支当前跟踪的是哪个远程分支，以及和远程相比是领先还是落后。

## 场景 3：需求做完了，把功能分支合回主干

最朴素的做法是：

```shell
git switch main
git pull --ff-only
git merge feature/login-form
git push
```

如果团队通过 PR 合并，这一步通常是在平台上点按钮完成；本地更常见的动作是先把功能分支同步好，再发起合并。

:::info
如果你想在合并前整理提交历史，不要直接在这里硬合，先看 [rebase](/base/version-control/git/rebase)。
:::

## 场景 4：分支名起错了，直接改

### 只改本地分支名

```shell
git branch -m feature/logn-form feature/login-form
```

### 本地和远程一起改

```shell
git branch -m feature/logn-form feature/login-form
git push origin --delete feature/logn-form
git push -u origin feature/login-form
```

## 场景 5：功能已经合完，删除旧分支

```shell
git switch main
git branch -d feature/login-form
git push origin --delete feature/login-form
```

如果 Git 提示本地分支还没被合并，说明它认为这条分支上的提交还有丢失风险。这个时候先别急着 `-D`，先看看到底是不是你还需要的历史。

## 常见坑

- 从过期的 `main` 上切分支，后面补同步会增加无意义冲突
- 工作区有未提交改动时直接切分支，容易把现场带脏
- 分支已经合并了，但本地和远程都不清理，时间久了会越来越难找

![img.png](/imgs/base/merge-animation.gif)
