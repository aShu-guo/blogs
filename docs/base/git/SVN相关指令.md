## SVN相关指令

https://blog.csdn.net/qq_36004521/article/details/80722091

## 服务端

1.新建远程svn仓库

svnadmin create svndir

2.修改相关配置

3.启动serve

svnserve -d -r svndir

## 客户端

1. 第一次初始化导入

svn import eclipse-workspace/platformSpringBoot svn://localhost/svndir/platformSpringBoot --username=weixiangming --password=119124748 -m "初始化导入"

2. 从服务端下载代码到客户端地址

svn checkout svn://localhost/svndir/platformSpringBoot --username=weixiangming --password=119124748 eclipse-workspace/platformSpringBootSvn

3. 修改之后向服务器提交（commit之前先pull）

svn commit -m "修改了PlatformSpringBootApplication文件"

4. 更新远程代码到本地（类似git push）

svn update

### 分支操作

1. 创建分支（相当于copy文件到另外一个目录下）

Svn cp http://svn.shguo.com/repos/sns/trunk/ http://svn.shguo.com/repos/sns/branches/101128_sns_imageUpload_shguo -m “shguo_branch”

2. 在新分支上开发，后提交

3. 向主干分支合并时保证两分支都是干净的

其他：

查看修改的文件：svn status
