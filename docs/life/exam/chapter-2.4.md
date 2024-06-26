# 案例分析答题测试-4

## 第一道题

### 问题1（4分）

操作性需求：指与用户操作有关的需求。

性能需求：指与系统执行任务效率有关的需求，单位时间内可以处理事件个数。可以通过资源调度、并发等策略实现。

安全性需求：要求系统有效抵御外部攻击、保证内部系统数据的完整性、机密性、允许合法用户访问并且拒绝非法用户访问等。可以通过追踪审计、认证、资源限制等策略实现

文化需求：要求系统提供国际化的能力，提供语言方案满足不同地区用户访问。

### 问题2（6分）

（1）g

（2）c

（3）e

（4）h

### 问题3（9）

d

b

f

## 第二道题

### 问题1（12分）

DFD：从数据加工的角度，描述数据在系统中逻辑流向、加工的过程

E1-E2：房主、租赁者

P1-P6：记录房主信息、记录房屋信息、记录租赁者个人信息、查询待租赁信息文件、安排租赁者看房、变更房屋状态

D1-D4：房主信息文件、租赁者信息文件、房屋信息文件、看房记录文件

### 问题2（2分）

ERD图作用

![img.png](/imgs/life/exam/exam-23.png)

### 问题3（0分）

（1）entity是只有属性，而且是在数据建模中使用；class既有属性又有方法，是在面向对象建模中使用

（2）

Essential User Case表示的必不可少的、无法或缺的需求，意味着必须支持的功能和需求。如果系统中没有实现用例对应的需求，系统流程是不完整的。

Real User Case表示的是真实世界中存在的需求。在系统中可以支持，也可以不支持。优先级相对Essential User Case较低，而且不会影响系统流程。

## 第三道题

### 问题1（4分）

分布式数据库缓存：去中心化的将数据分布存储在不同的数据库，并且将热点数据存放缓存中，以此来提高系统性能

![img.png](/imgs/life/exam/exam-24.png)

### 问题2（8分）

由于Memcache是没有持久化策略的，那么也就意味着当系统发生故障导致宕机时，存放在缓存中的数据会丢失。

1. 读数据时首先访问redis，如果能命中缓存则直接返回；反之去数据库中查询数据，并且将查询到的新数据回写到缓存中。写数据时，先写到数据库中，再写到redis中
2. 数据库中间件，实时更新缓存中的数据

### 问题3（4分）

哨兵模式：

Cluster集群模式：部署多个相同的redis数据作为集群，但是容易发生单点故障
