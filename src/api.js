import openSocket from 'socket.io-client';
const  socket = openSocket(':8000',{transports: ['websocket']});

function subscribeToTimer(cb) {
  socket.on('timer', timestamp => cb(null, timestamp));
  socket.emit('subscribeToTimer', 1000);
}
export { subscribeToTimer };

function requestTradeLogs(date, cb) {
  socket.on('tradeLogs', res => cb(res.error, res.data));
  socket.emit('requestTradeLogs', date);
}
export { requestTradeLogs };
