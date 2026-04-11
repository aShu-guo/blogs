# 合并与挑版本：svn merge

SVN 里真正需要一点经验的命令，`merge` 绝对算一个。

因为它不像 `update` 那样只是同步最新代码，它是在当前工作副本里，把另一条线的改动折进来。

## 什么时候用

- 功能分支开发到一半，想先把主干最新改动并进来
- 功能做完了，要把分支合回主干
- 某个修订号必须单独带进发布分支

## 我先说一个最重要的前提

**你站在哪个工作副本里执行 `merge`，改动就会合到哪里。**

所以做 `merge` 之前，我通常一定会先看：

```shell
svn info
svn status
svn update
```

至少要确认：

- 我现在到底在 `trunk` 还是某个 `branch`
- 工作副本是不是干净
- 基线是不是最新

## 场景 1：把主干最新改动同步到功能分支

先切到功能分支工作副本：

```shell
svn switch ^/branches/feature-order
svn update
```

然后在这个分支里合主干：

```shell
svn merge ^/trunk
```

看一眼现场：

```shell
svn status
svn diff
```

确认无误后再提交：

```shell
svn commit -m "merge trunk into feature-order"
```

这个动作的本质不是“功能已经完成”，而是“让功能分支别离主干太远”。

## 场景 2：把功能分支合回主干

先站到主干工作副本里：

```shell
svn switch ^/trunk
svn update
```

再把功能分支的改动折回来：

```shell
svn merge ^/branches/feature-order
```

确认结果后提交：

```shell
svn status
svn diff
svn commit -m "merge feature-order into trunk"
```

这里千万别反过来。很多合并事故不是 SVN 有多复杂，而是人站错了目录。

## 场景 3：我只想带一个修订号，不想整条分支一起进来

这时可以按修订号挑：

```shell
svn merge -c 128 ^/trunk
```

或者从某个分支挑：

```shell
svn merge -c 220 ^/branches/hotfix-1.2.1
```

这类用法很像“挑改动”，常见于：

- 发布分支只需要某个 bugfix
- 某个回归修复已经在主干上验证过，但不想整批功能一起带过去

## 关于 mergeinfo，我的建议是别随便碰

现代 SVN 会用 `svn:mergeinfo` 记录哪些修订号已经合过。

这能帮它减少重复合并，但也意味着：

- 你看到属性变化时别条件反射地删掉
- 合并后最好真的检查一下属性和内容都正常

如果团队里有人习惯“属性改动一律无视”，合并历史很容易被搞乱。

## 常见坑

- 在错误的工作副本里做 `merge`
- 还没 `update` 就开始合，冲突量会被放大
- 合完不看 `status` 和 `diff`，直接 `commit`
- 把“同步主干到分支”和“把分支合回主干”这两个方向搞反
- 看到网上还在写 `--reintegrate` 就照抄。老资料很多，先看你团队的 SVN 版本和当前约定
