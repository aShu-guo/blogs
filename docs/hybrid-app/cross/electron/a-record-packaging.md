# 将vue2项目打包为win应用记录

一个事业单位的招投标项目，需求已经开发完毕，但是对方希望得到的是一个桌面程序，而不是将其部署到服务器上。

## vue-cli-plugin-electron-builder

由于项目是基于`vue-cli`
构建的，而[vue-cli-plugin-electron-builder](https://github.com/nklayman/vue-cli-plugin-electron-builder)
是方便开发者将vue项目打包通过`electron`打包为桌面程序的插件。并且项目也满足使用`vue-cli-plugin-electron-builder`的前置条件

:::warning
需要保证项目是基于vue-cli的
:::

在项目目录下执行

```shell
vue add electron-builder
```

执行命令之后，插件会向项目中添加两个`scripts`：

```json
{
  "scripts": {
    ...
    "electron:build": "vue-cli-service electron:build",
    "electron:serve": "vue-cli-service electron:serve",
    ...
  }
}

```

### 运行开发服务

如果项目使用的依赖管理是yarn，执行：

```shell
yarn electron:serve
```

如果项目使用的依赖管理是npm，执行：

```shell
npm run electron:serve
```

### 构建项目

如果项目使用的依赖管理是yarn，执行：

```shell
yarn electron:build
```

如果项目使用的依赖管理是npm，执行：

```shell
npm run electron:build
```

此时构建并没有指定build的环境变量，而且也没有指定构建产物的平台。默认是构建出`NODE_ENV=production`的产物，target默认为当前系统平台。

例如：在mac上构建时，构建出的可执行文件是dmg文件；在windows上构建时，构建出的可执行文件是exe文件

### 指定环境变量以及平台

```json
{
  "scripts": {
    ...
    "electron:build": "vue-cli-service electron:build",
    "electron:serve": "vue-cli-service electron:serve",
    ...
  }
}

```

修改为：

```json
{
  "scripts": {
    ...
    "electron:build": "vue-cli-service electron:build  --mode prod_gray --win",
    "electron:serve": "vue-cli-service electron:serve",
    ...
  }
}

```

执行`electron:build`时，会去寻找`.env.prod_gray`名的环境变量文件，打包产物是exe

## 遇到的问题

### 依赖安装

下载electron包时出现`RequestError: read ECONNRESET`问题

**方案1：**

- 先执行`npm install`，在控制台上运行到`node install.js`时中断执行（ctrl+c）
- 进入`node_modules/electron`文件下， 编辑`install.js`

```js
downloadArtifact({
    version,
    artifactName: 'electron',
    force: process.env.force_no_cache === 'true',
    cacheRoot: process.env.electron_config_cache,
    platform: process.env.npm_config_platform || process.platform,
    arch: process.env.npm_config_arch || process.arch,
    mirrorOptions: {
        mirror: 'https://npm.taobao.org/mirrors/electron/'
    }
}).then(extractFile).catch(err => {
    console.error(err.stack);
    process.exit(1);
});
```

- 再次执行`npm install`

不建议，需要手动更改`node_modules`

**方案2：**

- 设置npm下载electron镜像地址

```shell
npm set ELECTRON_MIRROR https://registry.npmmirror.com/mirrors/electron/
```

- 再次执行`npm install`

**方案3：**

预安装：手动下载对应平台的文件，放到对应的目录下。这样在执行`npm install`时会自动跳过安装

不同平台对应的目录：

- `Linux: $XDG_CACHE_HOME or ~/.cache/electron/`
- `macOS: ~/Library/Caches/electron/`
- `Windows: $LOCALAPPDATA/electron/Cache or ~/AppData/Local/electron/Cache/`

### viser-vue

打包之后运行可执行文件时报错：Cannot assign to read only property 'constructor' of object `#<t>`

报错文件指向：`g2-plugin-slider.js`，而且项目中引入了`viser-vue`

分析`package-lock.json`文件，发现是`viser-vue`依赖`@antv/g2-plugin-slider`

```json
{
  "node_modules/viser": {
    "version": "2.4.9",
    "resolved": "https://registry.npmjs.org/viser/-/viser-2.4.9.tgz",
    "integrity": "sha512-DKsqtMa3TZYQHEZ7jp4kpNp1Iqomda7d+3IkkIjIdKQvfL8OeksXfy/ECZUY1hTrGoOe7cq85+6PMS+MPn4mgQ==",
    "dependencies": {
      "@antv/g2": "~3.5.3",
      "@antv/g2-brush": "^0.0.2",
      "@antv/g2-plugin-slider": "^2.1.0",
      "@types/d3-format": "*",
      "@types/lodash": "*",
      "@types/node": "^8.0.53",
      "d3-format": "^1.3.0",
      "lodash": "^4.17.4"
    }
  }
}
```

原因是`vue-cli`的`morden`模式导致的产物兼容问题，显式指定打包模式即可：

```json
{
  "scripts": {
    ...
    "electron:build": "vue-cli-service electron:build",
    "electron:serve": "vue-cli-service electron:serve",
    ...
  }
}

```

修改为：

```json
{
  "scripts": {
    ...
    "electron:build": "vue-cli-service electron:build --legacy --mode prod_gray --win",
    "electron:serve": "vue-cli-service electron:serve",
    ...
  }
}

```

也可以在`index.html`中引入外部cdn解决

### build失败

执行`electron:build`时报错：⨯ Exit code: ENOENT. spawn /usr/bin/python ENOENT

原因是`electron-builder`版本过低导致

解决方案是修改package.json文件，覆盖`electron-builder`版本：

使用的是`yarn`：

```json
{
  "resolutions": {
    "vue-cli-plugin-electron-builder/electron-builder": "^23.0.3"
  }
}
```

使用的是`npm`：

```json
{
  "overrides": {
    "vue-cli-plugin-electron-builder": {
      "electron-builder": "^23.0.3"
    }
  }
}
```

参考：

【1】[Electron 安装指导](https://www.electronjs.org/zh/docs/latest/tutorial/installation)

【2】[ant-design-vue-pro 使用 electron 打包后运行时报错](https://github.com/nklayman/vue-cli-plugin-electron-builder/issues/1089)

【3】[https://github.com/antvis/G2/pull/1641](https://github.com/antvis/G2/pull/1641)

【4】[Exit code: ENOENT. spawn /usr/bin/python error after updating macOS](https://github.com/electron-userland/electron-builder/issues/6726)
