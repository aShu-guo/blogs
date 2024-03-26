# npm-link

在任意项目地址下执行npm link，则会将当前项目保存到全局中。

假设项目名称为`datetime-picker-vue`（对应package.json中的名称），在项目根路径下执行`npm link`则将项目链接到全局，那么如何查看产生了什么效果呢？

1. 通过`npm config get prefix`获取当前node版本对应的全局路径`global_path`，例如`/Users/AShuGuo/.nvm/versions/node/v12.22.12`

![img.png](/imgs/base/npm/npm-link-1.png)

2. 进入`${global_path}/lib/node_modules`

![img.png](/imgs/base/npm/npm-link.png)

## 注意事项

npm-link命令常用来在本地测试npm包，如果主项目所需的node版本与npm包的版本不一致，那么以主项目版本为主

case：主项目版本要求node版本`>=`18，npm包版本要求node版本`<=`10

1. 在npm包路径下，使用要求的node版本打好包之后
2. 在npm包路径下，通过nrm切换到`node>=18`版本下执行`npm link`
3. 切换到主项目路径下，切换到`node>=18`版本下执行`npm link package_name`
4. 测试完毕之后，在npm包路径下执行`npm unlink`
5. 可以再次访问`${global_path}/lib/node_modules`目录下，二次确认是否真正unlink了

:::info
package_name对应package.json中的名称
:::
