# 只摘某几个提交：git cherry-pick

`cherry-pick` 适合处理这样一种场景：我不要整个分支，我只要其中某一个，或者某几个提交。

它很像“从别的分支上摘一颗已经成熟的果子过来”，而不是把整棵树搬过来。

## 什么时候用

- 某个 hotfix 已经在一个分支修好了，我想顺手带回另一个分支
- 另一个分支里只有一两个提交对我有用，不值得整分支合并
- 线上补丁需要快速同步到开发分支

## 场景 1：把某个修复从 hotfix 分支带回 develop

先找到那个提交的 commit id，然后在目标分支执行：

```shell
git switch develop
git cherry-pick <commit-id>
```

执行完成之后，这个提交的内容会以一个新的 commit 形式出现在 `develop` 上。

## 场景 2：连续几个提交一起摘过来

```shell
git cherry-pick <start-commit>^..<end-commit>
```

这个写法适合“这几次提交是一组，前后都有关联”的情况。

## 场景 3：希望保留原始来源信息

```shell
git cherry-pick -x <commit-id>
```

`-x` 会在新的提交说明里附带一行来源信息。跨分支同步 bugfix 时，这个参数很有用，后面查历史会轻松很多。

## 如果 cherry-pick 过程中冲突了

处理方式和 rebase 很像：

```shell
git status
git add .
git cherry-pick --continue
```

如果你发现自己挑错了提交：

```shell
git cherry-pick --abort
```

## 常见坑

- 只摘了表面那个提交，但它依赖的前置提交没带过来，最后代码不完整
- 同一个提交被重复 cherry-pick 到同一条线，历史会变得很难看
- `cherry-pick` 适合补丁式同步，不适合拿来代替正常的分支合并流程
