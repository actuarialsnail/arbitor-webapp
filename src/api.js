import openSocket from 'socket.io-client';
const socket = openSocket(':8000', { transports: ['websocket'] });

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

function cancelTradeLogsListener() {
  socket.off('tradeLogs');
}
export { cancelTradeLogsListener }

function requestStreamData(cb) {
  socket.on('streamData', data => cb(data));
  socket.emit('requestStreamData', 1000);
}
export { requestStreamData };

function cancelStreamData() {
  socket.off('streamData');
  socket.emit('cancelStreamData');
}
export { cancelStreamData };

function requestBalanceData(key, cb) {
  socket.on('balanceData', data => cb(data));
  socket.emit('requestBalanceData', key);
}
export { requestBalanceData };

function cancelBalanceListener() {
  socket.off('balanceData');
}
export { cancelBalanceListener };