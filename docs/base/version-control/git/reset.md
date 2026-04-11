# 撤销与回退

这一章只解决一个问题：改错了，怎么退。

难点其实不在命令本身，而在于先判断“错误发生在哪一层”。你得先分清楚：改动还在工作区，已经进了暂存区，已经 commit 了，还是已经 push 给别人了。

## 先做选择，不要先背命令

- 还在工作区：优先用 `git restore`
- 已经 `add` 到暂存区：用 `git restore --staged`
- 已经 `commit`，但还没 `push`：多半是 `git reset`
- 已经 `push` 到远程：优先 `git revert`

## 场景 1：我改了文件，但还没 add，想直接撤掉

```shell
git restore src/login.ts
git restore .
```

第一条是撤销指定文件，第二条是撤销整个工作区改动。

如果你还在用老命令，对应的是：

```shell
git checkout -- src/login.ts
git checkout -- .
```

## 场景 2：我已经 add 了，但现在不想提交这些文件

```shell
git restore --staged src/login.ts
git restore --staged .
```

这一步只是把文件从暂存区拿回工作区，不会丢你的改动内容。

## 场景 3：刚提交完，发现提交信息写错了，或者漏加了文件

```shell
git add src/login.ts
git commit --amend
```

这个命令会修改最后一次提交。它适合处理刚刚发生的小问题，不适合拿来改很久之前的历史。

## 场景 4：最后一次 commit 不想要了，但代码改动还想留着

```shell
git reset --mixed HEAD^
```

执行完之后：

- commit 没了
- 改动还在工作区
- 暂存区会被清掉

这很适合“我刚才那个提交太大了，想拆成两个更小的 commit”。

## 场景 5：最后一次 commit 不想要了，但改动我还想放在暂存区

```shell
git reset --soft HEAD^
```

这个比 `--mixed` 更轻一点。提交会回退，但改动仍然保留在暂存区，适合立即重新提交。

## 场景 6：最后一次 commit 和代码改动我都不要了

```shell
git reset --hard HEAD^
```

这是最猛的一种。它会同时改本地历史、暂存区和工作区。

:::warning
`git reset --hard` 下手前一定确认。真删过头了，后面通常要靠 [reflog](/base/version-control/git/reflog) 捞。
:::

## 场景 7：已经推到远程了，我想撤销某个提交

已经推到远程的历史，默认不要直接改写，优先用 `revert` 生成一个“反向提交”。

```shell
git revert <commit-id>
git push
```

这样做好处很简单：历史是公开透明的，团队里其他人不用陪你一起重写历史。

## 场景 8：要撤销的是一个 merge commit

```shell
git revert -m 1 <merge-commit-id>
git push
```

这里的 `-m 1` 可以理解成“保留当前主线，撤回另一个分支带来的变更”。

如果你不知道 `1` 和 `2` 该怎么选，先别急着执行，先确认这个 merge 当时到底是“谁合到谁”。

## `reset` 和 `revert` 怎么选

- 只在本地，还没推送：`reset` 更直接
- 已经推送到远程：`revert` 更稳妥
- 不确定有没有人已经基于这段历史继续开发：不要改历史，优先 `revert`

## 常见坑

- 把 `reset` 和 `revert` 当成同一个东西，用起来很容易翻车
- `commit --amend` 也会改提交 ID，已经 push 之后要谨慎
- `reset --hard` 不是不能用，而是要知道自己删的是“本地历史”还是“公共历史”
