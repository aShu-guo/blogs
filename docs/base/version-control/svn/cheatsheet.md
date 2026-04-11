# SVN 现场速查

这一页只放我自己最常查的场景，不铺概念。

## 新机器拉代码

```shell
svn checkout svn://host/project/trunk project
```

## 开工前先同步

```shell
svn update
svn status -u
```

`update` 是把服务器上的最新版本拉到当前工作副本，`status -u` 能顺手看一下服务器端还有没有你本地没拿到的更新。

## 看本地改了什么

```shell
svn status
svn diff
svn info
```

## 把文件纳入版本管理

```shell
svn add src/new-file.ts
svn delete src/old-file.ts
svn move src/old-name.ts src/new-name.ts
```

## 提交改动

```shell
svn commit -m "fix: correct order status mapping"
```

SVN 的 `commit` 是直接进服务器，不存在 Git 那种“先本地 commit，再 push”的两段式。

## 建分支和打标签

```shell
svn copy ^/trunk ^/branches/feature-order -m "create feature-order branch"
svn copy ^/trunk ^/tags/release-1.2.0 -m "tag release-1.2.0"
```

## 切工作副本到另一个分支

```shell
svn switch ^/branches/feature-order
svn switch ^/trunk
```

## 合并主干到功能分支

```shell
svn switch ^/branches/feature-order
svn update
svn merge ^/trunk
svn commit -m "merge trunk into feature-order"
```

## 把功能分支合回主干

```shell
svn switch ^/trunk
svn update
svn merge ^/branches/feature-order
svn commit -m "merge feature-order into trunk"
```

## 只挑一个版本号进来

```shell
svn merge -c 128 ^/trunk
svn commit -m "cherry-pick r128"
```

## 工作副本出问题时先试这几个

```shell
svn cleanup
svn revert path/to/file
svn resolve --accept working path/to/file
```

## 二进制文件协作

```shell
svn lock assets/banner.psd -m "update marketing banner"
svn unlock assets/banner.psd
svn propset svn:needs-lock yes assets/banner.psd
```
