# vue2迁移vite指南

最近接手了一个接近50万行代码的老旧项目，基础框架为 Vue@2.6。由于项目在开发过程中代码变动时热重载需要约10秒（在M2
Max芯片、32GB内存的MacBook上），为了提高开发效率，我们决定对项目进行改造：

1. 基于rspack

尽管我们对开发环境的 webpack 配置进行了多次优化，热重载时间仍然需要约`5秒`。考虑到 JavaScript 的性能相较于 Rust
存在显著差距，我们决定尝试基于 Rust 的 bundler——`Rspack`。Rspack 的设计初衷就是为了高效地处理大型项目，它在处理速度和资源管理方面相比传统的
JavaScript bundler 具有显著优势。预计使用 rspack 可以大幅度缩短热重载时间，从而提高开发效率和迭代速度。

2. 基于vite

Vite 是一款现代化的 bundler，凭借其在开发环境中无需进行编译即可运行的特性，已成为许多开发者的首选工具。我们计划在本地开发环境中使用
Vite 启动项目，这样可以充分利用 Vite 的`快速热重载`和`即时模块热更新`功能，大大缩短开发反馈时间。同时，为了保持生产环境的稳定性和兼容性，我们将在生产环境中继续使用现有的
webpack 打包。这样做不仅能提升开发体验，还能在不影响生产环境的情况下逐步引入和测试新技术。

这种改造策略具有以下优点：

- 提升开发效率：Vite 在开发环境中提供的即时热重载能够显著减少等待时间，提高开发人员的工作效率。
- 兼容性和稳定性：在生产环境中继续使用 webpack，可以确保现有代码的兼容性和稳定性，同时逐步过渡到新的工具链。
- 渐进式改进：通过这种方式，我们能够在不打破现有工作流的情况下，逐步引入新的技术和工具，降低了风险和学习曲线。

## 安装vite

1. 新建vite项目

```shell
npm create vite@3
```

2. 将vite.config.js拷贝到旧项目中，并更改配置文件为：

- 项目中vue \< 2.7，则需要安装`vite-plugin-vue2`（社区插件）
- 项目中vue >= 2.7，则需要安装`@vitejs/plugin-vue2`（官方插件）

由于我项目中vue使用的是2.6版本的，则安装前者

```js {2,11}
// import vue from '@vitejs/plugin-vue2';
import { createVuePlugin } from 'vite-plugin-vue2';

import { defineConfig, loadEnv } from 'vite';

// https://vitejs.dev/config/
export default ({ mode }) => {
  return defineConfig({
    plugins: [
      // vue(),
      createVuePlugin(),
    ],
  });
}

```

:::warning
vite版本必须是vite@3，否则dev环境（基于vite）的node版本会与production环境（基于webpack）冲突
:::

## 支持require

项目中有许多文件在引入静态资源时使用了 `require` 关键字，但 vite
本身并不支持这种方式。考虑到全面切换可能会显著增加工作量，`vite-plugin-require`
插件提供了自动转换的能力，从而简化了迁移过程。

```vue
<img class="search-icon" :src="require('@/assets/MapIcon/map-search.png')" alt="" />
```

1. 新增`vite-plugin-require`

```shell
npm i vite-plugin-require -D
```

2. 添加plugin到vite.config.js中

```js {2,11}
import { createVuePlugin } from 'vite-plugin-vue2';
import vitePluginRequire from 'vite-plugin-require';
import { defineConfig } from 'vite';

// https://vitejs.dev/config/
export default ({ mode }) => {
  return defineConfig({
    // 位置必须放在vue plugin后
    plugins: [
      createVuePlugin(),
      vitePluginRequire()
    ],
  });
}
```

:::warning
如果在项目中使用了`TemplateLiteral`，例如：

```vue
<img style="width: 362px" :src="require(`@/assets/layout/header_${isPlatform ? 3 : 2}.png`)" alt="" />
```

那么上述plugin无法解析，建议直接整体项目手动去除`require`
:::

## 支持process.env

vite加载环境变量到`import.meta.env`对象上，并且只加载`VITE_`作为前缀的变量。在webpack中则是将环境变量加载到`process.env`
对象上，这里需要改动的文件较少，可以直接手动改动，当然也可以通过`vite-plugin-env-compatible`在vite中像webpack那样使用环境变量

1. 安装plugin

```shell
npm i vite-plugin-env-compatible -D
```

2. 添加plugin

```js {4,14}
import vue from '@vitejs/plugin-vue2';
import vitePluginRequire from 'vite-plugin-require';
import { defineConfig } from 'vite';
import env from 'vite-plugin-env-compatible'


// https://vitejs.dev/config/
export default ({ mode }) => {
  return defineConfig({
    // 位置必须放在vue plugin后
    plugins: [
      createVuePlugin(),
      vitePluginRequire(),
      env({ mountedPath: 'process.env' }),
    ],
  });
}
```

## 依赖更新

接下来更新 `package.json` 中的依赖项。我们需要删除与 `Vue CLI` 相关的依赖项

