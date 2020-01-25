import openSocket from 'socket.io-client';
const  socket = openSocket(':8000',{transports: ['websocket']});

function subscribeToTimer(cb) {
  socket.on('timer', timestamp => cb(null, timestamp));
  socket.emit('subscribeToTimer', 1000);
}
export { subscribeToTimer };

function requestTradeLogs(cb) {
  socket.on('tradeLogs', tradeLogs => cb(null, tradeLogs))
  socket.emit('requestTradeLogs', null);
}
export { requestTradeLogs };
