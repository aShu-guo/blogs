# 外键

约束两个有引用关系的表，保证数据的正确性。

外键由两部分组成：包含外键字段默认值的父表和引用外键字段值的子表。外键是定义在子表上的。

## on update && on delete

父表update或者delete数据时，子表中引用相匹配外键值的数据行的行为

### CASCADE

父表update或者delete数据时，子表也对应的update或者delete。需要注意的是在两表中不要在与外键包含的字段上定义多个on update和on
delete，否则会造成多次触发。

如果父表和子表都定义了外键，而且外键中包含相同的字段，则需要定义相同的on update和on delete来保证操作成功。

### SET NULL

父表update或者delete数据时，子表设置数据为null。如果指定了设置null的行为，则需要保证子表的字段可以为null

### RESTRICT

子表忽略父表update或者delete数据的行为

### NO ACTION

默认操作，InnoDB引擎下与`RESTRICT`效果相同，会立刻阻止父表操作带来的影响。

### SET DEFAULT
