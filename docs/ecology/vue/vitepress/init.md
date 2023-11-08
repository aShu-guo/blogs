# 项目初始化

## 项目搭建

1. 新建一个空白目录，命名为blog
2. 初始化blog目录为git仓库，并初始化package.json文件

```shell
git init
npm init
```

3. 安装vuepress到本地

```shell
npm install -D vuepress@next
```

4. 在package.json文件中新增script脚本

```json
{
  "scripts": {
    "docs:dev": "vuepress dev docs",
    "docs:build": "vuepress build docs"
  }
}
```

5. 新建一个.gitignore文件在根目录下，并忽略掉以下目录

```text
node_modules
.temp
.cache
.idea
.vscode
docs/.vuepress/dist
```

6. 在根目录下新建一个docs目录，并在docs目录下新建一个README.md文档，并写入

```markdown
# Hello world
```

7. 启动项目

```shell
npm run docs:dev
```

## 最终的项目结构

![img.png](/imgs/init-press/dir-tree.png)



