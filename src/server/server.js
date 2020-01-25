const io = require('socket.io')();
const fs = require('fs');
const readline = require('readline');

io.on('connection', (client) => {
  client.on('subscribeToTimer', (interval) => {
    console.log('client is subscribing to timer with interval ', interval);
    setInterval(() => {
      client.emit('timer', new Date().toISOString().replace(/T/, ' ').replace(/\..+/, ''));
    }, interval);
  });

  client.on('requestTradeLogs', () => {
    console.log('client is requesting data');
    let tradeLogs = [];
    
    const readInterface = readline.createInterface({
      input: fs.createReadStream('../../../arbitorLog/tradeLog2020-01-06.json'),
      //output: process.stdout,
      console: false
    });
    
    readInterface.on('line', (line) => {
      tradeLogs.push(JSON.parse(line))
    });
    
    readInterface.on('close', () => {
      //console.log(tradeLogs);
      client.emit('tradeLogs', tradeLogs)
    })
  });
});

const port = 8000;
io.listen(port);
console.log('listening on port ', port);