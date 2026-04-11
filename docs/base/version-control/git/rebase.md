# 整理历史与更新基线：git rebase

如果只记一句人话：`rebase` 做的事，不是“把两个分支合起来”，而是“把当前分支独有的提交摘下来，重新接到另一个基点后面”。

## 我怎么理解 rebase

假设现在分支关系是这样：

```text
A---B---C main
     \
      D---E feature
```

这时在 `feature` 上执行：

```shell
git rebase main
```

结果通常会变成：

```text
A---B---C main
         \
          D'---E' feature
```

`D`、`E` 这两个提交看起来还在，但实际上已经变成新的提交了，所以 commit id 会变化。

## 什么时候用

- 主干更新了，我想让功能分支基于最新主干继续开发
- 合并前，我想把一串零碎提交整理干净
- 一个功能分支本来基于另一个分支开发，现在想改挂到主干上

## 场景 1：主干更新了，我要把自己的分支跟上

这是最常见的 rebase 用法。

```shell
git fetch origin
git switch feature/login-form
git rebase origin/main
```

如果过程中出现冲突：

```shell
git status
git add .
git rebase --continue
```

如果你发现冲突太多，或者方向不对，直接撤回：

```shell
git rebase --abort
```

如果这个分支之前已经推到远程了，rebase 之后要更新远程分支：

```shell
git push --force-with-lease
```

我会特别强调 `--force-with-lease`，因为它比裸 `--force` 更稳一点，至少会帮你挡住一部分“把别人刚推上来的内容覆盖掉”的事故。

## 场景 2：合并前整理提交历史

很多时候功能本身没问题，但提交历史很碎，比如：

- `fix: 修一点样式`
- `fix: 再修一点样式`
- `fix: 真正修好样式`

这种历史如果直接合进去，后面排查问题会很吵。比较常见的做法是：

```shell
git rebase -i HEAD~4
```

交互式界面里最常用的几个动作：

- `pick`：保留这个提交
- `reword`：保留提交，但修改提交说明
- `squash`：把当前提交合并到前一个提交，并一起编辑说明
- `fixup`：把当前提交合并到前一个提交，但丢掉当前说明
- `drop`：删除这个提交

我自己最常用的是 `reword`、`squash` 和 `fixup`，已经够覆盖大多数整理历史的场景。

## 场景 3：`feature/b` 是从 `feature/a` 切出来的，现在 `b` 想先上主干

这类场景直接 merge 往往会把 `feature/a` 的历史一起带过去，不够干净。更适合用 `--onto`。

```text
o---o---o---o main
     \
      o---o---o---o feature/a
                  \
                   o---o feature/b
```

```shell
git rebase --onto main feature/a feature/b
```

执行完之后，`feature/b` 会改成直接基于 `main`。

这个命令第一次看会有点绕，但它解决的是一个很实际的问题：我只想搬走 `b` 自己的提交，不想连 `a` 的半成品一起带上。

## 我一般不建议 rebase 的情况

- 这个分支已经是公共分支，其他人也在基于它继续开发
- 你只是想把两个分支的代码合起来，但并不在意提交历史是否线性
- 当前冲突已经很多，继续 rebase 只会让现场更难收拾

## 常见坑

- rebase 会改提交 id，所以它本质上是在重写历史
- 解决完冲突之后，不是直接 `commit`，而是 `git rebase --continue`
- rebase 过程中不要再 `pull`
- 已经推送过的分支 rebase 之后，要意识到远程也需要强制更新

![img.png](/imgs/base/git-rebase.gif)
