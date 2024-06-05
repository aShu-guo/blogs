function LinkList({ data, next }) {
  this.data = data;
  this.next = next;
}

function InitList() {
  const list = new LinkList({data:null,next});
}
