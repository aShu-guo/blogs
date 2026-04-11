# SVN 使用指南

SVN 没有 Git 那么流行，但在老项目、内网项目、权限要求严格的团队里，仍然很常见。

真正容易把人绊住的，通常也不是命令拼不出来，而是脑子里还带着 Git 的默认习惯：以为可以先在本地攒一串提交，再慢慢往远端推；以为分支是“本地概念”；以为回滚总有很多兜底手段。

SVN 不是这套玩法。它更直接，也更依赖现场纪律。

## 这一组文档怎么读

- 只想快速找命令，先看 [现场速查](/base/version-control/svn/cheatsheet)
- 想先把 SVN 和 Git 的差别捋顺，先看 [先把脑回路切过来](/base/version-control/svn/what)
- 日常开发怎么拉代码、更新、提交，看 [工作副本与日常提交流程](/base/version-control/svn/working-copy)
- 仓库里的 `trunk / branches / tags` 到底怎么用，看 [主干、分支、标签](/base/version-control/svn/branch)
- 分支之间怎么切，看 [切换工作副本：switch](/base/version-control/svn/switch)
- 分支怎么合、怎么按版本挑改动，看 [合并与挑版本：merge](/base/version-control/svn/merge)
- 工作副本锁了、冲突了、想放弃现场，看 [cleanup、revert、resolve](/base/version-control/svn/cleanup)
- 团队里有很多二进制文件或生成文件，看 [锁与属性](/base/version-control/svn/lock)

## 我自己用 SVN 的几个习惯

- 开工前先 `svn update`，不要等到提交前才发现已经落后很多个版本
- 重命名和移动一律用 `svn move`，不要在文件系统里手改再指望 SVN 猜懂
- 合并前先把工作副本清干净，别在脏现场里做 `merge`
- `svn revert` 之前先确认，因为它不像 Git 那样常有本地提交和 `reflog` 兜底

## 如果你维护的是自建 svnserve

这部分我只记最小流程，不展开服务端权限细节：

```shell
svnadmin create /data/svn/project
svnserve -d -r /data/svn
svn checkout svn://host/project
```

再往下通常就是配 `conf/passwd`、`conf/authz`，以及把仓库目录纳入备份。文档主体还是以前端/后端开发日常使用为主，不打算把服务端配置也写成运维手册。
