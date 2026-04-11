# 临时把现场收起来：git stash

开发里最常见的情况不是“我不会提交”，而是“我现在不能提交，但又必须先切出去处理别的事”。`git stash` 就是为这个场景准备的。

## 什么时候用

- 需求做到一半，突然要切去修一个紧急 bug
- 当前改动还不想 commit，但工作区必须先清干净
- 准备 `pull` 或 `rebase`，结果 Git 提示工作区不干净

如果你本来就应该把这次改动提交掉，那就不要为了用 `stash` 而 `stash`。它是临时收纳，不是长期仓库。

## 我最常用的几条命令

```shell
git stash push -m "wip: login form"
git stash list
git stash show -p stash@{0}
git stash apply stash@{0}
git stash pop
git stash drop stash@{0}
```

我更推荐 `git stash push -m "..."`，至少回头看 `stash list` 时还能知道当时藏的是什么。

## 场景 1：需求做到一半，临时去修线上 bug

```shell
git stash push -m "wip: login form"
git switch hotfix/login-error
# 修 bug、提交、推送
git switch feature/login-form
git stash pop
```

`pop` 的意思是“恢复并删除这条 stash”。如果你担心恢复时出问题，可以先用 `apply`，确认没问题再手动 `drop`。

## 场景 2：我只想 stash 一部分改动

### 交互式选择部分代码块

```shell
git stash push -p
```

### 只 stash 指定文件

```shell
git stash push -- src/login.ts src/login.css
```

这个用法很适合“页面样式还没改完，但脚本部分要先切出去处理”的场景。

## 场景 3：连未跟踪文件也一起 stash

默认情况下，`stash` 不会把未跟踪文件一起收进去。

```shell
git stash push -u -m "wip: login page"
```

`-u` 表示把 untracked files 也带上。如果你的工作区里新建了文件，这个参数很关键。

## `apply` 和 `pop` 怎么选

- `apply`：恢复 stash，但保留这条记录
- `pop`：恢复 stash，并尝试删除这条记录

我自己的习惯是：

- 不确定会不会冲突，用 `apply`
- 很确定只是临时切出去一下，用 `pop`

## 常见坑

- `stash` 不是长期备份，放久了自己都记不清哪条是干什么的
- `pop` 遇到冲突时，现场并不会自动帮你收拾干净，还是要自己解决
- 默认不包含未跟踪文件，需要 `-u`
- 切分支之后再恢复 stash，理论上可行，但如果上下文变化很大，冲突概率也会更高

:::warning
如果 stash 里的内容已经重要到你担心会丢，那它大概率就不该继续躺在 stash 里，而是该整理成 commit。
:::
