const str = 'exempt 豁免，免除\n' +
  'dystopia 反乌托邦的\n' +
  'disparage 贬低地\n' +
  'allegation 指控，无证据的说法\n' +
  'tensions 紧张，绷紧\n' +
  'attorney 律师\n' +
  'prejudice 使…有偏见\n' +
  'falsify 伪造，篡改，弄虚作假\n' +
  'hush money 封口费\n' +
  'election 选举\n' +
  'encounter 遭遇，意外的事情\n' +
  'position 位置，姿势，放置\n' +
  'deny 拒绝，否认\n' +
  'prosecutor 检举人，公诉人，控方律师\n' +
  'testify 出庭作证，证明\n' +
  'appeal 上诉，呼吁，申诉\n' +
  'convict 定谁的罪，判定有罪\n' +
  'court 法庭，造成，导致，吸引\n' +
  'motion 行动，动议\n' +
  'dismiss 解雇，释放，discharge\n' +
  'incentive 动机，诱因，原因motivation\n' +
  'trial 审讯，问讯\n' +
  'attract 吸引\n' +
  'traffic 交通，交易，贩卖\n' +
  'enslaved 使奴化，使奴役\n' +
  'monument 纪念碑，有纪念、历史意义的建筑\n' +
  'feature 以...为特色，以...为重要组成部分\n' +
  'bronze 青铜器\n' +
  'highlight 突出\n' +
  'artifact 艺术品，手工品\n' +
  'inscribe 刻上\n' +
  'formerly 以前\n' +
  'legacy 遗产\n' +
  'emancipated 解放\n' +
  'sculpture 雕塑\n' +
  'memoir 传记\n' +
  'museum 博物馆\n' +
  'obligation 义务\n' +
  'justice 正义\n' +
  'discrimination 歧视\n' +
  'liberty 自由(自己选择生活方式而不受政府及权威限制)；冒犯行为（或言语）[liberty vs freedom：前者是有限制的自由，后者是绝对的自由，可以自由的做任意的事情]\n' +
  'remedy 挽救，拨正，弥补\n' +
  'comedy 喜剧\n' +
  'cope 处理，应付\n' +
  'horrific 可怕的\n' +
  'triumph over 战胜\n' +
  'narrative 记叙文\n' +
  'extraordinary 非凡的\n' +
  'encounter 遭遇，经历\n' +
  'institution 制度\n' +
  'significant 有重大意义的\n' +
  'force 武力，强迫，强行\n' +
  '\n' +
  '—\n' +
  'furnish 供应，提供，装备\n' +
  'make an appearance （处于礼节的）短时间到场，露面\n' +
  'exterior 外部的，外面的\n' +
  'discipline 纪律，规定，学科，训练\n' +
  'triumph 胜利，成功\n' +
  'hostage 人质\n' +
  'loaf 一条面包，游荡，闲逛\n' +
  'applicable 能应用（实施）的，合适的\n' +
  'diploma 文凭，学位证书\n' +
  'contrast 对比，对照，差异\n' +
  'by contrast 对比之下\n' +
  'appendix 附录，附属物\n' +
  'substantial 实质的，真实的\n' +
  'hasty 匆忙的，仓促的，草率的\n' +
  'interpret 解释，说明，了解，认为，口译\n' +
  'fraction 碎片，小部分\n' +
  'owl 猫头鹰\n' +
  'startle 惊吓，使吃惊\n' +
  'inlet 水湾，小湾\n' +
  'concede （不情愿的）承认，退让，让步，给予\n' +
  'jewelry 珠宝\n' +
  'exhaust 筋疲力尽，排气装置，废气\n' +
  'dictate 口述，听写，命令，指示\n' +
  'lame 有缺陷的，无说服力的\n' +
  'stiff 僵硬的，呆板的\n' +
  'pinch 紧缺，短缺\n' +
  'pants 长裤\n' +
  'remnant 残余，零头布料，遗迹\n' +
  'projector 放映机，投影仪\n' +
  'crisp 脆的，易碎的\n' +
  'incident 事件，政变\n' +
  'zeal 热心，热忱，热情\n' +
  'rhythm 节奏，韵律\n' +
  'overlook 忽略，眺望，宽容，放任\n' +
  'shear 修剪，剪\n' +
  'kidnap 绑架，劫持\n' +
  'propaganda 宣传\n' +
  'prescribe 指示，规定，开处方药\n' +
  'cape 斗篷，披肩';

const splitWord = (str) => {
  return str.split('\n').map((item) => item.split(' ')[0]);
};

const random = (arr) => {
  return;
};

function randomSortBySort(arr) {
  arr.sort(() => Math.random() - 0.5);
}

const arr = splitWord(str);
randomSortBySort(arr);
console.log(arr);
