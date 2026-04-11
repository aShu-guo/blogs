# Git 现场速查

这一页不讲完整原理，只解决一个问题：现在遇到的情况，下一步该敲什么。

如果你已经知道自己要查哪类操作，直接跳对应章节更合适；如果你现在脑子里只有一句“现场有点乱”，先看这页会更快。

## 场景 1：我正在开发，但突然要先去处理别的事

- 改动还没整理好，也不想 commit：看 [git stash](/base/version-control/git/stash)
- 改动其实已经成型，只是还没推送：直接 commit，比 stash 更稳
- 临时切出去修 bug，回来还要接着写：优先 `stash`

最常见的一组命令：

```shell
git stash push -m "wip: current task"
git switch hotfix/xxx
# 修完回来
git switch feature/xxx
git stash pop
```

## 场景 2：我想撤销改动，但还没想清楚该用哪个命令

先别急着敲，先问自己这次改动现在停在哪一层：

- 还在工作区：`git restore`
- 已经进暂存区：`git restore --staged`
- 已经 commit，但还没 push：优先考虑 `git reset`
- 已经 push 到远程：优先考虑 `git revert`

如果你已经手滑用猛了，比如 `reset --hard` 之后后悔，直接去看 [git reflog](/base/version-control/git/reflog)。

## 场景 3：主干更新了，我的功能分支要跟上

先判断这条分支是不是你一个人在用：

- 只有你自己在开发：优先 `rebase`
- 多人共用，或者已经是公共协作分支：优先 `merge`

对应章节：

- 操作细节看 [git rebase](/base/version-control/git/rebase)
- 选择逻辑看 [merge vs rebase](/base/version-control/git/merge-rebase)

## 场景 4：我不是要整条分支，只想拿其中某一个提交

这种情况通常不是 `merge`，而是 [git cherry-pick](/base/version-control/git/cherry-pick)。

典型例子：

- hotfix 分支上的一个修复，要补回 develop
- 同事分支里某个提交正好能复用，但没必要把整条线并过来

## 场景 5：我觉得历史有点乱，想整理提交

先分两种：

- 只是想把自己的几次小提交合并、改名、删除：`git rebase -i`
- 想把已经公开给团队的历史重写一遍：先停一下，通常不建议

这类问题优先看 [git rebase](/base/version-control/git/rebase)。

## 场景 6：我把现场弄乱了，但感觉还有救

先看这三个命令，不要继续乱试：

```shell
git status
git log --oneline --decorate -10
git reflog
```

这三条命令分别回答三个问题：

- 现在工作区和暂存区是什么状态
- 最近正式提交历史长什么样
- 分支指针最近到底动过什么

很多“感觉代码丢了”的情况，最后都能在 `reflog` 里找回来。

## 场景 7：我不知道是哪个提交引入了 bug

如果你能找到一个“现在有问题”和一个“过去正常”的版本点，直接上 [git bisect](/base/version-control/git/bisect)。

不要一条条猜，也不要纯靠肉眼翻 diff。提交一多，二分查找会比手工排查快得多。

## 场景 8：我要发版本

- 需要给当前节点一个稳定版本名：看 [git tag](/base/version-control/git/tag)
- 需要确认当前分支是不是已经整理干净：先看 [git rebase](/base/version-control/git/rebase)

## 一份最短决策表

- 临时收现场：`stash`
- 撤销未推送历史：`reset`
- 撤销已推送历史：`revert`
- 找回误删现场：`reflog`
- 搬单个提交：`cherry-pick`
- 整理个人历史：`rebase`
- 保留真实合并关系：`merge`
- 定位引入 bug 的提交：`bisect`
- 给发布节点命名：`tag`

## 最后一句经验

大多数 Git 事故都不是因为命令太难，而是因为还没判断清楚“这段历史是不是已经公开给别人了”。

只要这个判断做对了，后面的命令选择通常不会太离谱。
