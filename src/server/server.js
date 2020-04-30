const io = require('socket.io')();
const fs = require('fs');
const readline = require('readline');

const priceDataStream = require('./priceDataStream');
const priceStream = new priceDataStream();
priceStream.masterStream();

const balanceRequest = require('./balanceRequest');

io.on('connection', (client) => {

  let timer;
  console.log(`client id: ${client.id} connected`);

  client.on('subscribeToTimer', (interval) => {
    console.log('client is subscribing to timer with interval ', interval);
    setInterval(() => {
      client.emit('timer', new Date().toISOString().replace(/T/, ' ').replace(/\..+/, ''));
    }, interval);
  });

  client.on('requestTradeLogs', (date) => {
    console.log('client is requesting data for:', date);
    let tradeLogs = [];
    let path = '../../../arbitorLog/tradeLog' + date + '.json';

    try {
      if (fs.existsSync(path)) {
        //file exists
        const readInterface = readline.createInterface({
          input: fs.createReadStream('../../../arbitorLog/tradeLog' + date + '.json'),
          //output: process.stdout,
          console: false
        });

        readInterface.on('line', (line) => {
          tradeLogs.push(JSON.parse(line))
        });

        readInterface.on('close', () => {
          //console.log(tradeLogs);
          client.emit('tradeLogs', { data: tradeLogs, error: false });
        })

      } else {
        console.log('no files found')
        client.emit('tradeLogs', { data: {}, error: 'no files found' });
      }
    } catch (err) {
      console.error(err)
      client.emit('tradeLogs', { data: {}, error: err });
    }
  });

  client.on('requestStreamData', (interval) => {
    console.log('client is subscribing to data stream with interval ', interval);
    timer = setInterval(() => {
      client.emit('streamData', priceStream.streamData);
    }, interval);
  })

  client.on('cancelStreamData', () => {
    console.log('client has unsubscribed to data stream');
    clearInterval(timer);
  })

  client.on('requestBalanceData', (key) => {
    console.log('client requested balance');
    if (key === 'bs') {
      balanceRequest.request((balance) => {
        client.emit('balanceData', balance);
      });
    } else {
      let dummy = {
        'coinfloor': { 'GBP': 10 },
        'coinbase': { 'GBP': 10 },
        'binance': { 'GBP': 10 }
      }
      client.emit('balanceData', dummy);
    }

  })

  client.on('disconnect', (reason)=>{
    console.log(`client id: ${client.id} disconnected: ${reason}`)
  })
});

const port = 8000;
io.listen(port);
console.log('listening on port ', port);