# typeorm UUID作为PK

## 原因

权限设计作为项目的基础模块，并且由于多个业务模块都共用该权限模块，考虑到后续业务扩展性以及跨数据库的键唯一，使用uuid作为主键。

但是如果使用`UUID`作为PK会存在性能问题：对于`InnoDB`，插入数据时并不是直接将数据放在表的末尾，而是会移动旧数据，后再插入新数据。对于大表而言，插入会非常缓慢。

另外，使用`varchar`或者`char`作为存储类型时，虽然数据行中的字段值是人类友好的格式，但是一条数据行占用的存储容量也比较大。

解决方案：

1. 设置datatype为`binary(16)`，节省存储空间
2. 默认值设置为`uuid_to_bin(uuid(), 1)`

## 实践

首先新建两张表：roles和users

```mysql
-- auto-generated definition
create table roles
(
    id          binary(16)               not null
        primary key,
    name        varchar(36)              not null comment '角色名',
    slug        varchar(36)              not null comment '角色简称',
    create_time datetime default (now()) not null comment '创建时间',
    update_time datetime default (now()) not null on update CURRENT_TIMESTAMP comment '更新时间',
    valid       tinyint  default 1       not null comment '数据是否合法'
);
```

```mysql
-- auto-generated definition
create table users
(
    id          binary(16)               not null
        primary key,
    role_id     binary(16)               not null comment '角色表主键',
    name        varchar(10)              not null comment '用户名',
    password    varchar(255)             not null comment '登录密码',
    status      tinyint  default 0       not null comment '用户状态：0-正常 1-冻结',
    nick_name   varchar(10)              null comment '昵称',
    create_time datetime default (now()) not null comment '创建时间',
    update_time datetime default (now()) not null on update CURRENT_TIMESTAMP comment '更新时间',
    valid       tinyint  default 1       not null comment '数据是否有效',
);

```

### 设置默认值

```mysql
alter table users
    add uuid binary(16) default uuid_to_bin(uuid(), 1) null after id;
```

mysql可能会抛出：

```markdown
statement is unsafe because it uses a system function that may return a different value on the replica
```

原因是：插入数据时的字段默认值如果使用系统函数，会造成分布式数据库存储时返回值不一致，从而导致数据不一致问题。

