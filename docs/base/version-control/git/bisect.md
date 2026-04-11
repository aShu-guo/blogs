# 哪个提交把 bug 引进来的：git bisect

`git bisect` 很像二分查找，只不过它查的不是数组，而是提交历史。

当你知道“现在这个版本有问题”，也知道“过去某个版本是正常的”，但中间到底是哪次提交把 bug 带进来的不确定时，`bisect` 非常有用。

## 什么时候用

- 一个 bug 是最近某段时间才出现的
- 你能找到一个“肯定正常”的旧提交
- 当前问题能稳定复现，至少可以判断“好”还是“坏”

如果 bug 本身不稳定，或者强依赖外部环境，`bisect` 的效果会差很多。

## 它在做什么

你先告诉 Git：

- 现在这个提交是坏的
- 过去某个提交是好的

然后 Git 会在中间挑一个提交让你验证。你每次只需要回答“好”还是“坏”，它就会不断把范围折半，直到把可疑提交缩到最小。

## 场景 1：手动排查是哪次提交引入了 bug

先开始：

```shell
git bisect start
git bisect bad
git bisect good <good-commit-id>
```

这里的 `bad` 默认就是当前 `HEAD`。

之后 Git 会自动切到中间某个提交。你在这个提交上手动验证问题：

- 如果问题存在，执行 `git bisect bad`
- 如果问题不存在，执行 `git bisect good`

不断重复，直到 Git 给出结果。

排查完一定记得恢复现场：

```shell
git bisect reset
```

## 场景 2：这个 bug 可以用自动化命令判断

如果你有一个明确的测试命令能稳定判断结果，效率会更高：

```shell
git bisect start
git bisect bad
git bisect good <good-commit-id>
git bisect run <test-command>
```

例如：

```shell
git bisect run pnpm test
```

这里有个约定：

- 命令退出码为 `0`，Git 会认为这个提交是好的
- 非 `0`，会认为这个提交是坏的

如果你的脚本里某些提交根本无法判断，可以用退出码 `125` 表示跳过。

## 场景 3：我只知道一个大概时间范围，不知道 good commit 是谁

这时候先别急着 `bisect`。先用下面几条命令缩小范围：

```shell
git log --oneline
git log --since="2 weeks ago"
```

先尽量找出一个你能确认“还没出问题”的版本节点，再开始 `bisect`，效率会高很多。

## 我什么时候会优先考虑 bisect

- 提交很多，靠肉眼看 diff 已经不现实
- 问题很隐蔽，看代码一时看不出来
- 回归 bug 已经出现，但没人记得是从哪次开始的

这种场景下，`bisect` 比“猜一提交试一提交”稳得多。

## 常见坑

- bug 不能稳定复现，结果会把 `bisect` 带偏
- 没有先找一个靠谱的 good commit，排查范围会很大
- 排查完忘了 `git bisect reset`，工作区会停在历史提交上
- 自动化命令本身不稳定，最后找出来的“坏提交”也不可信

:::warning
`git bisect` 不是用来证明“这次提交写得烂”，它只是帮你确认“问题第一次出现在哪里”。找到提交之后，仍然要回到代码和上下文里分析根因。
:::
