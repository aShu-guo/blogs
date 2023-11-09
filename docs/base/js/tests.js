const length=Buffer.from('e75ceb14-35c8-11ee-ba3a-4215a4f8edbc'.replace(/-/g, ''), 'hex')
console.log(length)

const length2=Buffer.from('e75ceb1435c811eeba3a4215a4f8edbc'.replace(/-/g, ''), 'hex')
console.log(length2)
'ec74ff16-35b3-11ee-ba3a-4215a4f8edbc' to hex
// 正确
0x 11EE35B3 EC78 F47C BA3A 4215A4F8EDBC
// 错误
0x EC78F47C 35B3 11EE BA3A 4215A4F8EDBC

11 ee 35 b3 ec 74 ff 16 ba 3a 42 15 a4 f8 ed bc
==>
ec74ff16-35b3-11ee-ba3a-4215a4f8edbc
