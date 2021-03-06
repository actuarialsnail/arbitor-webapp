import openSocket from 'socket.io-client';
const socket = openSocket(':8000', { transports: ['websocket'] });

function subscribeToTimer(cb) {
  socket.on('timer', timestamp => cb(null, timestamp));
  socket.emit('subscribeToTimer', 1000);
}
export { subscribeToTimer };

function requestLogs(date, type, cb) {
  socket.on('logs', res => cb(res.error, res.data));
  socket.emit('requestLogs', { date, type });
}
export { requestLogs };

function cancelLogsListener() {
  socket.off('logs');
}
export { cancelLogsListener }

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

function requestSnapshot(size, cb) {
  socket.on('snapshotData', data => cb(data));
  socket.emit('requestSnapshotData', { interval: 1000, size });
}
export { requestSnapshot };

function cancelSnapshotData() {
  socket.off('snapshotData');
  socket.emit('cancelSnapshotData');
}
export { cancelSnapshotData };

function sendOrderParams(requestObj, cb) {
  socket.on('placedLimitOrdersRes', res => cb(res));
  socket.emit('sendLimitOrders', requestObj);
}
export { sendOrderParams }

function cancelOrdersParamsListener() {
  socket.off('placedLimitOrdersRes');
}
export { cancelOrdersParamsListener }

function requestOpenOrdersData(key, cb) {
  socket.on('openOrdersData', data => cb(data));
  socket.emit('requestOpenOrdersData', key);
}
export { requestOpenOrdersData };

function cancelOpenOrdersListener() {
  socket.off('openOrdersData');
}
export { cancelOpenOrdersListener };

function requestCancelOrder(requestObj, cb) {
  socket.on('cancelOrder', res => cb(res));
  socket.emit('requestCancelOrder', requestObj);
}
export { requestCancelOrder };

function cancelCancelOrderListener() {
  socket.off('cancelOrder');
}
export { cancelCancelOrderListener };