# 主键

## Q&A

### 自增长主键存在哪些问题？

自增长主键会暴露`场外信息`，竞品可能通过注册账号判断产品的月获客数量。

但是如果使用UUID作为PK会存在性能问题：对于InnoDB，插入数据时并不是将数据放在表的末尾，而是会移动旧数据，后再插入新数据。对于大表而言，插入会非常缓慢。使用`varchar`
作为存储类型时，一条数据行占用的存储容量也比较大。

解决方案：

1. 设置datatype为`binary(16)`
2. 默认值设置为`uuid_to_bin(uuid(), 1)`

![img.png](/imgs/db/uuid-datatype.png)

但是对于master/slave，设置uuid为默认值会导致值不相同，mysql会抛出

```markdown
statement is unsafe because it uses a system function that may return a different value on the replica
```

最佳实践是设置`TRIGGER`，在插入数据时生成uuid：

```shell
DELIMITER ;;
CREATE TRIGGER before_insert_tablename
BEFORE INSERT ON tablename
FOR EACH ROW
BEGIN
  IF new.id IS NULL THEN
    SET new.id = UUID_TO_BIN(UUID(),1);
  END IF;
END
;;
```

![img.png](/imgs/db/uuid-pk.png)

观察id发现它们之间有很多相同的部分，似乎可以预测。原因是mysql中的`uuid()`
使用的是v1，而且uuid并不是被设计为不可预测的，如果希望生成完全不相同的uuid，可以使用v4来生成。

因为存储的是二进制的uuid，在查询时需要decode下，转换成真实的uuid查询：

```shell
select * from users where user_id=uuid_to_bin('2edc7cee-3596-11ee-ba3a-4215a4f8edbc', 1);

# or

select * from users where bin_to_uuid(user_id, 1)='2edc7cee-3596-11ee-ba3a-4215a4f8edbc';
```

#### 优缺点

优点：

1. 任何时候都是唯一的，这在跨数据库上是有利的
2. 使迁移、复制备份变得容易
3. 可以离线生成

缺点：

1. 很吃存储，但是存储并不贵
2. 无法根据id获取插入顺序
3. url上看着很丑

对于数据库的拓展以及迁移成本而言，个人更倾向于使用uuid作为主键。如果一开始设置为自增主键作为id，随着业务数据的不断膨胀以及多个分布式业务表数据相互交织，自增主键id的缺点便会变得愈发明显。

#### 拓展

1. 删除`TRIGGER`的命令：

```shell
DROP TRIGGER [IF EXISTS] [schema_name.]trigger_name;
```

2. 如果使用`TRIGGER`自动生成插入数据的id，那如何获取上次插入数据的uuid呢？

测试发现`LAST_INSERT_ID()`并没有效果：

![img.png](/imgs/db/uuid-insert-last-id.png)

解决方案：

- 不使用`TRIGGER`自动生成id，在项目中生成uuid，如此便可以事先知道要插入数据的id；
- 在`TRIGGER`中设置变量，插入后查询变量的值；

参考：
【1】[generating completely different uuid for mysql](https://stackoverflow.com/questions/61650560/generating-completely-different-uuid-for-mysql)

【2】[MySQL & UUIDs](https://lefred.be/content/mysql-uuids/)

【3】[Advantages and disadvantages of GUID / UUID database keys](https://stackoverflow.com/questions/45399/advantages-and-disadvantages-of-guid-uuid-database-keys)