```json
// package.json
{
  "@vue/cli-plugin-babel": "~4.5.0",
  // 移除
  "@vue/cli-plugin-eslint": "~4.5.0",
  // 移除
  "@vue/cli-plugin-router": "~4.5.0",
  // 移除
  "@vue/cli-plugin-vuex": "~4.5.0",
  // 移除
  "@vue/cli-service": "~4.5.0"
  // 移除
}
```

如果项目中使用了less，sass、saas、stylus等预处理器，因为Vite 内置了对最常见预处理器的支持，则可以将对应的`loader`删除，例如：

```json
// package.json
{
  "sass-loader": "^8.0.2"
  // 移除
}
```

## babel

由于 Vite 是一款面向未来的构建工具，我们可以乐观地认为它只需要支持最现代的浏览器。这将使我们的构建过程尽可能精简和高效。

实际上，这意味着我们可以完全从依赖项中移除 Babel，因为绝大多数移动和桌面端的现代浏览器几乎全面支持所有 ES6 功能。如果你需要继续支持像
Internet Explorer 11 这样的旧版浏览器，Vite 也提供了一个官方插件来实现这一点（`@vitejs/plugin-legacy`）。

1. 删除babel.config.js
2. 删除bale相关的依赖

```json
// package.json
{
  "babel-eslint": "^10.1.0",
  // 移除
  "core-js": "^3.6.5"
  // 移除
}
```

3. 更新`.eslintrc`文件

```json
// .eslintrc
// 移除
{
  "parserOptions": {
    "parser": "babel-eslint"
  }
}
```

```json
// .eslintrc
{
  "env": {
    "node": true,
    // 添加这个
    "es2022": true
  }
}
```

## 更新index.html

将index.html从public目录中拿到根目录下，并调整script引入的项目入口，参考：

```html
<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <link rel="icon" type="image/svg+xml" href="/vite.svg" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Vite + Vue</title>
</head>
<body>
<div id="app"></div>
<script type="module" src="/src/main.js"></script>
</body>
</html>
```

对于index.html中的`htmlWebpackPlugin`需要全部清除

## 支持path别名

修改配置文件

```js {19-31}
import vue from '@vitejs/plugin-vue2';
import vitePluginRequire from 'vite-plugin-require';
import { defineConfig } from 'vite';
import env from 'vite-plugin-env-compatible';

function pathResolve(dir) {
  return resolve(process.cwd(), './', dir)
}

// https://vitejs.dev/config/
export default ({ mode }) => {
  return defineConfig({
    // 位置必须放在vue plugin后
    plugins: [
      createVuePlugin(),
      vitePluginRequire(),
      env({ mountedPath: 'process.env' }),
    ],
    resolve: {
      alias: [
        {
          find: '~@',
          replacement: pathResolve('src'),
        },
        { find: /^~/, replacement: '' },
        {
          find: '@',
          replacement: pathResolve('src'),
        },
      ],
    },
  });
}
```

## 添加导入文件后缀

使用vite作为构建工具时，导入文件需要包含后缀，所以需要添加后缀：

1. 手动更改项目中所有涉及到文件导入的地方并添加后缀
2. 添加vite.config.js省略后缀列表，省略后缀列表中包含的文件类型可以在导入时不添加后缀

```js {32}
import vue from '@vitejs/plugin-vue2';
import vitePluginRequire from 'vite-plugin-require';
import { defineConfig } from 'vite';
import env from 'vite-plugin-env-compatible';

function pathResolve(dir) {
  return resolve(process.cwd(), './', dir)
}

export default ({ mode }) => {
  return defineConfig({
    plugins: [
      createVuePlugin(),
      env({ mountedPath: 'process.env' }),
      vitePluginRequire(),
      legacy({
        targets: ['defaults', 'not IE 11']
      })
    ],
    resolve: {
      alias: [
        {
          find: '~@',
          replacement: pathResolve('src')
        },
        { find: /^~/, replacement: '' },
        {
          find: '@',
          replacement: pathResolve('src')
        }
      ],
      extensions: ['.mjs', '.js', '.ts', '.jsx', '.tsx', '.json', '.vue']
    },
  })
}
```

## 支持css使用js
如果项目中使用了`css in js`，那么则需要添加：


```js {34-40}
import vue from '@vitejs/plugin-vue2';
import vitePluginRequire from 'vite-plugin-require';
import { defineConfig } from 'vite';
import env from 'vite-plugin-env-compatible';

function pathResolve(dir) {
  return resolve(process.cwd(), './', dir)
}

export default ({ mode }) => {
  return defineConfig({
    plugins: [
      createVuePlugin(),
      env({ mountedPath: 'process.env' }),
      vitePluginRequire(),
      legacy({
        targets: ['defaults', 'not IE 11']
      })
    ],
    resolve: {
      alias: [
        {
          find: '~@',
          replacement: pathResolve('src')
        },
        { find: /^~/, replacement: '' },
        {
          find: '@',
          replacement: pathResolve('src')
        }
      ],
      extensions: ['.mjs', '.js', '.ts', '.jsx', '.tsx', '.json', '.vue']
    },
    css: {
      preprocessorOptions: {
        less: {
          javascriptEnabled: true
        }
      }
    }
  })
}
```
