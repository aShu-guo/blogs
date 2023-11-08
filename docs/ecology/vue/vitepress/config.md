# 项目配置

vuepress可以自定义站点配置，也可以为每个页面自定义配置（Frontmatter）

## 站点配置

站点配置的存放路径有以下约定，默认配置存放路径为之前新建的docs目录下

默认的配置文件的搜索顺序为

- 根目录下
    - vuepress.config.ts
    - vuepress.config.js
    - vuepress.config.mjs
- 源文件目录下
    - vuepress/config.ts
    - vuepress/config.js
    - vuepress/config.mjs

所以配置文件有两种存放位置：

1. 存放在`根目录`下

![img.png](/imgs/init-press/config-1.png)

2. 存放在`源文件目录`下

![img.png](/imgs/init-press/vuepress-config.png)

当然vuepress也提供了`--config`参数，提供任意指定配置文件的能力

```shell
vuepress dev docs --config my-config.js
```

如果你选择了自行指定配置文件，那么需要将上述命令更新到`package.json`的`scripts`脚本中，用于方便运行

## 页面配置

vuepress支持在每个md文件最顶层包含一个YAML Frontmatter，并且首尾都需要用`---`包裹，并且被包裹的内容需要符合`YAML`语法规范

![img.png](/imgs/init-press/frontmatter.png)

> 可以通过两种方式校验自己的Frontmatter页面配置是否规范

1. 将自己的编写的Frontmatter通过以下地址校验

[YAML在线校验地址](https://www.bejson.com/validators/yaml_editor/)

2. 随意新建一个yml文件，在其中编写时对缩进更加敏感

## 拓展

在搭建过程中遇到一个容易迷惑的问题是自定义sidebar时，如果没有正确配置，会导致无法渲染除锚点

官方文档中指出，sidebar有4种类型，分别是：

`false | 'auto' | SidebarConfigArray | SidebarConfigObject`

并且默认值为`auto`

- false 表示禁用侧边栏，即在页面中不渲染侧边栏
- auto 表示侧边栏会根据md文件中的标题（一级标题、二级标题...，深度可以自定义）自动生成
- SidebarConfigArray 表示侧边栏可以是一个数组，数组中的元素可以是以下几种类型：`SidebarItem | SidebarGroup | string`
- SidebarConfigObject 表示侧边栏是一个key为string的对象

需要注意的是如果想要自定义sidebar的同时，又想要自动生成md文件的锚点，那么需要如下配置：

1. sidebar配置

```js
const sidebar = {
    '/vue-ecology/vuepress/': [
        {
            text: '基于vuepress搭建博客',
            children: [
                '/vue-ecology/vuepress/README.md',
                '/vue-ecology/vuepress/初始化.md',
                '/vue-ecology/vuepress/配置.md',
                '/vue-ecology/vuepress/YAML规范.md',
                '/vue-ecology/vuepress/部署.md',
            ]
        },
    ],
}
```

2. /vue-ecology/vuepress/初始化.md中需要指定标题

```markdown
# 初始化
```

否则sidebar会渲染为带有md后缀的标题

![img.png](/imgs/init-press/init-sidebar.png)

由于vuepress的设计逻辑为：

如果开发者自定义的一个对象用于sidebar，那么会使用开发者自定义的配置。

只有当开发者没有自定义一个对象，而是通过字符串配置时才会自动渲染锚点

参考：

[issue#824](https://github.com/vuepress/vuepress-next/issues/824)
