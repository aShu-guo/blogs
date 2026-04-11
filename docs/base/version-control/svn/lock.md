# 锁与属性：SVN 里几个很实用的高级操作

如果团队里大部分都是纯文本源码，这一页你可能不会天天用。

但只要项目里开始出现这些东西：

- PSD
- Excel
- Word
- 二进制配置包
- 很难自动合并的资源文件

SVN 的锁和属性就会比 Git 生态里常见一些。

## 场景 1：我要改一个二进制文件，先占坑

```shell
svn lock assets/banner.psd -m "update marketing banner"
```

改完之后，如果不需要继续占锁：

```shell
svn unlock assets/banner.psd
```

很多服务器配置下，正常提交后锁也会释放；但我不建议完全靠“也许会自动解锁”来管理现场，尤其是多人协作时。

## 场景 2：我想让某些文件默认必须先锁再改

这时可以设置属性：

```shell
svn propset svn:needs-lock yes assets/banner.psd
svn commit -m "set needs-lock for banner.psd"
```

这个属性最适合用在“几乎不可能人工合并”的文件上。

我不建议滥用到普通代码文件，否则团队日常开发会非常别扭。

## 场景 3：构建产物、日志文件别老出现在 `svn status`

SVN 没有 Git 那种仓库根目录一把梭的 `.gitignore` 体验，它更像是给目录设置属性：

```shell
svn propset svn:ignore "dist
node_modules
*.log" .
svn commit -m "ignore local build artifacts"
```

这里有两个要点：

- `svn:ignore` 是设在目录上的
- 改完属性后，也要提交

所以如果你在不同子目录下都有各自的临时文件，有时要分别设置，不是一次全局搞定。

## 场景 4：我想统一换行符或可执行权限

SVN 的属性不只拿来做 ignore。

例如：

```shell
svn propset svn:eol-style native scripts/deploy.sh
svn propset svn:executable ON scripts/deploy.sh
svn commit -m "normalize script properties"
```

这类动作在跨平台团队里尤其有用。否则有些脚本在 macOS/Linux 正常，到了别人的环境就开始闹脾气。

## 常见坑

- 对普通源码滥用 `lock`，最后所有人开发效率都下降
- 以为 `svn:ignore` 跟 `.gitignore` 一样是全局文件配置，其实它是目录属性
- 给文件加了 `svn:needs-lock`，但团队没人知道这套约定，最后只剩下只读文件在制造困惑
- 属性改了却没提交，别人根本拿不到你的规则
