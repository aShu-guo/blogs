# 分支协作进阶

基础分支操作不难，真正麻烦的是协作过程里的“分支关系乱了”。这类问题通常不是命令不会写，而是没想清楚当前分支和远程、和主干、和其他分支分别是什么关系。

## 场景 1：我要接手一个远程已经存在的分支

比如同事推了一个 `feature/order-refactor`，你要继续在他后面改。

```shell
git fetch origin
git switch --track origin/feature/order-refactor
```

如果本地已经有同名分支，就不用再 `--track`，直接切过去即可。

## 场景 2：本地分支跟踪错了远程分支

这种事不常见，但一旦配错，`pull` 和 `push` 都会很别扭。

```shell
git branch -u origin/feature/order-refactor
```

先用 `git branch -v` 看清楚当前分支到底在跟踪谁，再改。

## 场景 3：想看自己的分支到底比主干多了什么

在合并前，我很少直接凭感觉看代码，而是会先看一眼分支差异。

```shell
git fetch origin
git log --oneline --left-right origin/main...HEAD
git diff origin/main...HEAD
```

这两条命令足够回答两个问题：

- 我这个分支独有的提交有哪些
- 相比主干，实际代码差异是什么

## 场景 4：远程分支已经合并，本地想顺手清理

```shell
git fetch --prune
git branch --merged
```

`git fetch --prune` 很有用，它会顺手把那些远程已经删除的引用清理掉。不然时间久了，远程分支列表会越来越脏。

确认没问题之后，再删本地旧分支：

```shell
git branch -d feature/order-refactor
```

## 场景 5：`git pull` 提示本地和远程已经分叉

这时先别急着重复 `pull`。它通常说明两边都各自前进了。

你可以先看状态：

```shell
git status
git branch -v
```

然后按团队习惯处理：

- 如果团队是 merge 流程，可以 `git pull --no-rebase`
- 如果团队偏线性历史，可以 `git pull --rebase`

如果你已经知道自己要手动整理提交历史，就直接看 [rebase](/base/version-control/git/rebase) 那一章，不要在这里硬拧。

## 常见坑

- `git pull` 的默认行为团队里不统一，时间久了容易每个人历史都长得不一样
- 很多人只会 `branch`，不会 `branch -vv`，结果跟踪关系出问题还没发现
- 远程分支删了，本地引用不清理，过一阵子你自己都认不出来哪个还在用
