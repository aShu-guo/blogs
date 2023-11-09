# mongo shell 常用命令

database -> collection -> document

```shell
# 连接mongodb
mongosh "mongodb 地址"
# 使用A database
use A
# 查看database A下的所有collections
show collections
# 重命名A1 collection为A2
db.A1.renameCollection('A2')

```
