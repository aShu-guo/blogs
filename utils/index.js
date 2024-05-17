const str =
  'exempt 豁免，免除\n' +
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
  'force 武力，强迫，强行';

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
