# 概览

## mongodb可以替代Mysql么？

<table>
    <tbody>
    <tr>
        <th></th>
        <th>MongoDB</th>
        <th>MySQL</th>
    </tr>
    <tr>
        <td>支持连表查询：<strong>Join</strong></td>
        <td>可以通过MapReduce，$lookup</td>
        <td>支持，而且功能更强大</td>
    </tr>
    <tr>
        <td>数据完整性：<strong>Schema是否必须</strong></td>
        <td>1. 没有完整性强校验<br/>2. 而且不需要设计Schema，更加灵活、动态可变</td>
        <td>1. 数据完整性强校验<br/>2. </td>
    </tr>
    <tr>
        <td>支持事务：<strong>Transactions</strong></td>
        <td>支持单/多文档事务，但是多文档事务性能损耗较大</td>
        <td>支持</td>
    </tr>
    <tr>
        <td>中间表</td>
        <td></td>
        <td></td>
    </tr>
    </tbody>
</table>
