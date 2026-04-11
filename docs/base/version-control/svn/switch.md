# 切换工作副本：svn switch

很多 SVN 项目不是不会建分支，而是大家切分支的动作不够稳。`svn switch` 解决的，就是“我想保留当前工作副本目录，但把它切到仓库里的另一条线”。

## 什么时候用

- 当前目录已经是一个工作副本，我想从 `trunk` 切到某个分支
- 功能做完了，我想把工作副本切回主干
- 服务器地址变了，但仓库本身没变，需要修正工作副本指向

## 场景 1：从主干切到功能分支

先确认现场干净一点：

```shell
svn status
svn update
```

然后切过去：

```shell
svn switch ^/branches/feature-order
```

切完以后我习惯再看一眼：

```shell
svn info
```

确认 URL 已经变成你想要的分支。

## 场景 2：从功能分支切回主干

```shell
svn status
svn update
svn switch ^/trunk
```

如果你当前工作副本还有一堆没处理完的改动，`switch` 可能会把现场变得更难理解。所以我的建议一直是：**有本地改动时，先判断这次切换是不是值得硬做。**

## 场景 3：仓库地址变了，但仓库还是同一个

比如以前是：

```text
http://old-host/repos/project
```

后来改成：

```text
https://new-host/repos/project
```

这种场景通常用：

```shell
svn relocate https://new-host/repos/project/trunk
```

`relocate` 处理的是“同一个仓库换地址”，不是“把工作副本切到另一个完全无关的仓库”。

## `switch` 和重新 `checkout` 怎么选

我自己的判断很简单：

- 只是同一个仓库里切 `trunk` / `branch`，优先 `switch`
- 工作副本已经乱了，或者你怀疑元数据有问题，直接新 `checkout` 往往更省事

不要为了省一个 `checkout`，把一个已经不可信的工作副本继续修补下去。

## 常见坑

- 在脏工作副本上直接 `switch`，冲突会更难读
- 人在子目录里执行 `switch`，结果只切了局部目录，最后出现“半个项目在 trunk，半个项目在 branch”
- 把 `relocate` 当成通用切分支命令，这个用法是错的
- 切完不看 `svn info`，后面改了半天才发现自己还在旧分支
