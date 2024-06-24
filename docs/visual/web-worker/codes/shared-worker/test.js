var count = 0;
console.log(123);
self.onconnect = function(e) {
  console.log('>>>e:',e);
  count += 1;
  var port = e.ports[0];
  port.postMessage('Hello World! You are connection #' + count);

  port.onmessage = function(e) {
    setInterval(()=>{
      port.postMessage('pong'+count);
    },1000)
  }
}
