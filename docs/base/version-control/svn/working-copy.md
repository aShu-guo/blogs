# 工作副本与日常提交流程

如果你不是在做分支治理，而只是每天正常开发，这一页基本够用。

## 什么时候看这页

- 新机器第一次拉项目
- 新建文件、删文件、改文件名，不确定 SVN 会不会认
- 提交前想确认一下，自己手里的工作副本到底是什么状态

## 场景 1：第一次把项目拉到本地

```shell
svn checkout svn://host/project/trunk project
```

如果你拿到的是 HTTP 地址，也可以是：

```shell
svn checkout https://svn.example.com/repos/project/trunk project
```

拉完之后，建议先看一眼：

```shell
cd project
svn info
```

至少确认三件事：

- 当前 URL 是不是你要的那条线
- 工作副本根目录是不是你以为的那个目录
- 当前修订号大概是多少

## 场景 2：仓库刚建好，要把现有目录一次性导进去

这个场景没有 Git 那种“先 `git init` 再慢慢加”的感觉，通常更直接：

```shell
svn import ./project svn://host/project/trunk -m "init import"
```

`import` 只是把当前目录内容送到服务器，它不会顺手把你这个目录变成工作副本。

导完以后，正常做法还是重新 `checkout` 一份：

```shell
svn checkout svn://host/project/trunk project
```

## 场景 3：每天开工前先把现场拉平

```shell
svn update
svn status -u
```

我自己更建议把这一步当成固定动作。因为 SVN 的冲突很少是“突然出现”的，很多时候只是你拖太久没同步。

`status -u` 的几个常见状态可以顺手记一下：

- `M`：本地修改了
- `A`：已纳入版本控制，准备新增
- `D`：准备删除
- `?`：还没纳入版本控制
- `C`：冲突

## 场景 4：我改了代码，先看清楚再提交

```shell
svn status
svn diff
```

如果你只是想看某个文件：

```shell
svn diff src/order/service.js
```

这一步别省。SVN 没有 Git 那种“我先本地 commit 一下，回头再整理”的舒适区，所以提交前看现场更重要。

## 场景 5：新增、删除、重命名文件

### 新增文件

```shell
svn add src/new-file.ts
```

### 删除文件

```shell
svn delete src/old-file.ts
```

### 重命名或移动

```shell
svn move src/old-name.ts src/new-name.ts
```

我更建议把“重命名”和“移动”都理解成 `move`。因为 SVN 认的是版本控制层面的动作，不只是文件系统层面的结果。

## 场景 6：确认没问题了，直接提交

```shell
svn commit -m "fix: correct order status mapping"
```

这里最容易和 Git 混的是：SVN 的 `commit` 已经是共享动作。

所以我自己的习惯是提交前至少看一遍：

```shell
svn status
svn diff
```

## 几个我比较常用的小命令

### 只看最近几条历史

```shell
svn log -l 10
```

### 看某个文件是谁最后改的

```shell
svn blame src/order/service.js
```

### 新建目录并纳入版本控制

```shell
svn mkdir src/modules/report
```

如果是远程直接建目录，也可以：

```shell
svn mkdir ^/branches/release-1.2 -m "create release branch"
```

## 常见坑

- `?` 状态的文件不会自动进提交，需要你自己 `svn add`
- 直接用系统文件管理器改名，SVN 不一定认得出“这是重命名”
- `commit` 之前没 `update`，容易把冲突推迟到最不想面对的时候
- 工作副本里混了临时文件，最好尽快配 `svn:ignore`，别每次都人工跳过