最佳实践是使用`TRIGGER`确保插入新记录时产生的值是相同的（[原因](#为什么trigger可以确保插入新记录时产生的值是相同的)）

### 设置`TRIGGER`

设置roles的`TRIGGER`，在插入数据时设置id

```mysql
DELIMITER ;;
CREATE TRIGGER before_insert_roles
BEFORE INSERT ON roles
FOR EACH ROW
BEGIN
  IF new.id IS NULL THEN
    SET new.id = UUID_TO_BIN(UUID(),1);
  END IF;
END
;;
```

设置users的`TRIGGER`，在插入数据时设置id

```mysql
DELIMITER ;;
CREATE TRIGGER before_insert_users
BEFORE INSERT ON users
FOR EACH ROW
BEGIN
  IF new.id IS NULL THEN
    SET new.id = UUID_TO_BIN(UUID(),1);
  END IF;
END
;;
```

但是之前使用自增int类型pk时，可以通过`select last_insert_id();`获取上一次插入数据的ID，在同一事务中使用。但是通过`TRIGGER`
赋值给id时，`select last_insert_id();`会失效，那么如何获取插入数据的id呢？

解决方案有两种：

1. 插入数据之前，在项目中生成uuid
2. 在数据库中通过`TRIGGER`生成uuid，后设置到mysql变量中，再select变量获取上次插入数据的id。

第二种方案比较复杂，而且如果存在多个生成uuid的`TRIGGER`，那么设置mysql变量时：

- 需要保证变量名的唯一。
- 存在并发问题，多个服务在插入数据时都会修改变量，除非在插入数据时加锁。

故而选择第一种方案，在项目中生成uuid并在插入时给值。

## 集成typeorm

此处参考[nestjs官方文档](https://docs.nestjs.com/techniques/database)即可

那么如何typeorm是如何映射binary类型的pk呢？

在[issue#3187](https://github.com/typeorm/typeorm/issues/3187)中提到：

```markdown
We were considering this before, but decided to go simple way because of complexity of implementation and the fact that
only mysql 8 support uuid functions.
```

库开发者称：之前有考虑的这个问题，但是由于实现复杂度而且只有mysql-8.0版本才支持uuid函数，所以只简单的实现。

那么既然官方没有提供支持，开发者自己如何实现呢？

### entity

users table的实体类如下：

其中需要注意的是`transformer: UUIDWithSwapTransform`

```ts
// orm-utils.ts
/**
 * mysql数据类型为binary(16)
 * ex:
 *  in: 0x11EE35B38DDECE46BA3A4215A4F8EDBC
 *  out: ec74ff16-35b3-11ee-ba3a-4215a4f8edbc
 */
export const UUIDWithSwapTransform: ValueTransformer = {
    to: (uuid: string) => {
        return uuid
            ? Buffer.from(
                uuid.slice(14, 18) + uuid.slice(9, 13) + uuid.slice(0, 8) + uuid.slice(19, 23) + uuid.slice(-12),
                'hex',
            )
            : uuid;
    },
    from: (bin: Buffer) => {
        // 插入数据时，typrom返回的数据id长度有误
        return bin.toString('hex').length === 32
            ? `${bin.toString('hex', 4, 8)}-${bin.toString('hex', 2, 4)}-${bin.toString('hex', 0, 2)}-${bin.toString(
                'hex',
                8,
                10,
            )}-${bin.toString('hex', 10, 16)}`
            : bin.toString('hex');
    },
};

// users.entity.ts
@Entity({name: 'users'})
export class UsersEntity {
    @PrimaryColumn({
        type: 'binary',
        length: 16,
        generated: false,
        transformer: UUIDWithSwapTransform,
    })
    id: string;

    @Column({
        name: 'role_id',
        type: 'binary',
        length: 16,
        transformer: UUIDWithSwapTransform,
    })
    roleId: string;

    @Column()
    name: string;

    @Column()
    password: string;

    @Column({name: 'nick_name'})
    nickName: string;

    @Column()
    status: number;

    @Column({
        name: 'create_time',
    })
    createTime: string;

    @Column({
        name: 'update_time',
        default: dayjs().format('YYYY-MM-DD HH:mm:ss'),
    })
    updateTime: string;

    @Column({default: 0})
    valid: number;
}
```

在`userService`调用`userRepository`插入数据库时，需要自行设置id：

```ts
import {v1 as uuidv1} from 'uuid';

@Injectable()
class UserService {
    // inject Repository
    constructor(@InjectRepository(UsersEntity) private userRepository: Repository<UsersEntity>) {
    }

    create() {
        // new entity
        const entity = new UserEntity()
        entity.id = uuidv1();
        // insert database
        this.userRepository.save(entity)
    }
}
```

有读者发现transform中的from函数为什么需要首先判断`bin.toString('hex').length === 32`，原因是在实践过程中发现，如果from没有这个判断：

```ts
from: (bin: Buffer) => {
    // 插入数据时，typrom返回的数据id长度有误
    return `${bin.toString('hex', 4, 8)}-${bin.toString('hex', 2, 4)}-${bin.toString('hex', 0, 2)}-${bin.toString(
        'hex',
        8,
        10,
    )}-${bin.toString('hex', 10, 16)}`;
},
```

在userService调用`save`函数时返回的实体id有问题，发现id重复了6遍：

```json
{
    "id": "295c0610-3742-11ee-a82c-4d8752150610-295c0610-3742-11ee-a82c-4d8752150610-295c0610-3742-11ee-a82c-4d8752150610-295c0610-3742-11ee-a82c-4d8752150610-295c0610-3742-11ee-a82c-4d8752150610",
    "roleId": "8ddece46-35b3-11ee-ba3a-4215a4f8edbc",
    "name": "xiaohuang",
    "updateTime": "2023-08-10 13:53:00"
}
```

添加`bin.toString('hex').length === 32`执行save时，返回的数据时正常的：

```json
{
  "id": "65146a30-3742-11ee-bcd9-e1f122158786",
  "roleId": "8ddece46-35b3-11ee-ba3a-4215a4f8edbc",
  "name": "xiaohuang",
  "updateTime": "2023-08-10 13:54:40"
}
```

## Q&A

### 为什么`TRIGGER`可以确保插入新记录时产生的值是相同的？

为什么在master/slave的数据库中，`TRIGGER`可以确保插入新记录时产生的值是相同的呢？

> With statement-based replication, triggers executed on the master also execute on the slave. With row-based
> replication, triggers executed on the master do not execute on the slave. Instead, the row changes on the master
> resulting from trigger execution are replicated and applied on the slave.

最后一句：`master`上`TRIGGER`产生的行为也会应用到`slave`上

参考：

【1】[Store UUID as binary type in MySQL](https://github.com/typeorm/typeorm/issues/3187)

【2】[17.5.1.36 Replication and Triggers](https://dev.mysql.com/doc/refman/8.0/en/replication-features-triggers.html)
