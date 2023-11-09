# 分支进阶操作

## git rebase

rebase可译为变基，指在一个分支上所有提交应用指定分支的最新节点上

![img.png](/imgs/base/git-rebase.gif)

### 标准模式

假设有分支feature以及分支master，并且当前分支为feature

```markdown
          A---B---C feature
         /
    D---E---F---G master
```

执行

```shell
git rebase master
# 或者
git rebase master feature
```

将A、B、C对应的提交变基到master分支上

```markdown
                  A'--B'--C' feature
                 /
    D---E---F---G master
```

如果分支feature上存在与master分支上有相同的改动

```markdown
          A---B---C feature
         /
    D---E---A'---G master
```

那么变基之后的提交记录变为

```markdown
                  B---C feature
                 /
    D---E---A'---G master
```

### --onto 参数

将一系列提交变基到指定分支上（只会保证在指定分支上，并不会放置在最新的节点上）

> 用于处理基于其他分支开发的功能分支（feature/A分支需求较多还没有开发完成，而feature/B分支是基于feature/A开发的，但是已经开发完），希望合并到主分支

```markdown
    o---o---o---o---o  master
         \
          o---o---o---o---o---o  feature/A
                           \
                            o---o---o  feature/B
```

执行：

```shell
git rebase --onto master feature/A feature/B
```

因为feature/A分支是从master分支上切出的，所以它并不会改变。而feature/B是从feature/A分支上切出，执行变基之后，会将feature/B变为从master上切出。

```markdown
    o---o---o---o---o  master
         \          \
          \          o---o---o  feature/B
           \
            o---o---o---o---o---o  feature/A

```

当然，rebase不仅可以变基多个分支，也可以操作一个分支来删除commit（删除不连续的commit）

```markdown
    E---F---G---H---I---J  feature/A
```

执行

```shell
git rebase --onto feature/A~5 feature/A~3 feature/A
```

其中feature/A~5表示E，feature/A~3表示E、F、G，此时feature/A还剩H、I、J提交。变基之后H、I、J提交覆盖了F、G提交，最终分支变为：

```markdown
    E---H'---I'---J' feature/A
```

### 交互模式

以上是标准模式的变基操作，即只会将一系列commit集成到指定分支的最新修改。开启交互模式只需要添加参数：-i | --interactive。

```shell
# 假设有以下提交
commit 936e658ab28704455fd10d5a480b5b0fa0e43625 (HEAD -> master, origin/v1.2-1110, origin/master, v1.2-1110)
commit 12d5aae891d92b94cc601c9777dfca6d951ee8c4 feat:'生产环境修改ws配置'
commit fba7386ff9a4d0524e26a817e2a06cd17caa7541 fix:'样式调整'
commit ae3321e4c0833be2cec233f3eb2e3e3a1bb15662 feat:'新增部门概念、模块拆分'
commit ebe56a451bdb560135042f8a0bc43d2a6ffb416e feat:'修改生产环境变量'
```

假设在上述commit中删除掉ae3321e4c0833be2cec233f3eb2e3e3a1bb15662

```shell
# rebase操作的logId必须在ae3321e4c0833be2cec233f3eb2e3e3a1bb15662之前
git rebase -i ebe56a451bdb560135042f8a0bc43d2a6ffb416e
```

```shell
pick ae3321e feat:'修改生产环境变量'
pick fba7386 feat:'上云API新增部门概念、模块拆分'
pick 12d5aae fix:'样式调整'
pick 936e658 feat:'生产环境修改ws配置'

# Rebase ebe56a4..936e658 onto ebe56a4 (4 commands)
#
# Commands:
# p, pick <commit> = 保留
# r, reword <commit> = 保留，但是修改提交信息
# e, edit <commit> = 保留但停止修改
# s, squash <commit> = 保留，但合并到前一个提交
# f, fixup [-C | -c] <commit> = 类似"squash"，但只保留前一个提交的提交信息,。指定参数-c时，仅保留当前提交信息
# x, exec <command> = 使用 shell 运行命令
# b, break = 在此处停止（使用 'git rebase --continue' 继续变基）
# d, drop <commit> = 移除
```

将ae3321e修改为drop后并保存退出，

## 缺点

1. commit log会变得与实际情况不一致，部分log会丢失,导致排查错误时更困难。
2. 上手成本较高，新手不建议使用，容易造成commit丢失。

## 优点

1. commit日志更加清晰明了，而且rebase后的分支比merge更直观
2. 相对于merge更加灵活，可以胜任复杂的操作。

