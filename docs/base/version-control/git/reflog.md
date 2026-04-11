# 救命日志：git reflog

`git log` 看的是提交历史，`git reflog` 看的是“本地分支指针和 HEAD 最近动过什么”。

很多“我感觉这段提交没了”的情况，真正丢的不是提交本身，而是分支指针挪走了。这时候 `reflog` 往往能把你捞回来。

## 什么时候用

- `reset --hard` 之后后悔了
- `rebase` 改乱了，想回到开始之前
- 分支删了，但提交还想找回来
- `stash` 恢复出问题，想回头找现场

## 场景 1：`reset --hard` 之后想后悔

```shell
git reflog
```

你会看到类似这样的记录：

```text
54e8c1a HEAD@{0}: reset: moving to HEAD^
9ab2d31 HEAD@{1}: commit: feat: add login form
```

如果你要回到 `reset` 之前：

```shell
git reset --hard HEAD@{1}
```

## 场景 2：rebase 过程中越改越乱，想回到 rebase 之前

还是先看 `reflog`：

```shell
git reflog
```

找到 rebase 开始前那个提交，然后回去：

```shell
git reset --hard <commit-id>
```

如果你还不确定要不要彻底回退，也可以先开一条救援分支：

```shell
git switch -c rescue/<name> <commit-id>
```

## 场景 3：分支删了，但那条线上的提交还想保住

只要这些提交还没被 Git 清理掉，通常都能通过 `reflog` 找回。

```shell
git reflog
git switch -c rescue/feature-login <commit-id>
```

先拉一条救援分支，是比较稳的做法。别上来就继续 `reset --hard`，不然很容易把现场越弄越乱。

## 场景 4：stash 弄丢了，想看看还能不能找回来

```shell
git reflog stash
```

这条命令不一定每次都能救回来，但值得先看一眼。

## 常见坑

- `reflog` 是本地记录，不是远程共享记录，换一台机器就看不到了
- 这些记录不是永久保存的，放太久会过期
- 找回之前，最好先切一个 `rescue/*` 分支，避免二次误操作
