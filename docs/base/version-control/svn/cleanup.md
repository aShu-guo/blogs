# 现场救火：cleanup、revert、resolve

SVN 用久了，最烦人的往往不是“不会提交”，而是现场卡住：

- 更新一半中断了
- 合并做了一半发现不对
- 工作副本被锁住
- 冲突文件摆在那，不知道该先敲哪条命令

这一页就只讲这些脏活。

## 场景 1：工作副本锁了，很多命令都不让跑

最先试这个：

```shell
svn cleanup
```

然后再继续你刚才的动作，比如：

```shell
svn update
```

`cleanup` 的作用比较像“把上一次没收尾的 SVN 操作现场清干净”，它不是撤销逻辑改动，也不是神奇修复器。

## 场景 2：本地改乱了，我决定直接放弃

```shell
svn revert path/to/file
```

如果是一个目录：

```shell
svn revert -R src
```

这里我会非常保守地提醒一句：**`revert` 基本就是硬撤。**

Git 用户经常被宠坏了，总觉得回头还能再捞；SVN 这里别太乐观。

### 一个容易忽略的小点

`revert` 处理的是已纳入版本控制的改动。

如果目录里还有 `?` 状态的未跟踪文件，它不会帮你删掉，你得自己处理。

## 场景 3：冲突已经解决了，但还要告诉 SVN 一声

先看冲突：

```shell
svn status
svn diff
```

你手动改完文件后，再标记为已解决：

```shell
svn resolve --accept working path/to/file
```

如果你很明确要整份保留自己或对方的版本，也可以：

```shell
svn resolve --accept mine-full path/to/file
svn resolve --accept theirs-full path/to/file
```

但这个动作最好少偷懒。因为很多冲突不是“二选一”就能正确解决的。

## 场景 4：我想先查清楚到底谁改了什么

比较实用的一组命令：

```shell
svn info
svn status
svn diff
svn log -l 10
```

如果是单文件问题，再补一个：

```shell
svn blame path/to/file
```

很多时候你不是不会解冲突，而是压根不知道两边各自想表达什么。这种时候别急着 resolve，先把历史看明白。

## 什么时候别硬修，直接重新 checkout

我自己的判断标准比较直接：

- `svn cleanup` 跑完还是不对
- 工作副本被反复打断过很多次
- 你已经不信任当前目录到底是不是完整、干净、可解释

这时继续修旧工作副本，通常只是越修越乱。重新 `checkout` 虽然土，但经常是成本最低的方案。

## 常见坑

- 以为 `cleanup` 会帮你撤销错误改动，它不会
- `revert -R .` 敲得太快，结果把本地没备份的改动一起抹掉
- 冲突文件内容还没处理清楚，就先 `resolve`
- 工作副本明显坏了，还死扛着不重拉
